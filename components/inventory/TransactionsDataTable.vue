<script setup lang="ts">
  import type { Order } from '@/types/types';
  import { Button } from 'primevue';
  import { FilterMatchMode, FilterService } from '@primevue/core/api';

  const props = defineProps<{
    orders: Order[];
    transactionTypes: 'troop' | 'girl' | 'all' | 'audit' | 'audit-extra';
    paginated?: boolean;
    noTransactionsMessage?: string;
  }>();

  const transactionsStore = useTransactionsStore();
  const girlsStore = useGirlsStore();
  const transactionHelpers = useTransactionHelpers();
  const cookiesStore = useCookiesStore();

  // Selection state
  const selectedTransactions = ref<Order[]>([]);

  const showReceipt = (transaction: Order) => {
    // Open new tab with /pages/receipts?id=transaction.id
    window.open(
      `/receipts?id=${transaction.id}`,
      '_blank',
      'noopener,noreferrer',
    );
  };
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
    if (
      props.transactionTypes === 'all' ||
      props.transactionTypes === 'audit-extra'
    )
      return false;
    return (
      (props.transactionTypes === 'audit' &&
        props.orders.some((t) => t.status === 'recorded')) ||
      props.orders.some((t) => t.status === 'pending')
    );
  });

  const canUndoRecorded = computed(() => {
    if (
      props.transactionTypes === 'all' ||
      props.transactionTypes === 'audit' ||
      props.transactionTypes === 'audit-extra'
    )
      return false;
    return props.orders.some((t) => t.status === 'recorded');
  });

  const canMarkRecorded = computed(() => {
    if (
      props.transactionTypes === 'all' ||
      props.transactionTypes === 'audit-extra'
    )
      return false;
    return props.orders.some((t) => t.status === 'complete');
  });

  const canApprove = computed(() => {
    if (
      props.transactionTypes === 'all' ||
      props.transactionTypes === 'audit-extra'
    )
      return false;
    return props.orders.some((t) => t.status === 'requested');
  });

  const canMarkPending = computed(() => {
    if (
      props.transactionTypes === 'all' ||
      props.transactionTypes === 'audit' ||
      props.transactionTypes === 'audit-extra'
    )
      return false;
    return props.orders.some(
      (t) => t.status === 'complete' || t.status === 'rejected',
    );
  });

  const canDelete = computed(() => {
    if (
      props.transactionTypes === 'audit' ||
      props.transactionTypes === 'audit-extra'
    )
      return false;
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

  const canAddExtraAuditRows = computed(() => {
    return props.transactionTypes === 'audit-extra';
  });

  const girlsSelect = computed(() => {
    return girlsStore.allGirls.map((girl) => ({
      name: girlsStore.getGirlNameById(girl.id),
      id: girl.id,
    }));
  });

  const girlsTransactionTypeOptions = computed(() => {
    return transactionsStore.girlTransactionTypeOptions;
  });
  const troopTransactionTypeOptions = computed(() => {
    return transactionsStore.troopTransactionTypeOptions;
  });

  // Bulk action handlers
  const bulkMarkComplete = async () => {
    const toUpdate = selectedTransactions.value.filter(
      (t) => t.status === 'pending' || t.status === 'recorded',
    );
    const transactionIds = toUpdate.map((t) => t.id);
    await transactionsStore.updateTransactionStatusBulk(
      transactionIds,
      'complete',
      props.transactionTypes === 'audit' ? true : false,
    );
    selectedTransactions.value = [];
  };

  const bulkMarkRecorded = async () => {
    const toUpdate = selectedTransactions.value.filter(
      (t) => t.status === 'complete',
    );
    const transactionIds = toUpdate.map((t) => t.id);
    await transactionsStore.updateTransactionStatusBulk(
      transactionIds,
      'recorded',
      props.transactionTypes === 'audit' ? true : false,
    );
    selectedTransactions.value = [];
  };

  const bulkApprove = async () => {
    const toUpdate = selectedTransactions.value.filter(
      (t) => t.status === 'requested',
    );
    const transactionIds = toUpdate.map((t) => t.id);
    await transactionsStore.updateTransactionStatusBulk(
      transactionIds,
      'pending',
    );
    selectedTransactions.value = [];
  };

  const bulkMarkPending = async () => {
    const toUpdate = selectedTransactions.value.filter(
      (t) => t.status === 'complete' || t.status === 'rejected',
    );
    const transactionIds = toUpdate.map((t) => t.id);
    await transactionsStore.updateTransactionStatusBulk(
      transactionIds,
      'pending',
    );
    selectedTransactions.value = [];
  };

  const bulkDelete = async () => {
    const transactionIds = selectedTransactions.value.map((t) => t.id);
    await transactionsStore.bulkDeleteTransactions(transactionIds);
    selectedTransactions.value = [];
    deleteBulkTransactionsDialogVisible.value = false;
  };

  const bulkReject = async () => {
    const toUpdate = selectedTransactions.value.filter(
      (t) => t.status === 'requested' || t.status === 'pending',
    );
    const transactionIds = toUpdate.map((t) => t.id);
    await transactionsStore.updateTransactionStatusBulk(
      transactionIds,
      'rejected',
    );
    selectedTransactions.value = [];
  };

  const bulkShowReceipt = () => {
    // Open new tab with /pages/receipts?id=transactionIds
    const transactionIds = selectedTransactions.value
      .map((t) => t.id)
      .join('&id=');
    window.open(
      `/receipts?id=${transactionIds}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const bulkAddAuditRows = async () => {
    await transactionsStore.bulkInsertNewTransactions(
      selectedTransactions.value,
      true,
    );
    selectedTransactions.value = [];
  };

  const addAuditRow = async (transaction: Order) => {
    await transactionsStore.insertNewTransaction(transaction, true);
  };

  const canShowReceipt = computed(() => {
    return selectedTransactions.value.every((transaction) =>
      transactionsStore.transactionRequiresReceipt(transaction),
    );
  });

  const anyReceiptsAvailable = computed(() => {
    if (
      props.transactionTypes === 'audit' ||
      props.transactionTypes === 'audit-extra'
    )
      return false;
    return props.orders.some((transaction) =>
      transactionsStore.transactionRequiresReceipt(transaction),
    );
  });

  const getStatusBadgeSeverity = (status: string | null) => {
    if (status === 'complete') return 'success';
    if (status === 'recorded') return 'info';
    if (status === 'pending') return 'warn';
    return 'secondary';
  };

  const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    order_num: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    notes: { value: null, matchMode: FilterMatchMode.IN },
    supplier: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    from: { value: null, matchMode: FilterMatchMode.EQUALS },
    to: { value: null, matchMode: FilterMatchMode.EQUALS },
    type: { value: null, matchMode: FilterMatchMode.EQUALS },
    cookies: { value: null, matchMode: 'cookies_contains' }, // Custom filter for cookies
  });

  const globalFilterFields = ref([
    'order_num',
    'notes',
    'supplier',
    'from',
    'to',
    'type',
    'cookies',
  ]);

  // Example: Filter that checks if a string starts with a specific prefix (case-sensitive)
  FilterService.register('cookies_contains', (value, abbreviationsList) => {
    if (
      abbreviationsList === undefined ||
      abbreviationsList === null ||
      abbreviationsList.length === 0
    )
      return true;
    if (value === undefined || value === null) return false;

    let containsAll = true;
    abbreviationsList.forEach((abbreviation: string) => {
      console.log(value[abbreviation]);
      if (
        value[abbreviation] === undefined ||
        value[abbreviation] === null ||
        value[abbreviation] === 0
      ) {
        containsAll = false;
      }
    });
    return containsAll;
  });

  const moreActions = (transaction: Order) => [
    {
      label: 'Duplicate',
      icon: 'pi pi-copy',
      command: () =>
        transactionHelpers.duplicateTransaction(
          transaction,
          props.transactionTypes,
        ),
    },
    {
      label: 'Delete',
      icon: 'pi pi-trash',
      command: () => transactionHelpers.confirmDeleteTransaction(transaction),
    },
  ];

  const menuRefs = ref({});
  const setMenuRef = (el, id) => {
    if (el) menuRefs.value[id] = el;
  };
  // Use in template: :ref="(el) => setMenuRef(el, item.id)"
  const toggleMenu = (event, itemId) => {
    menuRefs.value[itemId].toggle(event);
  };
</script>

<template>
  <div v-if="orders.length === 0" class="p-4 text-center text-muted-color">
    {{ props.noTransactionsMessage || 'No transactions found.' }}
  </div>
  <div v-else>
    <Toolbar v-if="props.transactionTypes !== 'all'" class="mb-4">
      <template #start>
        <span class="mr-4 text-sm text-muted-color">
          {{ selectedTransactions.length }} selected
        </span>
        <Button
          v-if="canAddExtraAuditRows"
          v-tooltip.bottom="{
            value: 'Add selected rows to database as new transactions',
            showDelay: 500,
          }"
          :disabled="!hasSelection"
          label="Add Transactions to Database"
          icon="pi pi-plus"
          class="mr-2"
          variant="outlined"
          @click="bulkAddAuditRows"
        />
        <Button
          v-if="canMarkComplete"
          v-tooltip.bottom="{
            value:
              'Mark all selected transactions as complete. Click this when physical inventory has changed hands',
            showDelay: 500,
          }"
          :disabled="!hasSelection"
          label="Mark Complete"
          icon="pi pi-check"
          class="mr-2"
          variant="outlined"
          @click="bulkMarkComplete"
        />
        <Button
          v-if="canUndoRecorded"
          v-tooltip.bottom="{
            value:
              'Undo marking selected transactions as recorded and mark them as complete again.',
            showDelay: 500,
          }"
          :disabled="!hasSelection"
          label="Undo Mark Recorded"
          icon="pi pi-undo"
          class="mr-2"
          variant="outlined"
          @click="bulkMarkComplete"
        />
        <Button
          v-if="canMarkRecorded"
          v-tooltip.bottom="{
            value:
              'Click this when you have recorded these transactions in your council\'s cookie management system (Smart Cookies or eBudde)',
            showDelay: 500,
          }"
          :disabled="!hasSelection"
          label="Mark Recorded"
          icon="pi pi-check-circle"
          class="mr-2"
          variant="outlined"
          @click="bulkMarkRecorded"
        />
        <Button
          v-if="canApprove"
          v-tooltip.bottom="{
            value: 'Approve selected requests and mark as pending',
            showDelay: 500,
          }"
          :disabled="!hasSelection"
          label="Approve"
          icon="pi pi-check"
          class="mr-2"
          variant="outlined"
          @click="bulkApprove"
        />
        <Button
          v-if="canMarkPending"
          v-tooltip.bottom="{
            value: 'Mark selected transactions as pending again',
            showDelay: 500,
          }"
          :disabled="!hasSelection"
          label="Mark Pending"
          icon="pi pi-undo"
          variant="outlined"
          severity="secondary"
          class="mr-2"
          @click="bulkMarkPending"
        />
        <Button
          v-if="canReject"
          v-tooltip.bottom="{
            value: 'Reject selected transaction requests',
            showDelay: 500,
          }"
          :disabled="!hasSelection"
          label="Reject"
          icon="pi pi-times"
          severity="warn"
          class="mr-2"
          variant="outlined"
          @click="bulkReject"
        />
        <Button
          v-if="canDelete"
          v-tooltip.bottom="{
            value: 'Delete selected transactions',
            showDelay: 500,
          }"
          :disabled="!hasSelection"
          label="Delete"
          icon="pi pi-trash"
          severity="warn"
          variant="outlined"
          @click="deleteBulkTransactionsDialogVisible = true"
        />
        <Button
          v-if="anyReceiptsAvailable"
          v-tooltip.bottom="{
            value: 'View receipt for selected transaction(s)',
            showDelay: 500,
          }"
          :disabled="!hasSelection || !canShowReceipt"
          label="View Receipt"
          icon="pi pi-file"
          class="ml-2"
          variant="outlined"
          severity="secondary"
          @click="bulkShowReceipt"
        />
      </template>
    </Toolbar>

    <DataTable
      v-model:selection="selectedTransactions"
      v-model:filters="filters"
      filterDisplay="row"
      :globalFilterFields="globalFilterFields"
      :value="orders"
      data-key="id"
      sort-field="sortDate"
      :sort-order="-1"
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
          props.transactionTypes === 'troop' ||
          props.transactionTypes === 'all' ||
          props.transactionTypes === 'audit' ||
          props.transactionTypes === 'audit-extra'
        "
        field="supplier"
        header="Supplier"
        sortable
      >
        <template #body="slotProps">
          <span>{{ slotProps.data.supplier }}</span>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search Supplier"
          />
        </template>
      </Column>
      <Column field="order_num" header="TXN #" sortable>
        <template #body="slotProps">
          <span>{{ slotProps.data.order_num }}</span>
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search TXN #"
          />
        </template>
      </Column>
      <Column
        v-if="
          props.transactionTypes === 'girl' ||
          props.transactionTypes === 'all' ||
          props.transactionTypes === 'audit' ||
          props.transactionTypes === 'audit-extra'
        "
        field="from"
        header="From"
        sortable
        filterField="from"
        :showFilterMenu="false"
      >
        <template #body="slotProps">
          {{
            slotProps.data.from
              ? girlsStore.getGirlNameById(slotProps.data.from)
              : ''
          }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Select
            v-model="filterModel.value"
            @change="filterCallback()"
            :options="girlsSelect"
            optionLabel="name"
            optionValue="id"
            placeholder="Select One"
            :showClear="true"
          />
        </template>
      </Column>
      <Column
        v-if="
          props.transactionTypes === 'girl' ||
          props.transactionTypes === 'all' ||
          props.transactionTypes === 'audit' ||
          props.transactionTypes === 'audit-extra'
        "
        field="to"
        header="To"
        sortable
        filterField="to"
        :showFilterMenu="false"
      >
        <template #body="slotProps">
          {{
            slotProps.data.to
              ? girlsStore.getGirlNameById(slotProps.data.to)
              : ''
          }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Select
            v-model="filterModel.value"
            @change="filterCallback()"
            :options="girlsSelect"
            optionLabel="name"
            optionValue="id"
            placeholder="Select One"
            :showClear="true"
          />
        </template>
      </Column>

      <Column
        field="type"
        header="Type"
        filterField="type"
        :showFilterMenu="false"
        style="min-width: 120px"
        sortable
      >
        <template #body="slotProps">
          <Badge
            :severity="
              transactionHelpers.transactionTypeBadgeSeverity(
                slotProps.data.type,
              )
            "
            >{{
              transactionsStore.friendlyTransactionTypes(slotProps.data.type)
            }}</Badge
          >
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Select
            v-if="props.transactionTypes === 'troop'"
            v-model="filterModel.value"
            @change="filterCallback()"
            :options="troopTransactionTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select One"
            :showClear="true"
          />
          <Select
            v-if="props.transactionTypes === 'girl'"
            v-model="filterModel.value"
            @change="filterCallback()"
            :options="girlsTransactionTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select One"
            :showClear="true"
          />
        </template>
      </Column>
      <Column field="cookies" filterField="cookies" :showFilterMenu="false">
        <template #header>
          <span class="p-datatable-column-title">Cookies </span>
        </template>
        <template #body="slotProps">
          <CookieList :cookies="slotProps.data.cookies" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <MultiSelect
            v-model="filterModel.value"
            @change="filterCallback()"
            :options="cookiesStore.allCookies"
            optionLabel="name"
            optionValue="abbreviation"
            placeholder="Any"
            :maxSelectedLabels="1"
          />
        </template>
      </Column>
      <Column field="order_date" header="Date" sort-field="sortDate" sortable>
        <template #body="slotProps">
          <NuxtTime :datetime="slotProps.data.order_date" time-zone="UTC" />
        </template>
      </Column>
      <Column
        v-if="props.transactionTypes === 'audit'"
        field="status"
        header="Status"
        sortable
      >
        <template #body="slotProps">
          <Badge :severity="getStatusBadgeSeverity(slotProps.data.status)">{{
            slotProps.data.status
          }}</Badge>
        </template>
      </Column>
      <Column field="notes" header="Notes" />
      <Column field="actions" header="Actions" style="min-width: 224px">
        <template #body="slotProps">
          <Button
            v-if="props.transactionTypes === 'audit-extra'"
            v-tooltip.bottom="{
              value: 'Add this row to the database as a new transaction',
              showDelay: 500,
            }"
            aria-label="Extra Audit Row"
            icon="pi pi-plus"
            class="mr-2"
            variant="outlined"
            @click="addAuditRow(slotProps.data)"
          />
          <Button
            v-if="
              props.transactionTypes !== 'all' &&
              props.transactionTypes !== 'audit-extra' &&
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
              transactionsStore.updateTransactionStatus(
                slotProps.data.id,
                'complete',
              )
            "
          />
          <Button
            v-if="
              props.transactionTypes !== 'all' &&
              props.transactionTypes !== 'audit-extra' &&
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
              transactionsStore.updateTransactionStatus(
                slotProps.data.id,
                'recorded',
              )
            "
          />
          <Button
            v-if="
              props.transactionTypes !== 'all' &&
              props.transactionTypes !== 'audit-extra' &&
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
              transactionsStore.updateTransactionStatus(
                slotProps.data.id,
                'pending',
              )
            "
          />
          <Button
            v-if="
              props.transactionTypes !== 'audit' &&
              props.transactionTypes !== 'audit-extra' &&
              (slotProps.data.status === 'rejected' ||
                (props.transactionTypes !== 'all' &&
                  slotProps.data.status === 'complete'))
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
              transactionsStore.updateTransactionStatus(
                slotProps.data.id,
                'pending',
              )
            "
          />
          <Button
            v-if="
              props.transactionTypes !== 'all' &&
              props.transactionTypes !== 'audit-extra' &&
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
              transactionsStore.updateTransactionStatus(
                slotProps.data.id,
                'complete',
              )
            "
          />
          <Button
            v-if="
              props.transactionTypes !== 'audit' &&
              props.transactionTypes !== 'audit-extra'
            "
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
              props.transactionTypes !== 'audit' &&
              props.transactionTypes !== 'audit-extra' &&
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
              transactionsStore.updateTransactionStatus(
                slotProps.data.id,
                'rejected',
              )
            "
          />
          <Button
            v-if="
              props.transactionTypes !== 'audit' &&
              props.transactionTypes !== 'audit-extra' &&
              transactionsStore.transactionRequiresReceipt(slotProps.data)
            "
            v-tooltip.bottom="{ value: 'View Receipt', showDelay: 500 }"
            aria-label="View Receipt"
            icon="pi pi-file"
            class="mr-2"
            variant="outlined"
            severity="secondary"
            @click="showReceipt(slotProps.data)"
          />
          <Button
            type="button"
            icon="pi pi-ellipsis-v"
            outlined
            severity="secondary"
            @click="toggleMenu($event, slotProps.data.id)"
            aria-haspopup="true"
            :aria-controls="'overlay_menu_' + slotProps.data.id"
          />
          <Menu
            :ref="(el) => setMenuRef(el, slotProps.data.id)"
            :id="'overlay_menu_' + slotProps.data.id"
            :model="moreActions(slotProps.data)"
            :popup="true"
          />
        </template>
      </Column>
    </DataTable>
  </div>

  <Dialog
    v-model:visible="transactionsStore.deleteTransactionDialogVisible"
    :style="{ width: '450px' }"
    header="Confirm"
    :modal="true"
  >
    <div class="flex items-center gap-4">
      <i class="pi pi-exclamation-triangle !text-3xl" />
      <span v-if="transactionsStore.activeTransaction"
        >Are you sure you want to delete the transaction from
        <b>{{ transactionsStore.activeTransaction.order_date }}</b
        >?</span
      >
    </div>
    <template #footer>
      <Button
        label="No"
        icon="pi pi-times"
        text
        @click="transactionsStore.deleteTransactionDialogVisible = false"
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
