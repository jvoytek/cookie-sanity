import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import type { PerfectMatch, PartialMatch } from '~/types/types';
import { fuzzyMatch } from '~/utils/stringMatching';

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event);
  const user = await serverSupabaseUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  const body = await readBody(event);
  const { auditSessionId, seasonId } = body;

  if (!auditSessionId || !seasonId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters',
    });
  }

  // Fetch audit session
  const { data: auditSession, error: auditError } = await supabase
    .from('audit_sessions')
    .select('*')
    .eq('id', auditSessionId)
    .eq('profile', user.id)
    .single();

  if (auditError || !auditSession) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Audit session not found',
    });
  }

  // Fetch all orders for this season
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('season', seasonId);

  const totalOrders = orders?.length || 0;

  if (ordersError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch orders',
    });
  }

  const unmatchedOrders = orders || [];
  const auditExtraRows: Record<string, unknown>[] = [];

  // Fetch all sellers for this season
  const { data: sellers, error: sellersError } = await supabase
    .from('sellers')
    .select('*')
    .eq('season', seasonId);

  if (sellersError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch sellers',
    });
  }

  // Fetch all cookies for this season
  const { data: cookies, error: cookiesError } = await supabase
    .from('cookies')
    .select('*')
    .eq('season', seasonId);

  if (cookiesError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch cookies',
    });
  }

  // Extract parsed rows from audit session
  const parsedRows = Array.isArray(auditSession.parsed_rows)
    ? auditSession.parsed_rows
    : [];
  const originalFileData = auditSession.original_file_data as {
    headers?: string[];
  };
  const headers = originalFileData?.headers || [];

  // If headers don't match expected format, return empty matches
  const expectedHeaders = [
    'DATE',
    'TYPE',
    'FROM',
    'TO',
    // Cookie abbreviations will vary; assume any other headers are cookie types
  ];
  const hasValidHeaders = expectedHeaders.every((h) => headers.includes(h));
  if (!hasValidHeaders) {
    return {
      matches: [] as PerfectMatch[],
      unmatchedOrders: unmatchedOrders,
      totalAuditRows: parsedRows.length,
      totalOrders: totalOrders,
      matchCount: 0,
      error: 'Invalid audit file headers',
    };
  }

  // Helper function to convert parsed row to object
  const rowToObject = (row: unknown): Record<string, unknown> | null => {
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

  // Helper function to normalize date format
  const normalizeDate = (dateStr: string | null | undefined): string | null => {
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

  // Create seller lookup map
  const sellerMap = new Map<
    number,
    Database['public']['Tables']['sellers']['Row']
  >();
  sellers?.forEach((seller) => {
    sellerMap.set(seller.id, seller);
  });

  // Create cookie abbreviation set for validation
  const cookieAbbreviations = new Set<string>(
    cookies?.map((cookie) => cookie.abbreviation) || [],
  );

  // Find  matches
  const perfectMatches: PerfectMatch[] = [];

  for (const row of parsedRows) {
    const auditRowObj = rowToObject(row);
    if (!auditRowObj) continue;

    // Extract fields from audit row
    const auditDate = normalizeDate(auditRowObj.DATE as string);
    let auditType = (auditRowObj.TYPE as string).trim();
    if (auditType === 'COOKIE_SHARE') auditType = 'T2G';
    if (auditType === 'COOKIE_SHARE(B)') auditType = 'T2G(B)';
    if (auditType === 'COOKIE_SHARE(VB)') auditType = 'T2G(VB)';
    const auditFrom =
      auditType.slice(0, 3) === 'T2G' || auditType == 'DIRECT_SHIP'
        ? null
        : (auditRowObj.FROM as string);
    const auditTo =
      auditType.slice(0, 3) === 'G2T' ? null : (auditRowObj.TO as string);

    if (!auditDate || !auditType || (!auditFrom && !auditTo)) continue;

    // Try to match with orders
    for (const order of unmatchedOrders || []) {
      const orderDate = normalizeDate(order.order_date);

      // Check if DATE matches
      if (auditDate !== orderDate) continue;

      // Check if TYPE matches
      if (auditType !== order.type) continue;

      // Check if TO/FROM matches a seller
      // TO and FROM can be null in G2T and T2G orders respectively
      const orderToGirl = order.to ? sellerMap.get(order.to) : null;

      const orderFromGirl = order.from ? sellerMap.get(order.from) : null;

      const orderToGirlFullName = orderToGirl
        ? `${orderToGirl.first_name} ${orderToGirl.last_name}`
        : null;
      const orderFromGirlFullName = orderFromGirl
        ? `${orderFromGirl.first_name} ${orderFromGirl.last_name}`
        : null;

      if (auditTo !== orderToGirlFullName) continue;

      if (auditFrom !== orderFromGirlFullName) continue;

      // Check if cookies match
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

      if (cookiesMatch) {
        perfectMatches.push({
          auditRow: auditRowObj,
          order,
          orderToGirl,
          orderFromGirl,
        });
        // Remove matched order from unmatchedOrders
        const index = unmatchedOrders.indexOf(order);
        if (index > -1) {
          unmatchedOrders.splice(index, 1);
        }
        break;
      } else {
        auditExtraRows.push(auditRowObj);
      }
    }
  }

  // Find partial matches with remaining unmatched orders
  const partialMatches: PartialMatch[] = [];
  const auditRowsWithoutPerfectMatch = new Set<Record<string, unknown>>();

  for (const row of parsedRows) {
    const auditRowObj = rowToObject(row);
    if (!auditRowObj) continue;

    // Skip if this row was already perfectly matched
    const alreadyMatched = perfectMatches.some(
      (pm) => pm.auditRow === auditRowObj,
    );
    if (alreadyMatched) continue;

    auditRowsWithoutPerfectMatch.add(auditRowObj);
  }

  // Helper function to normalize ORDER # field
  const normalizeOrderNum = (
    orderNum: string | number | null | undefined,
  ): string => {
    if (!orderNum) return '';
    return String(orderNum).trim().replace(/\s+/g, '').toLowerCase();
  };

  // Helper function to check if dates match within ±2 days tolerance
  const dateMatchesWithTolerance = (
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

  // For each audit row without a perfect match, find partial matches
  for (const auditRowObj of auditRowsWithoutPerfectMatch) {
    const auditDate = normalizeDate(auditRowObj.DATE as string);
    let auditType = (auditRowObj.TYPE as string)?.trim() || '';
    if (auditType === 'COOKIE_SHARE') auditType = 'T2G';
    if (auditType === 'COOKIE_SHARE(B)') auditType = 'T2G(B)';
    if (auditType === 'COOKIE_SHARE(VB)') auditType = 'T2G(VB)';
    const auditFrom =
      auditType.slice(0, 3) === 'T2G' || auditType === 'DIRECT_SHIP'
        ? null
        : (auditRowObj.FROM as string);
    const auditTo =
      auditType.slice(0, 3) === 'G2T' ? null : (auditRowObj.TO as string);
    const auditOrderNum = normalizeOrderNum(auditRowObj['ORDER #']);

    const matchedOrders: PartialMatch['matchedOrders'] = [];

    // Try to match with remaining unmatched orders
    for (const order of unmatchedOrders) {
      const orderDate = normalizeDate(order.order_date);

      // Check matching criteria
      const dateMatch = dateMatchesWithTolerance(auditDate, orderDate);
      const typeMatch = auditType === order.type;

      // Check TO/FROM with fuzzy matching
      const orderToGirl = order.to ? sellerMap.get(order.to) : null;
      const orderFromGirl = order.from ? sellerMap.get(order.from) : null;

      const orderToGirlFullName = orderToGirl
        ? `${orderToGirl.first_name} ${orderToGirl.last_name}`
        : null;
      const orderFromGirlFullName = orderFromGirl
        ? `${orderFromGirl.first_name} ${orderFromGirl.last_name}`
        : null;

      const toMatch = fuzzyMatch(auditTo, orderToGirlFullName, 2);
      const fromMatch = fuzzyMatch(auditFrom, orderFromGirlFullName, 2);

      // Check ORDER # match (normalized)
      const orderNumMatch =
        auditOrderNum && order.order_num
          ? normalizeOrderNum(auditOrderNum) ===
            normalizeOrderNum(order.order_num)
          : false;

      // Count non-cookie fields that match
      let nonCookieFieldsMatched = 0;
      if (dateMatch) nonCookieFieldsMatched++;
      if (typeMatch) nonCookieFieldsMatched++;
      if (toMatch) nonCookieFieldsMatched++;
      if (fromMatch) nonCookieFieldsMatched++;
      if (orderNumMatch) nonCookieFieldsMatched++;

      // Calculate cookie match percentage
      const orderCookies = (order.cookies as Record<string, number>) || {};
      let cookiesMatched = 0;
      let totalCookies = 0;

      for (const abbr of cookieAbbreviations) {
        const auditQty = Number(auditRowObj[abbr]) || 0;
        const orderQty = Number(orderCookies[abbr]) || 0;

        totalCookies++;

        // Cookie quantity ±1 counts toward % match
        if (Math.abs(auditQty - orderQty) <= 1) {
          cookiesMatched++;
        }
      }

      const cookieMatchPercent =
        totalCookies > 0 ? (cookiesMatched / totalCookies) * 100 : 0;

      // Apply matching thresholds:
      // >50% cookie match if ≥1 non-cookie field matches
      // >20% cookie match if ≥2 non-cookie fields match
      const meetsThreshold =
        (nonCookieFieldsMatched >= 1 && cookieMatchPercent > 50) ||
        (nonCookieFieldsMatched >= 2 && cookieMatchPercent > 20);

      // Must have TYPE exact match as per requirements
      if (typeMatch && meetsThreshold) {
        matchedOrders.push({
          order,
          orderToGirl,
          orderFromGirl,
          matchScore: cookieMatchPercent,
          matchDetails: {
            dateMatch,
            typeMatch,
            toMatch,
            fromMatch,
            cookieMatchPercent,
            nonCookieFieldsMatched,
          },
        });
      }
    }

    // Only add to partial matches if we found at least one matching order
    if (matchedOrders.length > 0) {
      partialMatches.push({
        auditRow: auditRowObj,
        matchedOrders,
      });
    }
  }

  return {
    matches: perfectMatches,
    partialMatches: partialMatches,
    unmatchedOrders: unmatchedOrders,
    auditExtraRows: auditExtraRows,
    totalAuditRows: parsedRows.length,
    totalOrders: totalOrders,
    matchCount: perfectMatches.length,
    partialMatchCount: partialMatches.length,
  };
});
