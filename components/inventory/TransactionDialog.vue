<script setup lang="ts">
const ordersStore = useOrdersStore();

const transactionHelpers = useTransactionHelpers();
const myForm = ref<FormInstance | null>(null);

const submitHandler = () => {
  transactionHelpers.saveTransaction();
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
        ref="myForm"
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
      <Button label="Save" icon="pi pi-check" @click="myForm.node.submit()" />
    </template>
  </Dialog>
</template>
