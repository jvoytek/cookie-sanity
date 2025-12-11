import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import type { PerfectMatch } from '~/types/types';

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

  return {
    matches: perfectMatches,
    unmatchedOrders: unmatchedOrders,
    auditExtraRows: auditExtraRows,
    totalAuditRows: parsedRows.length,
    totalOrders: totalOrders,
    matchCount: perfectMatches.length,
  };
});
