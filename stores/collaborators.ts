import type { Database } from '@/types/supabase';
import type {
  SeasonCollaborator,
  SellerPermission,
  PermissionLevel,
} from '@/types/types';

export const useCollaboratorsStore = defineStore('collaborators', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const collaborators = ref<SeasonCollaborator[]>([]);
  const sellerPermissions = ref<SellerPermission[]>([]);
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

  const _supabaseFetchSellerPermissions = async (collaboratorId: number) => {
    return await supabaseClient
      .from('seller_permissions')
      .select('*')
      .eq('collaborator_id', collaboratorId);
  };

  const _supabaseFetchAllSellerPermissions = async (seasonId: number) => {
    return await supabaseClient
      .from('seller_permissions')
      .select(
        `*, 
        season_collaborators!inner(season_id, profile_id)`,
      )
      .eq('season_collaborators.season_id', seasonId);
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

  const fetchSellerPermissions = async (seasonId?: number) => {
    try {
      const targetSeasonId = seasonId ?? seasonsStore.currentSeason?.id;
      if (!targetSeasonId) return;

      const { data, error } =
        await _supabaseFetchAllSellerPermissions(targetSeasonId);
      if (error) throw error;
      sellerPermissions.value = (data ?? []) as SellerPermission[];
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
  ) => {
    try {
      const { error } = await supabaseClient
        .from('season_collaborators')
        .update(permissions)
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

  const setSellerPermission = async (
    collaboratorId: number,
    sellerId: number,
    permissionLevel: PermissionLevel,
  ) => {
    try {
      const { error } = await supabaseClient.from('seller_permissions').upsert({
        collaborator_id: collaboratorId,
        seller_id: sellerId,
        permission_level: permissionLevel,
      });

      if (error) throw error;
      await fetchSellerPermissions();
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getSellerPermission = (
    collaboratorId: number,
    sellerId: number,
  ): PermissionLevel => {
    const permission = sellerPermissions.value.find(
      (p) => p.collaborator_id === collaboratorId && p.seller_id === sellerId,
    );
    return (permission?.permission_level as PermissionLevel) ?? 'none';
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
    sellerPermissions,
    activeCollaborator,
    collaboratorDialogVisible,
    fetchCollaborators,
    fetchSellerPermissions,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    setSellerPermission,
    getSellerPermission,
    setActiveCollaborator,
    showDialog,
    hideDialog,
  };
});
