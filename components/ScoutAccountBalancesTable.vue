<script setup lang="ts">
import type { AccountBalance } from "@/stores/accounts";

const accountsStore = useAccountsStore();
const cookiesStore = useCookiesStore();

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getGirlDisplayName = (balance: AccountBalance): string => {
  const girl = balance.girl;
  return `${girl.first_name} ${girl.last_name.charAt(0)}.`;
};

const getStatusClass = (status: string): string => {
  if (status.includes('Owes')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  } else if (status === 'Overpaid') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  } else {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
};

const getCookieDistributionSummary = (balance: AccountBalance): string => {
  const totals = Object.entries(balance.cookieTotals)
    .filter(([_, qty]) => qty > 0)
    .map(([abbr, qty]) => {
      const cookie = cookiesStore.allCookies.find(c => c.abbreviation === abbr);
      return `${qty} ${cookie?.name || abbr}`;
    });
  return totals.length > 0 ? totals.join(', ') : 'None';
};
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
        Scout Account Balances
      </h2>
      <p class="text-muted-color">Current account status for each scout</p>
    </div>
    
    <DataTable
      :value="accountsStore.girlAccountBalances"
      data-key="girl.id"
      sort-field="girl.first_name"
      :sort-order="1"
      :paginator="true"
      :rows="10"
      :rows-per-page-options="[10, 25, 50]"
      size="small"
      class="p-datatable-sm"
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
      
      <Column field="balance" header="Balance" sortable>
        <template #body="slotProps">
          <span 
            :class="slotProps.data.balance < 0 ? 'text-red-600 dark:text-red-400' : 
                    slotProps.data.balance > 0 ? 'text-blue-600 dark:text-blue-400' : 
                    'text-green-600 dark:text-green-400'"
            class="font-medium"
          >
            {{ formatCurrency(slotProps.data.balance) }}
          </span>
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
      
      <Column header="Cookie Distribution" style="min-width: 200px">
        <template #body="slotProps">
          <div class="text-sm text-muted-color">
            {{ getCookieDistributionSummary(slotProps.data) }}
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.p-datatable-sm {
  font-size: 0.875rem;
}
</style>