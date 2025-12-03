<script setup lang="ts">
  definePageMeta({
    layout: 'print',
  });

  const accountsStore = useAccountsStore();
  const route = useRoute();
  const formatHelpers = useFormatHelpers();

  // Safely parse account query
  const rawAccount = route.query?.account;
  let accountId: number | null = null;
  if (rawAccount) {
    const first = Array.isArray(rawAccount) ? rawAccount[0] : rawAccount;
    if (typeof first === 'string') {
      const parsed = parseInt(first, 10);
      accountId = Number.isNaN(parsed) ? null : parsed;
    }
  }

  const girlAccount = computed(() => {
    return (
      (accountId !== null
        ? accountsStore.getGirlAccountById(accountId)
        : undefined) || {
        girl: { first_name: '', last_name: '', id: 0 },
        girlPaymentsList: [],
        balance: 0,
        paymentsReceived: 0,
        totalPhysicalCookiesDistributed: 0,
        totalVirtualCookiesDistributed: 0,
        totalDirectShipCookies: 0,
        estimatedSales: 0,
        cookieTotalsByVariety: {},
        cookieSummary: {},
      }
    );
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
</script>

<template>
  <div class="print-report">
    <!-- Header with Girl Name and Date -->
    <div class="report-header">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0">
        Cookie Account Report
      </h1>
      <h2 class="text-2xl text-surface-700 dark:text-surface-300 mt-2">
        {{ girlAccount.girl.first_name }} {{ girlAccount.girl.last_name }}
      </h2>
      <p class="text-muted-color mt-2">Report Date: {{ currentDate }}</p>
    </div>

    <!-- Account Summary Widgets -->
    <div class="grid grid-cols-12 gap-6 mt-6">
      <div class="col-span-12 lg:col-span-6 xl:col-span-4">
        <Fieldset>
          <template #legend>
            <p class="flex flex-wrap gap-2 items-center">
              <i class="pi pi-exclamation-triangle" />
              <span>Still Due</span>
            </p>
          </template>
          <p class="text-xl">
            {{ formatHelpers.formatCurrency(girlAccount.balance) }}<br />
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
            {{ formatHelpers.formatCurrency(girlAccount.paymentsReceived)
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
            </p>
          </template>
          <p class="text-xl">
            {{ girlAccount.estimatedSales }}
          </p>
        </Fieldset>
      </div>
    </div>

    <!-- Cookie Summary Table -->
    <div style="max-width: 1000px" class="mt-6">
      <h3 class="text-xl font-semibold mb-4">Cookie Summary</h3>
      <AccountSummaryTable
        :cookie-summary="girlAccount.cookieSummary"
        :total-payments="girlAccount.paymentsReceived"
        :still-due="girlAccount.balance"
      />
    </div>

    <!-- Payment History -->
    <div class="mt-6">
      <h3 class="text-xl font-semibold mb-4">
        Payment History for {{ girlAccount.girl.first_name }}
      </h3>
      <DataTable
        :value="girlAccount.girlPaymentsList"
        data-key="id"
        sort-field="payment_date"
        :sort-order="1"
        size="small"
        class="print-table"
      >
        <Column field="payment_date" header="Date" sortable>
          <template #body="slotProps">
            <NuxtTime :datetime="slotProps.data.payment_date" time-zone="UTC" />
          </template>
        </Column>
        <Column field="amount" header="Amount" sortable>
          <template #body="slotProps">
            {{ formatHelpers.formatCurrency(slotProps.data.amount) }}
          </template>
        </Column>
        <Column field="type" header="Type" sortable>
          <template #body="slotProps">
            {{ slotProps.data.type }}
          </template>
        </Column>
        <Column field="notes" header="Notes" sortable />
      </DataTable>
    </div>

    <!-- Print Button (hidden when printing) -->
    <div class="mt-6 no-print">
      <Button
        label="Print Report"
        icon="pi pi-print"
        severity="secondary"
        @click="window.print()"
      />
      <Button
        label="Close"
        icon="pi pi-times"
        severity="secondary"
        class="ml-2"
        @click="$router.back()"
      />
    </div>
  </div>
</template>

<style scoped>
  .print-report {
    padding: 2rem;
    max-width: 100%;
  }

  .report-header {
    border-bottom: 2px solid #dee2e6;
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }

  @media print {
    .print-report {
      padding: 0;
    }

    .no-print {
      display: none;
    }

    /* Ensure tables don't break across pages */
    .print-table {
      page-break-inside: avoid;
    }

    /* Remove any background colors for printing */
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
</style>
