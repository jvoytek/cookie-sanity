/**
 * Composable to guard routes that require a current season
 * Redirects to /settings if no season exists or is selected
 */
export const useSeasonGuard = () => {
  const seasonsStore = useSeasonsStore();
  const router = useRouter();

  const hasValidSeason = computed(() => {
    return seasonsStore.currentSeason?.id !== undefined;
  });

  const checkSeasonAndRedirect = async () => {
    // Wait a bit for stores to initialize if needed
    await nextTick();

    if (
      !hasValidSeason.value &&
      router.currentRoute.value.path !== '/settings'
    ) {
      await navigateTo('/settings');
      return false;
    }
    return true;
  };

  return {
    hasValidSeason,
    checkSeasonAndRedirect,
  };
};
