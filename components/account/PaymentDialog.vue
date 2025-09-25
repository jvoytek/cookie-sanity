<script setup lang="ts">
const accountsStore = useAccountsStore();

const paymentHelpers = usePaymentHelpers();
const myForm = ref<FormInstance | null>(null);

const submitHandler = () => {
  paymentHelpers.savePayment();
};
</script>

<template>
  <Dialog
    v-model:visible="accountsStore.editPaymentDialogVisible"
    :style="{ width: '450px' }"
    header="Payment Details"
    :modal="true"
  >
    <div class="flex flex-col gap-6">
      <FormKit
        ref="myForm"
        v-model="accountsStore.activePayment"
        type="form"
        :actions="false"
        @submit="submitHandler"
      >
        <!-- Render the dynamic form using the schema -->
        <FormKitSchema :schema="accountsStore.paymentDialogFormSchema.value" />
      </FormKit>
    </div>
    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        text
        @click="paymentHelpers.hideDialog"
      />
      <Button label="Save" icon="pi pi-check" @click="myForm.node.submit()" />
    </template>
  </Dialog>
</template>
