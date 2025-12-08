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

  const cookiesStore = useCookiesStore();
  const transactionsStore = useTransactionsStore();

  const chartData = ref();
  const chartOptions = ref();

  // Calculate packages distributed by cookie type
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

    // Calculate total packages per cookie type
    const cookiePackages: Record<string, number> = {};

    distributedTransactions.forEach((transaction: Order) => {
      if (transaction.cookies) {
        // Sum packages for each cookie type
        Object.entries(transaction.cookies).forEach(([abbreviation, count]) => {
          if (typeof count === 'number' && count > 0) {
            cookiePackages[abbreviation] =
              (cookiePackages[abbreviation] || 0) + count;
          }
        });
      }
    });

    // Convert to array with cookie details and sort by packages (descending)
    const cookieLookup = new Map(
      cookiesStore.allCookies.map((c) => [c.abbreviation, c]),
    );

    const cookieData = Object.entries(cookiePackages)
      .map(([abbreviation, packages]) => {
        const cookie = cookieLookup.get(abbreviation);
        return {
          abbreviation,
          name: cookie?.name || abbreviation,
          packages,
          color: cookie?.color || '#888',
        };
      })
      .sort((a, b) => b.packages - a.packages);

    return cookieData;
  };

  const updateChart = () => {
    const cookieData = calculatePackagesDistributed();

    if (cookieData.length === 0) {
      chartData.value = null;
      return;
    }

    const totalPackages = cookieData.reduce(
      (sum, cookie) => sum + cookie.packages,
      0,
    );

    // Use cookie colors
    const colors = cookieData.map((cookie) => cookie.color);

    chartData.value = {
      labels: cookieData.map((cookie) => cookie.name),
      datasets: [
        {
          data: cookieData.map((cookie) => cookie.packages),
          backgroundColor: colors,
          borderColor: colors.map((color) => {
            // Darken the border slightly
            // Handle both HSL and hex color formats
            const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslMatch) {
              const [, h, s, l] = hslMatch;
              return `hsl(${h}, ${s}%, ${Math.max(0, parseInt(l) - 10)}%)`;
            }
            // For hex colors, return as-is (or slightly darker if needed)
            return color;
          }),
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
      (cookiesStore.allCookies?.length || 0) +
      (transactionsStore.allTransactions?.length || 0),
  );

  watch(shouldUpdate, () => {
    updateChart();
  });
</script>

<template>
  <div class="card">
    <h5>Packages Distributed by Cookie Type</h5>
    <p class="text-sm text-gray-600 mb-4">
      Distribution of cookie packages by type through completed T2G (Troop to
      Girl) transactions. Percentages show each cookie type's share of the total
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
