<script setup lang="ts">
const props = defineProps<{
  girlId: number;
}>();

const accountsStore = useAccountsStore();
const paymentHelpers = usePaymentHelpers();
const formatHelpers = useFormatHelpers();

const girlAccount = computed(() => {
  console.log('getting girlAccountById for girlId:', props.girlId);
  return accountsStore.getGirlAccountById(props.girlId);
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
  <h5 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
    Payment History for {{ girlAccount!.girl.first_name }}
  </h5>
  <DataTable
    :value="girlAccount!.girlPaymentsList"
    data-key="id"
    sort-field="payment_date"
    :sort-order="1"
    size="small"
  >
    <Column field="payment_date" header="Date" sortable />
    <Column field="amount" header="Amount" sortable>
      <template #body="slotProps">
        {{ formatHelpers.formatCurrency(slotProps.data.amount) }}
      </template>
    </Column>
    <Column field="type" header="Type" sortable>
      <template #body="slotProps">
        {{ formatPaymentType(slotProps.data.type) }}
      </template>
    </Column>
    <Column field="notes" header="Notes" sortable />
    <Column field="actions" header="Actions" style="min-width: 140px">
      <template #body="slotProps">
        <Button
          v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
          aria-label="Edit"
          icon="pi pi-pencil"
          class="mr-2"
          variant="outlined"
          severity="secondary"
          @click="paymentHelpers.editPayment(slotProps.data)"
        />
        <Button
          v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
          aria-label="Delete"
          icon="pi pi-trash"
          class="mr-2"
          variant="outlined"
          severity="warn"
          @click="paymentHelpers.confirmDeletePayment(slotProps.data)"
        />
      </template>
    </Column>
  </DataTable>

  <Dialog
    v-model:visible="accountsStore.deletePaymentDialogVisible"
    :style="{ width: '450px' }"
    header="Confirm"
    :modal="true"
  >
    <div class="flex items-center gap-4">
      <i class="pi pi-exclamation-triangle !text-3xl" />
      <span v-if="accountsStore.activePayment"
        >Are you sure you want to delete the payment from
        <b>{{ accountsStore.activePayment.payment_date }}</b
        >?</span
      >
    </div>
    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        text
        @click="accountsStore.deletePaymentDialogVisible = false"
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        @click="paymentHelpers.deletePayment"
      />
    </template>
  </Dialog>
</template>
