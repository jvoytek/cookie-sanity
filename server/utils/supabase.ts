import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '~/types/types';

export const fetchAuditSessions = async (
  supabase: SupabaseClient,
  auditSessionIds: string[],
  user: User | null,
) => {
  const { data: auditSessions, error: auditError } = await supabase
    .from('audit_sessions')
    .select('*')
    .in('id', auditSessionIds)
    .eq('profile', user?.id);

  if (auditError || !auditSessions) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Audit session not found',
    });
  }

  return auditSessions;
};

export const fetchOrders = async (
  supabase: SupabaseClient,
  seasonId: string,
) => {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('season', seasonId);

  if (ordersError || !orders) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Orders not found',
    });
  }
  return orders;
};

export const fetchSellers = async (
  supabase: SupabaseClient,
  seasonId: string,
) => {
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

  return sellers;
};

export const fetchCookies = async (
  supabase: SupabaseClient,
  seasonId: string,
) => {
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
  return cookies;
};
