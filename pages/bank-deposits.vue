<script setup lang="ts">
  import type { Deposit } from '@/types/types';

  const depositsStore = useDepositsStore();
  const accountsStore = useAccountsStore();
  const transactionsStore = useTransactionsStore();
  const cookiesStore = useCookiesStore();
  const notificationHelpers = useNotificationHelpers();

  const dt = ref();
  const deleteDepositDialog = ref(false);

  // Calculate total cash/checks collected (excluding Digital Cookie payments)
  const totalCashChecks = computed(() => {
    return accountsStore.allPayments
      .filter((p) => p.type !== 'digital_cookie')
      .reduce((sum, payment) => sum + payment.amount, 0);
  });

  // Calculate difference between cash/checks and total deposits
  const depositDifference = computed(() => {
    return totalCashChecks.value - depositsStore.totalDeposits;
  });

  // Calculate remaining unpaid inventory
  // Total value of C2T and T2T transactions minus non-Digital Cookie payments minus deposits
  const remainingUnpaidInventory = computed(() => {
    // Get all C2T and T2T transactions
    const restockTransactions = transactionsStore.allTransactions.filter(
      (t) =>
        (t.type === 'C2T' || t.type === 'T2T') &&
        (t.status === 'complete' || t.status === 'recorded'),
    );

    // Calculate total value of these transactions
    let totalRestockValue = 0;
    restockTransactions.forEach((transaction) => {
      if (transaction.cookies) {
        const cookies = transaction.cookies as Record<string, number>;
        cookiesStore.allCookies.forEach((cookie) => {
          const quantity = cookies[cookie.abbreviation] || 0;
          const price = cookie.price || 0;
          totalRestockValue += quantity * price;
        });
      }
    });

    // Get payments not from Digital Cookie
    const nonDigitalPayments = accountsStore.allPayments
      .filter((p) => p.type !== 'digital_cookie')
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Return: total restock value - non-digital payments - deposits
    return totalRestockValue - nonDigitalPayments - depositsStore.totalDeposits;
  });

  function openNew() {
    depositsStore.depositDialogFormSchema.value = getDepositDialogFormSchema();
    depositsStore.setActiveDeposit(null);
    depositsStore.depositDialogVisible = true;
  }

  function hideDialog() {
    depositsStore.depositDialogVisible = false;
  }

  async function saveDeposit() {
    if (depositsStore.activeDeposit?.id) {
      await depositsStore.upsertDeposit(depositsStore.activeDeposit);
    } else if (depositsStore.activeDeposit) {
      await depositsStore.insertDeposit(depositsStore.activeDeposit);
    }
    depositsStore.depositDialogVisible = false;
    depositsStore.setActiveDeposit(null);
  }

  function editDeposit(deposit: Deposit) {
    depositsStore.depositDialogFormSchema.value = getDepositDialogFormSchema();
    depositsStore.setActiveDeposit(deposit);
    depositsStore.depositDialogVisible = true;
  }

  function confirmDeleteDeposit(deposit: Deposit) {
    depositsStore.setActiveDeposit(deposit);
    deleteDepositDialog.value = true;
  }

  async function deleteDeposit() {
    try {
      await depositsStore.deleteDeposit(depositsStore.activeDeposit);
      deleteDepositDialog.value = false;
      depositsStore.setActiveDeposit(null);
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  }

  const getDepositDialogFormSchema = () => {
    return [
      {
        $formkit: 'primeDatePicker',
        name: 'deposit_date',
        label: 'Deposit Date',
        key: 'deposit_date',
        placeholder: 'Select date',
        validation: 'required|date',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        'date-format': 'mm/dd/yy',
        'show-icon': true,
      },
      {
        $formkit: 'primeInputNumber',
        name: 'amount',
        label: 'Amount',
        key: 'amount',
        placeholder: '0.00',
        validation: 'required|min:0',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        mode: 'currency',
        currency: 'USD',
        locale: 'en-US',
      },
      {
        $formkit: 'primeTextarea',
        name: 'notes',
        label: 'Notes (optional)',
        placeholder: 'Additional notes about this deposit',
        class: 'w-full',
        rows: 3,
      },
    ];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
</script>

<template>
  <div class="grid grid-cols-12 gap-8">
    <div class="col-span-12">
      <div class="card">
        <h5>Bank Deposits</h5>
        <p>
          Track bank deposits of cash and checks collected from cookie sales.
        </p>

        <Toolbar class="mb-6">
          <template #start>
            <Button
              label="New Deposit"
              icon="pi pi-plus"
              severity="secondary"
              class="mr-2"
              @click="openNew"
            />
          </template>
        </Toolbar>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="card bg-blue-50 dark:bg-blue-900/20">
            <div class="flex justify-between items-start">
              <div>
                <span class="block text-500 font-medium mb-2"
                  >Total Cash/Checks Collected</span
                >
                <div class="text-900 font-medium text-xl">
                  {{ formatCurrency(totalCashChecks) }}
                </div>
              </div>
              <div
                class="flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 rounded"
                style="width: 2.5rem; height: 2.5rem"
              >
                <i class="pi pi-wallet text-blue-500 text-xl" />
              </div>
            </div>
          </div>

          <div class="card bg-green-50 dark:bg-green-900/20">
            <div class="flex justify-between items-start">
              <div>
                <span class="block text-500 font-medium mb-2"
                  >Total Deposits</span
                >
                <div class="text-900 font-medium text-xl">
                  {{ formatCurrency(depositsStore.totalDeposits) }}
                </div>
              </div>
              <div
                class="flex items-center justify-center bg-green-100 dark:bg-green-900/40 rounded"
                style="width: 2.5rem; height: 2.5rem"
              >
                <i class="pi pi-check-circle text-green-500 text-xl" />
              </div>
            </div>
          </div>

          <div
            class="card"
            :class="
              depositDifference >= 0
                ? 'bg-yellow-50 dark:bg-yellow-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            "
          >
            <div class="flex justify-between items-start">
              <div>
                <span class="block text-500 font-medium mb-2"
                  >Difference (Undeposited)</span
                >
                <div class="text-900 font-medium text-xl">
                  {{ formatCurrency(depositDifference) }}
                </div>
              </div>
              <div
                class="flex items-center justify-center rounded"
                :class="
                  depositDifference >= 0
                    ? 'bg-yellow-100 dark:bg-yellow-900/40'
                    : 'bg-red-100 dark:bg-red-900/40'
                "
                style="width: 2.5rem; height: 2.5rem"
              >
                <i
                  class="pi text-xl"
                  :class="
                    depositDifference >= 0
                      ? 'pi-exclamation-triangle text-yellow-500'
                      : 'pi-times-circle text-red-500'
                  "
                />
              </div>
            </div>
          </div>

          <div class="card bg-purple-50 dark:bg-purple-900/20">
            <div class="flex justify-between items-start">
              <div>
                <span class="block text-500 font-medium mb-2"
                  >Remaining Unpaid Inventory</span
                >
                <div class="text-900 font-medium text-xl">
                  {{ formatCurrency(remainingUnpaidInventory) }}
                </div>
              </div>
              <div
                class="flex items-center justify-center bg-purple-100 dark:bg-purple-900/40 rounded"
                style="width: 2.5rem; height: 2.5rem"
              >
                <i class="pi pi-box text-purple-500 text-xl" />
              </div>
            </div>
          </div>
        </div>

        <!-- Deposits Table -->
        <DataTable
          ref="dt"
          :value="depositsStore.allDeposits"
          data-key="id"
          sort-field="deposit_date"
          :sort-order="-1"
        >
          <Column field="deposit_date" header="Date" sortable>
            <template #body="slotProps">
              <NuxtTime
                :datetime="slotProps.data.deposit_date"
                time-zone="UTC"
              />
            </template>
          </Column>
          <Column field="amount" header="Amount" sortable>
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.amount) }}
            </template>
          </Column>
          <Column field="notes" header="Notes">
            <template #body="slotProps">
              {{ slotProps.data.notes || '-' }}
            </template>
          </Column>
          <Column :exportable="false" style="min-width: 12rem">
            <template #body="slotProps">
              <Button
                icon="pi pi-pencil"
                outlined
                rounded
                class="mr-2"
                @click="editDeposit(slotProps.data)"
              />
              <Button
                icon="pi pi-trash"
                outlined
                rounded
                severity="danger"
                @click="confirmDeleteDeposit(slotProps.data)"
              />
            </template>
          </Column>
          <template #footer>
            <div class="flex justify-end font-bold">
              Total: {{ formatCurrency(depositsStore.totalDeposits) }}
            </div>
          </template>
        </DataTable>

        <!-- Deposit Dialog -->
        <Dialog
          v-model:visible="depositsStore.depositDialogVisible"
          :style="{ width: '550px' }"
          header="Deposit Details"
          :modal="true"
          @after-hide="depositsStore.setActiveDeposit(null)"
        >
          <div class="flex flex-col gap-6">
            <FormKit
              id="deposit-form"
              v-model="depositsStore.activeDeposit"
              type="form"
              :actions="false"
              @submit="saveDeposit"
            >
              <FormKitSchema
                :schema="depositsStore.depositDialogFormSchema.value"
              />
            </FormKit>
          </div>

          <template #footer>
            <Button
              label="Cancel"
              icon="pi pi-times"
              outlined
              @click="hideDialog"
            />
            <Button label="Save" icon="pi pi-check" @click="saveDeposit" />
          </template>
        </Dialog>

        <!-- Delete Confirmation Dialog -->
        <Dialog
          v-model:visible="deleteDepositDialog"
          :style="{ width: '450px' }"
          header="Confirm"
          :modal="true"
        >
          <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl text-red-500" />
            <span v-if="depositsStore.activeDeposit">
              Are you sure you want to delete the deposit of
              <b>{{ formatCurrency(depositsStore.activeDeposit.amount) }}</b>
              on
              <b
                ><NuxtTime
                  :datetime="depositsStore.activeDeposit.deposit_date" /></b
              >?
            </span>
          </div>
          <template #footer>
            <Button
              label="No"
              icon="pi pi-times"
              text
              @click="deleteDepositDialog = false"
            />
            <Button label="Yes" icon="pi pi-check" @click="deleteDeposit" />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>
