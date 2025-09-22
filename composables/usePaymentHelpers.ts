export const usePaymentHelpers = () => {
  const accountsStore = useAccountsStore();
  const girlsStore = useGirlsStore();
  const toast = useToast();
  const submitted = ref(false);
  const form = ref<FormInstance | null>(null);

  const getPaymentDialogFormSchema = () => {
    const baseSchema = [
      {
        $formkit: "primeSelect",
        name: "seller_id",
        label: "From",
        id: "seller-id",
        key: "seller_id",
        placeholder: "Choose a scout",
        options: girlsStore.girlOptions,
        validation: "required",
        class: "w-full",
        "option-label": "label",
        "option-value": "value",
      },
      {
        $formkit: "primeInputNumber",
        name: "amount",
        label: "Amount",
        key: "amount",
        placeholder: "Enter amount",
        validation: "required|number|min:0.01",
        class: "w-full",
        minFractionDigits: 2,
        maxFractionDigits: 2,
      },
      {
        $formkit: "primeDatePicker",
        name: "payment_date",
        label: "Date",
        key: "payment_date",
        placeholder: "Select date",
        validation: "required|date",
        class: "w-full",
        type: "date",
        "date-format": "yy-mm-dd",
        "show-icon": true,
      },
      {
        $formkit: "primeTextarea",
        name: "notes",
        label: "Notes (optional)",
        placeholder: "Notes about this payment",
        class: "w-full",
        rows: 2,
      },
    ];

    return baseSchema;
  };

  function editPayment(payment: Payment) {
    accountsStore.activePayment = { ...payment };
    accountsStore.paymentDialogFormSchema.value = getPaymentDialogFormSchema();
    accountsStore.editPaymentDialogVisible = true;
  }

  function hideDialog() {
    accountsStore.editPaymentDialogVisible = false;
    submitted.value = false;
  }

  async function savePayment() {
    if (accountsStore.activePayment.id) {
      accountsStore.upsertPayment(accountsStore.activePayment);
    } else {
      accountsStore.insertNewPayment(accountsStore.activePayment);
    }
    accountsStore.editPaymentDialogVisible = false;
    accountsStore.activePayment = {};
    submitted.value = false;
  }

  function confirmDeletePayment(payment: Payment) {
    accountsStore.activePayment = payment;
    accountsStore.deletePaymentDialogVisible = true;
  }

  async function deletePayment() {
    try {
      accountsStore.deletePayment(accountsStore.activePayment);
      accountsStore.deletePaymentDialogVisible = false;
      accountsStore.activePayment = {};
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
    }
  }

  return {
    form,
    submitted,
    editPayment,
    hideDialog,
    savePayment,
    confirmDeletePayment,
    deletePayment,
  };
};
