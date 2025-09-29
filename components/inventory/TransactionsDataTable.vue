<script setup lang="ts">
const props = defineProps<{
  orders: Json[];
  transactionTypes: "troop" | "girl" | "all";
  paginated?: boolean;
}>();

const ordersStore = useOrdersStore();
const girlsStore = useGirlsStore();
const transactionHelpers = useTransactionHelpers();
</script>

<template>
  <DataTable
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
      v-if="props.transactionTypes === 'troop' || props.transactionTypes === 'all'"
      field="supplier"
      header="Supplier"
      sortable
    />
    <Column field="order_num" header="Transaction #" sortable />
    <Column
      v-if="props.transactionTypes === 'girl' || props.transactionTypes === 'all'"
      field="from"
      header="From"
      sortable
    >
      <template #body="slotProps">
        {{
          slotProps.data.from
            ? girlsStore.getGirlNameById(slotProps.data.from)
            : ""
        }}
      </template>
    </Column>
    <Column
      v-if="props.transactionTypes === 'girl' || props.transactionTypes === 'all'"
      field="to"
      header="To"
      sortable
    >
      <template #body="slotProps">
        {{
          slotProps.data.to ? girlsStore.getGirlNameById(slotProps.data.to) : ""
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
      v-if="props.transactionTypes === 'girl' || props.transactionTypes === 'all'"
      field="completed_date"
      header="Completed"
      sortable
    >
      <template #body="slotProps">
        {{
          slotProps.data.status === "complete"
            ? slotProps.data.completed_date
              ? slotProps.data.completed_date
              : slotProps.data.order_date
            : "N/A"
        }}
      </template>
    </Column>
    <Column field="actions" header="Actions" style="min-width: 140px">
      <template #body="slotProps">
        <Button
          v-if="props.transactionTypes !== 'all' && slotProps.data.status === 'pending'"
          v-tooltip.bottom="{
            value: 'Click this when physical inventory has changed hands',
            showDelay: 500,
          }"
          aria-label="Mark Received"
          icon="pi pi-check"
          class="mr-2"
          variant="outlined"
          @click="ordersStore.updateOrderStatus(slotProps.data.id, 'complete')"
        />
        <Button
          v-if="props.transactionTypes !== 'all' && slotProps.data.status === 'requested'"
          v-tooltip.bottom="{
            value: 'Click this to approve this request and mark as pending',
            showDelay: 500,
          }"
          aria-label="Approve Request"
          icon="pi pi-check"
          class="mr-2"
          variant="outlined"
          severity="secondary"
          @click="ordersStore.updateOrderStatus(slotProps.data.id, 'pending')"
        />
        <Button
          v-if="
            props.transactionTypes !== 'all' && 
            slotProps.data.status === 'complete' ||
            slotProps.data.status === 'rejected'
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
          @click="ordersStore.updateOrderStatus(slotProps.data.id, 'pending')"
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
                slotProps.data.status === 'complete'))
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
            (props.transactionTypes === 'girl') &&
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
          @click="ordersStore.updateOrderStatus(slotProps.data.id, 'rejected')"
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
</template>
