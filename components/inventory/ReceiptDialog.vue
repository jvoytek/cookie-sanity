<script setup lang="ts">
import type { Order } from '@/types/types';

const props = defineProps<{
  visible: boolean;
  transaction: Order | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const girlsStore = useGirlsStore();
const ordersStore = useTransactionsStore();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const printReceipt = () => {
  window.print();
};

const getFromName = (transaction: Order | null) => {
  if (!transaction) return '';
  if (transaction.from) {
    return girlsStore.getGirlNameById(transaction.from);
  }
  if (transaction.supplier) {
    return transaction.supplier;
  }
  return 'Troop';
};

const getToName = (transaction: Order | null) => {
  if (!transaction) return '';
  if (transaction.to) {
    return girlsStore.getGirlNameById(transaction.to);
  }
  return 'Troop';
};
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :style="{ width: '600px' }"
    header="Transaction Receipt"
    :modal="true"
    class="receipt-dialog"
  >
    <div v-if="transaction" class="receipt-content">
      <div class="receipt-header text-center mb-6">
        <h2 class="text-2xl font-bold mb-2">Cookie Transaction Receipt</h2>
        <p class="text-muted-color">
          Transaction #{{ transaction.order_num || transaction.id }}
        </p>
      </div>

      <div class="receipt-body space-y-4 mb-6">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="font-semibold">Date:</label>
            <p>{{ transaction.order_date }}</p>
          </div>
          <div>
            <label class="font-semibold">Type:</label>
            <p>{{ ordersStore.friendlyTransactionTypes(transaction.type || '') }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="font-semibold">From:</label>
            <p>{{ getFromName(transaction) }}</p>
          </div>
          <div>
            <label class="font-semibold">To:</label>
            <p>{{ getToName(transaction) }}</p>
          </div>
        </div>

        <div v-if="transaction.cookies" class="border-t pt-4">
          <label class="font-semibold mb-2 block">Cookie Details:</label>
          <CookieList :cookies="transaction.cookies" />
        </div>

        <div v-if="transaction.notes" class="border-t pt-4">
          <label class="font-semibold mb-2 block">Notes:</label>
          <p class="whitespace-pre-wrap">{{ transaction.notes }}</p>
        </div>
      </div>

      <div class="receipt-signatures border-t pt-6 space-y-6">
        <div>
          <label class="font-semibold block mb-2">Received By:</label>
          <div class="border-b border-gray-400 pb-1 w-full h-12" />
          <p class="text-sm text-muted-color mt-1">Signature</p>
        </div>
        <div>
          <label class="font-semibold block mb-2">Received From:</label>
          <div class="border-b border-gray-400 pb-1 w-full h-12" />
          <p class="text-sm text-muted-color mt-1">Signature</p>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Close"
        icon="pi pi-times"
        text
        @click="dialogVisible = false"
      />
      <Button
        label="Print"
        icon="pi pi-print"
        @click="printReceipt"
      />
    </template>
  </Dialog>
</template>

<style scoped>
@media print {
  :deep(.p-dialog-header),
  :deep(.p-dialog-footer),
  .receipt-dialog :deep(.p-dialog-header),
  .receipt-dialog :deep(.p-dialog-footer) {
    display: none !important;
  }

  :deep(.p-dialog-content) {
    padding: 0 !important;
  }

  :deep(.p-dialog) {
    box-shadow: none !important;
    border: none !important;
  }
}
</style>
