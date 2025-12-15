import type { Json } from '@/types/supabase';
import type { Cookie, Order } from '@/types/types';

export const transactionTypesToInvert = ['G2T', 'T2T', 'C2T'];
export const transactionTypesToInvertAudit = [
  'T2G',
  'T2G(B)',
  'T2G(VB)',
  'DIRECT_SHIP',
];

export const invertCookieQuantitiesInTransaction = (transaction: Order) => {
  const invertedCookies = invertCookieQuantities(transaction.cookies);
  transaction.cookies = invertedCookies ? invertedCookies : transaction.cookies;
  return transaction;
};

export const invertCookieQuantities = (
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

export const invertCookieQuantitiesAuditRow = (
  auditRow: Record<string, unknown>,
  cookies: Cookie[],
) => {
  cookies.forEach((cookie) => {
    const abbr = cookie.abbreviation;
    if (abbr && abbr in auditRow) {
      const value = auditRow[abbr];
      if (typeof value === 'number') {
        auditRow[abbr] = value === 0 ? null : value * -1;
      }
    }
  });
  return auditRow;
};

const _convertDateStringToMMDDYYYY = (
  date: string | null | undefined,
): string | null => {
  if (!date) return null;
  const dateParts = date.split('-');
  if (dateParts.length !== 3) return date ?? null;
  return `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
};

export const transformDataForTransaction = (transaction: Order): Order => {
  if (transaction.type && transactionTypesToInvert.includes(transaction.type)) {
    transaction = invertCookieQuantitiesInTransaction(transaction);
  }
  return {
    ...transaction,
    order_date: _convertDateStringToMMDDYYYY(transaction.order_date),
    sortDate: transaction.order_date
      ? new Date(transaction.order_date)
      : new Date(0),
  } as Order;
};
