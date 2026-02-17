<script setup lang="ts">
  import type { TimelineEntry } from '@/types/types';

  definePageMeta({
    layout: 'print',
  });

  const girlsStore = useGirlsStore();
  const cookiesStore = useCookiesStore();
  const route = useRoute();
  const formatHelpers = useFormatHelpers();
  const timelineHelpers = useTimelineHelpers();

  // Safely parse account query
  const rawAccount = route.query?.account;
  let accountId: number | null = null;
  if (rawAccount) {
    const first = Array.isArray(rawAccount) ? rawAccount[0] : rawAccount;
    if (typeof first === 'string') {
      const parsed = parseInt(first, 10);
      accountId = Number.isNaN(parsed) ? null : parsed;
    }
  }

  const girl = computed(() => {
    return accountId !== null
      ? girlsStore.allGirls.find((g) => g.id === accountId)
      : undefined;
  });

  const timeline = computed((): TimelineEntry[] => {
    if (!accountId) return [];
    return timelineHelpers.buildGirlTimeline(accountId);
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get all cookie abbreviations for column headers
  const cookieAbbreviations = computed(() => {
    return cookiesStore.allCookies.map((c) => c.abbreviation);
  });

  const finalBalance = computed(() => {
    if (timeline.value.length === 0) return 0;
    return timeline.value[timeline.value.length - 1].runningTotal;
  });

  // Calculate total columns for colspan
  const totalColumns = computed(() => {
    // Date, Type, From, To, Subtotal, Running Total = 6
    // Plus one column per cookie variety
    return 6 + cookieAbbreviations.value.length;
  });
</script>

<template>
  <div class="print-report">
    <!-- Header with Girl Name and Date -->
    <div class="report-header">
      <h4 v-if="girl">
        Detailed Timeline Report - {{ girl.first_name }} {{ girl.last_name }}
      </h4>
      <h4 v-else>Detailed Timeline Report</h4>
      <p class="text-sm text-gray-600">{{ currentDate }}</p>
    </div>

    <!-- Summary Information -->
    <div class="mb-4 text-sm">
      <strong>Final Balance:</strong>
      {{ formatHelpers.formatCurrency(finalBalance) }}
    </div>

    <!-- Timeline Table -->
    <div class="timeline-table-container">
      <table class="timeline-table">
        <thead>
          <tr>
            <th class="date-col">Date</th>
            <th class="type-col">Transaction Type</th>
            <th class="from-col">From</th>
            <th class="to-col">To</th>
            <th
              v-for="abbr in cookieAbbreviations"
              :key="abbr"
              class="cookie-col"
            >
              {{ abbr }}
            </th>
            <th class="subtotal-col">Subtotal</th>
            <th class="running-col">Running Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entry, idx) in timeline" :key="idx">
            <td class="date-col">
              <NuxtTime
                :datetime="entry.date"
                time-zone="UTC"
                day="numeric"
                month="numeric"
                year="2-digit"
              />
            </td>
            <td class="type-col">
              {{ timelineHelpers.formatTransactionType(entry.type) }}
            </td>
            <td class="from-col">{{ entry.from || '-' }}</td>
            <td class="to-col">{{ entry.to || '-' }}</td>
            <td
              v-for="abbr in cookieAbbreviations"
              :key="abbr"
              class="cookie-col text-right"
            >
              <template v-if="entry.cookies && entry.cookies[abbr]">
                {{ entry.cookies[abbr] }}
              </template>
              <template v-else>-</template>
            </td>
            <td class="subtotal-col text-right">
              {{ formatHelpers.formatCurrency(entry.subtotal) }}
            </td>
            <td class="running-col text-right font-semibold">
              {{ formatHelpers.formatCurrency(entry.runningTotal) }}
            </td>
          </tr>
          <tr v-if="timeline.length > 0" class="notes-row">
            <td :colspan="totalColumns" class="notes-header">Notes:</td>
          </tr>
          <tr
            v-for="(entry, idx) in timeline.filter((e) => e.notes)"
            :key="`note-${idx}`"
            class="notes-row"
          >
            <td class="notes-date">
              <NuxtTime
                :datetime="entry.date"
                time-zone="UTC"
                day="numeric"
                month="numeric"
                year="2-digit"
              />
            </td>
            <td :colspan="totalColumns - 1" class="notes-content">
              {{ entry.notes }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="timeline.length === 0" class="no-data">
      No transactions or payments found for this girl.
    </div>
  </div>
</template>

<style scoped>
  .print-report {
    font-family: Arial, sans-serif;
    font-size: 10pt;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in;
  }

  .report-header {
    text-align: center;
    margin-bottom: 1rem;
    border-bottom: 2px solid #333;
    padding-bottom: 0.5rem;
  }

  .report-header h4 {
    margin: 0;
    font-size: 14pt;
    font-weight: bold;
  }

  .timeline-table-container {
    width: 100%;
    overflow-x: auto;
  }

  .timeline-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    margin-top: 1rem;
  }

  .timeline-table th {
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    padding: 4px 6px;
    font-weight: bold;
    text-align: left;
    white-space: nowrap;
  }

  .timeline-table td {
    border: 1px solid #ddd;
    padding: 4px 6px;
    vertical-align: top;
  }

  .timeline-table tbody tr:nth-child(odd) {
    background-color: #fafafa;
  }

  .date-col {
    width: 60px;
  }

  .type-col {
    width: 80px;
    font-size: 7pt;
  }

  .from-col,
  .to-col {
    width: 90px;
    font-size: 8pt;
  }

  .cookie-col {
    width: 35px;
    text-align: right;
  }

  .subtotal-col,
  .running-col {
    width: 60px;
    text-align: right;
  }

  .notes-row {
    background-color: #fff !important;
  }

  .notes-header {
    font-weight: bold;
    padding-top: 8px;
    border-top: 2px solid #333;
  }

  .notes-date {
    font-size: 7pt;
    vertical-align: top;
    padding-right: 8px;
  }

  .notes-content {
    font-size: 8pt;
    font-style: italic;
    padding-left: 8px;
  }

  .no-data {
    text-align: center;
    padding: 2rem;
    color: #666;
    font-style: italic;
  }

  @media print {
    .print-report {
      padding: 0.25in;
    }

    .timeline-table {
      font-size: 7pt;
    }

    .type-col {
      font-size: 6pt;
    }

    .from-col,
    .to-col {
      font-size: 7pt;
    }
  }
</style>
