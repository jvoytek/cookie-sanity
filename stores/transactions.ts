import type { Database } from '@/types/supabase';
import type { Order, SCOrder2025, NewOrder } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useTransactionsStore = defineStore('transactions', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const toast = useToast();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();
  const cookiesStore = useCookiesStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allTransactions: Ref<Order[]> = ref([]);
  const transactionDialogFormSchema = reactive([]);

  const activeTransaction: ref<Json> = ref({});
  const editTransactionDialogVisible: ref<boolean> = ref(false);
  const deleteTransactionDialogVisible: ref<boolean> = ref(false);

  const transactionTypeOptions = [
    { value: 'T2G', label: 'Troop to Girl' },
    { value: 'G2G', label: 'Girl to Girl' },
    { value: 'G2T', label: 'Girl to Troop' },
    { value: 'T2T', label: 'Troop to Troop' },
    { value: 'C2T', label: 'Council to Troop' },
  ];

  /* Computed */

  const totalTransactionsByStatusAllCookies = computed(() => {
    return (status: string, transactionType: string) => {
      const total: Record<string, number> = {};
      allTransactions.value.forEach((transaction) => {
        if (transaction.cookies === null || transaction.type === null) return;
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
            total[cookie.abbreviation] =
              (total[cookie.abbreviation] || 0) +
              (transaction.cookies[cookie.abbreviation] || 0);
          });
        }
      });
      return total;
    };
  });

  const totalTransactionsByStatusAndCookie = computed(() => {
    return (
      status: string,
      transactionType: string,
      cookieAbbreviation: string,
    ) => {
      return allTransactions.value.reduce((total, transaction) => {
        if (
          transaction.status === status &&
          transaction.cookies &&
          (transactionType === 'girl'
            ? _isGirlTransactionType(transaction.type)
            : _isTroopTransactionType(transaction.type))
        ) {
          const quantity = transaction.cookies[cookieAbbreviation] || 0;
          return total + (typeof quantity === 'number' ? quantity : 0);
        }
        return total;
      }, 0);
    };
  });

  const sumTransactionsByCookie = computed(
    () =>
      (cookieAbbreviation: string): number =>
        allTransactions.value.reduce((sum, transaction) => {
          if (transaction.cookies && transaction.status === 'complete') {
            const quantity = transaction.cookies[cookieAbbreviation] || 0;
            return sum + (typeof quantity === 'number' ? quantity : 0);
          }
          return sum;
        }, 0),
  );

  const completedGirlTransactionList: Ref<Order[]> = computed(() => {
    return _getTransactionListByStatusAndType('complete', 'girl');
  });

  const completedGirlTransactionListCount: number = computed(() => {
    return completedGirlTransactionList.value.length;
  });

  const pendingGirlTransactionList: Ref<Order[]> = computed(() => {
    return _getTransactionListByStatusAndType('pending', 'girl');
  });

  const pendingGirlTransactionListCount: number = computed(() => {
    return pendingGirlTransactionList.value.length;
  });

  const requestedGirlTransactionrList: Ref<Order[]> = computed(() => {
    return _getTransactionListByStatusAndType('requested', 'girl');
  });

  const requestedGirlTransactionrListCount: number = computed(() => {
    return requestedGirlTransactionrList.value.length;
  });

  const rejectedGirlTransactionList: Ref<Order[]> = computed(() => {
    return _getTransactionListByStatusAndType('rejected', 'girl');
  });

  const rejectedGirlTransactionListCount: number = computed(() => {
    return rejectedGirlTransactionList.value.length;
  });

  const pendingTroopTransactionList: Ref<Order[]> = computed(() => {
    return _getTransactionListByStatusAndType('pending', 'troop');
  });

  const pendingTroopTransactionListCount: number = computed(() => {
    return pendingTroopTransactionList.value.length;
  });

  const completedTroopTransactionList: Ref<Order[]> = computed(() => {
    return _getTransactionListByStatusAndType('complete', 'troop');
  });

  const completedTroopTransactionListCount: number = computed(() => {
    return completedTroopTransactionList.value.length;
  });

  const sumTransactionsByCookieAll = computed((): Record<string, number> => {
    return allTransactions.value.reduce(
      (acc, transaction) => {
        if (transaction.cookies && transaction.status === 'complete') {
          for (const [cookieAbbreviation, quantity] of Object.entries(
            transaction.cookies,
          )) {
            if (typeof quantity === 'number') {
              acc[cookieAbbreviation] =
                (acc[cookieAbbreviation] || 0) + quantity;
            }
          }
        }
        return acc;
      },
      {} as Record<string, number>,
    );
  });

  /* Private Functions */

  const _getTransactionListByStatusAndType: Ref<Order[]> = (
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

  const _isGirlTransactionType = (type: string): boolean => {
    return (
      ['T2G', 'G2G', 'G2T'].includes(type.slice(0, 3)) ||
      type.slice(0, 12) === 'COOKIE_SHARE'
    );
  };

  const _isTroopTransactionType = (type: string): boolean => {
    return ['T2T', 'C2T'].includes(type.slice(0, 3));
  };

  const _updateTransaction = (transaction: Order) => {
    const index = allTransactions.value.findIndex(
      (o) => o.id === transaction.id,
    );
    if (index !== -1) {
      allTransactions.value[index] = transaction;
    }
  };

  const _sortTransactions = () => {
    allTransactions.value.sort((a, b) => a.order_date - b.order_date);
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

  const _getGirlId = (name: string): number | null => {
    try {
      const [first_name, last_name] = name.split(' ');
      const matchingGirl = girlsStore.allGirls?.find(
        (girl) =>
          girl.first_name === first_name && girl.last_name === last_name,
      );
      return matchingGirl?.id ?? null;
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  function _returnDateStringOrNull(date: Date | string | null) {
    if (!date || typeof date === 'string') {
      return date;
    } else {
      return date.toISOString().slice(0, 10);
    }
  }

  const _invertCookieQuantities = (cookies: Json | null): Json | null => {
    if (!cookies) return cookies;
    return Object.fromEntries(
      Object.entries(cookies).map(([key, value]) => [
        key,
        typeof value === 'number' ? (value === 0 ? null : value * -1) : value,
      ]),
    );
  };

  const _invertCookieQuantitiesInTransaction = (
    transaction: Order,
  ): Order[] => {
    transaction.cookies = _invertCookieQuantities(transaction.cookies);
    return transaction;
  };

  const _supabaseFetchTransactions = async () => {
    return await supabaseClient
      .from('orders')
      .select(`*`)
      .eq('profile', profileStore.currentProfile.id)
      .eq('season', seasonsStore.currentSeason.id)
      .neq('type', 'DIRECT_SHIP')
      .order('order_date', { ascending: false });
  };

  const _supabaseInsertTransaction = async (
    transaction: Omit<NewOrder, 'season'> & { season: number },
  ) => {
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

  /* Actions */

  const friendlyTransactionTypes = (type: string): string => {
    const transactionTypeMap: Record<string, string> = {
      T2G: 'Troop to Girl',
      G2G: 'Girl to Girl',
      G2T: 'Girl to Troop',
      T2T: 'Troop to Troop',
      C2T: 'Council to Troop',
      COOKIE_SHARE: 'Cookie Share',
    };
    return transactionTypeMap[type] || type;
  };

  const fetchTransactions = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;
      const { data, error } = await _supabaseFetchTransactions();
      if (error) throw error;
      allTransactions.value =
        data.map(_invertCookieQuantitiesInTransaction) ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertNewTransaction = async (
    transaction: Omit<NewOrder, 'season'> & { season: number },
  ) => {
    if (!profileStore.currentProfile) return;

    transaction.profile = profileStore.currentProfile.id;
    transaction.season =
      profileStore.currentProfile.season || seasonsStore.allSeasons[0].id;
    transaction.order_date = _returnDateStringOrNull(transaction.order_date);
    transaction.cookies = _invertCookieQuantities(transaction.cookies);

    try {
      const { data, error } = await _supabaseInsertTransaction(transaction);

      if (error) throw error;

      data.cookies = _invertCookieQuantities(data.cookies);
      _addTransaction(data);
      _sortTransactions();
      notificationHelpers.addSuccess('Transaction Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertNewTransactionFromUploads = async (
    transactionsList: NewOrder[],
  ) => {
    const { error } = await supabaseClient
      .from('orders')
      .insert(transactionsList)
      .select();
    if (error) throw error;
  };

  const upsertTransaction = async (transaction: Order) => {
    transaction.cookies = _invertCookieQuantities(transaction.cookies);

    try {
      console.log(transaction);
      const { data, error } = await _supabaseUpsertTransaction(transaction);

      if (error) throw error;

      data.cookies = _invertCookieQuantities(data.cookies);

      _updateTransaction(data);
      _sortTransactions();
      notificationHelpers.addSuccess('Transaction Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteTransaction = async (transaction: Order | number) => {
    const transactionId: number =
      typeof transaction === 'number' ? transaction : transaction.id;

    if (!transactionId) {
      notificationHelpers.addError({
        message: 'Transaction ID is required to delete a transaction.',
      });
      return;
    }

    try {
      const { error } = await _supabaseDeleteTransaction(transactionId);

      if (error) throw error;

      _removeTransaction(transactionId);
      notificationHelpers.addSuccess('Transaction Deleted');
    } catch (error) {
      if (error instanceof Error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message,
          life: 3000,
        });
      }
    }
  };

  const convertSCOrderToNewTransaction = (
    obj: SCOrder2025,
  ): NewOrder | undefined => {
    if (!profileStore.currentProfile?.id) return;
    const toGirlId = _getGirlId(obj.TO);
    const fromGirlId = _getGirlId(obj.FROM);
    return {
      profile: profileStore.currentProfile?.id,
      order_date: _returnDateStringOrNull(obj.DATE),
      order_num: obj['ORDER #'].toString(),
      to: toGirlId || null,
      from: fromGirlId || null,
      cookies: obj,
      season: profileStore.currentProfile?.season ?? null,
      type: obj.TYPE,
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
      data.cookies = _invertCookieQuantities(data.cookies);
      _updateTransaction(data);
      _sortTransactions();
      notificationHelpers.addSuccess(
        `Transaction Marked ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      );
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  return {
    allTransactions,
    sumTransactionsByCookie,
    activeTransaction,
    transactionDialogFormSchema,
    editTransactionDialogVisible,
    deleteTransactionDialogVisible,
    completedGirlTransactionList,
    completedGirlTransactionListCount,
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
    totalTransactionsByStatusAndCookie,
    totalTransactionsByStatusAllCookies,
    fetchTransactions,
    insertNewTransactionFromUploads,
    insertNewTransaction,
    upsertTransaction,
    deleteTransaction,
    convertSCOrderToNewTransaction,
    updateTransactionStatus,
    friendlyTransactionTypes,
    transactionTypeOptions,
  };
});
