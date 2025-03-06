<script setup lang="ts">
const props = defineProps<{
  orders: Json[];
  transactionTypes: "troop-transactions" | "girl-transactions";
}>();

const ordersStore = useOrdersStore();
const cookiesStore = useCookiesStore();

/*

    const activeTransaction: ref<Json | null> = ref(null);
    const editTransactionDialogVisible: ref<boolean> = ref(false);
    const deleteTransactionDialogVisible: ref<boolean> = ref(false);
    
  Transaction Helpers Composable should return the following:
  {
    submitted: ref<boolean>,
    editTransaction: (order: Order) => void,
    hideDialog: () => void,
    saveTransaction: () => Promise<void>,
    confirmDeleteTransaction: (order: Order) => void,
    deleteTransaction: () => Promise<void>,
    transactionTypeBadgeSeverity: (type: string) => string
  }
  */
const transactionHelpers =
  props.transactionTypes == "troop-transactions"
    ? useTroopTransactionHelpers()
    : useGirlTransactionHelpers();

const transactionTypeBadgeSeverity =
  transactionHelpers.transactionTypeBadgeSeverity;
//const submitted = transactionHelpers.submitted;
</script>

<template>
  <DataTable
    :value="orders"
    data-key="id"
    sort-field="order_date"
    :sort-order="1"
    size="small"
  >
    <Column field="supplier" header="Supplier" style="width: 5%" sortable />
    <Column
      field="order_num"
      header="Transaction #"
      style="width: 5%"
      sortable
    />
    <Column
      field="troop_transaction_type"
      header="Type"
      style="width: 5%"
      sortable
    >
      <template #body="slotProps">
        <Badge
          :severity="
            transactionTypeBadgeSeverity(slotProps.data.troop_transaction_type)
          "
          >{{ slotProps.data.troop_transaction_type }}</Badge
        >
      </template>
    </Column>
    <Column field="cookies" header="Cookies">
      <template #body="slotProps">
        <CookieList :cookies="slotProps.data.cookies" />
      </template>
    </Column>
    <Column
      field="order_date"
      header="Expected Date"
      style="width: 10%"
      sortable
    />
    <Column field="status" header="Status" style="width: 10%" sortable />
    <Column field="notes" header="Notes" style="width: 10%" />
    <Column field="actions" header="Actions" style="width: 30%">
      <template #body="slotProps">
        <Button
          v-if="slotProps.data.status === 'pending'"
          v-tooltip.bottom="{
            value: 'Click this when physical inventory has changed hands',
            showDelay: 500,
          }"
          aria-label="Mark Received"
          icon="pi pi-check"
          class="mr-2"
          variant="outlined"
          @click="ordersStore.markOrderComplete(slotProps.data.id)"
        />
        <Button
          v-if="slotProps.data.status === 'complete'"
          v-tooltip.bottom="{
            value: 'Click this to mark this transaction as pending again',
            showDelay: 500,
          }"
          aria-label="Mark Pending"
          icon="pi pi-undo"
          class="mr-2"
          variant="outlined"
          severity="secondary"
          @click="ordersStore.markOrderPending(slotProps.data.id)"
        />
        <Button
          v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
          aria-label="Edit"
          icon="pi pi-pencil"
          class="mr-2"
          variant="outlined"
          severity="secondary"
          @click="transactionHelpers.editTransaction(slotProps.data)"
        />
        <Button
          v-tooltip.bottom="{ value: 'Cancel', showDelay: 500 }"
          aria-label="Cancel"
          icon="pi pi-times"
          class="mr-2"
          variant="outlined"
          severity="warn"
          @click="transactionHelpers.confirmDeleteTransaction(slotProps.data)"
        />
      </template>
    </Column>
  </DataTable>

  <TransactionDialog
    :transaction-types="'troop-transactions'"
  />

  <Dialog
    v-model:visible="ordersStore.deleteTransactionDialogVisible"
    :style="{ width: '450px' }"
    header="Confirm"
    :modal="true"
  >
    <div class="flex items-center gap-4">
      <i class="pi pi-exclamation-triangle !text-3xl" />
      <span v-if="transaction"
        >Are you sure you want to delete the transaction from
        <b>{{ ordersStore.activeTransaction.order_date }}</b
        >?</span
      >
    </div>
    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        text
        @click="ordersStore.deleteTransactionDialogVisible = false"
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        @click="transactionHelpers.deleteTransaction"
      />
    </template>
  </Dialog>
</template>
