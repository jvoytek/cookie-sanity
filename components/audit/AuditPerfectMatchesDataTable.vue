<script setup lang="ts">
  import TransactionsDataTable from '../inventory/TransactionsDataTable.vue';

  const auditSessionsStore = useAuditSessionsStore();
  const cookiesStore = useCookiesStore();

  // Computed property to format matches for the DataTable
  const formattedMatches = computed(() => {
    return auditSessionsStore.perfectMatches.map((match, index: number) => {
      const auditRow = match.auditRow || {};
      const order = match.order || {};

      return {
        auditRow: auditRow,
        ...order,
      };
    });
  });

  // Get cookie columns from the store
  const cookieColumns = computed(() => {
    return cookiesStore.allCookies.map((cookie) => cookie.abbreviation);
  });

  // Get all non-cookie columns (standard columns)
  const standardColumns = computed(() => {
    const standard = [
      'DATE',
      'TYPE',
      'TO',
      'FROM',
      'ORDER #',
      'STATUS',
      'TOTAL',
      'TOTAL $',
    ];
    return standard;
  });
</script>

<template>
  <div class="card">
    <div
      v-if="!auditSessionsStore.mostRecentAuditSession"
      class="text-center py-8"
    >
      <p class="text-muted-color">
        No audit data uploaded yet. Upload a file to see perfect matches.
      </p>
    </div>

    <div
      v-else-if="auditSessionsStore.perfectMatchesLoading"
      class="text-center py-8"
    >
      <ProgressSpinner />
      <p class="text-muted-color mt-4">Finding perfect matches...</p>
    </div>

    <div v-else-if="formattedMatches.length === 0" class="text-center py-8">
      <p class="text-muted-color">
        No perfect matches found. This means none of the uploaded audit rows
        exactly match database orders.
      </p>
    </div>

    <div v-else>
      <!-- Match Summary -->
      <div class="mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-muted-color">Perfect Matches Found</p>
            <p class="font-semibold text-2xl text-green-600">
              {{ formattedMatches.length }}
            </p>
          </div>
          <div>
            <p class="text-sm text-muted-color">Match Criteria</p>
            <p class="font-semibold">Date, Type, Seller, Cookies</p>
          </div>
          <div>
            <p class="text-sm text-muted-color">Match Rate</p>
            <p class="font-semibold">
              {{
                auditSessionsStore.mostRecentAuditSession?.parsed_rows
                  ? (
                      (formattedMatches.length /
                        (Array.isArray(
                          auditSessionsStore.mostRecentAuditSession.parsed_rows,
                        )
                          ? auditSessionsStore.mostRecentAuditSession
                              .parsed_rows.length
                          : 0)) *
                      100
                    ).toFixed(1)
                  : 0
              }}%
            </p>
          </div>
        </div>
      </div>
      <TransactionsDataTable
        :orders="formattedMatches"
        transaction-types="audit"
        :paginated="true"
      />
      <!-- DataTable -->
      <!---<DataTable
        :value="formattedMatches"
        paginator
        :rows="10"
        :rows-per-page-options="[10, 25, 50]"
        scrollable
        scroll-height="500px"
        data-key="rowNumber"
        :pt="{
          wrapper: { class: 'overflow-auto' },
        }"
      >
        <Column
          field="rowNumber"
          header="Row #"
          :sortable="true"
          frozen
          style="min-width: 80px"
        />
        <Column
          field="date"
          header="Date"
          :sortable="true"
          style="min-width: 120px"
        />
        <Column
          field="type"
          header="Type"
          :sortable="true"
          style="min-width: 100px"
        />
        <Column
          field="toFrom"
          header="Seller"
          :sortable="true"
          style="min-width: 150px"
        />
        <Column
          field="orderNum"
          header="Order #"
          :sortable="true"
          style="min-width: 100px"
        />
        <Column
          v-for="abbr in cookieColumns"
          :key="abbr"
          :field="abbr"
          :header="abbr"
          :sortable="true"
          style="min-width: 80px"
        />
        <Column
          v-for="col in standardColumns.filter(
            (c) => !['DATE', 'TYPE', 'TO', 'FROM', 'ORDER #'].includes(c),
          )"
          :key="col"
          :field="col"
          :header="col"
          :sortable="true"
          style="min-width: 100px"
        />
      </DataTable>-->
    </div>
  </div>
</template>
