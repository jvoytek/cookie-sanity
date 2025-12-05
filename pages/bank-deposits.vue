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
    return depositsStore.totalDeposits - totalCashChecks.value;
  });

  // Calculate remaining unpaid inventory
  // Total value of C2T and T2T transactions minus non-Digital Cookie payments minus deposits
  const remainingUnpaidInventory = computed(() => {
    // Calculate total value of these transactions
    let totalRestockValue = 0;
    cookiesStore.allCookiesWithInventoryTotals(true).forEach((cookie) => {
      totalRestockValue += cookie.totalReceivedByTroop * cookie.price;
    });
    // Get payments not from Digital Cookie
    const digitalPayments = accountsStore.allPayments
      .filter((p) => p.type === 'digital_cookie')
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Return: total restock value - non-digital payments - deposits
    return totalRestockValue - digitalPayments - depositsStore.totalDeposits;
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
        $formkit: 'primeInputText',
        name: 'deposited_by',
        label: 'Deposited By',
        key: 'deposited_by',
        placeholder: 'Name of person who made the deposit',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
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
        <div class="grid grid-cols-12 gap-6 mb-6">
          <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <Fieldset>
              <template #legend>
                <p class="flex flex-wrap gap-2 items-center">
                  <i class="pi pi-wallet" />
                  <span>To deposit</span>
                </p>
              </template>
              <p class="text-xl">
                {{ formatCurrency(totalCashChecks) }}<br />
                <span class="text-sm leading-none text-muted-color"
                  >total cash/checks collected</span
                >
              </p>
            </Fieldset>
          </div>

          <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <Fieldset>
              <template #legend>
                <p class="flex flex-wrap gap-2 items-center">
                  <i class="pi pi-check-circle" />
                  <span>Deposits</span>
                </p>
              </template>
              <p class="text-xl">
                {{ formatCurrency(depositsStore.totalDeposits) }}<br />
                <span class="text-sm leading-none text-muted-color"
                  >total deposits made</span
                >
              </p>
            </Fieldset>
          </div>

          <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <Fieldset>
              <template #legend>
                <p class="flex flex-wrap gap-2 items-center">
                  <i
                    class="pi"
                    :class="
                      depositDifference >= 0
                        ? 'pi-exclamation-triangle'
                        : 'pi-times-circle'
                    "
                  />
                  <span>Difference</span>
                </p>
              </template>
              <Message
                :severity="depositDifference >= 0 ? 'success' : 'warn'"
                variant="simple"
                size="large"
              >
                {{ formatCurrency(depositDifference) }}<br />
                <span class="text-sm leading-none text-muted-color"
                  >undeposited amount</span
                >
              </Message>
            </Fieldset>
          </div>

          <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <Fieldset>
              <template #legend>
                <p class="flex flex-wrap gap-2 items-center">
                  <i class="pi pi-box" />
                  <span>Remaining</span>
                </p>
              </template>
              <p class="text-xl">
                {{ formatCurrency(remainingUnpaidInventory) }}<br />
                <span class="text-sm leading-none text-muted-color"
                  >remaining unpaid inventory</span
                >
              </p>
            </Fieldset>
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
          <Column field="deposited_by" header="Deposited By" sortable>
            <template #body="slotProps">
              {{ slotProps.data.deposited_by || '-' }}
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
