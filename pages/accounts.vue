<script setup lang="ts">
const girlsStore = useGirlsStore();
const paymentHelpers = usePaymentHelpers();
const activeGirlAccount = ref(null);
function openNew() {
  paymentHelpers.editPayment({});
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="col-span-12 lg:col-span-12 xl:col-span-12">
      <div class="card">
        <h5>Account Management</h5>
        <p class="text-muted-color mt-1">
          View and manage scout account balances and payments
        </p>
        <Toolbar class="mb-6">
          <template #start>
            <Button
              label="Record Payment"
              icon="pi pi-plus"
              severity="secondary"
              class="mr-2"
              @click="openNew"
            />
          </template>
        </Toolbar>
      </div>
    </div>

    <div class="card">
      <Tabs value="0">
        <TabList>
          <Tab value="0" class="flex items-center gap-2"
            ><i class="pi pi-envelope" />Troop Summary</Tab
          >
          <Tab value="1" class="flex items-center gap-2"
            ><i class="pi pi-exclamation-triangle" />Girl Details</Tab
          >
        </TabList>
        <TabPanel value="0">
          <div class="grid grid-cols-12 gap-6">
            <AccountSummaryWidget />
          </div>

          <AccountBalancesTable />
        </TabPanel>
        <TabPanel value="1">
          <div class="flex flex-wrap items-center">
          <label for="activeGirlAccount" class="m-4">Select a girl to view details:</label>
          <Select
            v-model="activeGirlAccount"
            :options="girlsStore.girlOptions"
            option-label="label"
            option-value="value"
            placeholder="Select a girl"
            class="m-4"
          />
          </div>
          <div class="grid grid-cols-12 gap-6">
            <AccountDetailWidget
            v-if="activeGirlAccount !== null"
            :girl-id="activeGirlAccount"
          />

          <div class="col-span-12">
            <PaymentsDataTable
            v-if="activeGirlAccount !== null"
            :girl-id="activeGirlAccount"
          />
          </div>  
                </div>
      
        </TabPanel>
      </Tabs>
    </div>

    <PaymentDialog />
  </div>
</template>
