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
  <div class="col-span-12 lg:col-span-6 xl:col-span-2">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-exclamation-triangle" />
          <span>Outstanding</span>
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
  <div class="col-span-12 lg:col-span-6 xl:col-span-2">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-dollar" />
          <span>Payments</span>
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
  <div class="col-span-12 lg:col-span-6 xl:col-span-2">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-arrow-right" />
          <span>Physical</span>
          <i
            v-tooltip.bottom="{
              value:
                'Total physical packages transferred to girl (does not include direct shipped orders).',
              showDelay: 500,
            }"
            class="pi pi-info-circle"
          />
        </p>
      </template>
      <p class="text-xl">
        {{ girlAccount!.totalPhysicalCookiesDistributed }}<br />
      </p>
      <Button
        v-if="
          girlAccount!.cookieTotalsByVariety &&
          Object.keys(girlAccount!.cookieTotalsByVariety).length > 0
        "
        :icon="
          showPackagesCookieList ? 'pi pi-chevron-up' : 'pi pi-chevron-down'
        "
        :label="showPackagesCookieList ? 'Hide Details' : 'Show Details'"
        text
        size="small"
        @click="showPackagesCookieList = !showPackagesCookieList"
      />
      <CookieList
        v-if="
          showPackagesCookieList &&
          girlAccount!.cookieTotalsByVariety &&
          Object.keys(girlAccount!.cookieTotalsByVariety).length > 0
        "
        :cookies="girlAccount!.cookieTotalsByVariety"
        :filter-virtual="true"
        class="mt-2"
      />
    </Fieldset>
  </div>
  <div class="col-span-12 lg:col-span-6 xl:col-span-2">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-box" />
          <span>Virtual (Donated)</span>
          <i
            v-tooltip.bottom="{
              value: 'Total virtual or donated packages transferred to girl.',
              showDelay: 500,
            }"
            class="pi pi-info-circle"
          />
        </p>
      </template>
      <p class="text-xl">
        {{ girlAccount!.totalVirtualCookiesDistributed }}<br />
      </p>
    </Fieldset>
  </div>
  <div class="col-span-12 lg:col-span-6 xl:col-span-2">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-truck" />
          <span>Direct</span>
          <i
            v-tooltip.bottom="{
              value: 'Total direct shipped packages for girl.',
              showDelay: 500,
            }"
            class="pi pi-info-circle"
          />
        </p>
      </template>
      <p class="text-xl">{{ girlAccount!.totalDirectShipCookies }}<br /></p>
    </Fieldset>
  </div>
  <div class="col-span-12 lg:col-span-6 xl:col-span-2">
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
