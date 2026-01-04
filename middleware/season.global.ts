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

  // Access supabase directly in middleware to avoid hydration mismatches
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  // If no user is logged in, skip the middleware
  if (!user.value) {
    return;
  }

  //fetch the user profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single();

  if (profileError || !profileData) {
    // If there's an error fetching the profile, skip the middleware
    return;
  }

  // fetch seasons for the profile
  const { data: seasonsData, error: seasonsError } = await supabase
    .from('seasons')
    .select('*')
    .eq('profile', profileData.id);

  if (seasonsError) {
    // If there's an error fetching seasons, skip the middleware
    return;
  }

  // Only redirect if profile is loaded and we know there are no seasons
  // This prevents redirecting during initial load
  if (seasonsData.length === 0 && to.path !== '/settings') {
    return navigateTo('/settings');
  }
});
