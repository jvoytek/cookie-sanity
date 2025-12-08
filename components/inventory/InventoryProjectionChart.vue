<script setup lang="ts">
  import { onMounted } from 'vue';
  import 'chartjs-adapter-date-fns';
  import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
  } from 'chart.js';
  import annotationPlugin from 'chartjs-plugin-annotation';
  import type { Order, BoothSale, InventoryEvent, Cookie } from '@/types/types';

  // Register Chart.js components and plugins
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    annotationPlugin,
  );

  // Register zoom plugin only on client side to avoid SSR issues
  if (import.meta.client) {
    import('chartjs-plugin-zoom').then((zoomPlugin) => {
      ChartJS.register(zoomPlugin.default);
    });
  }

  const cookiesStore = useCookiesStore();
  const transactionsStore = useTransactionsStore();
  const boothsStore = useBoothsStore();

  const chartData = ref();
  const chartOptions = ref();
  const chartRef = ref();

  // Filter state
  const startDate = ref<Date | null>(null);
  const endDate = ref<Date | null>(null);
  const selectedCookies = ref<Cookie[]>([]);

  // Initialize selected cookies with all non-virtual cookies
  onMounted(() => {
    selectedCookies.value = cookiesStore.allCookies.filter(
      (c) => !c.is_virtual,
    );

    // Set default date range
    const today = new Date();
    startDate.value = new Date(today);
    startDate.value.setMonth(today.getMonth() - 1); // 1 month ago
    endDate.value = new Date(today);
    endDate.value.setMonth(today.getMonth() + 2); // 2 months from now
  });

  // Available cookies for selection
  const availableCookies = computed(() => {
    return cookiesStore.allCookies?.filter((c) => !c.is_virtual) || [];
  });

  // Calculate inventory projection data
  const calculateInventoryProjection = () => {
    const cookies =
      selectedCookies.value.length > 0
        ? selectedCookies.value
        : availableCookies.value;
    if (cookies.length === 0) return;

    // Get all relevant transactions (pending and complete, not requested)
    const relevantTransactions = (
      transactionsStore.allTransactions || []
    ).filter(
      (t) =>
        t.order_date &&
        (t.status === 'pending' ||
          t.status === 'complete' ||
          t.status === 'recorded') &&
        t.type !== 'DIRECT_SHIP' &&
        t.type !== 'G2G',
    );

    // Get booth sales that affect troop inventory
    const relevantBooths = boothsStore.boothSalesUsingTroopInventory || [];

    // Create events list combining transactions and booth sales
    const events: InventoryEvent[] = [];

    // Add transaction events
    relevantTransactions.forEach((transaction) => {
      if (transaction.order_date && transaction.cookies && transaction.type) {
        const cookiesRecord =
          !transactionsStore.transactionTypesToInvert.includes(transaction.type)
            ? transactionsStore.invertCookieQuantities(
                transaction.cookies as Record<string, number>,
              )
            : (transaction.cookies as Record<string, number>);
        events.push({
          date: transaction.order_date.replace(
            /(\d\d)\/(\d\d)\/(\d{4})/,
            '$3-$1-$2',
          ), // Ensure date is in correct format
          type: transaction.type,
          transaction,
          cookies: cookiesRecord,
          description: getEventDescription(transaction),
        });
      }
    });

    // Add booth sale events
    relevantBooths.forEach((booth) => {
      if (booth.predicted_cookies) {
        const cookiesRecord = booth.predicted_cookies as Record<string, number>;
        const date =
          typeof booth.sale_date === 'string'
            ? booth.sale_date.replace(/(\d\d)\/(\d\d)\/(\d{4})/, '$3-$1-$2')
            : booth.sale_date.toISOString().split('T')[0];
        events.push({
          date: date,
          type: 'BOOTH',
          boothSale: booth,
          cookies: transactionsStore.invertCookieQuantities(cookiesRecord),
          description: getEventDescription(booth),
        });
      }
    });

    // Sort events by date
    events.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    // Build time series data
    const dates: string[] = [];
    const inventoryByDate: Record<string, Record<string, number>> = {};

    // Initialize with current inventory (sum of all completed transactions)
    const initialInventory: Record<string, number> = {};
    cookies.forEach((cookie) => {
      initialInventory[cookie.abbreviation] = 0;
    });

    // Process events to calculate inventory over time
    let currentInventory = { ...initialInventory };

    events.forEach((event) => {
      // Clone current inventory
      const newInventory = { ...currentInventory };

      // Apply changes based on transaction type
      cookies.forEach((cookie) => {
        const amount = event.cookies[cookie.abbreviation] || 0;
        newInventory[cookie.abbreviation] =
          (newInventory[cookie.abbreviation] || 0) + amount;
      });

      // Add this date if not already added
      if (!dates.includes(event.date)) {
        dates.push(event.date);
      }

      // Update inventory for this date
      inventoryByDate[event.date] = newInventory;
      currentInventory = newInventory;
    });

    // Add future projection point (5 years from last date)
    if (dates.length > 0) {
      const lastDate = dates[dates.length - 1];
      const futureDate = new Date(lastDate);
      futureDate.setFullYear(futureDate.getFullYear() + 5);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      dates.push(futureDateStr);
      inventoryByDate[futureDateStr] = currentInventory;
    }

    // Build datasets for each cookie
    const datasets = cookies.map((cookie) => ({
      label: cookie.name,
      data: dates.map(
        (date) => inventoryByDate[date]?.[cookie.abbreviation] || 0,
      ),
      borderColor: cookie.color || '#888',
      borderWidth: 1,
      backgroundColor: cookie.color || '#888',
      tension: 0,
      fill: false,
      segment: {
        borderDash: (ctx: { p0DataIndex: number }) => {
          // Make the last segment (to future point) dashed
          return ctx.p0DataIndex === dates.length - 2 ? [5, 5] : undefined;
        },
      },
    }));

    // Create event markers
    const eventMarkers = events.map((event) => ({
      date: event.date,
      type: event.type,
      description: event.description,
    }));

    return {
      labels: dates,
      datasets,
      events: eventMarkers,
    };
  };

  // Helper to get event color
  const getEventColor = (eventType: string): string => {
    const colors = {
      T2G: '#3b82f6', // blue
      'T2G(B)': '#3b82f6', // blue
      'T2G(VB)': '#3b82f6', // blue
      G2T: '#10b981', // green
      C2T: '#8b5cf6', // purple
      T2T: '#f59e0b', // amber
      BOOTH: '#ef4444', // red
    };
    return colors[eventType as keyof typeof colors] || '#888';
  };

  const getEventDescription = (event: BoothSale | Order): string => {
    if ('type' in event) {
      return transactionsStore.friendlyTransactionTypes(event.type);
    } else {
      return `Booth: ${event.location || ''}`;
    }
  };

  const updateChart = () => {
    const projection = calculateInventoryProjection();
    if (!projection) {
      chartData.value = null;
      return;
    }

    chartData.value = {
      // Labels for each day
      labels: projection.labels,
      datasets: projection.datasets,
    };

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const surfaceBorder = documentStyle.getPropertyValue(
      '--p-content-border-color',
    );

    // Create annotations for event markers and status lines
    const annotations: Record<
      string,
      | {
          type: string;
          xMin?: string;
          xMax?: string;
          yMin?: number;
          yMax?: number;
          borderColor?: string;
          borderWidth?: number;
          borderDash?: number[];
          backgroundColor?: string;
          drawTime?: string;
          label?: {
            display: boolean;
            content?: string;
            position?: string;
            backgroundColor?: string;
            color?: string;
            font?: { size: number };
          };
        }
      | Record<string, unknown>
    > = {};

    // Add today marker line
    const today = new Date().toISOString().split('T')[0];
    annotations.todayLine = {
      type: 'line',
      xMin: today,
      xMax: today,
      borderColor: '#6b7280', // gray-500
      borderWidth: 2,
      borderDash: [5, 5],
      label: {
        display: true,
        content: 'Today',
        position: 'start',
        backgroundColor: 'rgba(107, 114, 128, 0.8)',
        color: 'white',
        font: {
          size: 10,
        },
      },
    };

    // Add background box for future dates (after today)
    if (endDate.value && new Date(endDate.value) > new Date(today)) {
      annotations.futureBackground = {
        type: 'box',
        xMin: today,
        xMax: endDate.value.toISOString(),
        backgroundColor: 'rgba(229, 231, 235, 0.3)', // very light gray
        borderWidth: 0,
        drawTime: 'beforeDatasetsDraw',
      };
    }

    // Add inventory status severity lines
    // Good threshold (> 50)
    annotations.goodLine = {
      type: 'line',
      yMin: 50,
      yMax: 50,
      borderColor: '#10b981', // green-500
      borderWidth: 2,
      borderDash: [3, 3],
      label: {
        display: true,
        content: 'Good (50+)',
        position: 'end',
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        color: 'white',
        font: {
          size: 10,
        },
      },
    };

    // Ok threshold (> 20)
    annotations.okLine = {
      type: 'line',
      yMin: 20,
      yMax: 20,
      borderColor: '#f59e0b', // amber-500
      borderWidth: 2,
      borderDash: [3, 3],
      label: {
        display: true,
        content: 'Ok (20+)',
        position: 'end',
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        color: 'white',
        font: {
          size: 10,
        },
      },
    };

    // Low threshold (< 20)
    annotations.lowLine = {
      type: 'line',
      yMin: 0,
      yMax: 0,
      borderColor: '#ef4444', // red-500
      borderWidth: 2,
      borderDash: [3, 3],
      label: {
        display: true,
        content: 'Low',
        position: 'end',
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        color: 'white',
        font: {
          size: 10,
        },
      },
    };
    // Create a separate dataset for event markers (scatter points)
    const eventPoints = projection.events.map((event) => {
      const dateIndex = projection.labels.indexOf(event.date);
      if (dateIndex === -1) return null;
      return {
        x: event.date,
        // Bottom of chart which could be lower than 0
        y:
          Math.min(
            ...projection.datasets.map((ds) => ds.data[dateIndex] || 0),
          ) - 15,
        type: event.type,
        description: event.description,
      };
    });

    // Add event points as a scatter dataset (no line)
    projection.datasets.push({
      label: 'Event',
      data: eventPoints,
      showLine: false,
      pointStyle: 'triangle',
      pointRadius: 5,
      pointBackgroundColor: eventPoints.map((pt) => getEventColor(pt.type)),
      pointBorderColor: eventPoints.map((pt) => getEventColor(pt.type)),
      pointBorderWidth: 1,
      backgroundColor: eventPoints.map((pt) => getEventColor(pt.type)),
      borderColor: eventPoints.map((pt) => getEventColor(pt.type)),
      type: 'scatter',
      fill: false,
      tension: 0,
    });

    chartOptions.value = {
      aspectRatio: 3,
      plugins: {
        legend: {
          labels: {
            color: textColor,
            filter: (legendItem: { text: string }) => {
              // Hide "Event" from the legend
              return legendItem.text !== 'Event';
            },
          },
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: (context: {
              dataset: { label: string };
              parsed: { y: number };
            }) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (label === 'Event') {
                const event = projection.events[context.dataIndex];
                return event ? event.description : '';
              }
              return `${label}: ${value} packages`;
            },
          },
        },
        annotation: {
          annotations,
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
          },
          limits: {
            x: {
              min: 'original',
              max: 'original',
            },
            y: {
              min: 'original',
              max: 'original',
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day', // Or 'hour', 'month', etc.
          },
          min: startDate.value ? startDate.value.toISOString() : undefined,
          max: endDate.value ? endDate.value.toISOString() : undefined,
        },
        y: {
          title: {
            display: true,
            text: 'Number of Packages',
            color: textColor,
          },
          ticks: {
            color: textColor,
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

  // Watch for changes in stores and update chart
  const shouldUpdate = computed(
    () =>
      (cookiesStore.allCookies?.length || 0) +
      (transactionsStore.allTransactions?.length || 0) +
      (boothsStore.allBoothSales?.length || 0),
  );

  // Update chart when data changes
  watch(shouldUpdate, () => {
    updateChart();
  });

  // Watch for filter changes
  watch(
    [startDate, endDate, selectedCookies],
    () => {
      updateChart();
    },
    { deep: true },
  );
</script>

<template>
  <div class="card">
    <h5>Inventory Projection</h5>
    <p>
      Projected inventory over time based on pending and completed transactions.
      Lines show inventory levels, with events marked along the timeline.
      Click-drag to pan the chart.
    </p>

    <!-- Filters -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Start Date</label>
        <DatePicker v-model="startDate" show-icon />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">End Date</label>
        <DatePicker v-model="endDate" show-icon />
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium">Cookies</label>
        <MultiSelect
          v-model="selectedCookies"
          :options="availableCookies"
          option-label="name"
          placeholder="Select cookies"
          :max-selected-labels="2"
          class="w-full"
        />
      </div>
    </div>

    <div v-if="chartData">
      <Chart
        ref="chartRef"
        type="line"
        :data="chartData"
        :options="chartOptions"
      />
    </div>
    <div v-else class="text-center p-4 text-gray-500">
      No inventory data available. Add cookies and transactions to see the
      projection.
    </div>

    <!-- Legend for event types with triangles -->
    <div class="mt-4 flex flex-wrap gap-4 text-sm">
      <div class="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="6,2 10,10 2,10" fill="#3b82f6" />
        </svg>
        <span>T2G (Troop to Girl)</span>
      </div>
      <div class="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="6,2 10,10 2,10" fill="#10b981" />
        </svg>
        <span>G2T (Girl to Troop)</span>
      </div>
      <div class="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="6,2 10,10 2,10" fill="#8b5cf6" />
        </svg>
        <span>C2T (Council to Troop)</span>
      </div>
      <div class="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="6,2 10,10 2,10" fill="#f59e0b" />
        </svg>
        <span>T2T (Troop to Troop)</span>
      </div>
      <div class="flex items-center gap-2">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon points="6,2 10,10 2,10" fill="#ef4444" />
        </svg>
        <span>Booth Sale</span>
      </div>
    </div>
  </div>
</template>
