import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/supabase';
import type { PerfectMatch, PartialMatch } from '~/types/types';
import { fuzzyMatch } from '~/server/utils/stringMatching';
import {
  fetchAuditSession,
  fetchCookies,
  fetchOrders,
  fetchSellers,
} from '~/server/utils/supabase';
import {
  checkForCookieMatch,
  getCookieAbbreviations,
  getSellersMap,
  hasValidHeaders,
  normalizeDate,
  normalizeOrderNum,
  processAuditRowForMatching,
  rowToObject,
  dateMatchesWithTolerance,
  checkForPartialCookieMatch,
} from '~/server/utils/audit';
import { transformDataForTransaction } from '~/shared/utils/transactions';

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event);
  const user = await serverSupabaseUser(event);

  const body = await readBody(event);
  const { auditSessionId, seasonId } = body;

  if (!auditSessionId || !seasonId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameters',
    });
  }

  const auditSession = await fetchAuditSession(supabase, auditSessionId, user);
  const orders = (await fetchOrders(supabase, seasonId)).map(
    transformDataForTransaction,
  );
  const totalOrders = orders?.length || 0;
  const sellers = await fetchSellers(supabase, seasonId);
  const sellerMap = getSellersMap(sellers);
  const cookies = await fetchCookies(supabase, seasonId);
  const cookieAbbreviations = getCookieAbbreviations(cookies);

  const unmatchedOrders = orders || [];
  const auditExtraRows: Record<string, unknown>[] = [];

  // Extract parsed rows from audit session
  const parsedRows = Array.isArray(auditSession.parsed_rows)
    ? auditSession.parsed_rows
    : [];
  const originalFileData = auditSession.original_file_data as {
    headers?: string[];
  };
  const headers = originalFileData?.headers || [];

  // If headers don't match expected format, return empty matches
  if (!hasValidHeaders(headers)) {
    return {
      matches: [] as PerfectMatch[],
      unmatchedOrders: unmatchedOrders,
      totalAuditRows: parsedRows.length,
      totalOrders: totalOrders,
      matchCount: 0,
      error: 'Invalid audit file headers',
    };
  }

  // Find  perfect matches
  const perfectMatches: PerfectMatch[] = [];

  // Normalized audit rows for matching
  const auditRowsForMatching = parsedRows.map((row) =>
    processAuditRowForMatching(rowToObject(row, headers) || {}, cookies),
  );

  for (const auditRow of auditRowsForMatching) {
    if (!auditRow) continue;

    if (
      !auditRow.date ||
      !auditRow.type ||
      (auditRow.type !== 'C2T' && !auditRow.from && !auditRow.to)
    )
      continue;

    let auditRowMatched = false;

    // Try to match with orders
    for (const order of unmatchedOrders || []) {
      const orderDate = normalizeDate(order.order_date);

      if (auditRow.date !== orderDate) continue;
      if (auditRow.type !== order.type) continue;

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

      if (auditRow.type !== 'C2T' && auditRow.to !== orderToGirlFullName)
        continue;

      if (auditRow.type !== 'C2T' && auditRow.from !== orderFromGirlFullName)
        continue;

      // Check if cookies match
      const cookiesMatch = checkForCookieMatch(
        auditRow,
        order,
        cookieAbbreviations,
      );

      if (cookiesMatch) {
        auditRowMatched = true;
        perfectMatches.push({
          auditRow: auditRow,
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
      }
    }

    if (!auditRowMatched) {
      auditExtraRows.push(auditRow);
    }
  }

  // Find partial matches with remaining unmatched orders
  const partialMatches: PartialMatch[] = [];

  // For each audit row without a perfect match, find partial matches
  for (const auditRow of auditExtraRows) {
    const matchedOrders: PartialMatch['matchedOrders'] = [];

    // Try to match with remaining unmatched orders
    for (const order of unmatchedOrders) {
      const orderDate = normalizeDate(order.order_date);

      // Check matching criteria
      const dateMatch = dateMatchesWithTolerance(auditRow.date, orderDate);
      const typeMatch = auditRow.type === order.type;

      // Check TO/FROM with fuzzy matching
      const orderToGirl = order.to ? sellerMap.get(order.to) : null;
      const orderFromGirl = order.from ? sellerMap.get(order.from) : null;

      const orderToGirlFullName = orderToGirl
        ? `${orderToGirl.first_name} ${orderToGirl.last_name}`
        : null;
      const orderFromGirlFullName = orderFromGirl
        ? `${orderFromGirl.first_name} ${orderFromGirl.last_name}`
        : null;

      const toMatch =
        auditRow.to || orderToGirlFullName
          ? fuzzyMatch(auditRow.to, orderToGirlFullName, 2)
          : false;
      const fromMatch =
        auditRow.from || orderFromGirlFullName
          ? fuzzyMatch(auditRow.from, orderFromGirlFullName, 2)
          : false;

      // Check ORDER # match (normalized)
      const orderNumMatch =
        auditRow.order_num && order.order_num
          ? auditRow.order_num === normalizeOrderNum(order.order_num)
          : false;

      // Count non-cookie fields that match
      let nonCookieFieldsMatched = 0;
      if (dateMatch) nonCookieFieldsMatched++;
      if (typeMatch) nonCookieFieldsMatched++;
      if (toMatch || fromMatch) nonCookieFieldsMatched++;
      if (orderNumMatch) nonCookieFieldsMatched++;

      const {
        numberMatched: numberCookiesMatched,
        totalCookies: totalCookiesToMatch,
        matchPercentage: cookieMatchPercent,
      } = checkForPartialCookieMatch(auditRow, order, cookieAbbreviations);

      const totalMatchedPercentage =
        ((numberCookiesMatched + nonCookieFieldsMatched) /
          (totalCookiesToMatch + 4)) *
        100;

      // Apply matching thresholds:
      // >50% cookie match if ≥1 non-cookie field matches
      // >20% cookie match if ≥2 non-cookie fields match
      const meetsThreshold =
        (nonCookieFieldsMatched >= 1 && totalMatchedPercentage > 60) ||
        (nonCookieFieldsMatched >= 2 && totalMatchedPercentage > 40);

      // Must have TYPE exact match as per requirements
      if (meetsThreshold) {
        matchedOrders.push({
          order,
          orderToGirl,
          orderFromGirl,
          matchScore: totalMatchedPercentage,
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
        auditRow: auditRow,
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
