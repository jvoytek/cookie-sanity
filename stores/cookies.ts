import type { Database } from "@/types/supabase";
import type { Cookie } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useCookiesStore = defineStore("cookies", () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const toast = useToast();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const ordersStore = useOrdersStore();
  const boothsStore = useBoothsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allCookies = ref<Cookie[]>([]);
  const seasonCookies = ref<Cookie[]>([]);

  /* Computed */

  const cookieFormFields = computed(() => {
    return allCookies.value.map((cookie) => ({
      $formkit: "primeInputNumber",
      name: cookie.abbreviation,
      label: cookie.name,
      validation: "integer",
      wrapperClass: "grid grid-cols-3 gap-4 items-center",
      labelClass: "col-span-1",
      innerClass: "col-span-2 mt-1 mb-1",
      class: "w-full",
    }));
  });

  const averageCookiePrice = computed(() => {
    if (allCookies.value.length === 0) return 0;
    const total = allCookies.value.reduce(
      (sum, cookie) => sum + (cookie.price || 0),
      0,
    );
    return total / allCookies.value.length;
  });

  const allCookiesWithInventoryTotals = computed(() => {
    const stock = [];
    if (!seasonsStore.currentSeason) return stock;
    allCookies.value.forEach((cookie) => {
      const onHand = ordersStore.sumOrdersByCookie(cookie.abbreviation);
      const requestedGirlTransactions =
        ordersStore.totalTransactionsByStatusAndCookie(
          "requested",
          "girl",
          cookie.abbreviation,
        );
      const pendingGirlTransactions =
        ordersStore.totalTransactionsByStatusAndCookie(
          "pending",
          "girl",
          cookie.abbreviation,
        );
      const pendingTroopTransactions =
        ordersStore.totalTransactionsByStatusAndCookie(
          "pending",
          "troop",
          cookie.abbreviation,
        );
      const pendingBoothQuantities =
        boothsStore.getPredictedBoothSaleQuantityByCookie(cookie.abbreviation);
      const afterPending = onHand + pendingGirlTransactions + pendingTroopTransactions + pendingBoothQuantities;
      const afterPendingIncludingRequests = afterPending + requestedGirlTransactions;
      const afterPendingStatus = _afterPendingStatusSeverity(afterPending);
      const cookieTotals = {
        ...cookie,
        onHand: onHand,
        requestedGirl: requestedGirlTransactions,
        pendingGirl: pendingGirlTransactions,
        pendingTroop: pendingTroopTransactions,
        pendingBooth: pendingBoothQuantities,
        afterPending: afterPending,
        afterPendingIncludingRequests: afterPendingIncludingRequests,
        afterPendingStatusSeverity: afterPendingStatus[0],
        afterPendingStatus: afterPendingStatus[1],
      };
      stock.push(cookieTotals);
    });
    return stock;
  });

  /* Private Functions */

  const _afterPendingStatusSeverity = (quantity: number) => {
    if (quantity > 50) {
      return ["success", "Good"];
    } else if (quantity > 20) {
      return ["warn", "Ok"];
    } else {
      return ["danger", "Low"];
    }
  };

  const _updateCookie = (cookie: Cookie) => {
    const index = allCookies.value.findIndex((c) => c.id === cookie.id);
    if (index !== -1) {
      allCookies.value[index] = cookie;
    }
    const seasonIndex = seasonCookies.value.findIndex(
      (c) => c.id === cookie.id,
    );
    if (seasonIndex !== -1) {
      seasonCookies.value[seasonIndex] = cookie;
    }
  };

  const _sortCookies = () => {
    allCookies.value.sort((a, b) => a.order - b.order);
  };

  const _addCookie = (cookie: Cookie) => {
    allCookies.value.push(cookie);
  };

  const _removeCookie = (cookie: Cookie) => {
    const index = allCookies.value.findIndex((c) => c.id === cookie.id);
    if (index !== -1) {
      allCookies.value.splice(index, 1);
    }
  };

  const _supabaseFetchCookies = async () => {
    return await supabaseClient
      .from("cookies")
      .select(`*`)
      .eq("profile", profileStore.currentProfile.id)
      .eq("season", seasonsStore.currentSeason.id)
      .order("order");
  };

  const _supabaseFetchSeasonCookies = async () => {
    return await supabaseClient
      .from("cookies")
      .select(`*`)
      .eq("profile", user.value.id)
      .eq("season", seasonsStore.settingsSelectedSeason.id)
      .order("order");
  };

  const _supabaseInsertCookie = async (cookie: Cookie) => {
    return await supabaseClient
      .from("cookies")
      .insert(cookie)
      .select()
      .single();
  };

  const _supabaseDeleteCookie = async (cookie: Cookie) => {
    return await supabaseClient.from("cookies").delete().eq("id", cookie.id);
  };

  const _supabaseUpdateAllCookies = async () => {
    return await supabaseClient.from("cookies").upsert(allCookies.value);
  };

  /* Actions */

  const fetchCookies = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;
      const { data, error } = await _supabaseFetchCookies();
      if (error) throw error;
      allCookies.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const fetchSeasonCookies = async () => {
    try {
      if (!seasonsStore.settingsSelectedSeason) return;

      const { data, error } = await _supabaseFetchSeasonCookies();
      if (error) throw error;
      seasonCookies.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertCookie = async (cookie: Cookie) => {
    if (!seasonsStore.settingsSelectedSeason) return;
    cookie.profile = user.value.id;
    cookie.season = seasonsStore.settingsSelectedSeason.id;
    try {
      const { data, error } = await _supabaseInsertCookie(cookie);

      if (error) throw error;

      _addCookie(data as Cookie);
      _sortCookies();
      notificationHelpers.addSuccess("Cookie Created");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertCookie = async (cookie: Cookie) => {
    try {
      const { error } = await supabaseClient.from("cookies").upsert(cookie);

      if (error) throw error;

      _updateCookie(cookie);
      _sortCookies();
      notificationHelpers.addSuccess("Cookie Updated");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteCookie = async (cookie: Cookie) => {
    try {
      const { error } = await _supabaseDeleteCookie(cookie);

      if (error) throw error;

      _removeCookie(cookie);
      reorderCookies(allCookies.value);
      notificationHelpers.addSuccess("Cookie Deleted");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const reorderCookies = async (cookies: Cookie[]) => {
    cookies.forEach((cookie, i) => {
      const index = allCookies.value.findIndex((c) => c.id === cookie.id);
      allCookies.value[index].order = i;
    });

    _sortCookies();

    try {
      const { error } = await _supabaseUpdateAllCookies();
      if (error) throw error;
      notificationHelpers.addSuccess("Cookies Reordered");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getCookieByAbbreviation = (abbreviation: string) => {
    return allCookies.value.find(
      (cookie) => cookie.abbreviation === abbreviation,
    );
  };

  return {
    allCookies,
    allCookiesWithInventoryTotals,
    seasonCookies,
    cookieFormFields,
    averageCookiePrice,
    fetchSeasonCookies,
    fetchCookies,
    getCookieByAbbreviation,
    insertCookie,
    upsertCookie,
    deleteCookie,
    reorderCookies,
  };
});
