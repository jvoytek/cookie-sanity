<script setup lang="ts">
  const route = useRoute();
  const girlsStore = useGirlsStore();
  const accountsStore = useAccountsStore();

  // Get the girl ID from the route parameter
  const girlId = computed(() => {
    const id = route.params.id;
    return typeof id === 'string' ? parseInt(id, 10) : null;
  });

  // Get the girl details
  const girl = computed(() => {
    if (girlId.value === null) return null;
    return girlsStore.getGirlById(girlId.value);
  });

  // Get the girl's account summary
  const girlAccount = computed(() => {
    if (girlId.value === null) return null;
    return accountsStore.getGirlAccountById(girlId.value);
  });
</script>

<template>
  <div class="space-y-6 relative">
    <!-- Page Header -->
    <div class="col-span-12 lg:col-span-12 xl:col-span-12">
      <div class="card">
        <h5 v-if="girl">
          {{ girl.first_name }} {{ girl.last_name[0] }}. Dashboard
        </h5>
        <p>View account details and cookie summary</p>
      </div>
    </div>

    <!-- Account Details and Summary -->
    <div v-if="girlAccount && girl" class="card">
      <div class="grid grid-cols-12 gap-6">
        <AccountDetailWidget
          :girl-id="girlId!"
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
</template>
