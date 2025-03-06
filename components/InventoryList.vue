<script setup lang="ts">

const loading = ref(true);

loading.value = true;

const ordersStore = useOrdersStore();
const cookiesStore = useCookiesStore();

loading.value = false;

function openNew() {
  ordersStore.activeTransaction = {
    cookies: {},
    type: "order",
    status: "pending"
  };
  ordersStore.editTransactionDialogVisible = true;
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
              ordersStore.pendingRestockListCount
            }})</Tab
          >
          <Tab value="2" class="flex items-center gap-2"
            ><i class="pi pi-check" />Completed ({{
              ordersStore.completedRestockListCount
            }})</Tab
          >
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <div>
              <div class="card">
                <DataTable
                  :value="cookiesStore.allCookies"
                  data-key="id"
                  sort-field="order"
                  size="small"
                >
                  <Column
                    field="name"
                    header="Cookie Type"
                    style="width: 10%"
                    sortable
                  >
                    <template #body="slotProps">
                      <div class="text-sm flex items-center gap-2">
                        <span
                          class="w-2 h-2 rounded-full flex-shrink-0"
                          :style="{
                            backgroundColor: slotProps.data.color || '#888',
                          }"
                        />
                        <span>{{ slotProps.data.name }}</span>
                      </div>
                    </template>
                  </Column>
                  <Column
                    field="currentStock"
                    header="Current Stock"
                    style="width: 10%"
                    sortable
                  >
                    <template #body="slotProps">
                      {{
                        ordersStore.currentStock[slotProps.data.abbreviation]
                      }}
                    </template>
                  </Column>
                </DataTable>
              </div>
            </div>
          </TabPanel>
          <TabPanel value="1">
            <TransactionsDataTable :orders="ordersStore.pendingRestockList" :transaction-types="'troop-transactions'" />
          </TabPanel>
          <TabPanel value="2">
            <TransactionsDataTable :orders="ordersStore.completedRestockList" :transaction-types="'troop-transactions'" />
          </TabPanel>
        </TabPanels>
      </Tabs>

 
    </div>
  </div>
</template>
