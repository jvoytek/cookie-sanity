export const useTransactionHelpers = () => {
  const ordersStore = useTransactionsStore();
  const cookiesStore = useCookiesStore();
  const girlsStore = useGirlsStore();
  const toast = useToast();
  const submitted = ref(false);
  const form = ref<FormInstance | null>(null);

  const transactionTypeBadgeSeverity = (type: string) => {
    switch (type) {
      case 'C2T':
        return 'success';
      case 'T2T':
        return 'success';
      case 'T2G':
        return 'success';
      case 'G2T':
        return 'warn';
      case 'G2G':
        return 'info';
      default:
        return null;
    }
  };

  const getTransactionDialogFormSchema = (dialogType: string) => {
    const baseSchema = [
      {
        $formkit: 'primeSelect',
        name: 'type',
        id: 'transaction-type',
        label: 'Type',
        options: ordersStore.transactionTypeOptions,
        validation: 'required',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
      },
      {
        $formkit: 'primeInputText',
        name: 'supplier',
        label: 'Supplier',
        if: "$get('transaction-type').value === 'C2T' || $get('transaction-type').value === 'T2T'",
        key: 'supplier',
        placeholder: 'Council, Troop 1234, etc.',
        validation: 'required|alpha_numeric',
        class: 'w-full',
      },
      {
        $formkit: 'primeSelect',
        name: 'from',
        label: 'From',
        id: 'transaction-from',
        if: "$get('transaction-type').value === 'G2G' || $get('transaction-type').value === 'G2T'",
        key: 'from',
        placeholder: 'Choose a scout',
        options: girlsStore.girlOptions,
        validation: 'required',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
      },
      {
        $formkit: 'primeSelect',
        name: 'to',
        label: 'To',
        if: "$get('transaction-type').value === 'G2G' || $get('transaction-type').value === 'T2G'",
        key: 'to',
        placeholder: 'Choose a scout',
        options: girlsStore.girlOptions,
        validation: 'required',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
      },
      {
        $formkit: 'primeInputText',
        name: 'order_num',
        label: 'Order Number (optional)',
        placeholder: '#12345',
        validation: 'alpha_numeric',
        class: 'w-full',
      },
      {
        $formkit: 'primeDatePicker',
        name: 'order_date',
        label: 'Order Date',
        validation: 'required|date',
        class: 'w-full',
        dateFormat: 'yy-mm-dd',
        placeholder: 'YYYY-MM-DD',
      },
      {
        $formkit: 'primeSelect',
        name: 'status',
        id: 'transaction-status',
        label: 'Status',
        options: ['complete', 'pending', 'canceled'],
        validation: 'required',
        class: 'w-full',
        if: (dialogType !== 'new').toString(),
      },
      {
        $formkit: 'primeDatePicker',
        name: 'processed_date',
        label: 'Processed Date',
        validation: 'date',
        class: 'w-full',
        dateFormat: 'yy-mm-dd',
        placeholder: 'YYYY-MM-DD',
        if: "$get('transaction-status').value === 'complete'",
      },
      {
        $formkit: 'primeTextarea',
        name: 'notes',
        label: 'Notes (optional)',
        placeholder: 'Notes about this transaction',
        class: 'w-full',
        rows: 2,
      },
      {
        $el: 'div',
        children: [
          {
            $el: 'div',
            attrs: {
              class: 'text-md',
            },
            children: 'Cookies received from council',
          },
          {
            $el: 'div',
            attrs: {
              class: 'text-sm',
            },
            children:
              '(quantities should be positive unless your council accepts returns)',
          },
        ],

        if: "$get('transaction-type').value === 'C2T'",
      },
      {
        $el: 'div',
        children: [
          {
            $el: 'div',
            attrs: {
              class: 'text-md',
            },
            children: 'Cookies exchanged with other troop',
          },
          {
            $el: 'div',
            attrs: {
              class: 'text-sm',
            },
            children:
              '(positive quantities are added to your troop inventory, negative quantities are removed)',
          },
        ],

        if: "$get('transaction-type').value === 'T2T'",
      },
      {
        $el: 'div',
        children: [
          {
            $el: 'div',
            attrs: {
              class: 'text-md',
            },
            children: 'Cookies to be given to the girl',
          },
          {
            $el: 'div',
            attrs: {
              class: 'text-sm',
            },
            children:
              '(quantities should be negative, as these cookies are removed from your troop inventory)',
          },
        ],

        if: "$get('transaction-type').value === 'T2G'",
      },
      {
        $el: 'div',
        children: [
          {
            $el: 'div',
            attrs: {
              class: 'text-md',
            },
            children: 'Cookies to be returned to the troop',
          },
          {
            $el: 'div',
            attrs: {
              class: 'text-sm',
            },
            children:
              '(quantities should be positive, as these cookies are added to your troop inventory)',
          },
        ],

        if: "$get('transaction-type').value === 'G2T'",
      },
      {
        $el: 'div',
        children: [
          {
            $el: 'div',
            attrs: {
              class: 'text-md',
            },
            children: 'Cookies to be given from one girl to another',
          },
          {
            $el: 'div',
            attrs: {
              class: 'text-sm',
            },
            children:
              '(negative quantities are removed from girl in "From" field and added to girl in "To" field)',
          },
        ],

        if: "$get('transaction-type').value === 'G2G'",
      },
      {
        $formkit: 'group',
        name: 'cookies',
        children: cookiesStore.cookieFormFields,
        if: "$get('transaction-type').value",
      },
    ];

    return baseSchema;
  };

  function editTransaction(
    order: Order,
    type: 'new' | 'troop' | 'girl' | 'all' = 'troop',
  ) {
    ordersStore.activeTransaction = { ...order };
    ordersStore.transactionDialogFormSchema.value =
      getTransactionDialogFormSchema(type);
    ordersStore.editTransactionDialogVisible = true;
  }

  function hideDialog() {
    ordersStore.editTransactionDialogVisible = false;
    submitted.value = false;
  }

  async function saveTransaction() {
    if (ordersStore.activeTransaction.id) {
      ordersStore.upsertTransaction(ordersStore.activeTransaction);
    } else {
      ordersStore.insertNewTransaction(ordersStore.activeTransaction);
    }
    ordersStore.editTransactionDialogVisible = false;
    ordersStore.activeTransaction = {};
    submitted.value = false;
  }

  function confirmDeleteTransaction(order: Order) {
    ordersStore.activeTransaction = order;
    ordersStore.deleteTransactionDialogVisible = true;
  }

  async function deleteTransaction() {
    try {
      ordersStore.deleteTransaction(ordersStore.activeTransaction.id);
      ordersStore.deleteTransactionDialogVisible = false;
      ordersStore.activeTransaction = {};
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 3000,
      });
    }
  }

  return {
    form,
    submitted,
    editTransaction,
    hideDialog,
    saveTransaction,
    confirmDeleteTransaction,
    deleteTransaction,
    transactionTypeBadgeSeverity,
  };
};
