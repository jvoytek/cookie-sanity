import type { Database } from '@/types/supabase';
import type {
  Order,
  Payment,
  AccountBalance,
  TroopAccountSummary,
  Girl,
} from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useAccountsStore = defineStore('accounts', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();
  const cookiesStore = useCookiesStore();
  const ordersStore = useTransactionsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allPayments = ref<Payment[]>([]);
  const editPaymentDialogVisible = ref(false);
  const activePayment = ref<Payment | null>(null);
  const paymentDialogFormSchema = ref([]);
  const deletePaymentDialogVisible = ref(false);

  /* Computed */

  const girlAccountBalances = computed((): AccountBalance[] => {
    return getGirlAccountBalances();
  });

  const troopAccountSummary = computed((): TroopAccountSummary => {
    const balances = girlAccountBalances.value;

    const totalDistributedValue = balances.reduce(
      (sum, balance) => sum + balance.distributedValue,
      0,
    );
    const totalPaymentsReceived = balances.reduce(
      (sum, balance) => sum + balance.paymentsReceived,
      0,
    );
    const troopBalance = totalPaymentsReceived - totalDistributedValue;

    const numCookiesDistributed = balances.reduce(
      (sum, balance) => sum + (balance.numCookiesDistributed || 0),
      0,
    );

    const packagesDistributedByType: Record<string, number> = balances.reduce(
      (acc, balance) => {
        for (const [abbreviation, quantity] of Object.entries(
          balance.cookieTotals || {},
        )) {
          if (!acc[abbreviation]) {
            acc[abbreviation] = 0;
          }
          acc[abbreviation] += quantity;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate total direct ship cookies across all girls
    const totalDirectShipCookies = balances.reduce((sum, balance) => {
      const directShipTransactions = _getDirectShipTransactionsForGirl(
        balance.girl.id,
      );
      const { numCookiesDistributed: directShipCookies } =
        _getTotalsFromTransactionList(directShipTransactions);
      return sum + directShipCookies;
    }, 0);

    const estimatedTotalSales =
      troopBalance >= 0
        ? numCookiesDistributed + totalDirectShipCookies
        : Math.round(totalPaymentsReceived / cookiesStore.averageCookiePrice) +
          totalDirectShipCookies;

    // Count active accounts (accounts with any activity)
    const activeAccounts = balances.filter(
      (balance) => balance.distributedValue > 0 || balance.paymentsReceived > 0,
    ).length;

    return {
      totalDistributedValue,
      packagesDistributedByType,
      totalPaymentsReceived,
      troopBalance,
      estimatedTotalSales,
      activeAccounts,
      numCookiesDistributed: numCookiesDistributed,
      numCookiesRemaining: cookiesStore.allCookiesWithInventoryTotals.reduce(
        (sum, cookie) => sum + (cookie.onHand || 0),
        0,
      ),
    };
  });

  /* Private Functions */

  const _getTotalofPayments = (payments: Payment[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const _getPaymentsForGirl = (
    girlId: number,
    untilDate: Date = new Date(), // Return only payments before this date (not inclusive)
  ): Payment[] => {
    console.log(
      'Getting payments for girl ID:',
      girlId,
      'until date:',
      untilDate,
    );
    return allPayments.value.filter((p: Payment) => {
      if (p.seller_id !== girlId) return false;
      if (!p.payment_date) return false;
      return new Date(p.payment_date) < untilDate;
    });
  };

  const _getCompletedTransactionsForGirl = (
    girlId: number,
    untilIdInclusive?: number, // Return only transaction before this transaction ID (including this one)
    includePending: boolean = false,
  ): Order[] => {
    console.log(
      'Getting completed transactions for girl ID:',
      girlId,
      'until ID:',
      untilIdInclusive,
    );
    const statusTest = includePending
      ? function (order: Order) {
          return (
            order.status === 'complete' ||
            order.status === 'recorded' ||
            order.status === 'pending'
          );
        }
      : function (order: Order) {
          return order.status === 'complete' || order.status === 'recorded';
        };
    console.log('Status test function:', statusTest.toString());
    if (!untilIdInclusive) {
      return ordersStore.allTransactions
        .filter(
          (order) =>
            (order.to === girlId || order.from === girlId) &&
            statusTest(order) &&
            order.type !== 'DIRECT_SHIP',
        )
        .sort((a, b) => {
          const ta = a.order_date
            ? new Date(a.order_date).getTime()
            : Number.NEGATIVE_INFINITY;
          const tb = b.order_date
            ? new Date(b.order_date).getTime()
            : Number.NEGATIVE_INFINITY;
          return ta - tb;
        });
    }

    // Find the order corresponding to untilId and use its order_date as the cutoff
    const untilOrder = ordersStore.allTransactions.find(
      (o) => o.id === untilIdInclusive,
    );
    if (!untilOrder || !untilOrder.order_date) {
      // If we can't determine a cutoff date, fall back to returning all matching completed transactions (sorted)
      return ordersStore.allTransactions
        .filter(
          (order) =>
            (order.to === girlId || order.from === girlId) &&
            statusTest(order) &&
            order.type !== 'DIRECT_SHIP',
        )
        .sort((a, b) => {
          const ta = a.order_date
            ? new Date(a.order_date).getTime()
            : Number.NEGATIVE_INFINITY;
          const tb = b.order_date
            ? new Date(b.order_date).getTime()
            : Number.NEGATIVE_INFINITY;
          return ta - tb;
        });
    }

    const cutoffDate = new Date(untilOrder.order_date).getTime();

    return ordersStore.allTransactions
      .filter((order) => {
        if (!(order.to === girlId || order.from === girlId)) return false;
        if (!statusTest(order)) return false;
        if (order.type === 'DIRECT_SHIP') return false;
        if (!order.order_date) return false; // exclude transactions without a date when using a cutoff
        return new Date(order.order_date).getTime() <= cutoffDate;
      })
      .sort((a, b) => {
        const ta = a.order_date
          ? new Date(a.order_date).getTime()
          : Number.NEGATIVE_INFINITY;
        const tb = b.order_date
          ? new Date(b.order_date).getTime()
          : Number.NEGATIVE_INFINITY;
        return ta - tb;
      });
  };

  const _getDirectShipTransactionsForGirl = (girlId: number): Order[] => {
    return ordersStore.allTransactions.filter(
      (order) =>
        order.to === girlId &&
        order.status === 'complete' &&
        order.type === 'DIRECT_SHIP',
    );
  };

  const _getTotalsFromTransactionList = (transactionList: Order[]) => {
    const totals = {
      distributedValue: 0,
      numCookiesDistributed: 0,
      cookieTotals: {} as Record<string, number>,
    };
    transactionList.forEach((transaction: Order) => {
      const cookies = transaction.cookies;
      if (!cookies) return;
      for (const { abbreviation, price = 0 } of cookiesStore.allCookies) {
        const quantity = (cookies as Record<string, number>)[abbreviation] || 0;
        if (quantity) {
          totals.distributedValue -= quantity * (price || 0);
          totals.numCookiesDistributed -= quantity;
          totals.cookieTotals[abbreviation] =
            (totals.cookieTotals[abbreviation] || 0) + quantity;
        }
      }
      return totals;
    });

    return totals;
  };

  const _getStatus = (balance: number): string => {
    if (balance < 0) {
      return `Balance Due`;
    } else if (balance > 0) {
      return 'Overpaid';
    } else {
      return 'Paid in Full';
    }
  };

  const _addPayment = (payment: Payment) => {
    allPayments.value.push(payment);
  };

  const _updatePayment = (payment: Payment) => {
    const index = allPayments.value.findIndex(
      (p: Payment) => p.id === payment.id,
    );
    if (index !== -1) {
      allPayments.value[index] = payment;
    }
  };

  const _removePayment = (payment: Payment) => {
    const index = allPayments.value.findIndex(
      (p: Payment) => p.id === payment.id,
    );
    if (index !== -1) {
      allPayments.value.splice(index, 1);
    }
  };

  const _supabaseGetPayments = async () => {
    if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id) {
      return { data: [], error: { message: 'Profile or season not found' } };
    }
    return await supabaseClient
      .from('payments')
      .select(`*`)
      .eq('profile', profileStore.currentProfile.id)
      .eq('season', seasonsStore.currentSeason.id)
      .order('payment_date', { ascending: false });
  };

  const _supabaseInsertNewPayment = async (payment: Payment) => {
    return await supabaseClient
      .from('payments')
      .insert([payment])
      .select()
      .single();
  };

  const _supabaseUpsertPayment = async (payment: Payment) => {
    return await supabaseClient
      .from('payments')
      .upsert(payment)
      .select()
      .single();
  };

  const _supabaseDeletePayment = async (payment: Payment) => {
    return await supabaseClient.from('payments').delete().eq('id', payment.id);
  };

  /* Actions */

  const fetchPayments = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;
      const { data, error } = await _supabaseGetPayments();
      if (error) throw error;
      allPayments.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertNewPayment = async (payment: Partial<Payment>) => {
    if (!profileStore.currentProfile) return;
    payment.profile = profileStore.currentProfile.id;
    payment.season =
      profileStore.currentProfile.season || seasonsStore.allSeasons[0].id;

    try {
      const { data, error } = await _supabaseInsertNewPayment(
        payment as Payment,
      );

      if (error) throw error;
      _addPayment(data);
      notificationHelpers.addSuccess('Payment Added');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertPayment = async (payment: Payment) => {
    try {
      const { data, error } = await _supabaseUpsertPayment(payment);

      if (error) throw error;

      _updatePayment(data);
      notificationHelpers.addSuccess('Payment Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deletePayment = async (payment: Payment) => {
    try {
      const { error } = await _supabaseDeletePayment(payment);

      if (error) throw error;

      _removePayment(payment);
      notificationHelpers.addSuccess('Payment Deleted');
    } catch (error) {
      console.log(error);
      notificationHelpers.addError(error as Error);
    }
  };

  const getGirlAccountById = (
    id: number,
    untilId?: number,
    includePending: boolean = false,
  ) => {
    if (!untilId) {
      return girlAccountBalances.value.find(
        (account) => account.girl.id === id,
      );
    } else {
      const girl = girlsStore.getGirlById(id);
      if (!girl) return null;
      return getGirlAccountBalance(girl, untilId, includePending);
    }
  };

  const getGirlAccountBalances = () => {
    return girlsStore.allGirls.map((girl) => getGirlAccountBalance(girl));
  };

  const getGirlAccountBalance = (
    girl: Girl,
    untilId?: number,
    includePending: boolean = false,
  ) => {
    const completedTransactions = _getCompletedTransactionsForGirl(
      girl.id,
      untilId, // Including this transaction ID
      includePending,
    );
    console.log(completedTransactions);
    const { distributedValue, cookieTotals, numCookiesDistributed } = untilId
      ? _getTotalsFromTransactionList(completedTransactions.slice(0, -1))
      : _getTotalsFromTransactionList(completedTransactions);
    // derive an explicit Date | undefined from the last completed transaction's order_date (if present)
    let untilDate: Date | undefined = undefined;
    if (completedTransactions.length > 0) {
      const lastOrderDate =
        completedTransactions[completedTransactions.length - 1].order_date;
      if (
        lastOrderDate !== null &&
        lastOrderDate !== undefined &&
        typeof lastOrderDate === 'string'
      ) {
        untilDate = new Date(lastOrderDate);
      }
    }
    const girlPaymentsList = _getPaymentsForGirl(girl.id, untilDate);
    const paymentsReceived = _getTotalofPayments(girlPaymentsList);
    const balance = paymentsReceived - distributedValue;
    const status = _getStatus(balance);

    // Include DIRECT_SHIP orders in estimated sales
    const directShipTransactions = _getDirectShipTransactionsForGirl(girl.id);
    const { numCookiesDistributed: directShipCookies } =
      _getTotalsFromTransactionList(directShipTransactions);

    const estimatedSales =
      balance >= 0
        ? numCookiesDistributed + directShipCookies
        : Math.round(paymentsReceived / cookiesStore.averageCookiePrice) +
          directShipCookies;

    return {
      girl,
      distributedValue,
      paymentsReceived,
      balance,
      status,
      numCookiesDistributed,
      cookieTotals,
      estimatedSales,
      girlPaymentsList,
    };
  };

  return {
    allPayments,
    girlAccountBalances,
    editPaymentDialogVisible,
    deletePaymentDialogVisible,
    activePayment,
    paymentDialogFormSchema,
    troopAccountSummary,
    fetchPayments,
    insertNewPayment,
    upsertPayment,
    deletePayment,
    getGirlAccountById,
  };
});
