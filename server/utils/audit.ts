import type { Database } from '~/types/supabase';
import type { Cookie, Order } from '~/types/types';
import {
  invertCookieQuantitiesAuditRow,
  transactionTypesToInvertAudit,
} from '~/shared/utils/transactions';

export const normalizeDate = (
  dateStr: string | null | undefined,
): string | null => {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
};

export const normalizeOrderNum = (
  orderNum: string | number | null | undefined,
): string => {
  if (!orderNum) return '';
  return String(orderNum).trim().replace(/\s+/g, '').toLowerCase();
};

export const rowToObject = (
  row: unknown,
  headers: string[],
): Record<string, unknown> | null => {
  if (
    typeof row !== 'object' ||
    row === null ||
    !('data' in row) ||
    !Array.isArray((row as { data: unknown }).data)
  ) {
    return null;
  }

  const rowData = (row as { data: unknown[] }).data;
  const obj: Record<string, unknown> = {};

  headers.forEach((header, index) => {
    obj[header] = rowData[index];
  });

  return obj;
};

export const getSellersMap = (
  sellers: Database['public']['Tables']['sellers']['Row'][] | null | undefined,
) => {
  const sellerMap = new Map<
    number,
    Database['public']['Tables']['sellers']['Row']
  >();
  sellers?.forEach((seller) => {
    sellerMap.set(seller.id, seller);
  });

  return sellerMap;
};

export const getCookieAbbreviations = (
  cookies: Database['public']['Tables']['cookies']['Row'][] | null | undefined,
) => {
  return new Set<string>(cookies?.map((cookie) => cookie.abbreviation) || []);
};

export const hasValidHeaders = (headers: string[]): boolean => {
  const expectedHeaders = [
    'DATE',
    'ORDER #',
    'TYPE',
    'FROM',
    'TO',
    'STATUS',
    'TOTAL',
    'TOTAL $',
    // Cookie abbreviations will vary; assume any other headers are cookie types
  ];
  return expectedHeaders.every((h) => headers.includes(h));
};

export const processAuditRowForMatching = (
  auditRowObj: Record<string, unknown>,
  cookies: Cookie[],
): {
  date: string | null;
  type: string | null;
  from: string | null;
  to: string | null;
  order_num: string | null;
} => {
  // Extract fields from audit row
  const date = normalizeDate(auditRowObj.DATE as string);
  const order_num = normalizeOrderNum(auditRowObj['ORDER #']);

  let type = (auditRowObj.TYPE as string).trim();

  // convert COOKIE_SHARE to T2G for matching purposes (COOKIE_SHARE is not a useful type in orders)
  if (type === 'COOKIE_SHARE') type = 'T2G';
  if (type === 'COOKIE_SHARE(B)') type = 'T2G(B)';
  if (type === 'COOKIE_SHARE(VB)') type = 'T2G(VB)';

  if (type === 'INITIAL') {
    type = 'C2T';
  }

  const from =
    type.slice(0, 3) === 'T2G' || type == 'DIRECT_SHIP' || type === 'C2T'
      ? null
      : (auditRowObj.FROM as string);
  const to =
    type.slice(0, 3) === 'G2T' || type === 'C2T'
      ? null
      : (auditRowObj.TO as string);

  // invert cookie quantities if necessary
  if (type && transactionTypesToInvertAudit.includes(type)) {
    auditRowObj = invertCookieQuantitiesAuditRow(auditRowObj, cookies);
  }
  return {
    ...auditRowObj,
    date: date,
    type: type,
    from: from,
    to: to,
    order_num: order_num,
  };
};

export const checkForCookieMatch = (
  auditRowObj: Record<string, unknown>,
  order: Order,
  cookieAbbreviations: Set<string>,
): boolean => {
  let cookiesMatch = true;
  const orderCookies = (order.cookies as Record<string, number>) || {};

  for (const abbr of cookieAbbreviations) {
    const auditQty = Number(auditRowObj[abbr]) || 0;
    const orderQty = Number(orderCookies[abbr]) || 0;

    if (auditQty !== orderQty) {
      cookiesMatch = false;
      break;
    }
  }
  return cookiesMatch;
};

export const checkForPartialCookieMatch = (
  auditRowObj: Record<string, unknown>,
  order: Order,
  cookieAbbreviations: Set<string>,
): { numberMatched: number; totalCookies: number; matchPercentage: number } => {
  let cookiesMatched = 0;
  let totalCookies = 0;

  const orderCookies = (order.cookies as Record<string, number>) || {};

  for (const abbr of cookieAbbreviations) {
    const auditQty = Number(auditRowObj[abbr]) || 0;
    const orderQty = Number(orderCookies[abbr]) || 0;

    if (auditQty !== 0 && orderQty !== 0) {
      totalCookies++;
      // Check for quantity match within 2 units
      if (Math.abs(auditQty - orderQty) <= 2) {
        cookiesMatched++;
      }
      // Or if the absolute values match (someone put a negative quantity in one)
      else if (Math.abs(auditQty) === Math.abs(orderQty)) {
        cookiesMatched++;
      }
    } else if (auditQty !== 0 || orderQty !== 0) {
      totalCookies++;
      // Check for quantity match within 2 units
      if (Math.abs(auditQty - orderQty) <= 1) {
        cookiesMatched++;
      }
    }
  }

  const matchPercentage =
    totalCookies > 0 ? (cookiesMatched / totalCookies) * 100 : 0;

  return { numberMatched: cookiesMatched, totalCookies, matchPercentage };
};

export const dateMatchesWithTolerance = (
  date1: string | null,
  date2: string | null,
): boolean => {
  if (!date1 || !date2) return false;

  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

    const diffMs = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays <= 2;
  } catch {
    return false;
  }
};
