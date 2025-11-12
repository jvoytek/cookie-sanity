<script setup lang="ts">
  import type { GirlAccountSummary } from '@/types/types';
  const formatHelpers = useFormatHelpers();

  const props = defineProps<{
    girlId: number;
    girlAccount: GirlAccountSummary;
  }>();
</script>

<template>
  <div class="col-span-12 lg:col-span-6 xl:col-span-4">
    <Fieldset>
      <template #legend>
        <p class="flex flex-wrap gap-2 items-center">
          <i class="pi pi-exclamation-triangle" />
          <span>Still Due</span>
        </p>
      </template>
      <p class="text-xl">
        {{ formatHelpers.formatCurrency(props.girlAccount.balance) }}<br />
        <span class="text-sm leading-none text-muted-color"
          >total still owed</span
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
        {{ formatHelpers.formatCurrency(props.girlAccount.paymentsReceived)
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
                'Payments received/average cookie price + direct, booth sales and virtual booth sales. May not match actual sales.',
              showDelay: 500,
            }"
            class="pi pi-info-circle"
          />
        </p>
      </template>
      <p class="text-xl">
        {{ props.girlAccount.estimatedSales }}
      </p>
    </Fieldset>
  </div>
</template>
