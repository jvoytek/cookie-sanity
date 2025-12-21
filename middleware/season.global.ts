/**
 * Global middleware to ensure a valid season exists before accessing pages
 * Redirects to /settings if no season is available
 */
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser();
  const seasonsStore = useSeasonsStore();

  // Skip middleware for login, settings, and other excluded routes
  const excludedRoutes = ['/login', '/confirm', '/request', '/settings'];
  if (excludedRoutes.includes(to.path)) {
    return;
  }

  // Only run for authenticated users
  if (!user.value) {
    return;
  }

  // Check if we have a valid current season
  if (!seasonsStore.currentSeason?.id) {
    return navigateTo('/settings');
  }
});
