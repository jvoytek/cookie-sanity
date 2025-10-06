<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Chart from 'primevue/chart';
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
import { useCookiesStore } from '@/stores/cookies';
import { useTransactionsStore } from '@/stores/transactions';
import { useBoothsStore } from '@/stores/booths';
import type { Order, BoothSale } from '@/types/types';

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

const cookiesStore = useCookiesStore();
const transactionsStore = useTransactionsStore();
const boothsStore = useBoothsStore();

const chartData = ref();
const chartOptions = ref();

interface InventoryEvent {
  date: string;
  type: 'T2G' | 'G2T' | 'C2T' | 'T2T' | 'BOOTH';
  transaction?: Order;
  boothSale?: BoothSale;
  cookies: Record<string, number>;
  description: string;
}

// Calculate inventory projection data
const calculateInventoryProjection = () => {
  const cookies = cookiesStore.allCookies.filter((c) => !c.is_virtual);
  if (cookies.length === 0) return;

  // Get all relevant transactions (pending and complete, not requested)
  const relevantTransactions = transactionsStore.allTransactions.filter(
    (t) =>
      t.order_date &&
      (t.status === 'pending' || t.status === 'complete') &&
      t.type !== 'DIRECT_SHIP',
  );

  // Get booth sales that affect troop inventory
  const relevantBooths = boothsStore.boothSalesUsingTroopInventory;

  // Create events list combining transactions and booth sales
  const events: InventoryEvent[] = [];

  // Add transaction events
  relevantTransactions.forEach((transaction) => {
    if (transaction.order_date && transaction.cookies && transaction.type) {
      const cookiesRecord = transaction.cookies as Record<string, number>;
      events.push({
        date: transaction.order_date,
        type: transaction.type as 'T2G' | 'G2T' | 'C2T' | 'T2T',
        transaction,
        cookies: cookiesRecord,
        description: `${transaction.type} #${transaction.order_num || transaction.id}`,
      });
    }
  });

  // Add booth sale events
  relevantBooths.forEach((booth) => {
    if (booth.predicted_cookies) {
      const cookiesRecord = booth.predicted_cookies as Record<string, number>;
      events.push({
        date: booth.sale_date,
        type: 'BOOTH',
        boothSale: booth,
        cookies: cookiesRecord,
        description: `Booth: ${booth.location}`,
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
    initialInventory[cookie.abbreviation] =
      transactionsStore.sumTransactionsByCookie(cookie.abbreviation);
  });

  // Add today as starting point
  const today = new Date().toISOString().split('T')[0];
  dates.push(today);
  inventoryByDate[today] = { ...initialInventory };

  // Process events to calculate inventory over time
  let currentInventory = { ...initialInventory };

  events.forEach((event) => {
    // Clone current inventory
    const newInventory = { ...currentInventory };

    // Apply changes based on transaction type
    cookies.forEach((cookie) => {
      const amount = event.cookies[cookie.abbreviation] || 0;

      if (event.type === 'T2G' || event.type === 'BOOTH') {
        // Troop to Girl or Booth Sale: decrease troop inventory
        newInventory[cookie.abbreviation] =
          (newInventory[cookie.abbreviation] || 0) - amount;
      } else if (event.type === 'G2T') {
        // Girl to Troop: increase troop inventory
        newInventory[cookie.abbreviation] =
          (newInventory[cookie.abbreviation] || 0) + amount;
      } else if (event.type === 'C2T') {
        // Council to Troop: increase troop inventory
        newInventory[cookie.abbreviation] =
          (newInventory[cookie.abbreviation] || 0) + amount;
      } else if (event.type === 'T2T') {
        // Troop to Troop: could be + or - depending on direction
        // For simplicity, treating as neutral for now
        newInventory[cookie.abbreviation] =
          (newInventory[cookie.abbreviation] || 0) + amount;
      }
    });

    // Add this date if not already added
    if (!dates.includes(event.date)) {
      dates.push(event.date);
    }

    // Update inventory for this date
    inventoryByDate[event.date] = newInventory;
    currentInventory = newInventory;
  });

  // Build datasets for each cookie
  const datasets = cookies.map((cookie) => ({
    label: cookie.name,
    data: dates.map(
      (date) => inventoryByDate[date]?.[cookie.abbreviation] || 0,
    ),
    borderColor: cookie.color || '#888',
    backgroundColor: cookie.color || '#888',
    stepped: true,
    tension: 0,
    fill: false,
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
    G2T: '#10b981', // green
    C2T: '#8b5cf6', // purple
    T2T: '#f59e0b', // amber
    BOOTH: '#ef4444', // red
  };
  return colors[eventType as keyof typeof colors] || '#888';
};

const updateChart = () => {
  const projection = calculateInventoryProjection();
  if (!projection) {
    chartData.value = null;
    return;
  }

  chartData.value = {
    labels: projection.labels,
    datasets: projection.datasets,
  };

  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const surfaceBorder = documentStyle.getPropertyValue(
    '--p-content-border-color',
  );

  // Create annotations for event markers
  const annotations: Record<
    string,
    {
      type: string;
      xValue: string;
      yValue: number;
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      radius: number;
      pointStyle: string;
      label: { display: boolean };
    }
  > = {};
  projection.events.forEach((event, index) => {
    const dateIndex = projection.labels.indexOf(event.date);
    if (dateIndex >= 0) {
      annotations[`event${index}`] = {
        type: 'point',
        xValue: event.date,
        yValue: 0,
        backgroundColor: getEventColor(event.type),
        borderColor: getEventColor(event.type),
        borderWidth: 2,
        radius: 6,
        pointStyle: 'circle',
        label: {
          display: false,
        },
      };
    }
  });

  chartOptions.value = {
    maintainAspectRatio: false,
    aspectRatio: 0.6,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
        position: 'top',
      },
      tooltip: {
        callbacks: {
          title: (context: { label: string }[]) => {
            return `Date: ${context[0].label}`;
          },
          label: (context: {
            dataset: { label: string };
            parsed: { y: number };
          }) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;

            // Check if there's an event on this date
            const event = projection.events.find(
              (e) => e.date === context[0]?.label,
            );
            if (event) {
              return `${label}: ${value} packages (Event: ${event.description})`;
            }

            return `${label}: ${value} packages`;
          },
        },
      },
      annotation: {
        annotations,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: textColor,
        },
        ticks: {
          color: textColor,
        },
        grid: {
          color: surfaceBorder,
        },
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
    cookiesStore.allCookies.length +
    transactionsStore.allTransactions.length +
    boothsStore.allBoothSales.length,
);

// Update chart when data changes
watch(shouldUpdate, () => {
  updateChart();
});
</script>

<template>
  <div class="card">
    <h5>Inventory Projection</h5>
    <p class="text-sm text-gray-600 mb-4">
      Projected inventory over time based on pending and completed transactions.
      Lines show inventory levels, with events marked along the timeline.
    </p>
    <div v-if="chartData" class="chart-container" style="height: 400px">
      <Chart type="line" :data="chartData" :options="chartOptions" />
    </div>
    <div v-else class="text-center p-4 text-gray-500">
      No inventory data available. Add cookies and transactions to see the
      projection.
    </div>

    <!-- Legend for event types -->
    <div class="mt-4 flex flex-wrap gap-4 text-sm">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background-color: #3b82f6" />
        <span>T2G (Troop to Girl)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background-color: #10b981" />
        <span>G2T (Girl to Troop)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background-color: #8b5cf6" />
        <span>C2T (Council to Troop)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background-color: #f59e0b" />
        <span>T2T (Troop to Troop)</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full" style="background-color: #ef4444" />
        <span>Booth Sale</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
}
</style>
