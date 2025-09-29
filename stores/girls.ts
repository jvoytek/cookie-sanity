import type { Database } from "@/types/supabase";
import type { Girl } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useGirlsStore = defineStore("girls", () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allGirls = ref<Girl[]>([]);

  /* Computed */

  const girlOptions = computed(() => {
    const girlOptions = allGirls.value.map((girl) => ({
      label: _getGirlDisplayName(girl),
      value: girl.id,
    }));
    return girlOptions;
  });

  /* Private Functions */

  const _getGirlDisplayName = (girl: Girl) => {
    return girl.first_name + " " + girl.last_name[0] + ".";
  };

  const _updateGirl = (girl: Girl) => {
    const index = allGirls.value.findIndex((c) => c.id === girl.id);
    if (index !== -1) {
      allGirls.value[index] = girl;
    }
  };

  const _sortGirls = () => {
    allGirls.value.sort((a, b) =>
      a.first_name < b.first_name ? -1 : a.first_name > b.first_name ? 1 : 0,
    );
  };

  const _addGirl = (girl: Girl) => {
    allGirls.value.push(girl);
  };

  const _removeGirl = (girl: Girl) => {
    const index = allGirls.value.findIndex((c) => c.id === girl.id);
    if (index !== -1) {
      allGirls.value.splice(index, 1);
    }
  };

  const _supabaseFetchGirls = async () => {
    return await supabaseClient
      .from("sellers")
      .select(`*`)
      .eq("profile", profileStore.currentProfile.id)
      .eq("season", seasonsStore.currentSeason.id)
      .order("first_name");
  };

  const _supabaseInsertGirl = async (girl: Girl) => {
    return await supabaseClient.from("sellers").insert(girl).select().single();
  };

  const _supabaseDeleteGirl = async (girl: Girl) => {
    return await supabaseClient.from("sellers").delete().eq("id", girl.id);
  };

  function _findIndexById(id: number) {
    let index = -1;

    for (let i = 0; i < allGirls.value.length; i++) {
      if (allGirls.value[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  /* Actions */

  const fetchGirls = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await _supabaseFetchGirls();
      if (error) throw error;
      allGirls.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertGirl = async (girl: Girl) => {
    girl.profile = user.value.id;
    try {
      const { data, error } = await _supabaseInsertGirl(girl);

      if (error) throw error;

      _addGirl(data as Girl);
      _sortGirls();
      notificationHelpers.addSuccess("Girl Created");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertGirl = async (girl: Girl) => {
    try {
      const { error } = await supabaseClient.from("sellers").upsert(girl);

      if (error) throw error;

      _updateGirl(girl);
      _sortGirls();
      notificationHelpers.addSuccess("Girl Updated");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteGirl = async (girl: Girl) => {
    try {
      const { error } = await _supabaseDeleteGirl(girl);

      if (error) throw error;

      _removeGirl(girl);
      notificationHelpers.addSuccess("Girl Deleted");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getGirlById = (id: number) => {
    return allGirls.value ? allGirls.value[_findIndexById(id)] : null;
  };

  const getGirlNameById = (id: number) => {
    const theGirl = getGirlById(id);
    if (theGirl) {
      return _getGirlDisplayName(theGirl);
    }
    return "No girl found";
  };

  const getGirlNamesByIdList = (idList: number[]) => {
    return idList.map((id) => getGirlNameById(id)).join(", ");
  };

  return {
    fetchGirls,
    allGirls,
    girlOptions,
    insertGirl,
    upsertGirl,
    deleteGirl,
    getGirlNameById,
    getGirlNamesByIdList,
  };
});
