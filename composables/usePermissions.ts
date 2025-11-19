export const usePermissions = () => {
  const user = useSupabaseUser();
  const seasonsStore = useSeasonsStore();
  const collaboratorsStore = useCollaboratorsStore();

  // Check if the current user is the season owner
  const isSeasonOwner = computed(() => {
    return seasonsStore.isCurrentSeasonOwner();
  });

  // Check if the current user is a collaborator
  const isCollaborator = computed(() => {
    if (!user.value?.id || !seasonsStore.currentSeason?.id) return false;
    return collaboratorsStore.collaborators.some(
      (c) => c.profile_id === user.value.id,
    );
  });

  // Get the current user's collaborator record
  const currentCollaborator = computed(() => {
    if (!user.value?.id) return null;
    return (
      collaboratorsStore.collaborators.find(
        (c) => c.profile_id === user.value.id,
      ) ?? null
    );
  });

  // Check if user can view booths
  const canViewBooths = computed(() => {
    if (isSeasonOwner.value) return true;
    return currentCollaborator.value?.can_view_booths ?? false;
  });

  // Check if user can edit booths
  const canEditBooths = computed(() => {
    if (isSeasonOwner.value) return true;
    return currentCollaborator.value?.can_edit_booths ?? false;
  });

  // Check if user can view inventory checks
  const canViewInventoryChecks = computed(() => {
    if (isSeasonOwner.value) return true;
    return currentCollaborator.value?.can_view_inventory_checks ?? false;
  });

  // Check if user can edit inventory checks
  const canEditInventoryChecks = computed(() => {
    if (isSeasonOwner.value) return true;
    return currentCollaborator.value?.can_edit_inventory_checks ?? false;
  });

  // Check if user can delete the season
  const canDeleteSeason = computed(() => {
    return isSeasonOwner.value;
  });

  // Check if user can manage collaborators
  const canManageCollaborators = computed(() => {
    return isSeasonOwner.value;
  });

  return {
    isSeasonOwner,
    isCollaborator,
    currentCollaborator,
    canViewBooths,
    canEditBooths,
    canViewInventoryChecks,
    canEditInventoryChecks,
    canDeleteSeason,
    canManageCollaborators,
  };
};
