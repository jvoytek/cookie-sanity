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

  const formatPaymentType = (type: string) => {
    switch (type) {
      case 'cash':
        return 'Cash';
      case 'check':
        return 'Check';
      case 'digital_cookie':
        return 'Digital Cookie';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };
</script>

<template>
  <div class="print-report">
    <!-- Header with Girl Name and Date -->
    <div class="report-header">
      <h4>
        Cookie Account Report - {{ girlAccount.girl.first_name }}
        {{ girlAccount.girl.last_name }}
      </h4>
    </div>

    <table class="mt-4" width="400px">
      <tbody>
        <tr>
          <td>Date:</td>
          <td>
            {{ currentDate }}
          </td>
        </tr>
        <tr>
          <td>Still Due:</td>
          <td>
            {{ formatHelpers.formatCurrency(girlAccount.balance) }}
          </td>
        </tr>
        <tr>
          <td>Payments:</td>
          <td>
            {{ formatHelpers.formatCurrency(girlAccount.paymentsReceived) }}
          </td>
        </tr>
        <tr>
          <td>Estimated Sales:</td>
          <td>
            {{ girlAccount.estimatedSales.toLocaleString() }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Cookie Summary Table -->
  <div style="max-width: 1000px" class="mt-6">
    <AccountSummaryTable
      :cookie-summary="girlAccount.cookieSummary"
      :total-payments="girlAccount.paymentsReceived"
      :still-due="girlAccount.balance"
    />
  </div>

  <div class="page-break" />

  <!-- Payment History -->
  <div class="mt-6" style="max-width: 1000px">
    <h5 class="text-xl font-semibold mb-4">Payments</h5>
    <DataTable
      :value="girlAccount.girlPaymentsList"
      data-key="id"
      sort-field="payment_date"
      :sort-order="1"
      size="small"
      class="print-table"
    >
      <Column field="payment_date" header="Date">
        <template #body="slotProps">
          <NuxtTime :datetime="slotProps.data.payment_date" time-zone="UTC" />
        </template>
      </Column>
      <Column field="amount" header="Amount">
        <template #body="slotProps">
          {{ formatHelpers.formatCurrency(slotProps.data.amount) }}
        </template>
      </Column>
      <Column field="type" header="Type">
        <template #body="slotProps">
          {{ formatPaymentType(slotProps.data.type) }}
        </template>
      </Column>
      <Column field="notes" header="Notes" />
    </DataTable>
  </div>
</template>

<style scoped>
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
