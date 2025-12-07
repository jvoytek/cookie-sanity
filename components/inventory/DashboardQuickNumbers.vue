<script setup lang="ts">
  const cookiesStore = useCookiesStore();
  const accountsStore = useAccountsStore();
  // Calculate On Hand - total packages in troop inventory
  const onHandTotal = computed(() => {
    return cookiesStore
      .allCookiesWithInventoryTotals(true)
      .reduce((sum, cookie) => sum + (cookie.onHand || 0), 0);
  });

  // Calculate Requested/Pending - packages requested or pending distribution
  const requestedPendingTotal = computed(() => {
    return cookiesStore
      .allCookiesWithInventoryTotals(true)
      .reduce(
        (sum, cookie) =>
          sum + (cookie.requestedGirl || 0) + (cookie.pendingGirl || 0),
        0,
      );
  });

  // Calculate Total Distributed - all T2G transactions to girls
  const totalDistributed = computed(() => {
    return accountsStore.troopAccountSummary.totalAllCookiesDistributed || 0;
  });

  // Calculate Estimated Sales - total estimated sales of all girls
  const estimatedSales = computed(() => {
    return accountsStore.troopAccountSummary.estimatedTotalSales || 0;
  });
</script>

<template>
  <div class="card grid grid-cols-12 gap-8 mb-8">
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <Fieldset>
        <template #legend>
          <p class="flex flex-wrap gap-2 items-center">
            <i class="pi pi-box" />
            <span>On Hand</span>
          </p>
        </template>
        <p class="text-xl">
          {{ onHandTotal }}<br />
          <span class="text-sm leading-none text-muted-color"
            >packages in troop inventory</span
          >
        </p>
      </Fieldset>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <Fieldset>
        <template #legend>
          <p class="flex flex-wrap gap-2 items-center">
            <i class="pi pi-clock" />
            <span>Requested/Pending</span>
          </p>
        </template>
        <p class="text-xl">
          {{ requestedPendingTotal }}<br />
          <span class="text-sm leading-none text-muted-color"
            >packages requested or pending distribution</span
          >
        </p>
      </Fieldset>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <Fieldset>
        <template #legend>
          <p class="flex flex-wrap gap-2 items-center">
            <i class="pi pi-send" />
            <span>Total Distributed</span>
          </p>
        </template>
        <p class="text-xl">
          {{ totalDistributed }}<br />
          <span class="text-sm leading-none text-muted-color"
            >packages distributed to girls</span
          >
        </p>
      </Fieldset>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
      <Fieldset>
        <template #legend>
          <p class="flex flex-wrap gap-2 items-center">
            <i class="pi pi-chart-line" />
            <span>Estimated Sales</span>
          </p>
        </template>
        <p class="text-xl">
          {{ estimatedSales }}<br />
          <span class="text-sm leading-none text-muted-color"
            >total estimated sales of all girls</span
          >
        </p>
      </Fieldset>
    </div>
  </div>
</template>
