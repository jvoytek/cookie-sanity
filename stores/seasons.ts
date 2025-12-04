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
  const seasonDialogVisible = ref(false);
  const deleteSeasonDialogVisible = ref(false);
  const activeSeason = ref<Season | null>(null);
  const activeSeasonOriginal = ref<Season | null>(null);

  /* Private Functions */

  const _supabaseFetchSeasons = async () => {
    if (!profileStore.currentProfile?.id) {
      return { data: [] as Season[], error: { message: 'No profile found' } };
    }

    // Fetch both owned seasons and collaborated seasons
    const ownedSeasonsPromise = supabaseClient
      .from('seasons')
      .select(`*`)
      .eq('profile', profileStore.currentProfile.id);

    const collaboratedSeasonsPromise = supabaseClient.from('seasons').select(
      `*, 
        season_collaborators!inner(profile_id)`,
    );

    const [ownedResult, collaboratedResult] = await Promise.all([
      ownedSeasonsPromise,
      collaboratedSeasonsPromise,
    ]);

    if (ownedResult.error) return { data: [], error: ownedResult.error };
    if (collaboratedResult.error)
      return { data: ownedResult.data ?? [], error: null };

    // Combine and deduplicate seasons
    const allSeasonsMap = new Map<number, Season>();
    (ownedResult.data ?? []).forEach((season) => {
      allSeasonsMap.set(season.id, season);
    });
    (collaboratedResult.data ?? []).forEach((season) => {
      if (!allSeasonsMap.has(season.id)) {
        allSeasonsMap.set(season.id, season);
      }
    });

    const combinedSeasons = Array.from(allSeasonsMap.values()).sort(
      (a, b) => b.year - a.year,
    );

    return { data: combinedSeasons, error: null };
  };

  const _supabaseInsertSeason = async (season: Season) => {
    // Exclude id and created_at fields to let the database auto-generate them
    const { id, created_at, ...seasonInsert } = season;
    return await supabaseClient.from('seasons').insert(seasonInsert);
  };

  const _updateSeason = (season: Season) => {
    const index = allSeasons.value.findIndex((o) => o.id === season.id);
    if (index !== -1) {
      allSeasons.value[index] = season;
    }
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
    return season.troop_number + '-' + season.year;
  };

  const insertSeason = async (season: Season) => {
    if (!user.value?.id) return;
    season.profile = user.value.id;
    try {
      const { error } = await _supabaseInsertSeason(season);
      fetchSeasons();
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

  const setActiveSeason = (season: Season | null) => {
    activeSeason.value = season;
    // Create a deep copy of the original season for change tracking
    activeSeasonOriginal.value = season
      ? JSON.parse(JSON.stringify(season))
      : null;
  };

  const resetActiveSeason = () => {
    if (activeSeasonOriginal.value && activeSeason.value) {
      // Revert changes by resetting to the original deep copy
      _updateSeason(activeSeasonOriginal.value);
    }
    // Clear active season
    activeSeason.value = null;
    activeSeasonOriginal.value = null;
  };

  const hideDialog = () => {
    seasonDialogVisible.value = false;
  };
  const showDialog = () => {
    seasonDialogVisible.value = true;
  };

  const createNewSeason = () => {
    // Create a new season object for form binding
    // TypeScript cast is safe here because:
    // 1. FormKit will update this object with user input (troop_number, year)
    // 2. insertSeason will add the profile field
    // 3. _supabaseInsertSeason will exclude id and created_at before database insert
    const newSeason = {
      troop_number: '',
      year: new Date().getFullYear(),
    } as Season;
    activeSeason.value = newSeason;
    activeSeasonOriginal.value = null; // No original for new seasons
    showDialog();
  };

  const cancelEditSeason = () => {
    if (activeSeason.value?.id) {
      resetActiveSeason();
    } else {
      // Clear active season if creating a new one
      setActiveSeason(null);
    }
    hideDialog();
  };

  const editSeason = (season: Season) => {
    setActiveSeason(season);
    showDialog();
  };

  const confirmDeleteSeason = (season: Season) => {
    setActiveSeason(season);
    deleteSeasonDialogVisible.value = true;
  };

  const deleteSeason = async () => {
    if (!activeSeason.value?.id) return;
    try {
      const { error } = await supabaseClient
        .from('seasons')
        .delete()
        .eq('id', activeSeason.value.id);

      if (error) throw error;
      notificationHelpers.addSuccess('Season Deleted');
      deleteSeasonDialogVisible.value = false;
      activeSeason.value = null;
      await fetchSeasons();
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const isSeasonOwner = (season: Season | null | undefined): boolean => {
    if (!season || !user.value?.id) return false;
    return season.profile === user.value.id;
  };

  const isCurrentSeasonOwner = (): boolean => {
    return isSeasonOwner(currentSeason.value);
  };

  return {
    fetchSeasons,
    allSeasons,
    currentSeason,
    settingsSelectedSeason,
    seasonDialogVisible,
    deleteSeasonDialogVisible,
    activeSeason,
    getCurrentSeason,
    getSeasonName,
    insertSeason,
    upsertSeason,
    setActiveSeason,
    resetActiveSeason,
    hideDialog,
    showDialog,
    createNewSeason,
    cancelEditSeason,
    editSeason,
    confirmDeleteSeason,
    deleteSeason,
    isSeasonOwner,
    isCurrentSeasonOwner,
  };
});
