import type { Ref } from 'vue';

/**
 * Composable for checking user roles in the current season
 * Provides helpers to determine if the current user is:
 * - A season owner
 * - A season collaborator (with all_access)
 * - A parent (collaborator without all_access but with children)
 */
export const useUserRole = () => {
  const user = useSupabaseUser();
  const seasonsStore = useSeasonsStore();
  const collaboratorsStore = useCollaboratorsStore();

  const isSeasonOwner = computed(() => {
    return seasonsStore.isCurrentSeasonOwner();
  });

  const currentCollaborator = computed(() => {
    if (!user.value?.id) return null;
    return collaboratorsStore.collaborators.find(
      (c) => c.profile_id === user.value?.id,
    );
  });

  const isSeasonCollaborator = computed(() => {
    return currentCollaborator.value?.all_access === true;
  });

  const isParent = computed(() => {
    const collab = currentCollaborator.value;
    return (
      collab &&
      collab.all_access === false &&
      collab.children &&
      collab.children.length > 0
    );
  });

  const parentChildren = computed(() => {
    if (!isParent.value || !currentCollaborator.value?.children) {
      return [];
    }
    return currentCollaborator.value.children;
  });

  // Selected child for parent view
  const selectedChildId: Ref<number | null> = ref(null);

  // Initialize selected child when parent children change
  watch(
    parentChildren,
    (children) => {
      if (children.length > 0 && !selectedChildId.value) {
        selectedChildId.value = children[0];
      } else if (children.length === 0) {
        selectedChildId.value = null;
      }
    },
    { immediate: true },
  );

  const setSelectedChild = (childId: number) => {
    selectedChildId.value = childId;
  };

  return {
    isSeasonOwner,
    isSeasonCollaborator,
    isParent,
    parentChildren,
    selectedChildId,
    setSelectedChild,
    currentCollaborator,
  };
};
