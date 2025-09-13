import type { Database, Json } from "@/types/supabase";
import type { User } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useProfileStore = defineStore("profile", () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const toast = useToast();
  const seasonsStore = useSeasonsStore();
  const cookiesStore = useCookiesStore();
  const girlsStore = useGirlsStore();
  const ordersStore = useOrdersStore();

  /* State */
  const currentProfile = ref<User>();
  const display_name = ref<string>("");
  const currentSeasonId = ref<number>(-1);
  const appState = ref<Json>({});

  /* Computed */

  /* Private Functions */

  /* Actions */
  const fetchProfile = async () => {
    try {
      if (!user.value) return;
      const { data, error } = await supabaseClient
        .from("profiles")
        .select(`*`)
        .eq("id", user.value.id)
        .single();
      if (error) throw error;

      // Set state in profile store
      currentProfile.value = (data as User) ?? [];
      display_name.value = currentProfile.value?.display_name ?? "";
      appState.value = currentProfile.value?.state ?? {};
      currentSeasonId.value = currentProfile.value?.season ?? -1;

      // Trigger state update for other stores depending on profile
      await seasonsStore.fetchSeasons();
      await cookiesStore.fetchCookies();
      await girlsStore.fetchGirls();
      await ordersStore.fetchOrders();
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const updateProfile = async (silent: boolean = false) => {
    console.log(currentSeasonId.value);
    try {
      if (!user.value?.id) return;
      const updates = {
        id: user.value.id,
        display_name: display_name.value,
        state: appState.value,
        season: currentSeasonId.value,
      };

      const { error } = await supabaseClient.from("profiles").upsert(updates);

      if (error) throw error;
      if (silent == false) {
        toast.add({
          severity: "success",
          summary: "Successful",
          detail: "Profile Updated",
          life: 3000,
        });
      }
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const saveCurrentSeasonInProfile = async () => {
    console.log("Saving current season in profile", seasonsStore.currentSeason?.id);
    if (!seasonsStore.currentSeason?.id) return;
    currentSeasonId.value = seasonsStore.currentSeason.id;
    await updateProfile(true);
  };

  fetchProfile();

  return {
    currentProfile,
    display_name,
    appState,
    fetchProfile,
    updateProfile,
    saveCurrentSeasonInProfile,
  };
});
