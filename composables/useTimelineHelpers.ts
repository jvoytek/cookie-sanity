import type { TimelineEntry, TimelineTransactionType } from '@/types/types';

export const useTimelineHelpers = () => {
  const accountsStore = useAccountsStore();
  const ordersStore = useTransactionsStore();
  const girlsStore = useGirlsStore();
  const cookiesStore = useCookiesStore();

  /**
   * Build a detailed timeline of all transactions for a specific girl.
   * Combines orders and payments, sorted chronologically with running balance.
   */
  const buildGirlTimeline = (girlId: number): TimelineEntry[] => {
    const girl = girlsStore.allGirls.find((g) => g.id === girlId);
    if (!girl) return [];

    const timelineEntries: TimelineEntry[] = [];

    // Get all orders involving this girl (both from and to)
    const orders = ordersStore.allTransactions.filter(
      (order) =>
        (order.to === girlId || order.from === girlId) &&
        (order.status === 'complete' || order.status === 'recorded'),
    );

    // Get all payments for this girl
    const payments = accountsStore.allPayments.filter(
      (payment) => payment.seller_id === girlId,
    );

    // Process orders into timeline entries
    orders.forEach((order) => {
      const orderDate = order.order_date || order.created_at;
      const cookies = (order.cookies as Record<string, number>) || {};

      // Determine transaction direction and calculate subtotal
      let subtotal = 0;
      const cookieQuantities: Record<string, number> = {};

      const isReceiving = order.to === girlId;
      const isSending = order.from === girlId;

      // Calculate the value of cookies transferred
      if (cookies) {
        cookiesStore.allCookies.forEach((cookie) => {
          const abbr = cookie.abbreviation;
          const qty = cookies[abbr] || 0;

          if (qty !== 0) {
            // If girl is receiving cookies (T2G, G2G), add to their account (positive)
            // If girl is sending cookies (G2T, G2G), subtract from their account (negative)
            if (isReceiving && !isSending) {
              cookieQuantities[abbr] = qty;
              subtotal += qty * cookie.price;
            } else if (isSending && !isReceiving) {
              cookieQuantities[abbr] = -qty;
              subtotal -= qty * cookie.price;
            } else if (isReceiving && isSending) {
              // G2G where both from and to are this girl - shouldn't happen but handle it
              cookieQuantities[abbr] = 0;
            }
          }
        });
      }

      // Get from/to girl names
      const fromGirl = order.from
        ? girlsStore.allGirls.find((g) => g.id === order.from)
        : null;
      const toGirl = order.to
        ? girlsStore.allGirls.find((g) => g.id === order.to)
        : null;

      const fromName = order.from
        ? fromGirl
          ? `${fromGirl.first_name} ${fromGirl.last_name}`
          : 'Troop'
        : 'Troop';
      const toName = order.to
        ? toGirl
          ? `${toGirl.first_name} ${toGirl.last_name}`
          : 'Troop'
        : 'Troop';

      // Determine transaction type label
      let transactionType: TimelineTransactionType;
      const orderType = order.type || '';

      if (orderType === 'G2G') {
        transactionType = 'G2G';
      } else if (orderType === 'G2T') {
        transactionType = 'G2T';
      } else {
        // T2G, T2G(B), T2G(VB), etc.
        transactionType = 'T2G';
      }

      timelineEntries.push({
        date: orderDate,
        type: transactionType,
        from: fromName,
        to: toName,
        cookies:
          Object.keys(cookieQuantities).length > 0 ? cookieQuantities : null,
        subtotal,
        runningTotal: 0, // Will be calculated later
        notes: order.notes,
        orderId: order.id,
      });
    });

    // Process payments into timeline entries
    payments.forEach((payment) => {
      let paymentType: TimelineTransactionType;
      switch (payment.type) {
        case 'cash':
          paymentType = 'payment_cash';
          break;
        case 'check':
          paymentType = 'payment_check';
          break;
        case 'digital_cookie':
          paymentType = 'payment_digital';
          break;
        default:
          paymentType = 'payment_other';
      }

      timelineEntries.push({
        date: payment.payment_date,
        type: paymentType,
        from: `${girl.first_name} ${girl.last_name}`,
        to: 'Troop',
        cookies: null,
        subtotal: -payment.amount, // Payment reduces what girl owes
        runningTotal: 0, // Will be calculated later
        notes: payment.notes,
        paymentId: payment.id,
      });
    });

    // Sort entries by date
    timelineEntries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    // Calculate running totals
    let runningTotal = 0;
    timelineEntries.forEach((entry) => {
      runningTotal += entry.subtotal;
      entry.runningTotal = runningTotal;
    });

    return timelineEntries;
  };

  /**
   * Format transaction type for display
   */
  const formatTransactionType = (type: TimelineTransactionType): string => {
    switch (type) {
      case 'T2G':
        return 'Troop to Girl';
      case 'G2T':
        return 'Girl to Troop';
      case 'G2G':
        return 'Girl to Girl';
      case 'payment_cash':
        return 'Payment (Cash)';
      case 'payment_check':
        return 'Payment (Check)';
      case 'payment_digital':
        return 'Payment (Digital)';
      case 'payment_other':
        return 'Payment (Other)';
      default:
        return type;
    }
  };

  return {
    buildGirlTimeline,
    formatTransactionType,
  };
};
