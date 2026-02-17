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
    <div class="p-datatable p-component p-datatable-gridlines p-datatable-sm">
      <div class="p-datatable-table-container" style="overflow: auto">
        <table role="table" class="p-datatable-table">
          <thead class="p-datatable-thead">
            <tr role="row" class="p-datatable-row">
              <th class="date-col">Date</th>
              <th class="type-col">Transaction Type</th>
              <th
                v-for="abbr in cookieAbbreviations"
                :key="abbr"
                class="cookie-col"
              >
                {{ abbr }}
              </th>
              <th class="cookies-total-col">Total #</th>
              <th class="subtotal-col">Subtotal</th>
              <th class="running-col">Running Total</th>
              <th>Notes</th>
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
              <td class="text-right">{{ entry.cookiesTotal }}</td>
              <td class="subtotal-col text-right">
                {{ formatHelpers.formatCurrency(entry.subtotal) }}
              </td>
              <td class="running-col text-right">
                {{ formatHelpers.formatCurrency(entry.runningTotal) }}
              </td>
              <td class="text-right">
                {{ entry.order_num }} {{ entry.notes }}
                <span v-if="entry.type == 'G2G'">
                  {{ entry.from }} → {{ entry.to }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="timeline.length === 0" class="no-data">
      No transactions or payments found for this girl.
    </div>
  </div>
</template>
