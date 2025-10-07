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

// Check if there are overbooking violations
const hasOverbookingViolations = computed(
  () => transactionHelpers.overbookingViolations.value.length > 0,
);
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

      <!-- Display overbooking warnings -->
      <div
        v-if="hasOverbookingViolations"
        class="flex flex-col gap-2 p-4 bg-red-50 border border-red-300 rounded"
      >
        <div class="flex items-start gap-2">
          <i class="pi pi-exclamation-triangle text-red-600 mt-1" />
          <div class="flex-1">
            <div class="font-semibold text-red-800 mb-2">
              Overbooking Not Allowed
            </div>
            <div class="text-sm text-red-700">
              <div
                v-for="(violation, index) in transactionHelpers
                  .overbookingViolations.value"
                :key="index"
                class="mb-1"
              >
                {{ violation }}
              </div>
            </div>
          </div>
        </div>
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
        :disabled="hasOverbookingViolations"
        @click="submitButtonClickHandler"
      />
    </template>
  </Dialog>
</template>
