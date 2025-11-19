import type { Database } from '@/types/supabase';
import type { User } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useProfileStore = defineStore('profile', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const seasonsStore = useSeasonsStore();
  const cookiesStore = useCookiesStore();
  const girlsStore = useGirlsStore();
  const ordersStore = useTransactionsStore();
  const accountsStore = useAccountsStore();
  const boothsStore = useBoothsStore();
  const inventoryChecksStore = useInventoryChecksStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const currentProfile = ref<User>();
  const display_name = ref<string>('');
  const currentSeasonId = ref<number>(-1);

  /* Computed */

  /* Private Functions */

  const _supabaseFetchProfile = async () => {
    if (!user.value)
      return { data: null, error: { message: 'User not found' } };
    return await supabaseClient
      .from('profiles')
      .select(`*`)
      .eq('id', user.value.id)
      .single();
  };

  /* Actions */
  const fetchProfile = async () => {
    try {
      if (!user.value) return;
      const { data, error } = await _supabaseFetchProfile();
      if (error) throw error;

      // Set state in profile store
      currentProfile.value = (data as User) ?? [];
      display_name.value = currentProfile.value?.display_name ?? '';
      currentSeasonId.value = currentProfile.value?.season ?? -1;

      // Trigger state update for other stores depending on profile
      await seasonsStore.fetchSeasons();
      
      // Fetch collaborators data for the current season if it exists
      if (seasonsStore.currentSeason?.id) {
        const collaboratorsStore = useCollaboratorsStore();
        await collaboratorsStore.fetchCollaborators();
        await collaboratorsStore.fetchSellerPermissions();
      }
      
      await cookiesStore.fetchCookies();
      await girlsStore.fetchGirls();
      await ordersStore.fetchTransactions();
      await accountsStore.fetchPayments();
      await boothsStore.fetchBoothSales();
      await inventoryChecksStore.fetchInventoryChecks();
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const updateProfile = async (silent: boolean = false) => {
    try {
      if (!user.value?.id) return;
      const updates = {
        id: user.value.id,
        display_name: display_name.value,
        season: currentSeasonId.value,
      };

      const { error } = await supabaseClient.from('profiles').upsert(updates);

      if (error) throw error;
      if (silent == false) {
        notificationHelpers.addSuccess('Profile Updated');
      }
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const saveCurrentSeasonInProfile = async () => {
    if (!seasonsStore.currentSeason?.id) return;
    currentSeasonId.value = seasonsStore.currentSeason.id;
    await updateProfile(true);
  };

  fetchProfile();

  return {
    currentProfile,
    display_name,
    fetchProfile,
    updateProfile,
    saveCurrentSeasonInProfile,
  };
});
