import type { Database } from '@/types/supabase';
import type { BoothSale } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

const BOOTH_STATUS = {
  ARCHIVED: 'archived',
  ACTIVE: '',
} as const;

export const useBoothsStore = defineStore('booths', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const cookiesStore = useCookiesStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allBoothSales = ref<BoothSale[]>([]);
  const boothDialogFormSchema = reactive([]);
  const activeBoothSale = ref<BoothSale | null>(null);
  const activeBoothSaleOriginal = ref<BoothSale | null>(null);
  const boothDialogVisible = ref(false);
  const showArchivedBoothSales = ref(false);
  const recordSalesDialogVisible = ref(false);
  const activeBoothSaleForRecording = ref<BoothSale | null>(null);
  const salesRecordData = ref<
    Record<string, { predicted: number; remaining: number; sales: number }>
  >({});

  /* Computed */

  const orderedSalesRecordData = computed(() => {
    // Return an array of sales record data ordered by cookie order
    return cookiesStore.allCookiesNotVirtual.map((cookie) => ({
      cookieAbbr: cookie.abbreviation,
      cookieName: cookie.name,
      data: salesRecordData.value[cookie.abbreviation] || {
        predicted: 0,
        remaining: 0,
        sales: 0,
      },
    }));
  });

  const visibleBoothSales = computed(() => {
    if (showArchivedBoothSales.value) {
      return allBoothSales.value;
    }
    return allBoothSales.value.filter(
      (booth: BoothSale) => booth.status !== BOOTH_STATUS.ARCHIVED,
    );
  });

  const upcomingBoothSales = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcomingSales = allBoothSales.value.filter((booth) => {
      return new Date(booth.sale_date) >= new Date(today);
    });
    return upcomingSales;
  });

  const boothSalesUsingTroopInventory = computed(() => {
    return allBoothSales.value.filter(
      (booth: BoothSale) =>
        booth.inventory_type === 'troop' &&
        booth.status !== BOOTH_STATUS.ARCHIVED,
    );
  });

  const predictedCookieAmounts = computed(() => {
    const predictions: Record<string, number> = {};

    boothSalesUsingTroopInventory.value.forEach((booth: BoothSale) => {
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
    const index = allBoothSales.value.findIndex(
      (b: BoothSale) => b.id === boothSale.id,
    );
    if (index !== -1) {
      allBoothSales.value[index] = boothSale;
    }
  };

  const _sortBoothSales = () => {
    allBoothSales.value.sort(
      (a: BoothSale, b: BoothSale) =>
        new Date(a.sale_date).getTime() - new Date(b.sale_date).getTime(),
    );
  };

  const _addBoothSale = (boothSale: BoothSale) => {
    allBoothSales.value.push(boothSale);
  };

  const _removeBoothSale = (boothSale: BoothSale) => {
    const index = allBoothSales.value.findIndex(
      (b: BoothSale) => b.id === boothSale.id,
    );
    if (index !== -1) {
      allBoothSales.value.splice(index, 1);
    }
  };

  const _supabaseSelectBoothSales = async () => {
    return await supabaseClient
      .from('booth_sales')
      .select(`*`)
      .eq('season', seasonsStore.currentSeason?.id ?? 0)
      .order('sale_date', { ascending: true });
  };

  const _supabaseInsertBoothSale = async (boothSale: BoothSale) => {
    return await supabaseClient
      .from('booth_sales')
      .insert(boothSale)
      .select()
      .single();
  };

  const _supabaseUpsertBoothSale = async (boothSale: BoothSale) => {
    return await supabaseClient.from('booth_sales').upsert(boothSale);
  };

  const _supabaseDeleteBoothSale = async (boothSale: BoothSale) => {
    return await supabaseClient
      .from('booth_sales')
      .delete()
      .eq('id', boothSale.id);
  };

  const _transformDataForBoothSale = (booth: BoothSale) => {
    // transform sale_date from yyyy-mm-dd to mm/dd/yyyy
    const dateParts = booth.sale_date.split('-');
    const formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
    return {
      ...booth,
      sale_date: formattedDate,
    };
  };

  /* Actions */

  const setActiveBoothSalePredictedCookies = (expectedSales: number) => {
    if (!activeBoothSale.value) return;
    activeBoothSale.value.predicted_cookies =
      cookiesStore.getPredictedCookiesFromExpectedSales(expectedSales);
  };

  const setActiveBoothSaleTotalExpectedSales = () => {
    if (!activeBoothSale.value) return;
    const predictedCookies = activeBoothSale.value.predicted_cookies || {};
    activeBoothSale.value.expected_sales = Object.values(predictedCookies)
      .map((val) => Number(val) || 0)
      .reduce((sum: number, val: number) => sum + val, 0);
  };

  const fetchBoothSales = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await _supabaseSelectBoothSales();
      if (error) throw error;
      //convert sale_date string to mm/dd/yyyy format
      allBoothSales.value = data.map(_transformDataForBoothSale);
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertBoothSale = async (boothSale: BoothSale) => {
    if (!seasonsStore.currentSeason?.id || !user.value?.id) return;

    boothSale.profile = user.value.id;
    boothSale.season = seasonsStore.currentSeason.id;

    if (!boothSale.predicted_cookies) {
      boothSale.predicted_cookies =
        cookiesStore.getPredictedCookiesFromExpectedSales(
          boothSale.expected_sales ?? 0,
        );
    }

    if (boothSale.auto_calculate_predicted_cookies !== undefined)
      delete boothSale.auto_calculate_predicted_cookies;

    try {
      const { data, error } = await _supabaseInsertBoothSale(boothSale);

      if (error) throw error;

      _addBoothSale(_transformDataForBoothSale(data) as BoothSale);
      _sortBoothSales();
      notificationHelpers.addSuccess('Booth Sale Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertBoothSale = async (boothSale: BoothSale) => {
    try {
      // Auto-calculate predicted cookies if not provided
      if (!boothSale.predicted_cookies) {
        boothSale.predicted_cookies =
          cookiesStore.getPredictedCookiesFromExpectedSales(
            boothSale.expected_sales ?? 0,
          );
      }

      // Remove auto_calculate_predicted_cookies if it exists
      if (boothSale.auto_calculate_predicted_cookies !== undefined)
        delete boothSale.auto_calculate_predicted_cookies;

      const { error } = await _supabaseUpsertBoothSale(boothSale);

      if (error) throw error;

      _updateBoothSale(boothSale);
      _sortBoothSales();
      notificationHelpers.addSuccess('Booth Sale Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteBoothSale = async (boothSale: BoothSale | null) => {
    try {
      if (!boothSale) throw new Error('No Booth Sale Selected');

      const { error } = await _supabaseDeleteBoothSale(boothSale);

      if (error) throw error;

      _removeBoothSale(boothSale);
      notificationHelpers.addSuccess('Booth Sale Deleted');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getPredictedBoothSaleQuantityByCookie = (
    cookieAbbreviation: string,
  ): number => {
    let total = 0;
    boothSalesUsingTroopInventory.value.forEach((booth: BoothSale) => {
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

  const setActiveBoothSale = (boothSale: BoothSale | null) => {
    activeBoothSale.value = boothSale;
    activeBoothSaleOriginal.value = boothSale
      ? JSON.parse(JSON.stringify(boothSale))
      : null;
  };

  const resetActiveBoothSale = () => {
    if (activeBoothSaleOriginal.value && activeBoothSale.value) {
      // Revert changes by resetting to the original deep copy
      _updateBoothSale(activeBoothSaleOriginal.value);
    }
    // Clear active booth sale
    activeBoothSale.value = null;
    activeBoothSaleOriginal.value = null;
  };

  const archiveBoothSale = async (boothSale: BoothSale) => {
    try {
      const updatedBoothSale = {
        ...boothSale,
        status: BOOTH_STATUS.ARCHIVED,
      };

      const { error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(updatedBoothSale);
      notificationHelpers.addSuccess('Booth Sale Archived');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const unarchiveBoothSale = async (boothSale: BoothSale) => {
    try {
      const updatedBoothSale = {
        ...boothSale,
        status: null,
      };

      const { error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(updatedBoothSale);
      notificationHelpers.addSuccess('Booth Sale Archived');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const openRecordSalesDialog = (boothSale: BoothSale) => {
    activeBoothSaleForRecording.value = boothSale;

    // Initialize salesRecordData with all cookies
    const recordData: Record<
      string,
      { predicted: number; remaining: number; sales: number }
    > = {};

    // Get all non-virtual cookies from the cookies store
    cookiesStore.allCookiesNotVirtual.forEach((cookie) => {
      const predictedAmount = boothSale.predicted_cookies
        ? (boothSale.predicted_cookies as Record<string, number>)[
            cookie.abbreviation
          ] || 0
        : 0;

      recordData[cookie.abbreviation] = {
        predicted: predictedAmount,
        remaining: 0,
        sales: predictedAmount,
      };
    });

    salesRecordData.value = recordData;
    recordSalesDialogVisible.value = true;
  };

  const updateSalesRecordRemaining = (
    cookieAbbr: string,
    remaining: number,
  ) => {
    if (salesRecordData.value[cookieAbbr]) {
      salesRecordData.value[cookieAbbr].remaining = remaining;
      salesRecordData.value[cookieAbbr].sales =
        salesRecordData.value[cookieAbbr].predicted - remaining;
    }
  };

  const updateSalesRecordPredicted = (
    cookieAbbr: string,
    predicted: number,
  ) => {
    if (salesRecordData.value[cookieAbbr]) {
      salesRecordData.value[cookieAbbr].predicted = predicted;
      salesRecordData.value[cookieAbbr].sales =
        predicted - salesRecordData.value[cookieAbbr].remaining;
    }
  };

  const updateSalesRecordSales = (cookieAbbr: string, sales: number) => {
    if (salesRecordData.value[cookieAbbr]) {
      salesRecordData.value[cookieAbbr].sales = sales;
      salesRecordData.value[cookieAbbr].remaining =
        salesRecordData.value[cookieAbbr].predicted - sales;
    }
  };

  const saveRecordedSales = async () => {
    try {
      if (!activeBoothSaleForRecording.value) {
        throw new Error('No booth sale selected');
      }

      // Build cookies_sold object from salesRecordData
      const cookiesSold: Record<string, number> = {};
      const updatedPredictedCookies: Record<string, number> = {};
      let totalExpectedSales = 0;

      Object.entries(salesRecordData.value).forEach(([cookieAbbr, data]) => {
        cookiesSold[cookieAbbr] = data.sales;
        updatedPredictedCookies[cookieAbbr] = data.predicted;
        totalExpectedSales += data.predicted;
      });

      // Update the booth sale with cookies_sold, predicted_cookies, and expected_sales
      const updatedBoothSale = {
        ...activeBoothSaleForRecording.value,
        cookies_sold: cookiesSold,
        predicted_cookies: updatedPredictedCookies,
        expected_sales: totalExpectedSales,
      };

      const { error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(updatedBoothSale);
      notificationHelpers.addSuccess('Sales Recorded Successfully');
      recordSalesDialogVisible.value = false;
      activeBoothSaleForRecording.value = null;
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const closeRecordSalesDialog = () => {
    recordSalesDialogVisible.value = false;
    activeBoothSaleForRecording.value = null;
    salesRecordData.value = {};
  };

  return {
    allBoothSales,
    visibleBoothSales,
    showArchivedBoothSales,
    boothDialogFormSchema,
    resetActiveBoothSale,
    setActiveBoothSale,
    activeBoothSale,
    activeBoothSaleOriginal,
    boothDialogVisible,
    setActiveBoothSalePredictedCookies,
    setActiveBoothSaleTotalExpectedSales,
    upcomingBoothSales,
    boothSalesUsingTroopInventory,
    predictedCookieAmounts,
    fetchBoothSales,
    insertBoothSale,
    upsertBoothSale,
    deleteBoothSale,
    archiveBoothSale,
    unarchiveBoothSale,
    getPredictedBoothSaleQuantityByCookie,
    recordSalesDialogVisible,
    activeBoothSaleForRecording,
    salesRecordData,
    orderedSalesRecordData,
    openRecordSalesDialog,
    updateSalesRecordRemaining,
    updateSalesRecordPredicted,
    updateSalesRecordSales,
    saveRecordedSales,
    closeRecordSalesDialog,
  };
});
