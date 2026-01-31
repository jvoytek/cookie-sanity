<script setup>
  const { isParent, selectedChildId } = useUserRole();
  const girlsStore = useGirlsStore();
  const accountsStore = useAccountsStore();

  // Get the girl's display name
  const girlName = computed(() => {
    if (!selectedChildId.value) return '';
    return girlsStore.getGirlNameById(selectedChildId.value);
  });

  // Get the girl's account summary
  const girlAccount = computed(() => {
    if (!selectedChildId.value) return null;
    return accountsStore.getGirlAccountById(selectedChildId.value);
  });
</script>

<template>
  <div>
    <!-- Show Girl Dashboard for parents -->
    <div v-if="isParent && selectedChildId" class="space-y-6 relative">
      <!-- Page Header -->
      <div class="col-span-12 lg:col-span-12 xl:col-span-12">
        <div class="card">
          <h5>{{ girlName }} Dashboard</h5>
          <p>View account details and cookie summary</p>
        </div>
      </div>

      <!-- Account Details and Summary -->
      <div v-if="girlAccount && selectedChildId" class="card">
        <div class="grid grid-cols-12 gap-6">
          <AccountDetailWidget
            :girl-id="selectedChildId"
            :girl-account="girlAccount"
          />

          <div style="max-width: 1000px" class="col-span-12">
            <AccountSummaryTable
              :cookie-summary="girlAccount.cookieSummary"
              :total-payments="girlAccount.paymentsReceived"
              :still-due="girlAccount.balance"
            />
          </div>
        </div>
      </div>

      <NoGirlsOverlay />
    </div>

    <!-- Show regular dashboard for non-parents -->
    <div v-else>
      <DashboardQuickNumbers />
      <div class="grid grid-cols-12 gap-8">
        <div class="hidden md:block col-span-12 mb-8">
          <InventoryProjectionChart />
        </div>
      </div>
      <div class="grid grid-cols-12 gap-8">
        <PackagesDistributedChart class="col-span-12 md:col-span-6" />
        <TroopInventoryChart class="col-span-12 md:col-span-6" />
      </div>
      <div class="grid grid-cols-12 gap-8">
        <NextBoothSaleWidget class="col-span-12 md:col-span-4" />
      </div>
    </div>
  </div>
</template>
