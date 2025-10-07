<script setup lang="ts">
import type { Order } from '@/types/types';

const loading = ref(true);

loading.value = true;

const ordersStore = useTransactionsStore();
const girlsStore = useGirlsStore();

loading.value = false;

const transactionHelpers = useTransactionHelpers();

// Filter state - null means show all girls (troop view)
const selectedGirlFilter = ref<number | null>(null);

// Computed property for filter options
const filterOptions = computed(() => {
  const options = [{ label: 'Troop (All Girls)', value: null }];
  const girlOptions = girlsStore.girlOptions.map((option) => ({
    label: option.label,
    value: option.value,
  }));
  return [...options, ...girlOptions];
});

// Computed property for subheader text
const subheaderText = computed(() => {
  if (selectedGirlFilter.value === null) {
    return 'All Girl Transactions';
  }
  const girlName = girlsStore.getGirlNameById(selectedGirlFilter.value);
  return `${girlName}'s Transactions`;
});

// Filtered transaction lists based on selected girl
const filteredRequestedTransactions = computed((): Order[] => {
  return ordersStore.getGirlTransactionsByStatus(
    'requested',
    selectedGirlFilter.value,
  );
});

const filteredPendingTransactions = computed((): Order[] => {
  return ordersStore.getGirlTransactionsByStatus(
    'pending',
    selectedGirlFilter.value,
  );
});

const filteredCompletedTransactions = computed((): Order[] => {
  return ordersStore.getGirlTransactionsByStatus(
    'complete',
    selectedGirlFilter.value,
  );
});

const filteredRejectedTransactions = computed((): Order[] => {
  return ordersStore.getGirlTransactionsByStatus(
    'rejected',
    selectedGirlFilter.value,
  );
});

function openNew() {
  transactionHelpers.editTransaction(
    {
      cookies: {},
      status: 'requested',
    },
    'new',
  );
}
</script>

<template>
  <div class="col-span-12 lg:col-span-12 xl:col-span-12">
    <div class="card">
      <h5>Girl Inventory</h5>
      <p>
        Use this section to track scout restock requests and returns. You can
        also distribute or return cookies without a request.
      </p>
      <Toolbar class="mb-6">
        <template #start>
          <Button
            label="New Girl Transaction"
            icon="pi pi-plus"
            severity="secondary"
            class="mr-2"
            @click="openNew"
          />
          <Select
            v-model="selectedGirlFilter"
            :options="filterOptions"
            option-label="label"
            option-value="value"
            placeholder="Filter by girl"
            class="w-64"
          />
        </template>
      </Toolbar>

      <h6 class="mb-4 text-muted-color">{{ subheaderText }}</h6>

      <Tabs value="0">
        <TabList>
          <Tab value="0" class="flex items-center gap-2"
            ><i class="pi pi-envelope" />Requests ({{
              ordersStore.requestedGirlTransactionrListCount
            }})</Tab
          >
          <Tab value="1" class="flex items-center gap-2"
            ><i class="pi pi-exclamation-triangle" />Pending ({{
              ordersStore.pendingGirlTransactionListCount
            }})</Tab
          >
          <Tab value="2" class="flex items-center gap-2"
            ><i class="pi pi-check" />Completed ({{
              ordersStore.completedGirlTransactionListCount
            }})</Tab
          >
          <Tab value="3" class="flex items-center gap-2"
            ><i class="pi pi-times" />Rejected ({{
              ordersStore.rejectedGirlTransactionListCount
            }})</Tab
          >
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <TransactionsDataTable
              :orders="filteredRequestedTransactions"
              transaction-types="girl"
            />
          </TabPanel>
          <TabPanel value="1">
            <TransactionsDataTable
              :orders="filteredPendingTransactions"
              transaction-types="girl"
            />
          </TabPanel>
          <TabPanel value="2">
            <TransactionsDataTable
              :orders="filteredCompletedTransactions"
              transaction-types="girl"
              :paginated="true"
            />
          </TabPanel>
          <TabPanel value="3">
            <TransactionsDataTable
              :orders="filteredRejectedTransactions"
              transaction-types="girl"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>
