<script setup lang="ts">
const accountsStore = useAccountsStore();
const formatHelpers = useFormatHelpers();

const props = defineProps<{
  girlId: number;
}>();

const girlAccount = computed(() => {
  return accountsStore.getGirlAccountById(props.girlId);
});

// State for toggling cookie list visibility
const showPackagesCookieList = ref(false);
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
        {{ formatHelpers.formatCurrency(girlAccount!.balance) }}<br />
        <span class="text-sm leading-none text-muted-color"
          >total still owed</span
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
        {{ formatHelpers.formatCurrency(girlAccount!.paymentsReceived) }}<br />
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
      <p class="text-xl">{{ girlAccount!.numCookiesDistributed }}<br /></p>
      <Button
        v-if="
          girlAccount!.cookieTotals &&
          Object.keys(girlAccount!.cookieTotals).length > 0
        "
        :icon="
          showPackagesCookieList ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
        "
        :label="showPackagesCookieList ? 'Hide Details' : 'Show Details'"
        text
        size="small"
        class="mt-2"
        @click="showPackagesCookieList = !showPackagesCookieList"
      />
      <CookieList
        v-if="
          showPackagesCookieList &&
          girlAccount!.cookieTotals &&
          Object.keys(girlAccount!.cookieTotals).length > 0
        "
        :cookies="girlAccount!.cookieTotals"
        class="mt-2"
      />
    </Fieldset>
  </div>
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-tag" />
          <span>Estimated Sales</span>
          <i
            v-tooltip.bottom="{
              value:
                'Payments received/average cookie price + direct shipped orders. May not match actual sales.',
              showDelay: 500,
            }"
            class="pi pi-info-circle"
          />
        </p>
      </template>
      <p class="text-xl">
        {{ girlAccount!.estimatedSales }}
      </p>
    </Fieldset>
  </div>
</template>
