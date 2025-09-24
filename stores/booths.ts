import type { Database } from "@/types/supabase";
import type { BoothSale } from "@/types/types";

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useBoothsStore = defineStore("booths", () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const toast = useToast();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const cookiesStore = useCookiesStore();

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

  const troopInventoryBoothSales = computed(() => {
    return allBoothSales.value.filter(
      (booth) => booth.inventory_type === "troop",
    );
  });

  // Calculate predicted cookie amounts for troop inventory booth sales
  const predictedCookieAmounts = computed(() => {
    const predictions: Record<string, number> = {};

    troopInventoryBoothSales.value.forEach((booth) => {
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

  // Calculate predicted cookies based on sales level and available cookies
  const _calculatePredictedCookies = (expectedSales: number) => {
    const predictions: Record<string, number> = {};
    let cookieRatioTotal = cookiesStore.allCookies.reduce(
      (total, cookie) => total + (cookie.percent_of_sale ?? 0),
      0,
    );
    let cookiePercentages: Record<string, number> = {};
    // If no cookie ratios are defined, use equal distribution
    if (cookieRatioTotal === 0) {
      cookieRatioTotal = 100;
      cookiePercentages = cookiesStore.allCookies.reduce(
        (acc, cookie) => {
          acc[cookie.abbreviation] = 1 / cookiesStore.allCookies.length;
          return acc;
        },
        {} as Record<string, number>,
      );
    } else {
      cookiePercentages = cookiesStore.allCookies.reduce(
        (acc, cookie) => {
          acc[cookie.abbreviation] = cookie.percent_of_sale
            ? cookie.percent_of_sale / cookieRatioTotal
            : 0;
          return acc;
        },
        {} as Record<string, number>,
      );
    }
    const predictionCalculations = cookiesStore.allCookies
      .map((cookie) => {
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
      })
      .reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {} as Record<string, number>,
      );
    const totalFloored = Object.values(predictionCalculations).reduce(
      (sum, val) => sum + val.floor,
      0,
    );
    let remainderToDistribute = expectedSales - totalFloored;
    // Distribute the remainder based on the highest remainders
    while (remainderToDistribute > 0) {
      const sortedByRemainder = Object.entries(predictionCalculations).sort(
        (a, b) => b[1].remainder - a[1].remainder,
      );
      sortedByRemainder.forEach(([_key, prediction]) => {
        if (remainderToDistribute > 0) {
          prediction.final += 1;
          remainderToDistribute -= 1;
        }
      });
    }
    Object.entries(predictionCalculations).forEach(([cookieAbbr, calc]) => {
      predictions[cookieAbbr] = calc.final;
    });
    return predictions;
  };

  /* Actions */

  const setActiveBoothSalePredictedCookies = (expectedSales: number) => {
    activeBoothSale.value.predicted_cookies =
      _calculatePredictedCookies(expectedSales);
  };

  const setActiveBoothSaleTotalExpectedSales = () => {
    if (activeBoothSale.value.predicted_cookies) {
      const total = Object.values(
        activeBoothSale.value.predicted_cookies as Record<string, number>,
      ).reduce((sum, val) => sum + val, 0);
      if (activeBoothSale.value.expected_sales !== total)
        activeBoothSale.value.expected_sales = total;
    } else {
      activeBoothSale.value.expected_sales = 0;
    }
  };

  const fetchBoothSales = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await supabaseClient
        .from("booth_sales")
        .select(`*`)
        .eq("profile", profileStore.currentProfile.id)
        .eq("season", seasonsStore.currentSeason.id)
        .order("sale_date", { ascending: true });

      if (error) throw error;
      allBoothSales.value = data ?? [];
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const insertBoothSale = async (boothSale: BoothSale) => {
    if (!seasonsStore.currentSeason?.id) return;

    boothSale.profile = user.value.id;
    boothSale.season = seasonsStore.currentSeason.id;

    // Auto-calculate predicted cookies if not provided
    if (!boothSale.predicted_cookies) {
      boothSale.predicted_cookies = _calculatePredictedCookies(
        boothSale.expected_sales,
      );
    }

    // Remove auto_calculate_predicted_cookies if it exists
    if (boothSale.auto_calculate_predicted_cookies)
      delete boothSale.auto_calculate_predicted_cookies;

    try {
      const { data, error } = await supabaseClient
        .from("booth_sales")
        .insert(boothSale)
        .select()
        .single();

      if (error) throw error;

      _addBoothSale(data as BoothSale);
      _sortBoothSales();

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Booth Sale Created",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const upsertBoothSale = async (boothSale: BoothSale) => {
    try {
      // Auto-calculate predicted cookies if not provided
      if (!boothSale.predicted_cookies) {
        boothSale.predicted_cookies = _calculatePredictedCookies(
          boothSale.expected_sales,
        );
      }

      // Remove auto_calculate_predicted_cookies if it exists
      if (boothSale.auto_calculate_predicted_cookies)
        delete boothSale.auto_calculate_predicted_cookies;

      const { error } = await supabaseClient
        .from("booth_sales")
        .upsert(boothSale);

      if (error) throw error;

      _updateBoothSale(boothSale);
      _sortBoothSales();

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Booth Sale Updated",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  const deleteBoothSale = async (boothSale: BoothSale) => {
    try {
      const { error } = await supabaseClient
        .from("booth_sales")
        .delete()
        .eq("id", boothSale.id);

      if (error) throw error;

      _removeBoothSale(boothSale);

      toast.add({
        severity: "success",
        summary: "Successful",
        detail: "Booth Sale Deleted",
        life: 3000,
      });
    } catch (error) {
      toast.add({
        severity: "error",
        summary: "Error",
        detail: (error as Error).message,
        life: 3000,
      });
    }
  };

  // Get predicted amount for a specific cookie
  const getPredictedAmountForCookie = (cookieAbbreviation: string): number => {
    let total = 0;
    troopInventoryBoothSales.value.forEach((booth) => {
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
    upcomingBoothSales,
    troopInventoryBoothSales,
    predictedCookieAmounts,
    fetchBoothSales,
    insertBoothSale,
    upsertBoothSale,
    deleteBoothSale,
    getPredictedAmountForCookie,
  };
});
