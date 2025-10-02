import type { Database } from '@/types/supabase';
import type { SCOrder2025, Upload } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useUploadsStore = defineStore('uploads', () => {
  const supabaseClient = useSupabaseClient<Database>();

  const ordersStore = useTransactionsStore();
  const profileStore = useProfileStore();

  /* State */

  /* Computed */

  /* Private Functions */

  /* Actions */

  const insertUpload = async (jsonData: SCOrder2025[]): Promise<Upload> => {
    if (
      !profileStore.currentProfile?.season ||
      !profileStore.currentProfile?.id
    )
      throw new Error('Profile not found');
    console.log(profileStore.currentProfile.season);
    const upload = {
      profile: profileStore.currentProfile.id,
      season: profileStore.currentProfile.season ?? undefined,
      data: jsonData,
    };
    const { data, error } = await supabaseClient
      .from('uploads')
      .insert(upload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  };

  const getOnlyGirlOrders = (jsonData: SCOrder2025[]) => {
    const girlData = jsonData.filter(
      (order) => order['TO'].indexOf && order['TO'].indexOf(' ') >= 0,
    );
    return girlData
      .map(ordersStore.convertSCOrderToNewTransaction)
      .filter((order) => order?.to !== 0);
  };

  return { insertUpload, getOnlyGirlOrders };
});
