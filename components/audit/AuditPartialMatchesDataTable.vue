<script setup lang="ts">
  import type { SCOrder2025, NewOrder } from '~/types/types';

  const auditSessionsStore = useAuditSessionsStore();
  const cookiesStore = useCookiesStore();
  const transactionsStore = useTransactionsStore();
  const girlsStore = useGirlsStore();

  type PartialMatchRow = NewOrder & {
    id?: number;
    isAuditRow: boolean;
    auditRow?: PartialMatchRow;
    matchScore?: number;
    matchDetails?: {
      dateMatch: boolean;
      typeMatch: boolean;
      toMatch: boolean;
      fromMatch: boolean;
      cookieMatchPercent: number;
      nonCookieFieldsMatched: number;
    };
  };

  // Format partial matches for display with rowgroup structure
  const formattedPartialMatches = computed(() => {
    // extend Order type with additional fields
    const result: PartialMatchRow[] = [];

    auditSessionsStore.partialMatches.forEach((partialMatch, index) => {
      // Add the audit row as a group header
      const auditRow = transactionsStore.convertSCOrderToNewTransaction(
        partialMatch.auditRow as SCOrder2025,
      );
      // convert auditRow to a partial of the expected Order shape before asserting to PartialMatchRow
      result.push({
        ...auditRow,
        isAuditRow: true,
        matchScore: undefined,
        matchDetails: undefined,
      } as PartialMatchRow);
      //Sort the matched orders by match score descending
      partialMatch.matchedOrders.sort((a, b) => b.matchScore - a.matchScore);
      // Add each matched order
      partialMatch.matchedOrders.forEach((matchedOrder, matchIndex) => {
        const order = matchedOrder.order || {};

        result.push({
          ...order,
          isAuditRow: false,
          auditRow: auditRow,
          matchScore: matchedOrder.matchScore,
          matchDetails: matchedOrder.matchDetails,
        });
      });
    });
    return result;
  });

  // Get cookie columns from the store
  const cookieColumns = computed(() => {
    return cookiesStore.allCookies.map((cookie) => cookie.abbreviation);
  });
</script>

<template>
  <div class="card">
    <div
      v-if="!auditSessionsStore.mostRecentAuditSession"
      class="text-center py-8"
    >
      <p class="text-muted-color">
        No audit data uploaded yet. Upload a file to see partial matches.
      </p>
    </div>

    <div
      v-else-if="auditSessionsStore.perfectMatchesLoading"
      class="text-center py-8"
    >
      <ProgressSpinner />
      <p class="text-muted-color mt-4">Finding partial matches...</p>
    </div>

    <div
      v-else-if="formattedPartialMatches.length === 0"
      class="text-center py-8"
    >
      <p class="text-muted-color">
        No partial matches found. This means none of the uploaded audit rows
        partially match database orders.
      </p>
    </div>

    <div v-else>
      <!-- Match Summary -->
      <div class="mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-muted-color">Partial Matches Found</p>
            <p class="font-semibold text-2xl text-yellow-600">
              {{ auditSessionsStore.partialMatches.length }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-color">Match Criteria</p>
            <p class="font-semibold">
              Date ±2 days, Type, Fuzzy Names, Cookies ±1
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-color">Threshold</p>
            <p class="font-semibold">
              >50% cookies + ≥1 field OR >20% cookies + ≥2 fields
            </p>
          </div>
        </div>
      </div>

      <!-- DataTable -->
      <DataTable
        :value="formattedPartialMatches"
        paginator
        :rows="10"
        :rows-per-page-options="[10, 25, 50]"
        :rowStyle="
          ({ isAuditRow }) =>
            isAuditRow != true ? 'background: #EFEFEF;' : null
        "
        showGridlines
      >
        <Column field="matchScore" header="Match Score">
          <template #body="slotProps">
            <span v-if="slotProps.data.isAuditRow">Audit Row</span>

            <span
              v-else
              :class="{
                'text-green-600': slotProps.data.matchScore > 80,
                'text-yellow-600':
                  slotProps.data.matchScore > 50 &&
                  slotProps.data.matchScore <= 80,
                'text-orange-600': slotProps.data.matchScore <= 50,
              }"
              class="font-semibold"
            >
              {{ slotProps.data.matchScore?.toFixed(1) }}%
            </span>
          </template>
        </Column>
        <Column field="order_num" header="TXN #">
          <template #body="slotProps">
            <span
              v-if="!slotProps.data.isAuditRow"
              :class="
                slotProps.data.order_num === slotProps.data.auditRow.order_num
                  ? 'text-green-600'
                  : 'text-red-600'
              "
            >
              {{ slotProps.data.order_num }}
            </span>
            <span v-else> {{ slotProps.data.order_num }} </span>
          </template>
        </Column>

        <Column field="from" header="From">
          <template #body="slotProps">
            <span
              v-if="slotProps.data.isAuditRow !== true && slotProps.data.from"
              :class="
                slotProps.data.from === slotProps.data.auditRow.from
                  ? 'text-green-600'
                  : 'text-red-600'
              "
            >
              {{ girlsStore.getGirlNameById(slotProps.data.from) }}
            </span>
            <span v-else-if="slotProps.data.from">
              {{ girlsStore.getGirlNameById(slotProps.data.from) }}
            </span>
          </template>
        </Column>
        <Column field="to" header="To">
          <template #body="slotProps">
            <span
              v-if="slotProps.data.isAuditRow !== true && slotProps.data.to"
              :class="
                slotProps.data.to === slotProps.data.auditRow.to
                  ? 'text-green-600'
                  : 'text-red-600'
              "
            >
              {{ girlsStore.getGirlNameById(slotProps.data.to) }}
            </span>
            <span v-else-if="slotProps.data.to">
              {{ girlsStore.getGirlNameById(slotProps.data.to) }}
            </span>
          </template>
        </Column>
        <Column field="type" header="Type">
          <template #body="slotProps">
            <span
              v-if="slotProps.data.isAuditRow !== true && slotProps.data.type"
              :class="
                slotProps.data.matchDetails?.typeMatch
                  ? 'text-green-600'
                  : 'text-red-600'
              "
            >
              {{ slotProps.data.type }}
            </span>
            <span v-else-if="slotProps.data.type">
              {{ slotProps.data.type }}
            </span>
          </template>
        </Column>
        <Column field="order_date" header="Date">
          <template #body="slotProps">
            <span
              v-if="
                slotProps.data.isAuditRow !== true && slotProps.data.order_date
              "
              :class="
                slotProps.data.matchDetails?.dateMatch
                  ? 'text-green-600'
                  : 'text-red-600'
              "
            >
              {{ new Date(slotProps.data.order_date).toLocaleDateString() }}
            </span>
            <span v-else-if="slotProps.data.order_date">
              {{ new Date(slotProps.data.order_date).toLocaleDateString() }}
            </span>
          </template>
        </Column>
        <Column field="notes" header="Notes" />

        <Column
          v-for="abbr in cookieColumns"
          :key="abbr"
          :field="`cookies.${abbr}`"
          :header="abbr"
        >
          <template #body="slotProps">
            {{ slotProps.data.cookies?.[abbr] || 0 }}
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
