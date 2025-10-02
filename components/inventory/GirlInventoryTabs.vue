<script setup lang="ts">
const loading = ref(true);

loading.value = true;

const ordersStore = useTransactionsStore();

loading.value = false;

const transactionHelpers = useTransactionHelpers();

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
        </template>
      </Toolbar>

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
              :orders="ordersStore.requestedGirlTransactionrList"
              transaction-types="girl"
            />
          </TabPanel>
          <TabPanel value="1">
            <TransactionsDataTable
              :orders="ordersStore.pendingGirlTransactionList"
              transaction-types="girl"
            />
          </TabPanel>
          <TabPanel value="2">
            <TransactionsDataTable
              :orders="ordersStore.completedGirlTransactionList"
              transaction-types="girl"
              :paginated="true"
            />
          </TabPanel>
          <TabPanel value="3">
            <TransactionsDataTable
              :orders="ordersStore.rejectedGirlTransactionList"
              transaction-types="girl"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>
