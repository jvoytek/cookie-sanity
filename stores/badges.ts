import type { Database } from '@/types/supabase';
import type { Badge } from '@/types/types';

export const useBadgesStore = defineStore('badges', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const girlsStore = useGirlsStore();
  const notificationHelpers = useNotificationHelpers();

  const allBadges = ref<Badge[]>([]);

  const badgeOptions = computed(() =>
    allBadges.value.map((badge) => ({
      label: badge.name,
      value: badge.id,
    })),
  );

  const _updateBadge = (badge: Badge) => {
    const index = allBadges.value.findIndex((b) => b.id === badge.id);
    if (index !== -1) {
      allBadges.value[index] = badge;
    }
  };

  const _addBadge = (badge: Badge) => {
    allBadges.value.push(badge);
  };

  const _removeBadge = (badge: Badge) => {
    const index = allBadges.value.findIndex((b) => b.id === badge.id);
    if (index !== -1) {
      allBadges.value.splice(index, 1);
    }
  };

  const _sortBadges = () => {
    allBadges.value.sort((a, b) =>
      a.program_level < b.program_level
        ? -1
        : a.program_level > b.program_level
          ? 1
          : a.name < b.name
            ? -1
            : a.name > b.name
              ? 1
              : 0,
    );
  };

  const fetchBadges = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await supabaseClient
        .from('badges')
        .select('*')
        .eq('season', seasonsStore.currentSeason.id)
        .order('program_level')
        .order('name');

      if (error) throw error;
      allBadges.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertBadge = async (
    badge: Omit<Badge, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    if (!user.value?.id) {
      notificationHelpers.addError(new Error('No user found'));
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('badges')
        .insert({
          ...badge,
          profile: user.value.id,
        })
        .select()
        .single();

      if (error) throw error;

      _addBadge(data as Badge);
      _sortBadges();
      notificationHelpers.addSuccess('Badge Created');
      return data as Badge;
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertBadge = async (badge: Badge) => {
    try {
      const badgeToSave = {
        ...badge,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseClient
        .from('badges')
        .upsert(badgeToSave)
        .select()
        .single();

      if (error) throw error;

      _updateBadge(data as Badge);
      _sortBadges();
      notificationHelpers.addSuccess('Badge Updated');
      return data as Badge;
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteBadge = async (badge: Badge) => {
    try {
      const { error } = await supabaseClient
        .from('badges')
        .delete()
        .eq('id', badge.id);

      if (error) throw error;

      _removeBadge(badge);
      girlsStore.allGirls.forEach((girl) => {
        girl.badges_earned = (girl.badges_earned ?? []).filter(
          (badgeId) => badgeId !== badge.id,
        );
        girl.badges_received = (girl.badges_received ?? []).filter(
          (badgeId) => badgeId !== badge.id,
        );
      });
      notificationHelpers.addSuccess('Badge Deleted');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  return {
    allBadges,
    badgeOptions,
    fetchBadges,
    insertBadge,
    upsertBadge,
    deleteBadge,
  };
});
