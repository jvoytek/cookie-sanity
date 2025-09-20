<script setup lang="ts">
import type { AccountBalance } from "@/stores/accounts";

const accountsStore = useAccountsStore();
const cookiesStore = useCookiesStore();

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const getGirlDisplayName = (balance: AccountBalance): string => {
  const girl = balance.girl;
  return `${girl.first_name} ${girl.last_name.charAt(0)}.`;
};

const getStatusClass = (status: string): string => {
  if (status.includes("Owes")) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  } else if (status === "Overpaid") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
  } else {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
};
</script>

<template>
      <h5 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
        Scout Account Balances
      </h5>
      <p class="text-muted-color">Current account status for each scout</p>

    <DataTable
      :value="accountsStore.girlAccountBalances"
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

      <Column field="distributedValue" header="Distributed Value" sortable>
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.distributedValue) }}
        </template>
      </Column>

      <Column field="paymentsReceived" header="Payments Received" sortable>
        <template #body="slotProps">
          {{ formatCurrency(slotProps.data.paymentsReceived) }}
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

      <Column field="numCookiesDistributed" header="Packages Distributed" sortable />
      <Column field="estimatedSales" header="Estimated Sales" sortable />
    </DataTable>
</template>
