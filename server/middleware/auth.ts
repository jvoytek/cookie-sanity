import { serverSupabaseUser } from '#supabase/server';

export default defineEventHandler(async (event) => {
  if (!event.path.startsWith('/api')) {
    return; // Skip middleware for pages, assets, and SSR
  }

  const unprotectedRoutes = ['/api/public-data'];
  if (unprotectedRoutes.includes(event.path)) {
    return;
  }

  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
});
