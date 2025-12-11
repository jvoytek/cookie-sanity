<script setup lang="ts">
  const auditSessionsStore = useAuditSessionsStore();
  const cookiesStore = useCookiesStore();

  // Format partial matches for display with rowgroup structure
  const formattedPartialMatches = computed(() => {
    const result: Array<{
      groupIndex: number;
      auditRowData: Record<string, unknown>;
      isAuditRow: boolean;
      matchScore: number;
      matchDetails: {
        dateMatch: boolean;
        typeMatch: boolean;
        toMatch: boolean;
        fromMatch: boolean;
        cookieMatchPercent: number;
        nonCookieFieldsMatched: number;
      };
      orderToGirlName: string | null;
      orderFromGirlName: string | null;
      [key: string]: unknown;
    }> = [];

    auditSessionsStore.partialMatches.forEach((partialMatch, index) => {
      // Add the audit row as a group header
      const auditRow = partialMatch.auditRow || {};

      // Add each matched order as a child row
      partialMatch.matchedOrders.forEach((matchedOrder, matchIndex) => {
        const order = matchedOrder.order || {};
        const orderToGirl = matchedOrder.orderToGirl;
        const orderFromGirl = matchedOrder.orderFromGirl;

        result.push({
          groupIndex: index,
          auditRowData: auditRow,
          isAuditRow: matchIndex === 0, // First match shows the audit row data
          matchScore: matchedOrder.matchScore,
          matchDetails: matchedOrder.matchDetails,
          ...order,
          orderToGirlName: orderToGirl
            ? `${orderToGirl.first_name} ${orderToGirl.last_name}`
            : null,
          orderFromGirlName: orderFromGirl
            ? `${orderFromGirl.first_name} ${orderFromGirl.last_name}`
            : null,
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

      <!-- DataTable with RowGroups -->
      <DataTable
        :value="formattedPartialMatches"
        row-group-mode="subheader"
        group-rows-by="groupIndex"
        sortable
        paginator
        :rows="10"
        :rows-per-page-options="[10, 25, 50]"
        scrollable
        scroll-height="500px"
        :pt="{
          wrapper: { class: 'overflow-auto' },
        }"
      >
        <template #groupheader="slotProps">
          <div class="p-3 bg-primary-50 dark:bg-primary-900">
            <div class="flex justify-between items-center">
              <div>
                <span class="font-semibold">Upload Row:</span>
                <span class="ml-2">{{ slotProps.data.auditRowData.DATE }}</span>
                <span class="ml-2">{{ slotProps.data.auditRowData.TYPE }}</span>
                <span class="ml-2"
                  >To: {{ slotProps.data.auditRowData.TO || 'N/A' }}</span
                >
                <span class="ml-2"
                  >From: {{ slotProps.data.auditRowData.FROM || 'N/A' }}</span
                >
              </div>
            </div>
          </div>
        </template>

        <Column field="matchScore" header="Match %" style="min-width: 100px">
          <template #body="slotProps">
            <span
              :class="{
                'text-green-600': slotProps.data.matchScore > 80,
                'text-yellow-600':
                  slotProps.data.matchScore > 50 &&
                  slotProps.data.matchScore <= 80,
                'text-orange-600': slotProps.data.matchScore <= 50,
              }"
              class="font-semibold"
            >
              {{ slotProps.data.matchScore.toFixed(1) }}%
            </span>
          </template>
        </Column>

        <Column field="order_date" header="DB Date" style="min-width: 120px" />
        <Column field="type" header="DB Type" style="min-width: 100px" />
        <Column
          field="orderToGirlName"
          header="DB To"
          style="min-width: 150px"
        />
        <Column
          field="orderFromGirlName"
          header="DB From"
          style="min-width: 150px"
        />
        <Column
          field="order_num"
          header="DB Order #"
          style="min-width: 100px"
        />

        <Column
          v-for="abbr in cookieColumns"
          :key="abbr"
          :field="`cookies.${abbr}`"
          :header="abbr"
          style="min-width: 80px"
        >
          <template #body="slotProps">
            {{ slotProps.data.cookies?.[abbr] || 0 }}
          </template>
        </Column>

        <Column header="Match Details" style="min-width: 200px">
          <template #body="slotProps">
            <div class="text-xs">
              <div>
                Date: {{ slotProps.data.matchDetails.dateMatch ? '✓' : '✗' }}
              </div>
              <div>
                Type: {{ slotProps.data.matchDetails.typeMatch ? '✓' : '✗' }}
              </div>
              <div>
                To: {{ slotProps.data.matchDetails.toMatch ? '✓' : '✗' }}
              </div>
              <div>
                From: {{ slotProps.data.matchDetails.fromMatch ? '✓' : '✗' }}
              </div>
              <div>
                Fields: {{ slotProps.data.matchDetails.nonCookieFieldsMatched }}
              </div>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
