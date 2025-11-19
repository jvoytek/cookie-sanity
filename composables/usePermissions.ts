import type { PermissionLevel, Girl } from '@/types/types';

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

  // Get permission level for a specific seller
  const getSellerPermission = (sellerId: number): PermissionLevel => {
    if (isSeasonOwner.value) return 'edit';
    if (!currentCollaborator.value) return 'none';
    return collaboratorsStore.getSellerPermission(
      currentCollaborator.value.id,
      sellerId,
    );
  };

  // Check if user can view a specific seller
  const canViewSeller = (sellerId: number): boolean => {
    if (isSeasonOwner.value) return true;
    const permission = getSellerPermission(sellerId);
    return permission !== 'none';
  };

  // Check if user can edit a specific seller
  const canEditSeller = (sellerId: number): boolean => {
    if (isSeasonOwner.value) return true;
    const permission = getSellerPermission(sellerId);
    return permission === 'edit';
  };

  // Check if user can make transaction requests for a specific seller
  const canRequestForSeller = (sellerId: number): boolean => {
    if (isSeasonOwner.value) return true;
    const permission = getSellerPermission(sellerId);
    return permission === 'request' || permission === 'edit';
  };

  // Filter girls list based on permissions
  const filterGirlsByPermission = (girls: Girl[]): Girl[] => {
    if (isSeasonOwner.value) return girls;
    return girls.filter((girl) => canViewSeller(girl.id));
  };

  // Check if user can create new girls
  const canCreateGirls = computed(() => {
    return isSeasonOwner.value;
  });

  // Check if user can create new cookies
  const canCreateCookies = computed(() => {
    return isSeasonOwner.value;
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
    getSellerPermission,
    canViewSeller,
    canEditSeller,
    canRequestForSeller,
    filterGirlsByPermission,
    canCreateGirls,
    canCreateCookies,
    canDeleteSeason,
    canManageCollaborators,
  };
};
