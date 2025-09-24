import type { Database } from "@/types/supabase";
import type { Season } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useSeasonsStore = defineStore("seasons", () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const toast = useToast();
  const profileStore = useProfileStore();

  /* State */
  const allSeasons = ref<Season[]>([]);
  const currentSeason = ref<Season>();
  const settingsSelectedSeason = ref<Season>();

  /* Private Functions */

  /* Actions */

  const fetchSeasons = async () => {
    try {
      if (!profileStore.currentProfile?.id) return;
      const { data, error } = await supabaseClient
        .from("seasons")
        .select(`*`)
        .eq("profile", profileStore.currentProfile.id)
        .order("year");
      if (error) throw error;
      allSeasons.value = data ?? [];

      if (profileStore.currentProfile.season) {
        const index = allSeasons.value.findIndex(
          (c) => c.id === profileStore.currentProfile.season,
        );
        currentSeason.value = allSeasons.value[index];
      } else {
        currentSeason.value = allSeasons.value[0];
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

  const getCurrentSeason = async (): Promise<Season> => {
    if (currentSeason.value.id == -1) {
      await profileStore.fetchProfile();
      if (!allSeasons) {
        await fetchSeasons();
      }
      console.log("should be after fetching profile, etc", currentSeason.value);
      return currentSeason.value;
    } else {
      return currentSeason.value;
    }
  };

  const getSeasonName = (season: Season | null) => {
    if (!season) return "loading...";
    return (
      season.troop_number +
      "-" +
      new Date(season.year).toLocaleDateString("en-US", {
        year: "numeric",
        timeZone: "UTC",
      })
    );
  };

  const insertSeason = async (season: Season) => {
    season.profile = user.value.id;
    try {
      const { error } = await supabaseClient
        .from("seasons")
        .insert(season)
        .select()
        .single();

      if (error) throw error;

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Season Created",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
    }
  };

  const upsertSeason = async (season: Season) => {
    try {
      const { error } = await supabaseClient.from("seasons").upsert(season);

      if (error) throw error;

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Product Updated",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: error.message,
        life: 3000,
      });
    }
  };

  return {
    fetchSeasons,
    allSeasons,
    currentSeason,
    settingsSelectedSeason,
    getCurrentSeason,
    getSeasonName,
    insertSeason,
    upsertSeason,
  };
});
