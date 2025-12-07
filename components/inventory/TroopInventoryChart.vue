<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  import type { ChartData, ChartOptions } from 'chart.js';

  // Register Chart.js components
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
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

    // Prepare data for the chart
    const labels = cookies.map((cookie) => cookie.name);
    const onHandData = cookies.map((cookie) => cookie.onHand || 0);
    const afterPendingData = cookies.map((cookie) => cookie.afterPending || 0);
    const colors = cookies.map((cookie) => cookie.color || '#888');

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
        {
          type: 'line' as const,
          label: 'After Pending',
          data: afterPendingData,
          borderColor: '#6b7280',
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointBackgroundColor: '#6b7280',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const surfaceBorder = documentStyle.getPropertyValue(
      '--p-content-border-color',
    );

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
              return `${label}: ${value} packages`;
            },
          },
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
            stepSize: 10,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    };
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
      inventory with a dashed line showing the projected "After Pending" amount.
    </p>

    <div v-if="chartData">
      <Chart type="bar" :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="text-center p-4 text-gray-500">
      No inventory data available. Add cookies to see the chart.
    </div>
  </div>
</template>
