<script setup lang="ts">

const props = defineProps<{
  transactionTypes: "troop-transactions" | "girl-transactions";
}>();

const ordersStore = useOrdersStore();
const cookiesStore = useCookiesStore();

const transactionHelpers =
  props.transactionTypes == "troop-transactions"
    ? useTroopTransactionHelpers()
    : useGirlTransactionHelpers();

</script>

<template>
  <Dialog
    v-model:visible="ordersStore.editTransactionDialogVisible"
    :style="{ width: '450px' }"
    header="Transaction Details"
    :modal="true"
  >
    <div class="flex flex-col gap-6">
      <div>
        <label for="troop_transaction_type" class="block font-bold mb-3"
          >Transaction Type</label
        >
        <Dropdown
          id="troop_transaction_type"
          v-model="ordersStore.activeTransaction.troop_transaction_type"
          :options="props.transactionTypes === 'troop-transactions' ? ['restock', 'transfer', 'trade'] : ['trade', 'return', 'distribution'] "
          placeholder="Select a Transaction Type"
          required="true"
          autofocus
          :invalid="transactionHelpers.submitted.value && !ordersStore.activeTransaction.troop_transaction_type"
          fluid
        />
        <small
          v-if="transactionHelpers.submitted.value && !ordersStore.activeTransaction.troop_transaction_type"
          class="text-red-500"
          >Transaction Type is required.</small
        >
      </div>
      <div v-if="props.transactionTypes === 'troop-transactions'">
        <label for="supplier" class="block font-bold mb-3"> {{ ordersStore.activeTransaction.troop_transaction_type === 'restock' ? 'Supplier' : 'Other Troop' }}</label>
        <InputText
          id="supplier"
          v-model.trim="ordersStore.activeTransaction.supplier"
          placeholder="Council, Troop 1234, etc."
          required="true"
          :invalid="transactionHelpers.submitted.value && !ordersStore.activeTransaction.supplier"
          fluid
        />
        <small v-if="transactionHelpers.submitted.value && !ordersStore.activeTransaction.supplier" class="text-red-500"
          >Supplier is required.</small
        >
      </div>
      <div>
        <label 
          for="order_date" 
          class="block font-bold mb-3"
        >
          {{ props.transactionTypes === 'troop-transactions' ? 'Expected Date' : 'Order Date' }}
        </label>
        <DatePicker
          id="order_date"
          v-model.trim="ordersStore.activeTransaction.order_date"
          label="Expected Date"
          required="true"
          date-format="yy-mm-dd"
          :invalid="transactionHelpers.submitted.value && !ordersStore.activeTransaction.order_date"
          placeholder="YYYY-MM-DD"
          fluid
        />
        <small v-if="transactionHelpers.submitted.value && !ordersStore.activeTransaction.order_date" class="text-red-500"
          >{{ props.transactionTypes === 'troop-transactions' ? 'Expected' : 'Order' }} Date is required.</small
        >
      </div>
      <div>
        <label for="order_num" class="block font-bold mb-3"
          >Transaction Number (optional)</label
        >
        <InputText
          id="order_num"
          v-model.trim="ordersStore.activeTransaction.order_num"
          placeholder="Transaction Number"
          fluid
        />
      </div>
      <div v-for="cookie in cookiesStore.allCookies" :key="cookie.id">
        <div class="columns-2 items-center gap-2">
          <div class="flex items-center gap-2">
            <span
              class="w-2 h-2 rounded-full flex-shrink-0"
              :style="{
                backgroundColor: cookie.color || '#888',
              }"
            />
            <span
              ><label :for="cookie.abbreviation" class="font-bold">{{
                cookie.name
              }}</label></span
            >
          </div>

            <InputNumber
              :id="cookie.abbreviation"
              v-model="ordersStore.activeTransaction.cookies[cookie.abbreviation]"
              size="small"
              fluid
            />
        </div>
      </div>
      <div>
        <label for="notes" class="block font-bold mb-3">Notes (optional)</label>
        <Textarea
          id="notes"
          v-model.trim="ordersStore.activeTransaction.notes"
          placeholder="Notes about this transaction"
          :rows="3"
          :cols="30"
          auto-resize
          fluid
        />
      </div>
    </div>
    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        text
        @click="transactionHelpers.hideDialog"
      />
      <Button
        label="Save"
        icon="pi pi-check"
        @click="transactionHelpers.saveTransaction"
      />
    </template>
  </Dialog>
</template>
