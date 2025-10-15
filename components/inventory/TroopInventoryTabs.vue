<script setup lang="ts">
import type { NewOrder } from '@/types/types';
const loading = ref(true);

loading.value = true;

const ordersStore = useTransactionsStore();
const transactionHelpers = useTransactionHelpers();

loading.value = false;

function openNew() {
  transactionHelpers.editTransaction({} as NewOrder, 'troop');
}
</script>

<template>
  <div class="col-span-12 lg:col-span-12 xl:col-span-12">
    <div class="card">
      <h5>Troop Inventory</h5>
      <Toolbar class="mb-6">
        <template #start>
          <Button
            label="New Troop Transaction"
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
            ><i class="pi pi-box" />Current Inventory</Tab
          >
          <Tab value="1" class="flex items-center gap-2"
            ><i class="pi pi-truck" />Pending ({{
              ordersStore.pendingTroopTransactionListCount
            }})</Tab
          >
          <Tab value="2" class="flex items-center gap-2"
            ><i class="pi pi-check" />Completed ({{
              ordersStore.completedTroopTransactionListCount
            }})</Tab
          >
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <TroopCurrentInventoryDataTable />
          </TabPanel>
          <TabPanel value="1">
            <TransactionsDataTable
              :orders="ordersStore.pendingTroopTransactionList"
              transaction-types="troop"
            />
          </TabPanel>
          <TabPanel value="2">
            <TransactionsDataTable
              :orders="ordersStore.completedTroopTransactionList"
              transaction-types="troop"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>
