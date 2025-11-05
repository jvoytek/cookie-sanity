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
    return girlsStore.allGirls.map((girl) => getGirlAccountBalance(girl));
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

    const totalAllCookiesDistributed = balances.reduce(
      (sum, balance) => sum + (balance.totalAllCookiesDistributed || 0),
      0,
    );

    const totalPhysicalCookiesDistributed = balances.reduce(
      (sum, balance) => sum + (balance.totalPhysicalCookiesDistributed || 0),
      0,
    );

    const packagesDistributedByType: Record<string, number> = balances.reduce(
      (acc, balance) => {
        for (const [abbreviation, quantity] of Object.entries(
          balance.cookieTotalsByVariety || {},
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

    const totalVirtualCookiesDistributed = Object.entries(
      packagesDistributedByType,
    ).reduce((sum, [abbreviation, quantity]) => {
      const cookie = cookiesStore.getCookieByAbbreviation(abbreviation);
      if (cookie?.is_virtual) {
        return sum + quantity;
      }
      return sum;
    }, 0);
    // Calculate total direct ship cookies across all girls
    const totalDirectShipCookies = balances.reduce((sum, balance) => {
      const directShipTransactions = _getDirectShipTransactionsForGirl(
        balance.girl.id,
      );
      const { totalAllCookiesDistributed: directShipCookies } =
        _getTotalsFromTransactionList(directShipTransactions, balance.girl.id);
      return sum + directShipCookies;
    }, 0);

    const estimatedTotalSales =
      troopBalance >= 0
        ? totalAllCookiesDistributed + totalDirectShipCookies
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
      totalDirectShipCookies,
      totalVirtualCookiesDistributed,
      activeAccounts,
      totalAllCookiesDistributed: totalAllCookiesDistributed,
      totalPhysicalCookiesDistributed: totalPhysicalCookiesDistributed,
      totalCookiesRemaining: cookiesStore.allCookiesWithInventoryTotals.reduce(
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
    untilDate?: Date, // Return only payments before this date (not inclusive)
  ): Payment[] => {
    return allPayments.value.filter((p: Payment) => {
      if (p.seller_id !== girlId) return false;
      if (!p.payment_date) return false;
      if (!untilDate) return true;
      return new Date(p.payment_date) < untilDate;
    });
  };

  const _getCompletedTransactionsForGirl = (
    girlId: number,
    untilIdInclusive?: number, // Return only transaction before this transaction ID (including this one)
    includePending: boolean = false,
  ): Order[] => {
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
        (order.status === 'complete' || order.status === 'recorded') &&
        order.type === 'DIRECT_SHIP',
    );
  };

  const _getTotalsFromTransactionList = (
    transactionList: Order[],
    girlId: number,
  ) => {
    const totals = {
      distributedValue: 0,
      totalAllCookiesDistributed: 0,
      totalPhysicalCookiesDistributed: 0,
      totalVirtualCookiesDistributed: 0,
      cookieTotalsByVariety: {} as Record<string, number>,
    };
    transactionList.forEach((transaction: Order) => {
      const cookies = transaction.cookies;
      if (!cookies) return;
      for (const cookie of cookiesStore.allCookies) {
        const abbreviation = cookie.abbreviation;
        let price = cookie.price ?? 0;
        let quantity = (cookies as Record<string, number>)[abbreviation] || 0;
        const type = transaction.type;
        const from = transaction.from;
        if (type === 'G2G' && from === girlId) {
          quantity = -quantity;
        }
        if (type === 'T2G(B)' || type === 'T2G(VB)') {
          price = 0; // Booth and Virtual Booth transfers are already paid for
        }
        if (quantity) {
          totals.distributedValue -= quantity * (price || 0);
          totals.totalAllCookiesDistributed -= quantity;
          totals.totalPhysicalCookiesDistributed -=
            cookiesStore.getCookieByAbbreviation(abbreviation)?.is_virtual
              ? 0
              : quantity;
          totals.totalVirtualCookiesDistributed -=
            cookiesStore.getCookieByAbbreviation(abbreviation)?.is_virtual
              ? quantity
              : 0;
          totals.cookieTotalsByVariety[abbreviation] =
            (totals.cookieTotalsByVariety[abbreviation] || 0) + quantity;
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

  const _sortPayments = () => {
    allPayments.value.sort((a, b) => {
      const dateA = a.payment_date
        ? new Date(a.payment_date).getTime()
        : Number.NEGATIVE_INFINITY;
      const dateB = b.payment_date
        ? new Date(b.payment_date).getTime()
        : Number.NEGATIVE_INFINITY;
      return dateB - dateA;
    });
  };

  const _transformDataForPayment = (payment: Payment) => {
    const transformedPayment = { ...payment };
    // Convert payment_date from yyyy-mm-dd to mm/dd/yyyy
    if (payment.payment_date) {
      const dateParts = payment.payment_date.split('-');
      const year = dateParts[0];
      const month = dateParts[1].padStart(2, '0');
      const day = dateParts[2].padStart(2, '0');
      transformedPayment.payment_date = `${month}/${day}/${year}`;
    }
    return transformedPayment;
  };

  /* Actions */

  const fetchPayments = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;
      const { data, error } = await _supabaseGetPayments();
      // convert payment_date strings to mm/dd/yyyy format
      if (data) {
        allPayments.value = data.map(_transformDataForPayment);
      }
      if (error) throw error;
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
      _addPayment(_transformDataForPayment(data));
      notificationHelpers.addSuccess('Payment Added');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertPayment = async (payment: Payment) => {
    try {
      const { data, error } = await _supabaseUpsertPayment(payment);

      if (error) throw error;

      _updatePayment(_transformDataForPayment(data));
      _sortPayments();
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
      notificationHelpers.addError(error as Error);
    }
  };

  const getGirlAccountById = (
    id: number,
    untilId?: number,
    includePending: boolean = false,
  ) => {
    if (!untilId) {
      const girlAccount = girlAccountBalances.value.find(
        (account) => account.girl.id === id,
      );
      return girlAccount;
    } else {
      const girl = girlsStore.getGirlById(id);
      if (!girl) return null;
      return getGirlAccountBalance(girl, untilId, includePending);
    }
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
    const {
      distributedValue,
      totalVirtualCookiesDistributed,
      totalPhysicalCookiesDistributed,
      totalAllCookiesDistributed,
      cookieTotalsByVariety,
    } = untilId
      ? _getTotalsFromTransactionList(
          completedTransactions.slice(0, -1),
          girl.id,
        )
      : _getTotalsFromTransactionList(completedTransactions, girl.id);
    // derive an explicit Date | undefined from the last completed transaction's order_date (if present)
    let untilDate: Date | undefined = undefined;
    if (untilId) {
      // Prefer the order from the completed list, fall back to all transactions if needed
      const untilOrder = completedTransactions.find((o) => o.id === untilId);

      if (untilOrder && untilOrder.order_date) {
        const od = untilOrder.order_date;
        if (typeof od === 'string' || typeof od === 'number') {
          untilDate = new Date(od);
        } else if (od instanceof Date) {
          untilDate = new Date(od.getTime());
        }
      }
    }
    const girlPaymentsList = _getPaymentsForGirl(girl.id, untilDate);
    const paymentsReceived = _getTotalofPayments(girlPaymentsList);
    const balance = paymentsReceived - distributedValue;
    const status = _getStatus(balance);

    // Include DIRECT_SHIP orders in estimated sales
    const directShipTransactions = _getDirectShipTransactionsForGirl(girl.id);
    const { totalAllCookiesDistributed: totalDirectShipCookies } =
      _getTotalsFromTransactionList(directShipTransactions, girl.id);

    // Include virtual cookie totals in cookieTotalsByVariety

    const estimatedSales =
      balance >= 0
        ? totalAllCookiesDistributed + totalDirectShipCookies
        : Math.round(paymentsReceived / cookiesStore.averageCookiePrice) +
          totalDirectShipCookies;

    return {
      girl,
      distributedValue,
      paymentsReceived,
      balance,
      status,
      totalAllCookiesDistributed,
      totalDirectShipCookies,
      totalVirtualCookiesDistributed,
      totalPhysicalCookiesDistributed,
      cookieTotalsByVariety,
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
