<script setup lang="ts">
import type { Order } from '@/types/types';

const props = defineProps<{
  orders: Order[];
  transactionTypes: 'troop' | 'girl' | 'all';
  paginated?: boolean;
}>();

const ordersStore = useTransactionsStore();
const girlsStore = useGirlsStore();
const transactionHelpers = useTransactionHelpers();

// Selection state
const selectedTransactions = ref<Order[]>([]);
const selectAll = ref(false);
const deleteBulkTransactionsDialogVisible = ref(false);

// Watch for select all changes
watch(selectAll, (newValue) => {
  if (newValue) {
    // Select all transactions across all pages
    selectedTransactions.value = [...props.orders];
  } else {
    // Only clear if we're unchecking (not if individual selections caused this)
    if (selectedTransactions.value.length === props.orders.length) {
      selectedTransactions.value = [];
    }
  }
});

// Watch for individual selections to update select all state
watch(
  selectedTransactions,
  (newValue) => {
    selectAll.value =
      newValue.length === props.orders.length && props.orders.length > 0;
  },
  { deep: true },
);

// Reset selection when orders change
watch(
  () => props.orders,
  () => {
    selectedTransactions.value = [];
    selectAll.value = false;
  },
);

// Computed properties for button visibility and counts
const hasSelection = computed(() => selectedTransactions.value.length > 0);

const canMarkComplete = computed(() => {
  if (props.transactionTypes === 'all') return false;
  return props.orders.some((t) => t.status === 'pending');
});

const canUndoRecorded = computed(() => {
  if (props.transactionTypes === 'all') return false;
  return props.orders.some((t) => t.status === 'recorded');
});

const canMarkRecorded = computed(() => {
  if (props.transactionTypes === 'all') return false;
  return props.orders.some((t) => t.status === 'complete');
});

const canApprove = computed(() => {
  if (props.transactionTypes === 'all') return false;
  return props.orders.some((t) => t.status === 'requested');
});

const canMarkPending = computed(() => {
  if (props.transactionTypes === 'all') return false;
  return props.orders.some(
    (t) => t.status === 'complete' || t.status === 'rejected',
  );
});

const canDelete = computed(() => {
  if (props.transactionTypes === 'all') return true;
  if (props.transactionTypes === 'troop') return true;
  if (props.transactionTypes === 'girl') {
    return props.orders.some(
      (t) =>
        t.status === 'rejected' ||
        t.status === 'complete' ||
        t.status === 'recorded',
    );
  }
  return false;
});

const canReject = computed(() => {
  if (props.transactionTypes !== 'girl') return false;
  return props.orders.some(
    (t) => t.status === 'requested' || t.status === 'pending',
  );
});

// Bulk action handlers
const bulkMarkComplete = async () => {
  const toUpdate = selectedTransactions.value.filter(
    (t) => t.status === 'pending' || t.status === 'recorded',
  );
  const transactionIds = toUpdate.map((t) => t.id);
  await ordersStore.updateTransactionStatusBulk(transactionIds, 'complete');
  selectedTransactions.value = [];
};

const bulkMarkRecorded = async () => {
  const toUpdate = selectedTransactions.value.filter(
    (t) => t.status === 'complete',
  );
  const transactionIds = toUpdate.map((t) => t.id);
  await ordersStore.updateTransactionStatusBulk(transactionIds, 'recorded');
  selectedTransactions.value = [];
};

const bulkApprove = async () => {
  const toUpdate = selectedTransactions.value.filter(
    (t) => t.status === 'requested',
  );
  const transactionIds = toUpdate.map((t) => t.id);
  await ordersStore.updateTransactionStatusBulk(transactionIds, 'pending');
  selectedTransactions.value = [];
};

const bulkMarkPending = async () => {
  const toUpdate = selectedTransactions.value.filter(
    (t) => t.status === 'complete' || t.status === 'rejected',
  );
  const transactionIds = toUpdate.map((t) => t.id);
  await ordersStore.updateTransactionStatusBulk(transactionIds, 'pending');
  selectedTransactions.value = [];
};

const bulkDelete = async () => {
  for (const transaction of selectedTransactions.value) {
    await ordersStore.deleteTransaction(transaction.id);
  }
  selectedTransactions.value = [];
  deleteBulkTransactionsDialogVisible.value = false;
};

const bulkReject = async () => {
  const toUpdate = selectedTransactions.value.filter(
    (t) => t.status === 'requested' || t.status === 'pending',
  );
  const transactionIds = toUpdate.map((t) => t.id);
  await ordersStore.updateTransactionStatusBulk(transactionIds, 'rejected');
  selectedTransactions.value = [];
};
</script>

<template>
  <Toolbar v-if="props.transactionTypes !== 'all'" class="mb-4">
    <template #start>
      <span class="mr-4 text-sm text-muted-color">
        {{ selectedTransactions.length }} selected
      </span>
      <Button
        v-if="canMarkComplete"
        :disabled="!hasSelection"
        @click="bulkMarkComplete"
        v-tooltip.bottom="{
          value:
            'Mark all selected transactions as complete. Click this when physical inventory has changed hands',
          showDelay: 500,
        }"
        label="Mark Complete"
        icon="pi pi-check"
        class="mr-2"
        variant="outlined"
      />
      <Button
        v-if="canUndoRecorded"
        :disabled="!hasSelection"
        @click="bulkMarkComplete"
        v-tooltip.bottom="{
          value:
            'Undo marking selected transactions as recorded and mark them as complete again.',
          showDelay: 500,
        }"
        label="Undo Mark Recorded"
        icon="pi pi-undo"
        class="mr-2"
        variant="outlined"
      />
      <Button
        v-if="canMarkRecorded"
        :disabled="!hasSelection"
        @click="bulkMarkRecorded"
        v-tooltip.bottom="{
          value:
            'Click this when you have recorded these transactions in your council\'s cookie management system (Smart Cookies or eBudde)',
          showDelay: 500,
        }"
        label="Mark Recorded"
        icon="pi pi-check-circle"
        class="mr-2"
        variant="outlined"
      />
      <Button
        v-if="canApprove"
        @click="bulkApprove"
        :disabled="!hasSelection"
        v-tooltip.bottom="{
          value: 'Approve selected requests and mark as pending',
          showDelay: 500,
        }"
        label="Approve"
        icon="pi pi-check"
        class="mr-2"
        variant="outlined"
      />
      <Button
        v-if="canMarkPending"
        :disabled="!hasSelection"
        @click="bulkMarkPending"
        v-tooltip.bottom="{
          value: 'Mark selected transactions as pending again',
          showDelay: 500,
        }"
        label="Mark Pending"
        icon="pi pi-undo"
        variant="outlined"
        severity="secondary"
        class="mr-2"
      />
      <Button
        v-if="canReject"
        :disabled="!hasSelection"
        @click="bulkReject"
        v-tooltip.bottom="{
          value: 'Reject selected transaction requests',
          showDelay: 500,
        }"
        label="Reject"
        icon="pi pi-times"
        severity="warn"
        class="mr-2"
        variant="outlined"
      />
      <Button
        v-if="canDelete"
        :disabled="!hasSelection"
        @click="deleteBulkTransactionsDialogVisible = true"
        v-tooltip.bottom="{
          value: 'Delete selected transactions',
          showDelay: 500,
        }"
        label="Delete"
        icon="pi pi-trash"
        severity="warn"
        variant="outlined"
      />
    </template>
  </Toolbar>

  <DataTable
    v-model:selection="selectedTransactions"
    :value="orders"
    data-key="id"
    sort-field="order_date"
    :sort-order="1"
    :paginator="props.paginated !== false"
    :rows="20"
    :rows-per-page-options="[20, 50, 100]"
    size="small"
  >
    <Column
      v-if="props.transactionTypes !== 'all'"
      selection-mode="multiple"
      header-style="width: 3rem"
    />
    <Column
      v-if="
        props.transactionTypes === 'troop' || props.transactionTypes === 'all'
      "
      field="supplier"
      header="Supplier"
      sortable
    />
    <Column field="order_num" header="TXN #" sortable />
    <Column
      v-if="
        props.transactionTypes === 'girl' || props.transactionTypes === 'all'
      "
      field="from"
      header="From"
      sortable
    >
      <template #body="slotProps">
        {{
          slotProps.data.from
            ? girlsStore.getGirlNameById(slotProps.data.from)
            : ''
        }}
      </template>
    </Column>
    <Column
      v-if="
        props.transactionTypes === 'girl' || props.transactionTypes === 'all'
      "
      field="to"
      header="To"
      sortable
    >
      <template #body="slotProps">
        {{
          slotProps.data.to ? girlsStore.getGirlNameById(slotProps.data.to) : ''
        }}
      </template>
    </Column>

    <Column field="type" header="Type" style="min-width: 120px" sortable>
      <template #body="slotProps">
        <Badge
          :severity="
            transactionHelpers.transactionTypeBadgeSeverity(slotProps.data.type)
          "
          >{{
            ordersStore.friendlyTransactionTypes(slotProps.data.type)
          }}</Badge
        >
      </template>
    </Column>
    <Column field="cookies">
      <template #header>
        <span class="p-datatable-column-title"
          >Cookies
          <i
            v-tooltip.bottom="{
              value:
                'Cookie quantities are negative when cookies are moved from the troop inventory to a scout or another location, and positive when cookies are added to the troop inventory from a scout or another location.',
              showDelay: 500,
            }"
            class="pi pi-question-circle"
        /></span>
      </template>
      <template #body="slotProps">
        <CookieList :cookies="slotProps.data.cookies" />
      </template>
    </Column>
    <Column field="order_date" header="Expected" sortable />
    <Column
      v-if="
        props.transactionTypes === 'girl' || props.transactionTypes === 'all'
      "
      field="completed_date"
      header="Completed"
      sortable
    >
      <template #body="slotProps">
        {{
          slotProps.data.status === 'complete'
            ? slotProps.data.completed_date
              ? slotProps.data.completed_date
              : slotProps.data.order_date
            : 'N/A'
        }}
      </template>
    </Column>
    <Column field="actions" header="Actions" style="min-width: 182px">
      <template #body="slotProps">
        <Button
          v-if="
            props.transactionTypes !== 'all' &&
            slotProps.data.status === 'pending'
          "
          v-tooltip.bottom="{
            value: 'Click this when physical inventory has changed hands',
            showDelay: 500,
          }"
          aria-label="Mark Complete"
          icon="pi pi-check"
          class="mr-2"
          variant="outlined"
          @click="
            ordersStore.updateTransactionStatus(slotProps.data.id, 'complete')
          "
        />
        <Button
          v-if="
            props.transactionTypes !== 'all' &&
            slotProps.data.status === 'complete'
          "
          v-tooltip.bottom="{
            value:
              'Click this when you have recorded this transaction in your council\'s cookie management system (Smart Cookies or eBudde)',
            showDelay: 500,
          }"
          aria-label="Mark Recorded"
          icon="pi pi-check-circle"
          class="mr-2"
          variant="outlined"
          @click="
            ordersStore.updateTransactionStatus(slotProps.data.id, 'recorded')
          "
        />
        <Button
          v-if="
            props.transactionTypes !== 'all' &&
            slotProps.data.status === 'requested'
          "
          v-tooltip.bottom="{
            value: 'Click this to approve this request and mark as pending',
            showDelay: 500,
          }"
          aria-label="Approve Request"
          icon="pi pi-check"
          class="mr-2"
          variant="outlined"
          @click="
            ordersStore.updateTransactionStatus(slotProps.data.id, 'pending')
          "
        />
        <Button
          v-if="
            slotProps.data.status === 'rejected' ||
            (props.transactionTypes !== 'all' &&
              slotProps.data.status === 'complete')
          "
          v-tooltip.bottom="{
            value: 'Click this to mark this transaction as pending again',
            showDelay: 500,
          }"
          aria-label="Mark Pending"
          icon="pi pi-undo"
          class="mr-2"
          variant="outlined"
          severity="secondary"
          @click="
            ordersStore.updateTransactionStatus(slotProps.data.id, 'pending')
          "
        />
        <Button
          v-if="
            props.transactionTypes !== 'all' &&
            slotProps.data.status === 'recorded'
          "
          v-tooltip.bottom="{
            value:
              'Click this to undo marking as recorded and mark as completed again',
            showDelay: 500,
          }"
          aria-label="Undo Mark Recorded"
          icon="pi pi-undo"
          class="mr-2"
          variant="outlined"
          severity="secondary"
          @click="
            ordersStore.updateTransactionStatus(slotProps.data.id, 'complete')
          "
        />
        <Button
          v-tooltip.bottom="{ value: 'Edit', showDelay: 500 }"
          aria-label="Edit"
          icon="pi pi-pencil"
          class="mr-2"
          variant="outlined"
          severity="secondary"
          @click="
            transactionHelpers.editTransaction(
              slotProps.data,
              props.transactionTypes,
            )
          "
        />
        <Button
          v-if="
            props.transactionTypes === 'all' ||
            props.transactionTypes === 'troop' ||
            (props.transactionTypes === 'girl' &&
              (slotProps.data.status === 'rejected' ||
                slotProps.data.status === 'complete' ||
                slotProps.data.status === 'recorded'))
          "
          v-tooltip.bottom="{ value: 'Delete', showDelay: 500 }"
          aria-label="Delete"
          icon="pi pi-trash"
          class="mr-2"
          variant="outlined"
          severity="warn"
          @click="transactionHelpers.confirmDeleteTransaction(slotProps.data)"
        />
        <Button
          v-if="
            props.transactionTypes !== 'all' &&
            props.transactionTypes === 'girl' &&
            (slotProps.data.status === 'requested' ||
              slotProps.data.status === 'pending')
          "
          v-tooltip.bottom="{
            value: 'Reject Transaction Request',
            showDelay: 500,
          }"
          aria-label="Reject Transaction Request"
          icon="pi pi-times"
          class="mr-2"
          variant="outlined"
          severity="warn"
          @click="
            ordersStore.updateTransactionStatus(slotProps.data.id, 'rejected')
          "
        />
      </template>
    </Column>
  </DataTable>

  <Dialog
    v-model:visible="ordersStore.deleteTransactionDialogVisible"
    :style="{ width: '450px' }"
    header="Confirm"
    :modal="true"
  >
    <div class="flex items-center gap-4">
      <i class="pi pi-exclamation-triangle !text-3xl" />
      <span v-if="ordersStore.activeTransaction"
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

  <Dialog
    v-model:visible="deleteBulkTransactionsDialogVisible"
    :style="{ width: '450px' }"
    header="Confirm"
    :modal="true"
  >
    <div class="flex items-center gap-4">
      <i class="pi pi-exclamation-triangle !text-3xl" />
      <span
        >Are you sure you want to delete
        <b>{{ selectedTransactions.length }} transaction(s)</b>?</span
      >
    </div>
    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        text
        @click="deleteBulkTransactionsDialogVisible = false"
      />
      <Button label="Yes" icon="pi pi-check" @click="bulkDelete" />
    </template>
  </Dialog>
</template>
