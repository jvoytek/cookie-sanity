import type { Database } from '@/types/supabase';
import type { Adult } from '@/types/types';

export const useAdultsStore = defineStore('adults', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  const allAdults = ref<Adult[]>([]);

  const _updateAdult = (adult: Adult) => {
    const index = allAdults.value.findIndex((a) => a.id === adult.id);
    if (index !== -1) {
      allAdults.value[index] = adult;
    }
  };

  const _sortAdults = () => {
    allAdults.value.sort((a, b) =>
      a.first_name < b.first_name ? -1 : a.first_name > b.first_name ? 1 : 0,
    );
  };

  const _addAdult = (adult: Adult) => {
    allAdults.value.push(adult);
  };

  const _removeAdult = (adult: Adult) => {
    const index = allAdults.value.findIndex((a) => a.id === adult.id);
    if (index !== -1) {
      allAdults.value.splice(index, 1);
    }
  };

  const _supabaseFetchAdults = async () => {
    if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
      return { data: [], error: { message: 'Profile or season not found' } };

    return await supabaseClient
      .from('adults')
      .select(`*`)
      .eq('season', seasonsStore.currentSeason.id)
      .order('first_name');
  };

  const _supabaseInsertAdult = async (adult: Adult) => {
    return await supabaseClient.from('adults').insert(adult).select().single();
  };

  const _supabaseDeleteAdult = async (adult: Adult) => {
    return await supabaseClient.from('adults').delete().eq('id', adult.id);
  };

  const fetchAdults = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await _supabaseFetchAdults();
      if (error) throw error;
      allAdults.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertAdult = async (adult: Adult) => {
    if (!user.value?.id) {
      notificationHelpers.addError(new Error('No user found'));
      return;
    }

    adult.profile = user.value.id;
    adult.sellers = adult.sellers ?? [];
    try {
      const { data, error } = await _supabaseInsertAdult(adult);

      if (error) throw error;

      _addAdult(data as Adult);
      _sortAdults();
      notificationHelpers.addSuccess('Adult Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertAdult = async (adult: Adult) => {
    adult.sellers = adult.sellers ?? [];
    try {
      const { error } = await supabaseClient.from('adults').upsert(adult);

      if (error) throw error;

      _updateAdult(adult);
      _sortAdults();
      notificationHelpers.addSuccess('Adult Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteAdult = async (adult: Adult) => {
    try {
      const { error } = await _supabaseDeleteAdult(adult);

      if (error) throw error;

      _removeAdult(adult);
      notificationHelpers.addSuccess('Adult Deleted');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const removeGirlFromAdults = async (girlId: number) => {
    const adultsToUpdate = allAdults.value.filter((adult) =>
      adult.sellers?.includes(girlId),
    );

    if (adultsToUpdate.length === 0) return;

    try {
      await Promise.all(
        adultsToUpdate.map(async (adult) => {
          const updatedAdult = {
            ...adult,
            sellers: (adult.sellers ?? []).filter((id) => id !== girlId),
          };
          const { error } = await supabaseClient
            .from('adults')
            .upsert(updatedAdult);
          if (error) throw error;
          _updateAdult(updatedAdult);
        }),
      );
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getAdultsBySellerId = (sellerId: number) => {
    return allAdults.value.filter((adult) =>
      (adult.sellers ?? []).includes(sellerId),
    );
  };

  const getAdultNamesByIdList = (adultIds: number[]): string => {
    const names = allAdults.value
      .filter((adult) => adultIds.includes(adult.id))
      .map((adult) => `${adult.first_name} ${adult.last_name}`);
    return names.join(', ');
  };

  return {
    fetchAdults,
    allAdults,
    insertAdult,
    upsertAdult,
    deleteAdult,
    removeGirlFromAdults,
    getAdultsBySellerId,
    getAdultNamesByIdList,
  };
});
