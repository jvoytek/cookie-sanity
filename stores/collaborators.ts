import type { Database } from '@/types/supabase';
import type { SeasonCollaborator } from '@/types/types';

export const useCollaboratorsStore = defineStore('collaborators', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const collaborators = ref<SeasonCollaborator[]>([]);
  const activeCollaborator = ref<SeasonCollaborator | null>(null);
  const collaboratorDialogVisible = ref(false);

  /* Private Functions */
  const _supabaseFetchCollaborators = async (seasonId: number) => {
    return await supabaseClient
      .from('season_collaborators')
      .select(`*, profiles:profile_id(display_name)`)
      .eq('season_id', seasonId)
      .order('created_at', { ascending: false });
  };

  /* Actions */
  const fetchCollaborators = async (seasonId?: number) => {
    try {
      const targetSeasonId = seasonId ?? seasonsStore.currentSeason?.id;
      if (!targetSeasonId) return;

      const { data, error } = await _supabaseFetchCollaborators(targetSeasonId);
      if (error) throw error;
      collaborators.value = (data ?? []) as SeasonCollaborator[];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const addCollaborator = async (
    profileId: string,
    seasonId: number,
    permissions: {
      can_view_booths: boolean;
      can_edit_booths: boolean;
      can_view_inventory_checks: boolean;
      can_edit_inventory_checks: boolean;
    },
    allAccess: boolean = true,
    children: number[] | null = null,
  ) => {
    try {
      if (!user.value?.id) return;

      const { data, error } = await supabaseClient
        .from('season_collaborators')
        .insert({
          season_id: seasonId,
          profile_id: profileId,
          invited_by: user.value.id,
          can_view_booths: permissions.can_view_booths,
          can_edit_booths: permissions.can_edit_booths,
          can_view_inventory_checks: permissions.can_view_inventory_checks,
          can_edit_inventory_checks: permissions.can_edit_inventory_checks,
          all_access: allAccess,
          children: children,
        })
        .select()
        .single();

      if (error) throw error;
      notificationHelpers.addSuccess('Collaborator added successfully');
      await fetchCollaborators(seasonId);
      return data;
    } catch (error) {
      notificationHelpers.addError(error as Error);
      return null;
    }
  };

  const updateCollaborator = async (
    collaboratorId: number,
    permissions: {
      can_view_booths: boolean;
      can_edit_booths: boolean;
      can_view_inventory_checks: boolean;
      can_edit_inventory_checks: boolean;
    },
    allAccess?: boolean,
    children?: number[] | null,
  ) => {
    try {
      const updateData: any = permissions;
      if (allAccess !== undefined) updateData.all_access = allAccess;
      if (children !== undefined) updateData.children = children;

      const { error } = await supabaseClient
        .from('season_collaborators')
        .update(updateData)
        .eq('id', collaboratorId);

      if (error) throw error;
      notificationHelpers.addSuccess('Collaborator updated successfully');
      await fetchCollaborators();
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteCollaborator = async (collaboratorId: number) => {
    try {
      const { error } = await supabaseClient
        .from('season_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      notificationHelpers.addSuccess('Collaborator removed successfully');
      await fetchCollaborators();
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const setActiveCollaborator = (collaborator: SeasonCollaborator | null) => {
    activeCollaborator.value = collaborator;
  };

  const showDialog = () => {
    collaboratorDialogVisible.value = true;
  };

  const hideDialog = () => {
    collaboratorDialogVisible.value = false;
    activeCollaborator.value = null;
  };

  return {
    collaborators,
    activeCollaborator,
    collaboratorDialogVisible,
    fetchCollaborators,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    setActiveCollaborator,
    showDialog,
    hideDialog,
  };
});
