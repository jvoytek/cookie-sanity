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
      const isBoothOrDirectShip =
        order.type === 'T2G(B)' ||
        order.type === 'T2G(VB)' ||
        order.type === 'DIRECT_SHIP';

      // Calculate the value of cookies transferred

      cookiesStore.allCookies.forEach((cookie) => {
        const abbr = cookie.abbreviation;
        const qty = cookies[abbr] || 0;

        if (qty !== 0) {
          // If girl is receiving cookies (T2G, G2G), add to their account (positive)
          // If girl is sending cookies (G2T, G2G), subtract from their account (negative)
          // If it's a booth type transaction, no change
          if (isBoothOrDirectShip) {
            cookieQuantities[abbr] = qty;
            subtotal = 0;
          } else if (isReceiving && !isSending) {
            cookieQuantities[abbr] = qty;
            subtotal += qty * cookie.price;
          } else if (isSending && !isReceiving) {
            cookieQuantities[abbr] = -qty;
            subtotal -= qty * cookie.price;
          }
          // Note: If both from and to are the same girl (shouldn't happen), skip this entry
        }
      });

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

      timelineEntries.push({
        date: orderDate,
        type: order.type as TimelineTransactionType,
        from: fromName,
        to: toName,
        cookies:
          Object.keys(cookieQuantities).length > 0 ? cookieQuantities : null,
        cookiesTotal: Object.values(cookieQuantities).reduce(
          (sum, qty) => sum + qty,
          0,
        ),
        subtotal,
        runningTotal: 0, // Will be calculated later
        notes: order.notes,
        order_num: order.order_num,
        orderId: order.id,
      });
    });

    // Process payments into timeline entries
    // Group digital payments by date for consolidation
    const digitalPaymentsByDate = new Map<string, typeof payments>();
    const nonDigitalPayments: typeof payments = [];

    payments.forEach((payment) => {
      if (payment.type === 'digital_cookie') {
        const dateKey = payment.payment_date;
        if (!digitalPaymentsByDate.has(dateKey)) {
          digitalPaymentsByDate.set(dateKey, []);
        }
        digitalPaymentsByDate.get(dateKey)!.push(payment);
      } else {
        nonDigitalPayments.push(payment);
      }
    });

    // Add non-digital payments as separate entries
    nonDigitalPayments.forEach((payment) => {
      let paymentType: TimelineTransactionType;
      switch (payment.type) {
        case 'cash':
          paymentType = 'payment_cash';
          break;
        case 'check':
          paymentType = 'payment_check';
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
        cookiesTotal: null,
        subtotal: -payment.amount, // Payment reduces what girl owes
        runningTotal: 0, // Will be calculated later
        notes: payment.notes,
        paymentId: payment.id,
      });
    });

    // Add consolidated digital payments (one entry per date)
    digitalPaymentsByDate.forEach((paymentsOnDate, date) => {
      const totalAmount = paymentsOnDate.reduce(
        (sum, p) => sum + p.amount,
        0,
      );
      // Collect all notes from digital payments on this date
      const allNotes = paymentsOnDate
        .map((p) => p.notes)
        .filter((n) => n)
        .join('; ');

      timelineEntries.push({
        date: date,
        type: 'payment_digital',
        from: `${girl.first_name} ${girl.last_name}`,
        to: 'Troop',
        cookies: null,
        cookiesTotal: null,
        subtotal: -totalAmount, // Payment reduces what girl owes
        runningTotal: 0, // Will be calculated later
        notes: allNotes || null,
        // Store all payment IDs as a comma-separated string in notes for reference
        paymentId: undefined, // Don't set a single payment ID for consolidated entries
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
      case 'T2G(B)':
        return 'Troop to Girl (Booth)';
      case 'T2G(VB)':
        return 'Troop to Girl (Virtual Booth)';
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
      case 'DIRECT_SHIP':
        return 'Direct Ship';
      default:
        return type;
    }
  };

  return {
    buildGirlTimeline,
    formatTransactionType,
  };
};
