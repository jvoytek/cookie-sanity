import type { Order } from '@/types/types';

export const useTransactionHelpers = () => {
  const ordersStore = useTransactionsStore();
  const cookiesStore = useCookiesStore();
  const girlsStore = useGirlsStore();
  const submitted = ref(false);
  const notificationHelpers = useNotificationHelpers();

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
      case 'DIRECT_SHIP':
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
        // combine troop and girl types
        options: [
          ...ordersStore.troopTransactionTypeOptions,
          ...ordersStore.girlTransactionTypeOptions,
        ],
        validation: 'required',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
        if: (dialogType === 'all').toString(),
      },
      {
        $formkit: 'primeSelect',
        name: 'type',
        id: 'transaction-type',
        label: 'Type',
        options: ordersStore.troopTransactionTypeOptions,
        validation: 'required',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
        if: (dialogType === 'troop').toString(),
      },
      {
        $formkit: 'primeSelect',
        name: 'type',
        id: 'transaction-type',
        label: 'Type',
        options: ordersStore.girlTransactionTypeOptions,
        validation: 'required',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
        if: (dialogType === 'girl').toString(),
      },
      {
        $formkit: 'primeInputText',
        name: 'supplier',
        label: 'Supplier',
        if: "$get('transaction-type').value === 'C2T' || $get('transaction-type').value === 'T2T'",
        key: 'supplier',
        placeholder: 'Council, Troop 1234, etc.',
        validation: 'required|alpha_numeric',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
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
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
      },
      {
        $formkit: 'primeSelect',
        name: 'to',
        label: 'To',
        if: "$get('transaction-type').value === 'G2G' || $get('transaction-type').value === 'T2G' || $get('transaction-type').value === 'DIRECT_SHIP'",
        key: 'to',
        placeholder: 'Choose a scout',
        options: girlsStore.girlOptions,
        validation: 'required',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        'option-label': 'label',
        'option-value': 'value',
      },
      {
        $formkit: 'primeInputText',
        name: 'order_num',
        label: 'TXN # (optional)',
        placeholder: '#12345',
        validation: 'alpha_numeric',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
      },
      {
        $formkit: 'primeDatePicker',
        name: 'order_date',
        label: 'Order Date',
        validation: 'required|date',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
        class: 'w-full',
        dateFormat: 'yy-mm-dd',
        placeholder: 'YYYY-MM-DD',
      },
      {
        $formkit: 'primeDatePicker',
        name: 'processed_date',
        label: 'Processed Date',
        validation: 'date',
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
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
        wrapperClass: 'grid grid-cols-4 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-3 mt-1 mb-1',
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
        $el: 'div',
        children: [
          {
            $el: 'div',
            attrs: {
              class: 'text-md',
            },
            children: 'Cookies shipped directly from baker to customer',
          },
          {
            $el: 'div',
            attrs: {
              class: 'text-sm',
            },
            children:
              '(quantities should be negative; direct ship orders are included in estimated sales but NOT in inventory or balance calculations)',
          },
        ],

        if: "$get('transaction-type').value === 'DIRECT_SHIP'",
      },
      {
        $formkit: 'group',
        name: 'cookies',
        children: cookiesStore.cookieFormFields,
        if: "$get('transaction-type').value && $get('transaction-type').value === 'T2G'",
      },
      {
        $formkit: 'group',
        name: 'cookies',
        children: cookiesStore.cookieFormFieldsNotVirtual,
        if: "$get('transaction-type').value && $get('transaction-type').value !== 'T2G'",
      },
    ];

    return baseSchema;
  };

  function editTransaction(
    order: Order,
    type: 'troop' | 'girl' | 'all' = 'all',
  ) {
    ordersStore.setActiveTransaction({ ...order });
    ordersStore.transactionDialogFormSchema.value =
      getTransactionDialogFormSchema(type);
    ordersStore.editTransactionDialogVisible = true;
  }

  function cancelEditTransaction() {
    if (ordersStore.activeTransaction?.id) {
      ordersStore.resetActiveTransaction();
    } else {
      // Clear active transaction if creating a new one
      ordersStore.setActiveTransaction(null);
    }
    hideDialog();
  }

  function hideDialog() {
    ordersStore.editTransactionDialogVisible = false;
    submitted.value = false;
  }

  async function saveTransaction() {
    // Validate that virtual cookies are not used in troop-type transactions
    const transactionType = ordersStore.activeTransaction?.type;
    const isTroopTransaction =
      transactionType === 'C2T' || transactionType === 'T2T';

    if (isTroopTransaction && ordersStore.activeTransaction?.cookies) {
      const hasVirtualCookies = cookiesStore.allCookies.some((cookie) => {
        const quantity =
          ordersStore.activeTransaction?.cookies?.[cookie.abbreviation] || 0;
        return cookie.is_virtual && quantity !== 0;
      });

      if (hasVirtualCookies) {
        notificationHelpers.addError(
          new Error(
            'Virtual cookies cannot be used in troop-type transactions',
          ),
        );
        return;
      }
    }

    if (ordersStore.activeTransaction?.id) {
      ordersStore.upsertTransaction(ordersStore.activeTransaction);
    } else {
      ordersStore.insertNewTransaction(ordersStore.activeTransaction);
    }
    ordersStore.editTransactionDialogVisible = false;
    ordersStore.setActiveTransaction(null);
    submitted.value = false;
  }

  function confirmDeleteTransaction(order: Order) {
    ordersStore.setActiveTransaction(order);
    ordersStore.deleteTransactionDialogVisible = true;
  }

  async function deleteTransaction() {
    try {
      if (!ordersStore.activeTransaction?.id)
        throw new Error('No transaction selected');
      ordersStore.deleteTransaction(ordersStore.activeTransaction?.id);
      ordersStore.deleteTransactionDialogVisible = false;
      ordersStore.setActiveTransaction(null);
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  }

  return {
    submitted,
    editTransaction,
    cancelEditTransaction,
    hideDialog,
    saveTransaction,
    confirmDeleteTransaction,
    deleteTransaction,
    transactionTypeBadgeSeverity,
  };
};
