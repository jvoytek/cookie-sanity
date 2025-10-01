import type { Database } from '@/types/supabase';
import type { Season } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useSeasonsStore = defineStore('seasons', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allSeasons = ref<Season[]>([]);
  const currentSeason = ref<Season>();
  const settingsSelectedSeason = ref<Season>();

  /* Private Functions */

  const _supabaseFetchSeasons = async () => {
    if (!profileStore.currentProfile?.id) {
      return { data: [] as Season[], error: { message: 'No profile found' } };
    }

    return await supabaseClient
      .from('seasons')
      .select(`*`)
      .eq('profile', profileStore.currentProfile.id)
      .order('year');
  };

  const _supabaseInsertSeason = async (season: Season) => {
    return await supabaseClient
      .from('seasons')
      .insert(season)
      .select()
      .single();
  };

  /* Actions */

  const fetchSeasons = async () => {
    try {
      if (!profileStore.currentProfile?.id) return;
      const { data, error } = await _supabaseFetchSeasons();
      if (error) throw error;
      allSeasons.value = data ?? [];

      if (profileStore.currentProfile.season) {
        const index = allSeasons.value.findIndex(
          (c) => c.id === profileStore.currentProfile?.season,
        );
        currentSeason.value = allSeasons.value[index];
      } else {
        currentSeason.value = allSeasons.value[0];
      }
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getCurrentSeason = async () => {
    if (currentSeason.value?.id === -1) {
      await profileStore.fetchProfile();
      if (!allSeasons) {
        await fetchSeasons();
      }
      return currentSeason.value;
    } else {
      return currentSeason.value;
    }
  };

  const getSeasonName = (season: Season | null) => {
    if (!season) return 'loading...';
    return (
      season.troop_number +
      '-' +
      new Date(season.year).toLocaleDateString('en-US', {
        year: 'numeric',
        timeZone: 'UTC',
      })
    );
  };

  const insertSeason = async (season: Season) => {
    if (!user.value?.id) return;
    season.profile = user.value.id;
    try {
      const { error } = await _supabaseInsertSeason(season);

      if (error) throw error;
      notificationHelpers.addSuccess('Season Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertSeason = async (season: Season) => {
    try {
      const { error } = await supabaseClient.from('seasons').upsert(season);

      if (error) throw error;
      notificationHelpers.addSuccess('Season Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  return {
    fetchSeasons,
    allSeasons,
    currentSeason,
    settingsSelectedSeason,
    getCurrentSeason,
    getSeasonName,
    insertSeason,
    upsertSeason,
  };
});
