<script setup lang="ts">
const accountsStore = useAccountsStore();
const formatHelpers = useFormatHelpers();
</script>

<template>
  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-muted-color font-medium mb-4"
            >Total Outstanding</span
          >
          <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
            {{
              formatHelpers.formatCurrency(
                Math.abs(accountsStore.troopAccountSummary.troopBalance),
              )
            }}
          </div>
        </div>
        <div
          class="flex items-center justify-center bg-red-100 dark:bg-red-400/10 rounded-border"
          style="width: 2.5rem; height: 2.5rem"
        >
          <i class="pi pi-exclamation-triangle text-red-500 !text-xl" />
        </div>
      </div>
      <span class="text-muted-color">amount still owed</span>
    </div>
  </div>

  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-muted-color font-medium mb-4"
            >Total Payments</span
          >
          <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
            {{
              formatHelpers.formatCurrency(
                accountsStore.troopAccountSummary.totalPaymentsReceived,
              )
            }}
          </div>
        </div>
        <div
          class="flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-border"
          style="width: 2.5rem; height: 2.5rem"
        >
          <i class="pi pi-dollar text-green-500 !text-xl" />
        </div>
      </div>
      <span class="text-muted-color">total received</span>
    </div>
  </div>

  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-muted-color font-medium mb-4"
            >Total Distributed</span
          >
          <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
            {{
              formatHelpers.formatCurrency(
                accountsStore.troopAccountSummary.totalDistributedValue,
              )
            }}
          </div>
        </div>
        <div
          class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border"
          style="width: 2.5rem; height: 2.5rem"
        >
          <i class="pi pi-box text-blue-500 !text-xl" />
        </div>
      </div>
      <span class="text-muted-color">value distributed</span>
    </div>
  </div>

  <div class="col-span-12 lg:col-span-6 xl:col-span-3">
    <div class="card mb-0">
      <div class="flex justify-between mb-4">
        <div>
          <span class="block text-muted-color font-medium mb-4"
            >Active Accounts</span
          >
          <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">
            {{ accountsStore.troopAccountSummary.activeAccounts }}
          </div>
        </div>
        <div
          class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border"
          style="width: 2.5rem; height: 2.5rem"
        >
          <i class="pi pi-users text-cyan-500 !text-xl" />
        </div>
      </div>
      <span class="text-muted-color">scouts with balances</span>
    </div>
  </div>
</template>
