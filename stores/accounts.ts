import type { Database } from '@/types/supabase';
import type {
  Order,
  Payment,
  GirlAccountSummary,
  TroopAccountSummary,
  Girl,
  CookieSummary,
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

  const girlGirlAccountSummarys = computed((): GirlAccountSummary[] => {
    return girlsStore.allGirls.map((girl) => getGirlAccountSummary(girl));
  });

  const troopAccountSummary = computed((): TroopAccountSummary => {
    const balances = girlGirlAccountSummarys.value;

    const totalDistributedValue = balances.reduce(
      (sum, balance) => sum + balance.cookieSummary.totalDue,
      0,
    );
    const totalPaymentsReceived = balances.reduce(
      (sum, balance) => sum + balance.paymentsReceived,
      0,
    );
    const troopBalance = totalPaymentsReceived - totalDistributedValue;

    const totalAllCookiesDistributed = balances.reduce(
      (sum, balance) => sum + (balance.cookieSummary.countAllPackages || 0),
      0,
    );

    const totalGirlDelivery = balances.reduce(
      (sum, balance) => sum + (balance.cookieSummary.countGirlDelivery || 0),
      0,
    );

    const estimatedTotalSales = balances.reduce(
      (sum, balance) => sum + balance.estimatedSales,
      0,
    );

    const cookieSummary: CookieSummary = {
      directShipped: {},
      directShippedTotals: {},
      countDirectShipped: 0,
      girlDelivery: {},
      girlDeliveryTotals: {},
      countGirlDelivery: 0,
      boothSales: {},
      boothSalesTotals: {},
      countBoothSales: 0,
      virtualBoothSales: {},
      virtualBoothSalesTotals: {},
      countVirtualBoothSales: 0,
      countAllPackages: totalAllCookiesDistributed,
      totalDue: 0,
    };
    // Aggregate cookie summary across all girls
    balances.forEach((balance) => {
      const cs = balance.cookieSummary;
      // directShipped
      for (const abbr in cs.directShipped) {
        cookieSummary.directShipped[abbr] =
          (cookieSummary.directShipped[abbr] || 0) + cs.directShipped[abbr];
      }
      for (const abbr in cs.directShippedTotals) {
        cookieSummary.directShippedTotals[abbr] =
          (cookieSummary.directShippedTotals[abbr] || 0) +
          cs.directShippedTotals[abbr];
      }
      cookieSummary.countDirectShipped += cs.countDirectShipped;

      // girlDelivery
      for (const abbr in cs.girlDelivery) {
        cookieSummary.girlDelivery[abbr] =
          (cookieSummary.girlDelivery[abbr] || 0) + cs.girlDelivery[abbr];
      }
      for (const abbr in cs.girlDeliveryTotals) {
        cookieSummary.girlDeliveryTotals[abbr] =
          (cookieSummary.girlDeliveryTotals[abbr] || 0) +
          cs.girlDeliveryTotals[abbr];
      }
      cookieSummary.countGirlDelivery += cs.countGirlDelivery;

      // boothSales
      for (const abbr in cs.boothSales) {
        cookieSummary.boothSales[abbr] =
          (cookieSummary.boothSales[abbr] || 0) + cs.boothSales[abbr];
      }
      for (const abbr in cs.boothSalesTotals) {
        cookieSummary.boothSalesTotals[abbr] =
          (cookieSummary.boothSalesTotals[abbr] || 0) +
          cs.boothSalesTotals[abbr];
      }
      cookieSummary.countBoothSales += cs.countBoothSales;
    });

    return {
      totalDistributedValue,
      totalPaymentsReceived,
      troopBalance,
      estimatedTotalSales,
      totalAllCookiesDistributed: totalAllCookiesDistributed,
      totalGirlDelivery: totalGirlDelivery,
      totalCookiesRemaining: cookiesStore.allCookiesWithInventoryTotals.reduce(
        (sum, cookie) => sum + (cookie.onHand || 0),
        0,
      ),
      cookieSummary,
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
            statusTest(order) /* &&
            order.type !== 'DIRECT_SHIP',*/,
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

  const _getCookieSummaryFromTransactionList = (
    transactionList: Order[],
    girlId: number,
  ) => {
    const totals: CookieSummary = {
      directShipped: {},
      directShippedTotals: {},
      countDirectShipped: 0,
      girlDelivery: {},
      girlDeliveryTotals: {},
      countGirlDelivery: 0,
      boothSales: {},
      boothSalesTotals: {},
      countBoothSales: 0,
      virtualBoothSales: {},
      virtualBoothSalesTotals: {},
      countVirtualBoothSales: 0,
      countAllPackages: 0,
      totalDue: 0,
    };

    type TransactionCategoryKeys =
      | 'directShipped'
      | 'girlDelivery'
      | 'boothSales'
      | 'virtualBoothSales';

    const transactionTypeLookup: Record<string, TransactionCategoryKeys> = {
      DIRECT_SHIP: 'directShipped',
      G2G: 'girlDelivery',
      T2G: 'girlDelivery',
      G2T: 'girlDelivery',
      'T2G(B)': 'boothSales',
      'T2G(VB)': 'virtualBoothSales',
    };

    transactionList.forEach((transaction: Order) => {
      const cookies = transaction.cookies;
      if (!cookies) return;
      // transaction.type may be null/undefined, coerce to a string before using as an index
      const txTypeKey = (transaction.type ?? '') as string;
      const mappedType = transactionTypeLookup[txTypeKey];
      // No cost to girl for DIRECT_SHIP, T2G(B), T2G(VB) transactions
      if (mappedType) {
        cookiesStore.allCookies.forEach((cookie) => {
          const abbreviation = cookie.abbreviation;
          let quantity = (cookies as Record<string, number>)[abbreviation] || 0;

          // Adjust quantity for G2G transfers where the girl is the sender
          if (mappedType === 'girlDelivery') {
            const type = transaction.type;
            const from = transaction.from;
            if (type === 'G2G' && from === girlId) {
              quantity = -quantity;
            }
          }

          if (!quantity) return;

          // Update the appropriate category totals object
          totals[mappedType][abbreviation] =
            (totals[mappedType][abbreviation] || 0) - quantity;

          // Global package count
          totals.countAllPackages -= quantity;

          // Update specific counters
          if (mappedType === 'directShipped') {
            totals.countDirectShipped -= quantity;
          } else if (mappedType === 'boothSales') {
            totals.countBoothSales -= quantity;
          } else if (mappedType === 'virtualBoothSales') {
            totals.countVirtualBoothSales -= quantity;
          } else if (mappedType === 'girlDelivery') {
            totals.countGirlDelivery -= quantity;
          }

          // Girl owes money for girlDelivery transactions
          if (mappedType === 'girlDelivery') {
            totals.totalDue += quantity * (cookie.price || 0);
            totals.girlDeliveryTotals[abbreviation] =
              (totals.girlDeliveryTotals[abbreviation] || 0) +
              quantity * (cookie.price || 0);
          }
        });
      }
    });

    //Enter $0.00 for directShip, boothSales, and virtualBoothSales totals
    for (const abbreviation in totals.directShipped) {
      totals.directShippedTotals[abbreviation] = 0;
    }
    for (const abbreviation in totals.boothSales) {
      totals.boothSalesTotals[abbreviation] = 0;
    }
    for (const abbreviation in totals.virtualBoothSales) {
      totals.virtualBoothSalesTotals[abbreviation] = 0;
    }
    return totals;
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
      const girlAccount = girlGirlAccountSummarys.value.find(
        (account) => account.girl.id === id,
      );
      return girlAccount;
    } else {
      const girl = girlsStore.getGirlById(id);
      if (!girl) return null;
      return getGirlAccountSummary(girl, untilId, includePending);
    }
  };

  const getGirlAccountSummary = (
    girl: Girl,
    untilId?: number,
    includePending: boolean = false,
  ) => {
    const completedTransactions = _getCompletedTransactionsForGirl(
      girl.id,
      untilId, // Including this transaction ID
      includePending,
    );

    const cookieSummary = untilId
      ? _getCookieSummaryFromTransactionList(
          completedTransactions.slice(0, -1),
          girl.id,
        )
      : _getCookieSummaryFromTransactionList(completedTransactions, girl.id);

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
    const balance = cookieSummary.totalDue + paymentsReceived;
    const status = _getStatus(balance);

    const estimatedSales =
      balance >= 0
        ? cookieSummary.countAllPackages
        : Math.round(paymentsReceived / cookiesStore.averageCookiePrice) +
          cookieSummary.countDirectShipped +
          cookieSummary.countBoothSales +
          cookieSummary.countVirtualBoothSales;

    return {
      girl,
      paymentsReceived,
      balance,
      status,
      estimatedSales,
      girlPaymentsList,
      cookieSummary,
    };
  };

  return {
    allPayments,
    girlGirlAccountSummarys,
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
