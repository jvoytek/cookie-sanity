<script setup lang="ts">
const accountsStore = useAccountsStore();
const formatHelpers = useFormatHelpers();
</script>

<template>
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-exclamation-triangle" />
          <span>Total Outstanding</span>
        </p>
      </template>
      <p class="text-xl">
        {{ formatHelpers.formatCurrency(accountsStore.troopAccountSummary.troopBalance)
        }}<br />
        <span class="text-sm leading-none text-muted-color"
          >total still owed by all girls</span
        >
      </p>
    </Fieldset>
  </div>
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-dollar" />
          <span>Payments Received</span>
        </p>
      </template>
      <p class="text-xl">
        {{
          formatHelpers.formatCurrency(
            accountsStore.troopAccountSummary.totalPaymentsReceived,
          )
        }}<br />
        <span class="text-sm leading-none text-muted-color"
          >total received</span
        >
      </p>
    </Fieldset>
  </div>
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
            <i class="pi pi-arrow-right" />
            <span>Packages Distributed</span>
        </p>
      </template>
      <p class="text-xl">
        {{ accountsStore.troopAccountSummary.numCookiesDistributed }}<br />
        <span class="text-sm leading-none text-muted-color"
          >{{ accountsStore.troopAccountSummary.numCookiesRemaining }} remain in
          troop inventory</span
        >
      </p>
    </Fieldset>
  </div>
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
            <i class="pi pi-tag" />
            <span>Estimated Sales</span>
        </p>
      </template>
      <p class="text-xl">
        {{ accountsStore.troopAccountSummary.estimatedTotalSales }}<br />
        <span class="text-sm leading-none text-muted-color"
          >payments received/average cookie price</span
        >
      </p>
    </Fieldset>
  </div>
</template>
