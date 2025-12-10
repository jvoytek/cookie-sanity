import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';

interface PerfectMatch {
  auditRow: Record<string, unknown>;
  order: Database['public']['Tables']['orders']['Row'];
  seller: Database['public']['Tables']['sellers']['Row'];
}

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

  if (ordersError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch orders',
    });
  }

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
  const sellerMap = new Map<number, Database['public']['Tables']['sellers']['Row']>();
  sellers?.forEach((seller) => {
    sellerMap.set(seller.id, seller);
  });

  // Create cookie abbreviation set for validation
  const cookieAbbreviations = new Set<string>(
    cookies?.map((cookie) => cookie.abbreviation) || [],
  );

  // Find perfect matches
  const perfectMatches: PerfectMatch[] = [];

  for (const row of parsedRows) {
    const auditRowObj = rowToObject(row);
    if (!auditRowObj) continue;

    // Extract fields from audit row
    const auditDate = normalizeDate(auditRowObj.DATE as string);
    const auditType = auditRowObj.TYPE as string;
    const auditToFrom = (auditRowObj.TO || auditRowObj.FROM) as string;

    if (!auditDate || !auditType || !auditToFrom) continue;

    // Try to match with orders
    for (const order of orders || []) {
      const orderDate = normalizeDate(order.order_date);

      // Check if DATE matches
      if (auditDate !== orderDate) continue;

      // Check if TYPE matches
      if (auditType !== order.type) continue;

      // Check if TO/FROM matches seller name
      const seller = order.to ? sellerMap.get(order.to) : null;
      if (!seller) continue;

      const sellerFullName = `${seller.first_name} ${seller.last_name}`;
      if (auditToFrom !== sellerFullName) continue;

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
          seller,
        });
      }
    }
  }

  return {
    matches: perfectMatches,
    totalAuditRows: parsedRows.length,
    totalOrders: orders?.length || 0,
    matchCount: perfectMatches.length,
  };
});
