<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    Title,
    type Chart,
    type TooltipItem,
  } from 'chart.js';
  import type { Order } from '@/types/types';

  // Register Chart.js components
  ChartJS.register(ArcElement, Tooltip, Legend, Title);

  const girlsStore = useGirlsStore();
  const transactionsStore = useTransactionsStore();

  const chartData = ref();
  const chartOptions = ref();

  // Calculate packages distributed to each girl
  const calculatePackagesDistributed = () => {
    // Get all T2G transactions (complete and recorded status)
    const distributedTransactions = transactionsStore.allTransactions.filter(
      (transaction: Order) => {
        const isT2GType =
          transaction.type === 'T2G' ||
          transaction.type === 'T2G(B)' ||
          transaction.type === 'T2G(VB)';
        const isDistributed =
          transaction.status === 'complete' ||
          transaction.status === 'recorded';
        return isT2GType && isDistributed;
      },
    );

    // Calculate total packages per girl
    const girlPackages: Record<number, number> = {};

    distributedTransactions.forEach((transaction: Order) => {
      if (transaction.to && transaction.cookies) {
        const girlId = transaction.to;
        // Sum all cookie packages for this transaction
        const totalPackages = Object.values(transaction.cookies).reduce(
          (sum: number, count: number) => {
            return sum + (typeof count === 'number' ? count : 0);
          },
          0,
        );

        girlPackages[girlId] = (girlPackages[girlId] || 0) + totalPackages;
      }
    });

    // Convert to array and sort by packages (descending)
    const girlData = Object.entries(girlPackages)
      .map(([girlId, packages]) => ({
        girlId: Number(girlId),
        name: girlsStore.getGirlNameById(Number(girlId)),
        packages,
      }))
      .sort((a, b) => b.packages - a.packages);

    return girlData;
  };

  const updateChart = () => {
    const girlData = calculatePackagesDistributed();

    if (girlData.length === 0) {
      chartData.value = null;
      return;
    }

    const totalPackages = girlData.reduce(
      (sum, girl) => sum + girl.packages,
      0,
    );

    // Generate colors for each girl
    const colors = girlData.map((_, index) => {
      const hue = (index * 137.5) % 360; // Golden angle for better color distribution
      return `hsl(${hue}, 65%, 55%)`;
    });

    chartData.value = {
      labels: girlData.map((girl) => girl.name),
      datasets: [
        {
          data: girlData.map((girl) => girl.packages),
          backgroundColor: colors,
          borderColor: colors.map((color) => color.replace('55%', '45%')),
          borderWidth: 1,
        },
      ],
    };

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');

    chartOptions.value = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textColor,
            generateLabels: (chart: Chart) => {
              const data = chart.data;
              if (data.labels?.length && data.datasets.length) {
                return (data.labels as string[]).map(
                  (label: string, i: number) => {
                    const value = data.datasets[0].data[i] as number;
                    const percentage = ((value / totalPackages) * 100).toFixed(
                      1,
                    );
                    return {
                      text: `${label}: ${value} (${percentage}%)`,
                      fillStyle: (data.datasets[0].backgroundColor as string[])[
                        i
                      ],
                      strokeStyle: (data.datasets[0].borderColor as string[])[
                        i
                      ],
                      lineWidth: data.datasets[0].borderWidth as number,
                      hidden: false,
                      index: i,
                    };
                  },
                );
              }
              return [];
            },
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'pie'>) => {
              const label = context.label || '';
              const value = context.parsed;
              const percentage = ((value / totalPackages) * 100).toFixed(1);
              return `${label}: ${value} packages (${percentage}%)`;
            },
          },
        },
      },
    };
  };

  onMounted(() => {
    updateChart();
  });

  // Watch for changes in stores and update chart
  const shouldUpdate = computed(
    () =>
      (girlsStore.allGirls?.length || 0) +
      (transactionsStore.allTransactions?.length || 0),
  );

  watch(shouldUpdate, () => {
    updateChart();
  });
</script>

<template>
  <div class="card">
    <h5>Packages Distributed to Girls</h5>
    <p class="text-sm text-gray-600 mb-4">
      Total packages distributed to each girl through completed T2G (Troop to
      Girl) transactions. Percentages show each girl's share of the total
      distributed packages.
    </p>

    <div v-if="chartData" class="flex justify-center">
      <Chart type="pie" :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="text-center p-4 text-gray-500">
      No packages distributed yet. Complete T2G transactions to see the
      distribution.
    </div>
  </div>
</template>
