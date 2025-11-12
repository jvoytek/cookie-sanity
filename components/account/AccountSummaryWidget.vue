<script setup lang="ts">
const accountsStore = useAccountsStore();
const formatHelpers = useFormatHelpers();

// State for toggling cookie list visibility
const showPackagesCookieList = ref(false);
</script>

<template>
  <div class="col-span-12 lg:col-span-6 xl:col-span-4">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-exclamation-triangle" />
          <span>Outstanding</span>
        </p>
      </template>
      <p class="text-xl">
        {{
          formatHelpers.formatCurrency(
            accountsStore.troopAccountSummary.troopBalance,
          )
        }}<br />
        <span class="text-sm leading-none text-muted-color"
          >total still owed by all girls</span
        >
      </p>
    </Fieldset>
  </div>
  <div class="col-span-12 lg:col-span-6 xl:col-span-4">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-dollar" />
          <span>Payments</span>
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
  <div class="col-span-12 lg:col-span-6 xl:col-span-4">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-tag" />
          <span>Estimated Sales</span>
          <i
            v-tooltip.bottom="{
              value:
                'Payments received/average cookie price + direct, booth, and virtual booth. May not match actual sales.',
              showDelay: 500,
            }"
            class="pi pi-info-circle"
          />
        </p>
      </template>
      <p class="text-xl">
        {{ accountsStore.troopAccountSummary.estimatedTotalSales }}<br />
        <span class="text-sm leading-none text-muted-color"
          >payments received/average cookie price + direct, booth, and virtual
          booth.</span
        >
      </p>
    </Fieldset>
  </div>
</template>
