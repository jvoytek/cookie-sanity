<script setup lang="ts">
  const girlsStore = useGirlsStore();
  const paymentHelpers = usePaymentHelpers();
  const accountsStore = useAccountsStore();

  const route = useRoute();

  // Safely parse account query which can be string | string[] | null | undefined
  const rawAccount = route.query?.account;
  let accountIdParam: number | null = null;
  if (rawAccount) {
    const first = Array.isArray(rawAccount) ? rawAccount[0] : rawAccount;
    if (typeof first === 'string') {
      const parsed = parseInt(first, 10);
      accountIdParam = Number.isNaN(parsed) ? null : parsed;
    }
  }

  // Account selection - null means "Troop"
  const selectedAccount = ref<number | null>(accountIdParam);

  const girlAccount = computed(() => {
    return (
      (selectedAccount.value !== null
        ? accountsStore.getGirlAccountById(selectedAccount.value)
        : undefined) || {
        girl: { first_name: '' },
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

  // Import dialog visibility
  const importDialogVisible = ref(false);

  // Options for account selector: "Troop" + all girls
  const accountOptions = computed(() => {
    return [{ label: 'Troop', value: null }, ...girlsStore.girlOptions];
  });

  // Computed flags for conditional rendering
  const isTroopView = computed(() => selectedAccount.value === null);
  const isGirlView = computed(() => selectedAccount.value !== null);

  function openNew() {
    paymentHelpers.editPayment(null);
  }

  function openImport() {
    importDialogVisible.value = true;
  }

  function setQueryParam() {
    const query = { ...route.query };
    if (selectedAccount.value !== null) {
      query.account = selectedAccount.value.toString();
    } else {
      delete query.account;
    }
    useRouter().replace({ query });
  }

  function openPrintReport() {
    if (selectedAccount.value !== null) {
      const printUrl = `/account-print?account=${selectedAccount.value}`;
      window.open(printUrl, '_blank');
    }
  }
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="col-span-12 lg:col-span-12 xl:col-span-12">
      <div class="card">
        <h5>Account Management</h5>
        <p class="text-muted-color mt-1">
          View and manage scout account balances and payments
        </p>
        <Toolbar class="mb-6">
          <template #start>
            <Button
              label="Record Payment"
              icon="pi pi-plus"
              severity="secondary"
              class="mr-2"
              @click="openNew"
            />
            <Button
              label="Import"
              icon="pi pi-upload"
              severity="secondary"
              class="mr-2"
              @click="openImport"
            />
            <Button
              v-if="isGirlView"
              label="Print"
              icon="pi pi-print"
              severity="secondary"
              class="mr-2"
              @click="openPrintReport"
            />
            <Select
              v-model="selectedAccount"
              :options="accountOptions"
              option-label="label"
              option-value="value"
              placeholder="Select account"
              class="w-64"
              @change="setQueryParam"
            />
          </template>
        </Toolbar>
      </div>
    </div>

    <!-- Troop View -->
    <div v-if="isTroopView" class="card">
      <div class="grid grid-cols-12 gap-6">
        <AccountSummaryWidget />
      </div>

      <AccountBalancesTable />
    </div>

    <!-- Girl View -->
    <div v-if="isGirlView" class="card">
      <div class="grid grid-cols-12 gap-6">
        <AccountDetailWidget
          :girl-id="selectedAccount!"
          :girl-account="girlAccount"
        />

        <div style="max-width: 1000px" class="col-span-12">
          <AccountSummaryTable
            :cookie-summary="girlAccount.cookieSummary"
            :total-payments="girlAccount.paymentsReceived"
            :still-due="girlAccount.balance"
          />
        </div>

        <div class="col-span-12">
          <PaymentsDataTable
            :girl-id="selectedAccount!"
            :girl-account="girlAccount"
          />
        </div>
      </div>
    </div>

    <PaymentDialog />
    <ImportPaymentsDialog v-model:visible="importDialogVisible" />
  </div>
</template>
