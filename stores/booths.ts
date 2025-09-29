import type { Database } from "@/types/supabase";
import type { BoothSale, Cookie } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useBoothsStore = defineStore("booths", () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const cookiesStore = useCookiesStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allBoothSales = ref<BoothSale[]>([]);
  const boothDialogFormSchema = reactive([]);
  const activeBoothSale = ref<BoothSale>({});
  const boothDialogVisible = ref(false);

  /* Computed */

  const upcomingBoothSales = computed(() => {
    const today = new Date().toISOString().split("T")[0];
    return allBoothSales.value.filter((booth) => booth.sale_date >= today);
  });

  const boothSalesUsingTroopInventory = computed(() => {
    return allBoothSales.value.filter(
      (booth) => booth.inventory_type === "troop",
    );
  });

  const predictedCookieAmounts = computed(() => {
    const predictions: Record<string, number> = {};

    boothSalesUsingTroopInventory.value.forEach((booth) => {
      if (booth.predicted_cookies) {
        const cookies = booth.predicted_cookies as Record<string, number>;
        Object.entries(cookies).forEach(([cookieId, amount]) => {
          predictions[cookieId] = (predictions[cookieId] || 0) + amount;
        });
      }
    });

    return predictions;
  });

  /* Private Functions */

  const _updateBoothSale = (boothSale: BoothSale) => {
    const index = allBoothSales.value.findIndex((b) => b.id === boothSale.id);
    if (index !== -1) {
      allBoothSales.value[index] = boothSale;
    }
  };

  const _sortBoothSales = () => {
    allBoothSales.value.sort(
      (a, b) =>
        new Date(a.sale_date + " " + a.sale_time).getTime() -
        new Date(b.sale_date + " " + b.sale_time).getTime(),
    );
  };

  const _addBoothSale = (boothSale: BoothSale) => {
    allBoothSales.value.push(boothSale);
  };

  const _removeBoothSale = (boothSale: BoothSale) => {
    const index = allBoothSales.value.findIndex((b) => b.id === boothSale.id);
    if (index !== -1) {
      allBoothSales.value.splice(index, 1);
    }
  };

  const _getCookiePercentages = (
    cookieRatioTotal?: number,
  ): Record<string, number> => {
    return cookiesStore.allCookies.reduce(
      (acc, cookie) => {
        const percentOfSale =
          cookieRatioTotal > 0 ? (cookie.percent_of_sale ?? 0) : 1;
        acc[cookie.abbreviation] =
          cookieRatioTotal > 0
            ? percentOfSale / cookieRatioTotal
            : percentOfSale / cookiesStore.allCookies.length;
        return acc;
      },
      {} as Record<string, number>,
    );
  };

  const _getTotalPercentOfSale = (): number => {
    return cookiesStore.allCookies.reduce(
      (total, cookie) => total + (cookie.percent_of_sale ?? 0),
      0,
    );
  };

  const _getBaseCookiePredictions = (
    cookie: Cookie,
    expectedSales: number,
    cookiePercentages: Record<string, number>,
  ): Record<
    string,
    { exact: number; floor: number; remainder: number; final: number }
  > => {
    const predictedExact =
      expectedSales * cookiePercentages[cookie.abbreviation];
    const predictedFloor = Math.floor(predictedExact);
    return {
      [cookie.abbreviation]: {
        exact: predictedExact,
        floor: predictedFloor,
        remainder: predictedExact - predictedFloor,
        final: predictedFloor, // Final value to be adjusted later
      },
    };
  };

  const _getTotalFloored = (
    predictions: Record<
      string,
      { floor: number; remainder: number; final: number; exact: number }
    >,
  ): number => {
    return Object.values(predictions).reduce((sum, val) => sum + val.floor, 0);
  };

  const _distributeRemainder = (
    predictions: Record<
      string,
      { floor: number; remainder: number; final: number; exact: number }
    >,
    remainder: number,
  ): Record<
    string,
    { floor: number; remainder: number; final: number; exact: number }
  > => {
    Object.entries(predictions)
      .sort((a, b) => b[1].remainder - a[1].remainder)
      .forEach(([_key, prediction]) => {
        if (remainder > 0) {
          prediction.final += 1;
          remainder -= 1;
        }
      });
    return predictions;
  };

  const _supabaseSelectBoothSales = async () => {
    return await supabaseClient
      .from("booth_sales")
      .select(`*`)
      .eq("profile", profileStore.currentProfile.id)
      .eq("season", seasonsStore.currentSeason.id)
      .order("sale_date", { ascending: true });
  };

  const _supabaseInsertBoothSale = async (boothSale: BoothSale) => {
    return await supabaseClient
      .from("booth_sales")
      .insert(boothSale)
      .select()
      .single();
  };

  const _supabaseUpsertBoothSale = async (boothSale: BoothSale) => {
    return await supabaseClient
      .from("booth_sales")
      .upsert(boothSale);
  };

  const _supabaseDeleteBoothSale = async (boothSale: BoothSale) => {
    return await supabaseClient
    .from("booth_sales")
    .delete()
    .eq("id", boothSale.id);
  };

  /* Actions */

  const getPredictedCookiesFromExpectedSales = (
    expectedSales: number,
  ): Record<string, number> => {
    const predictions: Record<string, number> = {};

    const cookieRatioTotal = _getTotalPercentOfSale();
    const cookiePercentages = _getCookiePercentages(cookieRatioTotal);

    const predictionCalculations = cookiesStore.allCookies
      .map((cookie) =>
        _getBaseCookiePredictions(cookie, expectedSales, cookiePercentages),
      )
      .reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {} as Record<string, number>,
      );

    const totalFloored = _getTotalFloored(predictionCalculations);

    const predictionsWithRemainder = _distributeRemainder(
      predictionCalculations,
      expectedSales - totalFloored,
    );

    Object.keys(predictionsWithRemainder).forEach((cookieAbbr) => {
      predictions[cookieAbbr] = predictionCalculations[cookieAbbr].final;
    });

    return predictions;
  };

  const setActiveBoothSalePredictedCookies = (expectedSales: number) => {
    activeBoothSale.value.predicted_cookies =
      getPredictedCookiesFromExpectedSales(expectedSales);
  };

  const setActiveBoothSaleTotalExpectedSales = () => {
    const predictedCookies = activeBoothSale.value.predicted_cookies || {};
    activeBoothSale.value.expected_sales = Object.values(
      predictedCookies,
    ).reduce((sum, val) => sum + val, 0);
  };

  const fetchBoothSales = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await _supabaseSelectBoothSales();

      if (error) throw error;
      allBoothSales.value = data ?? [];
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertBoothSale = async (boothSale: BoothSale) => {
    if (!seasonsStore.currentSeason?.id) return;

    boothSale.profile = user.value.id;
    boothSale.season = seasonsStore.currentSeason.id;

    if (!boothSale.predicted_cookies) {
      boothSale.predicted_cookies = getPredictedCookiesFromExpectedSales(
        boothSale.expected_sales,
      );
    }

    if (boothSale.auto_calculate_predicted_cookies)
      delete boothSale.auto_calculate_predicted_cookies;

    try {
      const { data, error } = await _supabaseInsertBoothSale(boothSale);

      if (error) throw error;

      _addBoothSale(data as BoothSale);
      _sortBoothSales();
      notificationHelpers.addSuccess("Booth Sale Created");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertBoothSale = async (boothSale: BoothSale) => {
    try {
      // Auto-calculate predicted cookies if not provided
      if (!boothSale.predicted_cookies) {
        boothSale.predicted_cookies = getPredictedCookiesFromExpectedSales(
          boothSale.expected_sales,
        );
      }

      // Remove auto_calculate_predicted_cookies if it exists
      if (boothSale.auto_calculate_predicted_cookies)
        delete boothSale.auto_calculate_predicted_cookies;

      const { error } = await _supabaseUpsertBoothSale(boothSale);

      if (error) throw error;

      _updateBoothSale(boothSale);
      _sortBoothSales();
      notificationHelpers.addSuccess("Booth Sale Updated");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteBoothSale = async (boothSale: BoothSale) => {
    try {
      const { error } = await _supabaseDeleteBoothSale(boothSale);

      if (error) throw error;

      _removeBoothSale(boothSale);
      notificationHelpers.addSuccess("Booth Sale Deleted");
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getPredictedBoothSaleQuantityByCookie = (cookieAbbreviation: string): number => {
    let total = 0;
    boothSalesUsingTroopInventory.value.forEach((booth) => {
      if (booth.predicted_cookies) {
        const cookies = booth.predicted_cookies as Record<string, number>;
        // Find cookie by abbreviation
        if (cookies[cookieAbbreviation]) {
          total += cookies[cookieAbbreviation];
        }
      }
    });
    return total * -1; // Return negative for inventory purposes
  };

  return {
    allBoothSales,
    boothDialogFormSchema,
    activeBoothSale,
    boothDialogVisible,
    setActiveBoothSalePredictedCookies,
    setActiveBoothSaleTotalExpectedSales,
    getPredictedCookiesFromExpectedSales,
    upcomingBoothSales,
    boothSalesUsingTroopInventory,
    predictedCookieAmounts,
    fetchBoothSales,
    insertBoothSale,
    upsertBoothSale,
    deleteBoothSale,
    getPredictedBoothSaleQuantityByCookie,
  };
});
