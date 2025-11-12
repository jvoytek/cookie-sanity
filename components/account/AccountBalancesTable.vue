<script setup lang="ts">
import type { GirlAccountSummary } from '@/types/types';

const accountsStore = useAccountsStore();
const paymentHelpers = usePaymentHelpers();
const formatHelpers = useFormatHelpers();

const getGirlDisplayName = (balance: GirlAccountSummary): string => {
  const girl = balance.girl;
  return `${girl.first_name} ${girl.last_name.charAt(0)}.`;
};

const getStatusClass = (status: string): string => {
  if (status === 'Balance Due') {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  } else if (status === 'Overpaid') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  } else {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
};

function openNewForGirl(girlId: number) {
  paymentHelpers.editPayment({ seller_id: girlId });
}
</script>

<template>
  <h5 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
    Scout Account Balances
  </h5>
  <p class="text-muted-color">Current account status for each scout</p>

  <!--
        girl,
      paymentsReceived,
      balance,
      status,
      estimatedSales,
      girlPaymentsList,
      cookieSummary,-->
  <DataTable
    :value="accountsStore.girlGirlAccountSummarys"
    data-key="girl.id"
    sort-field="girl.first_name"
    :sort-order="1"
    class="p-datatable"
  >
    <Column field="girl.first_name" header="Scout" sortable>
      <template #body="slotProps">
        <div class="font-medium">
          {{ getGirlDisplayName(slotProps.data) }}
        </div>
      </template>
    </Column>

    <Column field="totalDue" header="Total Due" sortable>
      <template #body="slotProps">
        {{
          formatHelpers.formatCurrency(slotProps.data.cookieSummary.totalDue)
        }}
      </template>
    </Column>

    <Column field="paymentsReceived" header="Payments" sortable>
      <template #body="slotProps">
        {{ formatHelpers.formatCurrency(slotProps.data.paymentsReceived) }}
      </template>
    </Column>

    <Column field="balance" header="Outstanding" sortable>
      <template #body="slotProps">
        {{ formatHelpers.formatCurrency(slotProps.data.balance) }}
      </template>
    </Column>

    <Column field="status" header="Status" sortable>
      <template #body="slotProps">
        <span
          :class="getStatusClass(slotProps.data.status)"
          class="px-2 py-1 rounded-full text-xs font-medium"
        >
          {{ slotProps.data.status }}
        </span>
      </template>
    </Column>
    <Column field="cookieSummary.countDirectShipped" header="Direct" sortable />
    <Column field="cookieSummary.countBoothSales" header="Booth" sortable />
    <Column
      field="cookieSummary.countVirtualBoothSales"
      header="(V) Booth"
      sortable
    />
    <Column
      field="cookieSummary.countGirlDelivery"
      header="Girl Delivery"
      sortable
    />

    <Column field="estimatedSales" sortable>
      <template #header>
        <span class="flex items-center gap-2">
          <strong>Estimated Sales</strong>
          <i
            v-tooltip.bottom="{
              value:
                'Payments received/average price per cookie + direct, booth and virtual booth. May not match actual sales.',
              showDelay: 500,
            }"
            class="pi pi-info-circle"
          />
        </span>
      </template>
      <template #body="slotProps">
        {{ slotProps.data.estimatedSales }}
      </template>
    </Column>
    <Column header="Actions" style="min-width: 140px">
      <template #body="slotProps">
        <Button
          v-tooltip.bottom="{ value: 'Add Payment', showDelay: 500 }"
          aria-label="Add Payment"
          icon="pi pi-plus"
          class="mr-2"
          variant="outlined"
          severity="secondary"
          @click="openNewForGirl(slotProps.data.girl.id)"
        />
      </template>
    </Column>
  </DataTable>
</template>
