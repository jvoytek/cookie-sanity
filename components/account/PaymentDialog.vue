<script setup lang="ts">
  import { useFormKitNodeById } from '@formkit/vue';

  const formNode = useFormKitNodeById('payment-form');
  const accountsStore = useAccountsStore();
  const paymentHelpers = usePaymentHelpers();

  const submitHandler = () => {
    paymentHelpers.savePayment();
  };

  const submitButtonClickHandler = () => {
    if (formNode.value) formNode.value.submit();
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
        id="payment-form"
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
      <Button
        label="Save"
        icon="pi pi-check"
        @click="submitButtonClickHandler"
      />
    </template>
  </Dialog>
</template>
