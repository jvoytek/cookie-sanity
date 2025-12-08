<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  import annotationPlugin from 'chartjs-plugin-annotation';
  import type { ChartData, ChartOptions } from 'chart.js';

  // Type for horizontal line annotations
  interface LineAnnotation {
    type: string;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    borderColor: string;
    borderWidth: number;
    borderDash: number[];
    label: { display: boolean };
  }

  // Register Chart.js components and plugins
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    annotationPlugin,
  );

  const cookiesStore = useCookiesStore();

  const chartData = ref<ChartData<'bar'> | null>(null);
  const chartOptions = ref<ChartOptions<'bar'> | null>(null);

  // Get inventory data with totals
  const inventoryData = computed(() => {
    return cookiesStore.allCookiesWithInventoryTotals(false);
  });

  const updateChart = () => {
    const cookies = inventoryData.value;

    if (cookies.length === 0) {
      chartData.value = null;
      return;
    }

    // Prepare data for the chart - use abbreviations for labels
    const labels = cookies
      .filter((cookie) => cookie.abbreviation)
      .map((cookie) => cookie.abbreviation);
    const onHandData = cookies
      .filter((cookie) => cookie.abbreviation)
      .map((cookie) => cookie.onHand || 0);
    const colors = cookies
      .filter((cookie) => cookie.abbreviation)
      .map((cookie) => cookie.color || '#888');

    // Filter cookies with abbreviations for use in annotations
    const validCookies = cookies.filter((cookie) => cookie.abbreviation);

    // Calculate dynamic step size based on max inventory value
    const maxValue = Math.max(
      ...onHandData,
      ...validCookies.map((cookie) => cookie.afterPending || 0),
    );
    const stepSize = maxValue > 100 ? 20 : maxValue > 50 ? 10 : 5;

    chartData.value = {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'On Hand',
          data: onHandData,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
        },
      ],
    };

    // Only access DOM on client side
    if (import.meta.client) {
      const documentStyle = getComputedStyle(document.documentElement);
      const textColor = documentStyle.getPropertyValue('--p-text-color');
      const surfaceBorder = documentStyle.getPropertyValue(
        '--p-content-border-color',
      );

      // Create horizontal line annotations for "After Pending" values
      const annotations: Record<string, LineAnnotation> = {};
      validCookies.forEach((cookie, index) => {
        const afterPending = cookie.afterPending || 0;
        annotations[`afterPending_${cookie.abbreviation}`] = {
          type: 'line',
          xMin: index - 0.4,
          xMax: index + 0.4,
          yMin: afterPending,
          yMax: afterPending,
          borderColor: '#6b7280',
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            display: false,
          },
        };
      });

      chartOptions.value = {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        plugins: {
          legend: {
            labels: {
              color: textColor,
            },
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                const cookieData = validCookies[context.dataIndex];
                const afterPending = cookieData?.afterPending || 0;
                return [
                  `${label}: ${value} packages`,
                  `After Pending: ${afterPending} packages`,
                ];
              },
            },
          },
          annotation: {
            annotations,
          },
        },
        scales: {
          x: {
            ticks: {
              color: textColor,
            },
            grid: {
              color: surfaceBorder,
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Packages',
              color: textColor,
            },
            ticks: {
              color: textColor,
              stepSize,
            },
            grid: {
              color: surfaceBorder,
            },
          },
        },
      };
    }
  };

  onMounted(() => {
    updateChart();
  });

  // Watch for changes in inventory data
  watch(
    () => inventoryData.value,
    () => {
      updateChart();
    },
    { deep: true },
  );
</script>

<template>
  <div class="card">
    <h5>Current Inventory</h5>
    <p class="text-sm text-gray-600 mb-4">
      Current troop inventory by cookie type. Bars show current "On Hand"
      inventory with a dashed horizontal line on each bar showing the projected
      "After Pending" amount.
    </p>

    <div v-if="chartData">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="text-center p-4 text-gray-500">
      No inventory data available. Add cookies to see the chart.
    </div>
  </div>
</template>
