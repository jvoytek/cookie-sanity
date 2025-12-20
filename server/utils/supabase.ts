import type { SupabaseClient } from '@supabase/supabase-js';
import type { User } from '~/types/types';

export const fetchAuditSession = async (
  supabase: SupabaseClient,
  auditSessionId: string,
  user: User | null,
) => {
  const { data: auditSession, error: auditError } = await supabase
    .from('audit_sessions')
    .select('*')
    .eq('id', auditSessionId)
    .eq('profile', user?.id)
    .single();

  if (auditError || !auditSession) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Audit session not found',
    });
  }
  return auditSession;
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
