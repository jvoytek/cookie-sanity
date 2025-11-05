<script setup lang="ts">
const girlsStore = useGirlsStore();
const paymentHelpers = usePaymentHelpers();

// Account selection - null means "Troop"
const selectedAccount = ref<number | null>(null);

// Import dialog visibility
const importDialogVisible = ref(false);

// Options for account selector: "Troop" + all girls
const accountOptions = computed(() => {
  return [{ label: 'Troop', value: null }, ...girlsStore.girlOptions];
});

// Computed flags for conditional rendering
const isTroopView = computed(() => selectedAccount.value === null);
const isGirlView = computed(() => selectedAccount.value !== null);

function openNew() {
  paymentHelpers.editPayment(null);
}

function openImport() {
  importDialogVisible.value = true;
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
            <Button
              label="Import"
              icon="pi pi-upload"
              severity="secondary"
              class="mr-2"
              @click="openImport"
            />
            <Select
              v-model="selectedAccount"
              :options="accountOptions"
              option-label="label"
              option-value="value"
              placeholder="Select account"
              class="w-64"
            />
          </template>
        </Toolbar>
      </div>
    </div>

    <!-- Troop View -->
    <div v-if="isTroopView" class="card">
      <div class="grid grid-cols-12 gap-6">
        <AccountSummaryWidget />
      </div>

      <AccountBalancesTable />
    </div>

    <!-- Girl View -->
    <div v-if="isGirlView" class="card">
      <div class="grid grid-cols-12 gap-6">
        <AccountDetailWidget :girl-id="selectedAccount!" />

        <div class="col-span-12">
          <PaymentsDataTable :girl-id="selectedAccount!" />
        </div>
      </div>
    </div>

    <PaymentDialog />
    <ImportPaymentsDialog v-model:visible="importDialogVisible" />
  </div>
</template>
