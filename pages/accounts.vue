<script setup lang="ts">
const accountsStore = useAccountsStore();
const girlsStore = useGirlsStore();
const cookiesStore = useCookiesStore();
const ordersStore = useOrdersStore();

// Fetch all necessary data when the page loads
onMounted(async () => {
  await Promise.all([
    accountsStore.fetchPayments(),
    girlsStore.fetchGirls(),
    cookiesStore.fetchCookies(),
    ordersStore.fetchOrders(),
  ]);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
          Account Management
        </h1>
        <p class="text-muted-color mt-1">
          View and manage scout account balances and payments
        </p>
      </div>
    </div>

    <!-- Troop Summary Dashboard -->
    <div class="grid grid-cols-12 gap-6">
      <AccountSummaryWidget />
    </div>

    <!-- Scout Account Balances Table -->
    <ScoutAccountBalancesTable />
  </div>
</template>