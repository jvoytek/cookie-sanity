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
      v-if="auditSessionsStore.selectedAuditSessionIds.length === 0"
      class="text-center py-8"
    >
      <p class="text-muted-color">
        No audit data uploaded yet. Upload a file to see perfect matches.
      </p>
    </div>

    <div v-else-if="auditSessionsStore.matchesLoading" class="text-center py-8">
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
                auditSessionsStore.numParsedRows
                  ? (
                      (formattedMatches.length /
                        auditSessionsStore.numParsedRows) *
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
    </div>
  </div>
</template>
