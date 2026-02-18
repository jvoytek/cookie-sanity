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

  const cookieTotals = computed(() => {
    const totals: Record<string, number> = {};
    cookieAbbreviations.value.forEach((abbr) => {
      totals[abbr] = 0;
      timeline.value.forEach((entry) => {
        if (entry.cookies && entry.cookies[abbr]) {
          totals[abbr] += entry.cookies[abbr];
        }
      });
    });
    return totals;
  });

  const grandTotal = computed(() => {
    return Object.values(cookieTotals.value).reduce((sum, val) => sum + val, 0);
  });

  const totalCredits = computed(() => {
    return timeline.value.reduce(
      (sum, entry) => sum + (entry.subtotal < 0 ? entry.subtotal : 0),
      0,
    );
  });

  const totalDebits = computed(() => {
    return timeline.value.reduce(
      (sum, entry) => sum + (entry.subtotal > 0 ? entry.subtotal : 0),
      0,
    );
  });
</script>

<template>
  <div class="print-report">
    <!-- Header with Girl Name and Date -->
    <div class="report-header">
      <h4 v-if="girl">
        Timeline Report - {{ girl.first_name }} {{ girl.last_name }}
      </h4>
      <h4 v-else>Detailed Timeline Report</h4>
      <p class="text-sm text-gray-600">{{ currentDate }}</p>
    </div>

    <!-- Summary Information -->
    <div class="mb-4 text-sm">
      <strong>Balance:</strong>
      {{ formatHelpers.formatCurrency(finalBalance) }}
    </div>

    <!-- Timeline Table -->
    <div class="p-datatable p-component p-datatable-gridlines p-datatable-sm">
      <div class="p-datatable-table-container" style="overflow: auto">
        <table role="table" class="p-datatable-table">
          <thead class="p-datatable-thead">
            <tr
              role="row"
              class="p-datatable-row"
              style="border-bottom: 2px solid #333"
            >
              <th
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #333',
                }"
              >
                Date
              </th>
              <th
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #333',
                }"
              >
                Transaction Type
              </th>
              <th
                v-for="abbr in cookieAbbreviations"
                :key="abbr"
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #333',
                }"
              >
                {{ abbr }}
              </th>
              <th
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #333',
                }"
              >
                Total #
              </th>
              <th
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #333',
                }"
              >
                Debits
              </th>
              <th
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #333',
                }"
              >
                Credits
              </th>

              <th
                :style="{
                  'border-top': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #333',
                }"
              >
                Running Total
              </th>
              <th
                :style="{
                  'border-top': 'none',
                  'border-right': 'none',
                  'border-left': 'none',
                  'border-bottom': '2px solid #333',
                }"
              >
                Notes
              </th>
            </tr>
          </thead>
          <tbody class="p-datatable-tbody">
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
                class="text-right"
              >
                <template v-if="entry.cookies && entry.cookies[abbr]">
                  {{ entry.cookies[abbr] }}
                </template>
                <template v-else-if="entry.cookiesTotal">-</template>
              </td>
              <td class="text-right">{{ entry.cookiesTotal }}</td>
              <td class="subtotal-col text-right">
                <span v-if="entry.subtotal >= 0">{{
                  formatHelpers.formatCurrencyAccounting(entry.subtotal)
                }}</span>
              </td>
              <td class="subtotal-col text-right">
                <span v-if="entry.subtotal < 0">{{
                  formatHelpers.formatCurrencyAccounting(entry.subtotal)
                }}</span>
              </td>

              <td class="running-col text-right">
                {{ formatHelpers.formatCurrencyAccounting(entry.runningTotal) }}
              </td>
              <td class="text-right">
                {{ entry.order_num }} {{ entry.notes }}
                <span v-if="entry.type == 'G2G'">
                  {{ entry.from }} → {{ entry.to }}</span
                >
              </td>
            </tr>
          </tbody>
          <tfoot class="p-datatable-tfoot">
            <tr>
              <td colspan="2" class="text-right"><strong>Total</strong></td>
              <td
                v-for="abbr in cookieAbbreviations"
                :key="abbr"
                class="text-right"
              >
                <strong>{{ cookieTotals[abbr] }}</strong>
              </td>
              <td>
                <strong>{{ grandTotal }}</strong>
              </td>
              <td>
                <strong>{{
                  formatHelpers.formatCurrencyAccounting(totalDebits)
                }}</strong>
              </td>
              <td>
                <strong>{{
                  formatHelpers.formatCurrencyAccounting(totalCredits)
                }}</strong>
              </td>
              <td>
                <strong>{{
                  formatHelpers.formatCurrencyAccounting(finalBalance)
                }}</strong>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div v-if="timeline.length === 0" class="no-data">
      No transactions or payments found for this girl.
    </div>
  </div>
</template>
