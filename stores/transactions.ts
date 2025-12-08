import type { Database, Json } from '@/types/supabase';
import type { Order, SCOrder2025, NewOrder } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useTransactionsStore = defineStore('transactions', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();
  const cookiesStore = useCookiesStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allTransactions = ref<Order[]>([]);
  const transactionDialogFormSchema = reactive([]);

  const activeTransaction = ref<Order | null>(null);
  const activeTransactionOriginal = ref<Order | null>(null);
  const editTransactionDialogVisible = ref(false);
  const deleteTransactionDialogVisible = ref(false);

  const troopTransactionTypeOptions = [
    { value: 'T2T', label: 'Troop to Troop' },
    { value: 'C2T', label: 'Council to Troop' },
  ];

  const girlTransactionTypeOptions = [
    { value: 'T2G', label: 'Troop to Girl' },
    { value: 'T2G(B)', label: 'Troop to Girl (Booth)' },
    { value: 'T2G(VB)', label: 'Troop to Girl (Virtual Booth)' },
    { value: 'G2G', label: 'Girl to Girl' },
    { value: 'G2T', label: 'Girl to Troop' },
    { value: 'DIRECT_SHIP', label: 'Direct Ship' },
  ];

  const transactionTypesToInvert = ['G2T', 'T2T', 'C2T'];

  /* Computed */

  const totalTransactionsByStatusAllCookies = computed(() => {
    return (
      status: string,
      transactionType: string,
      includeVirtualCookies: boolean = false,
    ) => {
      const total: Record<string, number> = cookiesStore.allCookies
        .map((cookie) => cookie.abbreviation)
        .reduce(
          (acc, abbreviation) => {
            acc[abbreviation] = 0;
            return acc;
          },
          {} as Record<string, number>,
        );
      allTransactions.value.forEach((transaction) => {
        if (transaction.cookies === null || transaction.type === null) return;
        // Skip DIRECT_SHIP orders for inventory calculations
        if (transaction.type === 'DIRECT_SHIP') return;
        if (
          transaction.status === status &&
          (transactionType === 'all' ||
            (transactionType === 'girl' &&
              _isGirlTransactionType(transaction.type)) ||
            (transactionType === 'troop' &&
              _isTroopTransactionType(transaction.type)))
        ) {
          cookiesStore.allCookies.forEach((cookie) => {
            if (!transaction.cookies) return;
            // Virtual cookies should not count towards physical inventory
            if (
              cookie.is_virtual &&
              includeVirtualCookies === false &&
              (transactionType === 'troop' || transactionType === 'all')
            ) {
              return;
            }
            if (transactionTypesToInvert.includes(transaction.type || '')) {
              total[cookie.abbreviation] =
                (total[cookie.abbreviation] || 0) +
                (transaction.cookies[cookie.abbreviation] || 0);
            } else {
              total[cookie.abbreviation] =
                (total[cookie.abbreviation] || 0) -
                (transaction.cookies[cookie.abbreviation] || 0);
            }
          });
        }
      });
      return total;
    };
  });

  const sumTransactionsByCookie = computed(
    () =>
      (
        cookieAbbreviation: string,
        troopTransactions: boolean = false,
        includeVirtualCookies: boolean = false,
      ): number => {
        const cookie = cookiesStore.getCookieByAbbreviation(cookieAbbreviation);
        // Virtual cookies should not count towards physical inventory
        if (cookie?.is_virtual && !includeVirtualCookies) {
          return 0;
        }
        return allTransactions.value.reduce((sum, transaction) => {
          if (troopTransactions && transaction.type == 'G2G') return sum;
          if (transaction.type === 'DIRECT_SHIP') return sum;
          if (
            transaction.cookies &&
            (transaction.status === 'complete' ||
              transaction.status === 'recorded')
          ) {
            const quantity = transaction.cookies[cookieAbbreviation] || 0;
            if (transactionTypesToInvert.includes(transaction.type || '')) {
              return sum + (typeof quantity === 'number' ? quantity : 0);
            }
            return sum - (typeof quantity === 'number' ? quantity : 0);
          }
          return sum;
        }, 0);
      },
  );

  const completedGirlTransactionList = computed(() => {
    return _getTransactionListByStatusAndType('complete', 'girl');
  });

  const completedGirlTransactionListCount = computed(() => {
    return completedGirlTransactionList.value.length;
  });

  const recordedGirlTransactionList = computed(() => {
    return _getTransactionListByStatusAndType('recorded', 'girl');
  });

  const recordedGirlTransactionListCount = computed(() => {
    return recordedGirlTransactionList.value.length;
  });

  const pendingGirlTransactionList = computed(() => {
    return _getTransactionListByStatusAndType('pending', 'girl');
  });

  const pendingGirlTransactionListCount = computed(() => {
    return pendingGirlTransactionList.value.length;
  });

  const requestedGirlTransactionrList = computed(() => {
    return _getTransactionListByStatusAndType('requested', 'girl');
  });

  const requestedGirlTransactionrListCount = computed(() => {
    return requestedGirlTransactionrList.value.length;
  });

  const rejectedGirlTransactionList = computed(() => {
    return _getTransactionListByStatusAndType('rejected', 'girl');
  });

  const rejectedGirlTransactionListCount = computed(() => {
    return rejectedGirlTransactionList.value.length;
  });

  const pendingTroopTransactionList = computed(() => {
    return _getTransactionListByStatusAndType('pending', 'troop');
  });

  const pendingTroopTransactionListCount = computed(() => {
    return pendingTroopTransactionList.value.length;
  });

  const completedTroopTransactionList = computed(() => {
    return _getTransactionListByStatusAndType('complete', 'troop');
  });

  const completedTroopTransactionListCount = computed(() => {
    return completedTroopTransactionList.value.length;
  });

  const recordedTroopTransactionList = computed(() => {
    return _getTransactionListByStatusAndType('recorded', 'troop');
  });

  const recordedTroopTransactionListCount = computed(() => {
    return recordedTroopTransactionList.value.length;
  });

  /* Private Functions */

  const _getTransactionListByStatusAndType = (
    status: string,
    type: 'girl' | 'troop',
  ): Order[] => {
    const isTransactionType =
      type == 'girl' ? _isGirlTransactionType : _isTroopTransactionType;
    return allTransactions.value.filter(
      (transaction) =>
        transaction.status === status && isTransactionType(transaction.type),
    );
  };

  const _getTransactionListByStatusTypeAndGirl = (
    status: string,
    type: 'girl' | 'troop',
    girlId: number | null,
  ): Order[] => {
    const baseList = _getTransactionListByStatusAndType(status, type);
    if (girlId === null) {
      return baseList;
    }
    return baseList.filter(
      (transaction) => transaction.to === girlId || transaction.from === girlId,
    );
  };

  const _isGirlTransactionType = (type: string | null): boolean => {
    if (!type) return false;
    return (
      ['T2G', 'G2G', 'G2T'].includes(type.slice(0, 3)) ||
      type.slice(0, 12) === 'COOKIE_SHARE' ||
      type === 'DIRECT_SHIP'
    );
  };

  const _isTroopTransactionType = (type: string | null): boolean => {
    if (!type) return false;
    return ['T2T', 'C2T'].includes(type.slice(0, 3));
  };

  const _updateTransaction = (transaction: Order) => {
    const index = allTransactions.value.findIndex(
      (o) => o.id === transaction.id,
    );
    if (index !== -1) {
      allTransactions.value[index] = transaction as Order;
    }
  };

  const _sortTransactions = () => {
    allTransactions.value.sort((a: Order, b: Order) => {
      const aDate = a.order_date ? new Date(a.order_date).getTime() : 0;
      const bDate = b.order_date ? new Date(b.order_date).getTime() : 0;
      return aDate - bDate;
    });
  };

  const _addTransaction = (transaction: Order) => {
    allTransactions.value.unshift(transaction);
  };

  const _removeTransaction = (transaction: Order | number) => {
    const transactionId: number =
      typeof transaction === 'number' ? transaction : transaction.id;

    if (!transactionId) {
      notificationHelpers.addError({
        message: 'Transaction ID is required to delete a transaction.',
      } as Error);
      return;
    }

    const index = allTransactions.value.findIndex(
      (o) => o.id === transactionId,
    );
    if (index !== -1) {
      allTransactions.value.splice(index, 1);
    }
  };

  const _returnDateStringOrNull = (date: Date | string | null | undefined) => {
    if (!date || typeof date === 'string') {
      return date;
    } else {
      return date.toISOString().slice(0, 10);
    }
  };

  const _convertDateStringToMMDDYYYY = (
    date: string | null | undefined,
  ): string | null => {
    if (!date) return null;
    const dateParts = date.split('-');
    if (dateParts.length !== 3) return date ?? null;
    return `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
  };

  const invertCookieQuantities = (
    cookies: Json | null | undefined,
  ): Json | null => {
    if (!cookies) return null;
    return Object.fromEntries(
      Object.entries(cookies).map(([key, value]) => {
        return [
          key,
          typeof value === 'number' ? (value === 0 ? null : value * -1) : value,
        ];
      }),
    ) as Json;
  };

  const _invertCookieQuantitiesInTransaction = (transaction: Order) => {
    const invertedCookies = invertCookieQuantities(transaction.cookies);
    transaction.cookies = invertedCookies
      ? invertedCookies
      : transaction.cookies;
    return transaction;
  };

  const _transformDataForTransaction = (transaction: Order): Order => {
    if (
      transaction.type &&
      transactionTypesToInvert.includes(transaction.type)
    ) {
      transaction = _invertCookieQuantitiesInTransaction(transaction);
    }
    return {
      ...transaction,
      order_date: _convertDateStringToMMDDYYYY(transaction.order_date),
      sortDate: transaction.order_date
        ? new Date(transaction.order_date)
        : new Date(0),
    } as Order;
  };

  const _supabaseFetchTransactions = async () => {
    if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
      return { data: null, error: new Error('Profile or Season not set') };
    return await supabaseClient
      .from('orders')
      .select(`*`)
      .eq('season', seasonsStore.currentSeason.id)
      .order('order_date', { ascending: false });
  };

  const _supabaseInsertTransaction = async (transaction: NewOrder) => {
    return await supabaseClient
      .from('orders')
      .insert(transaction)
      .select()
      .single();
  };

  const _supabaseUpsertTransaction = async (transaction: Order) => {
    return await supabaseClient
      .from('orders')
      .upsert(transaction)
      .select()
      .single();
  };

  const _supabaseDeleteTransaction = async (transactionId: number) => {
    return await supabaseClient.from('orders').delete().eq('id', transactionId);
  };

  const _supabaseUpdateTransactionStatus = async (
    transactionId: number,
    status: string,
  ) => {
    return await supabaseClient
      .from('orders')
      .update({ status: status })
      .eq('id', transactionId)
      .select()
      .single();
  };

  const _supabaseUpdateTransactionStatusBulk = async (
    transactionIds: number[],
    status: string,
  ) => {
    return await supabaseClient
      .from('orders')
      .update({ status: status })
      .in('id', transactionIds);
  };

  /* Actions */

  const friendlyTransactionTypes = (type: string): string => {
    const transactionTypeMap: Record<string, string> = {
      T2G: 'Troop to Girl',
      'T2G(B)': 'Booth',
      'T2G(VB)': 'Virtual Booth',
      G2G: 'Girl to Girl',
      G2T: 'Girl to Troop',
      T2T: 'Troop to Troop',
      C2T: 'Council to Troop',
      COOKIE_SHARE: 'Cookie Share',
      DIRECT_SHIP: 'Direct Ship',
    };
    return transactionTypeMap[type] || type;
  };

  const fetchTransactions = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;
      const { data, error } = await _supabaseFetchTransactions();
      if (error) throw error;
      allTransactions.value = data.map(_transformDataForTransaction) ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertNewTransaction = async (transaction: NewOrder | null) => {
    if (!profileStore.currentProfile || !transaction) return;

    transaction.profile = profileStore.currentProfile.id;
    transaction.season =
      profileStore.currentProfile.season || seasonsStore.allSeasons[0].id;
    transaction.order_date = _returnDateStringOrNull(transaction.order_date);
    if (transactionTypesToInvert.includes(transaction.type || '')) {
      transaction = _invertCookieQuantitiesInTransaction(transaction);
    }

    if (transaction.auto_calculate_cookies !== undefined)
      delete transaction.auto_calculate_cookies;

    if (transaction.total_cookies !== undefined)
      delete transaction.total_cookies;

    if (transaction.sortDate !== undefined) delete transaction.sortDate;

    try {
      const { data, error } = await _supabaseInsertTransaction(transaction);

      if (error) throw error;
      _addTransaction(_transformDataForTransaction(data));
      _sortTransactions();
      notificationHelpers.addSuccess('Transaction Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertNewTransactionFromUploads = async (
    transactionsList: NewOrder[],
  ) => {
    // Ensure all transactions have a valid season number (not null)
    const validTransactionsList = transactionsList.map((tx) => ({
      ...tx,
      season:
        typeof tx.season === 'number'
          ? tx.season
          : profileStore.currentProfile?.season ||
            seasonsStore.allSeasons[0].id,
    }));

    const { error } = await supabaseClient
      .from('orders')
      .insert(validTransactionsList)
      .select();
    if (error) throw error;
  };

  const upsertTransaction = async (transaction: Order) => {
    if (transactionTypesToInvert.includes(transaction.type || '')) {
      transaction = _invertCookieQuantitiesInTransaction(transaction);
    }

    if (transaction.auto_calculate_cookies !== undefined)
      delete transaction.auto_calculate_cookies;

    if (transaction.total_cookies !== undefined)
      delete transaction.total_cookies;

    if (transaction.sortDate !== undefined) delete transaction.sortDate;

    try {
      const { data, error } = await _supabaseUpsertTransaction(transaction);

      if (error) throw error;

      _updateTransaction(_transformDataForTransaction(data));
      _sortTransactions();
      notificationHelpers.addSuccess('Transaction Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const bulkDeleteTransactions = async (transactionIds: number[]) => {
    try {
      const { error } = await supabaseClient
        .from('orders')
        .delete()
        .in('id', transactionIds);

      if (error) throw error;

      transactionIds.forEach((id) => _removeTransaction(id));
      notificationHelpers.addSuccess('Transactions Deleted');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteTransaction = async (transaction: Order | number | undefined) => {
    if (!transaction) {
      notificationHelpers.addError(
        new Error('Transaction ID is required to delete a transaction.'),
      );
      return;
    }

    const transactionId: number =
      typeof transaction === 'number' ? transaction : transaction.id;

    if (!transactionId) {
      notificationHelpers.addError(
        new Error('Transaction ID is required to delete a transaction.'),
      );
      return;
    }

    try {
      const { error } = await _supabaseDeleteTransaction(transactionId);

      if (error) throw error;

      _removeTransaction(transactionId);
      notificationHelpers.addSuccess('Transaction Deleted');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const convertSCOrderToNewTransaction = (obj: SCOrder2025) => {
    if (
      !profileStore.currentProfile?.id ||
      !profileStore.currentProfile?.season
    )
      return;
    const toGirlId = girlsStore.getGirlIdByName(obj.TO);
    const fromGirlId = girlsStore.getGirlIdByName(obj.FROM);
    // Convert COOKIE_SHARE types to T2G
    let type = obj.TYPE;
    if (type === 'COOKIE_SHARE') {
      type = 'T2G';
    } else if (type === 'COOKIE_SHARE(B)') {
      type = 'T2G(B)';
    } else if (type === 'COOKIE_SHARE(VB)') {
      type = 'T2G(VB)';
    }
    return {
      profile: profileStore.currentProfile?.id,
      order_date: _returnDateStringOrNull(obj.DATE),
      order_num: obj['ORDER #'].toString(),
      to: toGirlId || null,
      from: fromGirlId || null,
      cookies: obj,
      season: profileStore.currentProfile.season || undefined,
      type: type,
      status: 'complete',
    };
  };

  const updateTransactionStatus = async (
    transactionId: number,
    status: string,
  ) => {
    try {
      const { data, error } = await _supabaseUpdateTransactionStatus(
        transactionId,
        status,
      );
      if (error) throw error;
      _updateTransaction(_transformDataForTransaction(data));
      _sortTransactions();
      notificationHelpers.addSuccess(
        `Transaction Marked ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      );
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const updateTransactionStatusBulk = async (
    transactionIds: number[],
    status: string,
  ) => {
    try {
      const { error } = await _supabaseUpdateTransactionStatusBulk(
        transactionIds,
        status,
      );
      if (error) throw error;
      // Since data is a single record, we need to refetch all transactions
      await fetchTransactions();
      notificationHelpers.addSuccess(
        `Transactions Marked ${
          status.charAt(0).toUpperCase() + status.slice(1)
        }`,
      );
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getGirlTransactionsByStatus = (
    status: string,
    girlId: number | null,
  ): Order[] => {
    return _getTransactionListByStatusTypeAndGirl(status, 'girl', girlId);
  };

  const setActiveTransaction = (transaction: Order | null) => {
    activeTransaction.value = transaction;
    // Create a deep copy of the original transaction for change tracking
    activeTransactionOriginal.value = transaction
      ? JSON.parse(JSON.stringify(transaction))
      : null;
  };

  const resetActiveTransaction = () => {
    if (activeTransactionOriginal.value && activeTransaction.value) {
      // Revert changes by resetting to the original deep copy
      _updateTransaction(activeTransactionOriginal.value);
    }
    // Clear active transaction
    activeTransaction.value = null;
    activeTransactionOriginal.value = null;
  };

  const transactionRequiresReceipt = (transaction: Order): boolean => {
    const receiptRequiredTypes = ['T2G', 'T2G(B)', 'T2G(VB)', 'G2G', 'G2T'];
    return (
      receiptRequiredTypes.includes(transaction.type || '') &&
      transaction.status !== 'requested' &&
      transaction.status !== 'rejected'
    );
  };

  const getTransactionsById = (
    transactionIds: number | string | number[] | string[],
  ): Order[] => {
    const idsAsNumbers = Array.isArray(transactionIds)
      ? transactionIds.map((id) => Number(id))
      : [Number(transactionIds)];
    const transactions = allTransactions.value.filter((transaction) =>
      idsAsNumbers.includes(transaction.id),
    );
    // sort transactions by the order_date ascending
    return transactions.sort((a, b) => {
      const aTime =
        a.sortDate instanceof Date
          ? a.sortDate.getTime()
          : a.order_date
            ? Date.parse(String(a.order_date)) || 0
            : 0;
      const bTime =
        b.sortDate instanceof Date
          ? b.sortDate.getTime()
          : b.order_date
            ? Date.parse(String(b.order_date)) || 0
            : 0;
      return aTime - bTime;
    });
  };

  const setActiveTransactionPredictedCookies = (expectedSales: number) => {
    if (!activeTransaction.value) return;
    activeTransaction.value.cookies =
      cookiesStore.getPredictedCookiesFromExpectedSales(expectedSales);
  };

  const setActiveTransactionTotalExpectedSales = () => {
    if (!activeTransaction.value) return;
    const predictedCookies = activeTransaction.value.cookies || {};
    activeTransaction.value.total_cookies = cookiesStore.allCookies
      .map((cookie) => predictedCookies[cookie.abbreviation] || 0)
      .reduce((sum: number, val: number) => sum + val, 0);
  };

  return {
    allTransactions,
    sumTransactionsByCookie,
    setActiveTransaction,
    resetActiveTransaction,
    activeTransaction,
    activeTransactionOriginal,
    transactionDialogFormSchema,
    editTransactionDialogVisible,
    deleteTransactionDialogVisible,
    completedGirlTransactionList,
    completedGirlTransactionListCount,
    recordedGirlTransactionList,
    recordedGirlTransactionListCount,
    pendingGirlTransactionList,
    pendingGirlTransactionListCount,
    requestedGirlTransactionrList,
    requestedGirlTransactionrListCount,
    rejectedGirlTransactionList,
    rejectedGirlTransactionListCount,
    pendingTroopTransactionList,
    pendingTroopTransactionListCount,
    completedTroopTransactionList,
    completedTroopTransactionListCount,
    recordedTroopTransactionList,
    recordedTroopTransactionListCount,
    totalTransactionsByStatusAllCookies,
    fetchTransactions,
    insertNewTransactionFromUploads,
    insertNewTransaction,
    upsertTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
    convertSCOrderToNewTransaction,
    updateTransactionStatus,
    updateTransactionStatusBulk,
    friendlyTransactionTypes,
    invertCookieQuantities,
    transactionTypesToInvert,
    troopTransactionTypeOptions,
    girlTransactionTypeOptions,
    getGirlTransactionsByStatus,
    transactionRequiresReceipt,
    getTransactionsById,
    setActiveTransactionPredictedCookies,
    setActiveTransactionTotalExpectedSales,
  };
});
