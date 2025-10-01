<script setup lang="ts">
import { useFormKitNodeById } from '@formkit/vue';

const ordersStore = useTransactionsStore();
const formNode = useFormKitNodeById('transaction-form');
const transactionHelpers = useTransactionHelpers();

const submitHandler = () => {
  transactionHelpers.saveTransaction();
};

const submitButtonClickHandler = () => {
  if (formNode.value) formNode.value.submit();
};
</script>

<template>
  <Dialog
    v-model:visible="ordersStore.editTransactionDialogVisible"
    :style="{ width: '450px' }"
    header="Transaction Details"
    :modal="true"
  >
    <div class="flex flex-col gap-6">
      <FormKit
        id="transaction-form"
        v-model="ordersStore.activeTransaction"
        type="form"
        :actions="false"
        @submit="submitHandler"
      >
        <!-- Render the dynamic form using the schema -->
        <FormKitSchema
          :schema="ordersStore.transactionDialogFormSchema.value"
        />
      </FormKit>
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
        @click="submitButtonClickHandler"
      />
    </template>
  </Dialog>
</template>
