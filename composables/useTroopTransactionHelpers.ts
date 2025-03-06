export const useTroopTransactionHelpers = () => {
  
  const ordersStore = useOrdersStore();
  const toast = useToast();
  const submitted = ref(false);


  const transactionTypeBadgeSeverity = (type: string) => {
    switch (type) {
      case "restock":
        return "success";
      case "transfer":
        return "warn";
      case "trade":
        return "info";
      default:
        return null;
    }
  };

    /*
  Transaction Helpers Composable should return the following:
  {
    submitted: ref<boolean>,
    editTransaction: (order: Order) => void,
    hideDialog: () => void,
    saveTransaction: () => Promise<void>,
    confirmDeleteTransaction: (order: Order) => void,
    deleteTransaction: () => Promise<void>,
    transactionTypeBadgeSeverity: (type: string) => string
  }
  */

  function editTransaction(order: Order) {
    ordersStore.activeTransaction = { ...order };
    ordersStore.editTransactionDialogVisible = true;
  }

  function hideDialog() {
    ordersStore.editTransactionDialogVisible = false;
    submitted.value = false;
  }

  async function saveTransaction() {
    submitted.value = true;
    if (ordersStore.activeTransaction.supplier?.trim()) {
      if (ordersStore.activeTransaction.id) {
        ordersStore.upsertOrder(ordersStore.activeTransaction);
      } else {
        ordersStore.insertNewOrderFromOrdersList(ordersStore.activeTransaction);
      }
      ordersStore.editTransactionDialogVisible = false;
      ordersStore.activeTransaction = {};
      submitted.value = false;
    }
  }

  function confirmDeleteTransaction(order: Order) {
    ordersStore.activeTransaction = order;
    ordersStore.deleteTransactionDialogVisible = true;
  }

  async function deleteTransaction() {
    try {
      ordersStore.deleteOrder(ordersStore.activeTransaction.id);
      ordersStore.deleteTransactionDialogVisible = false;
      ordersStore.activeTransaction = {};
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
    submitted,
    editTransaction,
    hideDialog,
    saveTransaction,
    confirmDeleteTransaction,
    deleteTransaction,
    transactionTypeBadgeSeverity,
  };
};
