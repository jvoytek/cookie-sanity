/**
 * Global middleware to ensure a valid season exists before accessing pages
 * Redirects to /settings if no season is available
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for login, settings, and other excluded routes
  const excludedRoutes = ['/login', '/confirm', '/request', '/settings'];
  if (excludedRoutes.includes(to.path)) {
    return;
  }

  const seasonsStore = useSeasonsStore();
  const profileStore = useProfileStore();

  await profileStore.fetchProfile();

  // Only redirect if profile is loaded and we know there are no seasons
  // This prevents redirecting during initial load
  if (
    profileStore.currentProfile &&
    seasonsStore.allSeasons.length === 0 &&
    to.path !== '/settings'
  ) {
    return navigateTo('/settings');
  }
});
