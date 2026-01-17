import type { Database, Json } from '@/types/supabase';
import type { BoothSale } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

const BOOTH_STATUS = {
  PENDING: '',
  COMMITTED: 'committed',
  RECORDED: 'recorded',
  ARCHIVED: 'archived',
} as const;

type CashBreakdown = {
  ones: number;
  fives: number;
  tens: number;
  twenties: number;
  fifties: number;
  hundreds: number;
  cents: number;
};

const createEmptyCashBreakdown = (): CashBreakdown => ({
  ones: 0,
  fives: 0,
  tens: 0,
  twenties: 0,
  fifties: 0,
  hundreds: 0,
  cents: 0,
});

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
  const activeBoothSalesRecordData = ref<
    Record<string, { predicted: number; remaining: number; sales: number }>
  >({});
  const deleteBoothSaleDialogVisible = ref(false);
  const cashBreakdown = ref<CashBreakdown>(createEmptyCashBreakdown());
  const creditReceipts = ref(0);
  const otherReceipts = ref(0);
  const distributeSalesDialogVisible = ref(false);
  const activeBoothSaleForDistribution = ref<BoothSale | null>(null);
  const distributionData = ref<Record<number, Record<string, number>>>({});

  /* Computed */

  const totalCashReceipts = computed(() => {
    const billsTotal =
      cashBreakdown.value.ones * 1 +
      cashBreakdown.value.fives * 5 +
      cashBreakdown.value.tens * 10 +
      cashBreakdown.value.twenties * 20 +
      cashBreakdown.value.fifties * 50 +
      cashBreakdown.value.hundreds * 100;
    const total = billsTotal + cashBreakdown.value.cents;
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  });

  const orderedActiveBoothSalesRecordData = computed(() => {
    // Return an array of sales record data ordered by cookie order
    return cookiesStore.allCookies.map((cookie) => ({
      abbreviation: cookie.abbreviation,
      name: cookie.name,
      color: cookie.color,
      price: cookie.price,
      is_virtual: cookie.is_virtual,
      data: activeBoothSalesRecordData.value[cookie.abbreviation] || {
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
      return (
        new Date(booth.sale_date) >= new Date(today) &&
        booth.status !== BOOTH_STATUS.ARCHIVED &&
        _totalCookiesSold(booth.cookies_sold) == 0
      );
    });
    return upcomingSales;
  });

  const pastBoothSales = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    const pastSales = allBoothSales.value.filter((booth) => {
      return (
        new Date(booth.sale_date) < new Date(today) &&
        booth.status !== BOOTH_STATUS.ARCHIVED &&
        _totalCookiesSold(booth.cookies_sold) == 0
      );
    });
    return pastSales;
  });

  const archivedBoothSales = computed(() => {
    return allBoothSales.value.filter(
      (booth: BoothSale) => booth.status === BOOTH_STATUS.ARCHIVED,
    );
  });

  const recordedBoothSales = computed(() => {
    return allBoothSales.value.filter(
      (booth: BoothSale) =>
        booth.status !== BOOTH_STATUS.ARCHIVED &&
        _totalCookiesSold(booth.cookies_sold) > 0,
    );
  });

  const unArchivedBoothSalesUsingTroopInventory = computed(() => {
    return allBoothSales.value.filter(
      (booth: BoothSale) =>
        booth.inventory_type === 'troop' &&
        booth.status !== BOOTH_STATUS.ARCHIVED,
    );
  });

  const upcomingBoothSalesUsingTroopInventory = computed(() => {
    return upcomingBoothSales.value.filter(
      (booth: BoothSale) => booth.inventory_type === 'troop',
    );
  });

  const pastBoothSalesUsingTroopInventory = computed(() => {
    return pastBoothSales.value.filter(
      (booth: BoothSale) => booth.inventory_type === 'troop',
    );
  });

  const committedBoothSalesUsingTroopInventory = computed(() => {
    return allBoothSales.value.filter(
      (booth: BoothSale) =>
        booth.inventory_type === 'troop' &&
        booth.status === BOOTH_STATUS.COMMITTED &&
        _totalCookiesSold(booth.cookies_sold) === 0,
    );
  });

  const unCommittedBoothSalesInProjectionsUsingTroopInventory = computed(() => {
    return allBoothSales.value.filter(
      (booth: BoothSale) =>
        booth.inventory_type === 'troop' &&
        booth.status !== BOOTH_STATUS.COMMITTED &&
        booth.status !== BOOTH_STATUS.ARCHIVED &&
        booth.in_projections,
    );
  });

  const recordedBoothSalesUsingTroopInventory = computed(() => {
    return recordedBoothSales.value.filter(
      (booth: BoothSale) => booth.inventory_type === 'troop',
    );
  });

  const upcomingTroopBoothSaleEstimatesMap = computed(() => {
    const estimatesMap: Record<string, number> = {};
    upcomingBoothSalesUsingTroopInventory.value.forEach((booth) => {
      if (booth.predicted_cookies) {
        Object.entries(booth.predicted_cookies).forEach(
          ([cookieAbbr, quantity]) => {
            if (!estimatesMap[cookieAbbr]) {
              estimatesMap[cookieAbbr] = 0;
            }
            estimatesMap[cookieAbbr] -= Number(quantity) || 0;
          },
        );
      }
    });
    return estimatesMap;
  });

  const pastTroopBoothSaleEstimatesMap = computed(() => {
    const estimatesMap: Record<string, number> = {};
    pastBoothSalesUsingTroopInventory.value.forEach((booth) => {
      if (booth.predicted_cookies) {
        Object.entries(booth.predicted_cookies).forEach(
          ([cookieAbbr, quantity]) => {
            if (!estimatesMap[cookieAbbr]) {
              estimatesMap[cookieAbbr] = 0;
            }
            estimatesMap[cookieAbbr] -= Number(quantity) || 0;
          },
        );
      }
    });
    return estimatesMap;
  });

  const committedTroopBoothSaleEstimatesMap = computed(() => {
    const estimatesMap: Record<string, number> = {};
    committedBoothSalesUsingTroopInventory.value.forEach((booth) => {
      if (booth.predicted_cookies) {
        Object.entries(booth.predicted_cookies).forEach(
          ([cookieAbbr, quantity]) => {
            if (!estimatesMap[cookieAbbr]) {
              estimatesMap[cookieAbbr] = 0;
            }
            estimatesMap[cookieAbbr] -= Number(quantity) || 0;
          },
        );
      }
    });
    return estimatesMap;
  });

  const unCommittedTroopBoothSaleEstimatesMap = computed(() => {
    const estimatesMap: Record<string, number> = {};
    unCommittedBoothSalesInProjectionsUsingTroopInventory.value.forEach(
      (booth) => {
        if (booth.predicted_cookies) {
          Object.entries(booth.predicted_cookies).forEach(
            ([cookieAbbr, quantity]) => {
              if (!estimatesMap[cookieAbbr]) {
                estimatesMap[cookieAbbr] = 0;
              }
              estimatesMap[cookieAbbr] -= Number(quantity) || 0;
            },
          );
        }
      },
    );
    return estimatesMap;
  });

  const recordedTroopBoothSalesMap = computed(() => {
    const salesMap: Record<string, number> = {};
    recordedBoothSalesUsingTroopInventory.value.forEach((booth) => {
      if (booth.cookies_sold) {
        Object.entries(booth.cookies_sold).forEach(([cookieAbbr, quantity]) => {
          if (!salesMap[cookieAbbr]) {
            salesMap[cookieAbbr] = 0;
          }
          salesMap[cookieAbbr] -= Number(quantity) || 0;
        });
      }
    });
    return salesMap;
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
    return await supabaseClient
      .from('booth_sales')
      .upsert(boothSale)
      .select()
      .single();
  };

  const _supabaseDeleteBoothSale = async (boothSale: BoothSale) => {
    return await supabaseClient
      .from('booth_sales')
      .delete()
      .eq('id', boothSale.id);
  };

  // Convert 24-hour format time to 12-hour format
  const _convert24to12Hour = (time24: string | null): string | null => {
    if (!time24) return null;

    const [hours, minutes] = time24.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12

    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Convert 12-hour format time to 24-hour format
  const _convert12to24Hour = (time12: string | null): string | null => {
    if (!time12) return null;

    const match = time12.match(
      /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/i,
    );
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const _transformDataForBoothSale = (booth: BoothSale) => {
    // transform sale_date from yyyy-mm-dd to mm/dd/yyyy
    const dateParts = booth.sale_date.split('-');
    const formattedDate =
      dateParts.length > 1
        ? `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`
        : booth.sale_date;
    return {
      ...booth,
      sale_date: formattedDate,
      start_time: _convert24to12Hour(booth.start_time),
      end_time: _convert24to12Hour(booth.end_time),
      total_sales: _getTotalSales(booth.cookies_sold),
      packages_sold: _getTotalPackagesSoldForBoothSale(booth.cookies_sold),
    };
  };

  const _transformDataForSave = (booth: BoothSale) => {
    if (!booth.predicted_cookies) {
      booth.predicted_cookies =
        cookiesStore.getPredictedCookiesFromExpectedSales(
          booth.expected_sales ?? 0,
        );
    }
    // Convert times from 12-hour to 24-hour format for database storage
    booth.start_time = _convert12to24Hour(booth.start_time);
    booth.end_time = _convert12to24Hour(booth.end_time);
    delete booth.total_sales;
    delete booth.packages_sold;
    delete booth.auto_calculate_predicted_cookies;
  };

  const _totalCookiesSold = (cookiesSold: Json | null | undefined) => {
    if (cookiesSold === null || cookiesSold === undefined) return 0;
    const totalSold = Object.values(cookiesSold).reduce(
      (sum, val) => sum + Number(val || 0),
      0,
    );
    return totalSold;
  };

  const _getTotalSales = (cookies: Json | null) => {
    if (!cookies) return 0;
    let total = 0;
    cookiesStore.allCookies.forEach((cookie) => {
      total += Number(cookies[cookie.abbreviation] || 0) * cookie.price;
    });
    return total;
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
    _transformDataForSave(boothSale);

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
    _transformDataForSave(boothSale);

    try {
      const { data, error } = await _supabaseUpsertBoothSale(boothSale);

      if (error) throw error;

      _updateBoothSale(_transformDataForBoothSale(data));
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

      _transformDataForSave(updatedBoothSale);
      const { data, error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(_transformDataForBoothSale(data));
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

      _transformDataForSave(updatedBoothSale);
      const { data, error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(_transformDataForBoothSale(data));
      notificationHelpers.addSuccess('Booth Sale Unarchived');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const markCommittedBoothSale = async (boothSale: BoothSale) => {
    try {
      const updatedBoothSale = {
        ...boothSale,
        status: BOOTH_STATUS.COMMITTED,
      };

      _transformDataForSave(updatedBoothSale);
      const { data, error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(_transformDataForBoothSale(data));
      notificationHelpers.addSuccess('Booth Sale Marked as Committed');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const unmarkCommittedBoothSale = async (boothSale: BoothSale) => {
    try {
      const updatedBoothSale = {
        ...boothSale,
      };
      delete updatedBoothSale.status;

      _transformDataForSave(updatedBoothSale);
      const { data, error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(_transformDataForBoothSale(data));
      notificationHelpers.addSuccess('Booth Sale Unmarked as committed');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const openRecordSalesDialog = (boothSale: BoothSale) => {
    activeBoothSaleForRecording.value = boothSale;

    // Initialize activeBoothSalesRecordData with all cookies
    const recordData: Record<
      string,
      { predicted: number; remaining: number; sales: number }
    > = {};

    // Get all non-virtual cookies from the cookies store
    cookiesStore.allCookies.forEach((cookie) => {
      const predictedAmount = boothSale.predicted_cookies
        ? (boothSale.predicted_cookies as Record<string, number>)[
            cookie.abbreviation
          ] || 0
        : 0;

      const sold = boothSale.cookies_sold
        ? (boothSale.cookies_sold as Record<string, number>)[
            cookie.abbreviation
          ] || 0
        : predictedAmount;

      recordData[cookie.abbreviation] = {
        predicted: predictedAmount,
        remaining: predictedAmount - sold,
        sales: sold,
      };
    });

    activeBoothSalesRecordData.value = recordData;

    // Initialize cash breakdown from booth sale or reset to zero
    if (boothSale.cash_breakdown) {
      const breakdown = boothSale.cash_breakdown as Record<string, number>;
      cashBreakdown.value = {
        ones: breakdown.ones || 0,
        fives: breakdown.fives || 0,
        tens: breakdown.tens || 0,
        twenties: breakdown.twenties || 0,
        fifties: breakdown.fifties || 0,
        hundreds: breakdown.hundreds || 0,
        cents: breakdown.cents || 0,
      };
    } else {
      cashBreakdown.value = createEmptyCashBreakdown();
    }

    // Initialize credit and other receipts from booth sale or reset to zero
    creditReceipts.value = boothSale.credit_receipts ?? 0;
    otherReceipts.value = boothSale.other_receipts ?? 0;

    recordSalesDialogVisible.value = true;
  };

  const updateSalesRecordRemaining = (
    cookieAbbr: string,
    remaining: number,
  ) => {
    if (activeBoothSalesRecordData.value[cookieAbbr]) {
      activeBoothSalesRecordData.value[cookieAbbr].remaining = remaining;
      activeBoothSalesRecordData.value[cookieAbbr].sales =
        activeBoothSalesRecordData.value[cookieAbbr].predicted - remaining;
    }
  };

  const updateSalesRecordPredicted = (
    cookieAbbr: string,
    predicted: number,
  ) => {
    if (activeBoothSalesRecordData.value[cookieAbbr]) {
      activeBoothSalesRecordData.value[cookieAbbr].predicted = predicted;
      activeBoothSalesRecordData.value[cookieAbbr].sales =
        predicted - activeBoothSalesRecordData.value[cookieAbbr].remaining;
    }
  };

  const updateSalesRecordSales = (cookieAbbr: string, sales: number) => {
    if (activeBoothSalesRecordData.value[cookieAbbr]) {
      activeBoothSalesRecordData.value[cookieAbbr].sales = sales;
      activeBoothSalesRecordData.value[cookieAbbr].remaining =
        activeBoothSalesRecordData.value[cookieAbbr].predicted - sales;
    }
  };

  const saveRecordedSales = async () => {
    try {
      if (!activeBoothSaleForRecording.value) {
        throw new Error('No booth sale selected');
      }

      // Build cookies_sold object from activeBoothSalesRecordData
      const cookiesSold: Record<string, number> = {};
      const updatedPredictedCookies: Record<string, number> = {};
      let totalExpectedSales = 0;

      Object.entries(activeBoothSalesRecordData.value).forEach(
        ([cookieAbbr, data]) => {
          cookiesSold[cookieAbbr] = data.sales;
          updatedPredictedCookies[cookieAbbr] = data.predicted;
          totalExpectedSales += data.predicted;
        },
      );

      // Update the booth sale with cookies_sold, predicted_cookies, expected_sales, cash_receipts, cash_breakdown, credit_receipts, and other_receipts
      const updatedBoothSale = {
        ...activeBoothSaleForRecording.value,
        cookies_sold: cookiesSold,
        predicted_cookies: updatedPredictedCookies,
        expected_sales: totalExpectedSales,
        cash_receipts: totalCashReceipts.value,
        cash_breakdown: Object.assign({}, cashBreakdown.value),
        credit_receipts: creditReceipts.value,
        other_receipts: otherReceipts.value,
      };
      _transformDataForSave(updatedBoothSale);
      const { data, error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(_transformDataForBoothSale(data));
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
    activeBoothSalesRecordData.value = {};
    cashBreakdown.value = createEmptyCashBreakdown();
    creditReceipts.value = 0;
    otherReceipts.value = 0;
  };

  const _getTotalPackagesSoldForBoothSale = (cookies: Json | null): number => {
    if (!cookies) return 0;
    return Object.values(cookies as Record<string, number>)
      .map((val) => Number(val) || 0)
      .reduce((sum: number, val: number) => sum + val, 0);
  };

  const openDistributeSalesDialog = (boothSale: BoothSale) => {
    activeBoothSaleForDistribution.value = boothSale;

    // Get girls assigned to this booth sale
    const girlsStore = useGirlsStore();
    const scoutsAttending = boothSale.scouts_attending;
    if (!scoutsAttending || !Array.isArray(scoutsAttending)) {
      notificationHelpers.addError(
        new Error('No scouts assigned to this booth sale'),
      );
      return;
    }

    const assignedGirls = scoutsAttending
      .map((girlId) => girlsStore.getGirlById(girlId))
      .filter((girl) => girl !== null);

    if (assignedGirls.length === 0) {
      notificationHelpers.addError(
        new Error('No valid scouts assigned to this booth sale'),
      );
      return;
    }

    // Initialize distributionData with evenly distributed cookies
    const cookiesSold = boothSale.cookies_sold as Record<string, number> | null;
    if (!cookiesSold) {
      notificationHelpers.addError(new Error('No cookies sold data found'));
      return;
    }

    const newDistributionData: Record<number, Record<string, number>> = {};

    // Initialize each girl's cookie counts to 0
    assignedGirls.forEach((girl) => {
      newDistributionData[girl.id] = {};
      cookiesStore.allCookies.forEach((cookie) => {
        newDistributionData[girl.id][cookie.abbreviation] = 0;
      });
    });

    // Distribute cookies evenly using round-robin algorithm
    let girlIndex = 0;
    cookiesStore.allCookies.forEach((cookie) => {
      const sold = cookiesSold[cookie.abbreviation] || 0;
      for (let i = 0; i < sold; i++) {
        const girl = assignedGirls[girlIndex];
        newDistributionData[girl.id][cookie.abbreviation]++;

        // Move to next girl, wrapping around
        girlIndex = (girlIndex + 1) % assignedGirls.length;
      }
      // Start next cookie type with the next girl in rotation
      // (not starting over with first girl)
    });

    distributionData.value = newDistributionData;
    distributeSalesDialogVisible.value = true;
  };

  const updateDistributionData = (
    girlId: number,
    cookieAbbr: string,
    value: number,
  ) => {
    if (!distributionData.value[girlId]) {
      distributionData.value[girlId] = {};
    }
    distributionData.value[girlId][cookieAbbr] = value;
  };

  const saveDistributedSales = async () => {
    try {
      if (!activeBoothSaleForDistribution.value) {
        throw new Error('No booth sale selected');
      }

      const transactionsStore = useTransactionsStore();
      const today = new Date().toISOString().split('T')[0];

      // Create a transaction for each girl with cookies distributed
      const transactionsToCreate = Object.entries(distributionData.value)
        .filter(([_girlIdStr, cookies]) => {
          // Skip girls with no cookies distributed
          return Object.values(cookies).some((qty) => qty > 0);
        })
        .map(([girlIdStr, cookies]) => {
          const girlId = Number(girlIdStr);
          return {
            type: 'T2G(B)',
            order_date: activeBoothSaleForDistribution.value.sale_date,
            to: girlId,
            from: null,
            cookies: cookies,
            status: 'complete',
            notes: `Booth Sale: ${activeBoothSaleForDistribution.value.location}, ${activeBoothSaleForDistribution.value.sale_date} ${activeBoothSaleForDistribution.value.start_time || ''} - ${activeBoothSaleForDistribution.value.end_time || ''}`,
          };
        });

      // Insert all transactions
      const transactionPromises = transactionsToCreate.map((transaction) =>
        transactionsStore.insertNewTransaction(transaction, false),
      );

      await Promise.all(transactionPromises);

      // Set activeBoothSaleForDistribution to archived
      const updatedBoothSale = {
        ...activeBoothSaleForDistribution.value,
        status: BOOTH_STATUS.ARCHIVED,
      };
      _transformDataForSave(updatedBoothSale);
      const { data, error } = await _supabaseUpsertBoothSale(updatedBoothSale);

      if (error) throw error;

      _updateBoothSale(_transformDataForBoothSale(data));

      notificationHelpers.addSuccess('Sales distributed successfully');
      closeDistributeSalesDialog();
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const closeDistributeSalesDialog = () => {
    distributeSalesDialogVisible.value = false;
    activeBoothSaleForDistribution.value = null;
    distributionData.value = {};
  };

<<<<<<< HEAD
=======
  const toggleInProjections = async (boothSale: BoothSale) => {
    try {
      const updatedBoothSale = {
        ...boothSale,
        in_projections: !boothSale.in_projections,
      };

      // Clone the object before transformation to avoid modifying the original
      const boothSaleToSave = { ...updatedBoothSale };
      _transformDataForSave(boothSaleToSave);
      const { data, error } = await _supabaseUpsertBoothSale(boothSaleToSave);

      if (error) throw error;

      _updateBoothSale(_transformDataForBoothSale(data));
      const status = data.in_projections ? 'included in' : 'excluded from';
      notificationHelpers.addSuccess(
        `Booth Sale ${status} inventory projections`,
      );
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

>>>>>>> 612207ce6f592e9f1a9cf9898b7620680478705f
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
    deleteBoothSaleDialogVisible,
    setActiveBoothSalePredictedCookies,
    setActiveBoothSaleTotalExpectedSales,
    upcomingBoothSales,
    pastBoothSales,
    archivedBoothSales,
    recordedBoothSales,
    upcomingBoothSalesUsingTroopInventory,
    upcomingTroopBoothSaleEstimatesMap,
    pastTroopBoothSaleEstimatesMap,
    committedTroopBoothSaleEstimatesMap,
    unCommittedTroopBoothSaleEstimatesMap,
    recordedTroopBoothSalesMap,
    pastBoothSalesUsingTroopInventory,
    recordedBoothSalesUsingTroopInventory,
    unArchivedBoothSalesUsingTroopInventory,
    unCommittedBoothSalesInProjectionsUsingTroopInventory,
    fetchBoothSales,
    insertBoothSale,
    upsertBoothSale,
    deleteBoothSale,
    archiveBoothSale,
    unarchiveBoothSale,
    markCommittedBoothSale,
    unmarkCommittedBoothSale,
    recordSalesDialogVisible,
    activeBoothSaleForRecording,
    orderedActiveBoothSalesRecordData,
    openRecordSalesDialog,
    updateSalesRecordRemaining,
    updateSalesRecordPredicted,
    updateSalesRecordSales,
    saveRecordedSales,
    closeRecordSalesDialog,
    cashBreakdown,
    totalCashReceipts,
    creditReceipts,
    otherReceipts,
    distributeSalesDialogVisible,
    activeBoothSaleForDistribution,
    distributionData,
    openDistributeSalesDialog,
    updateDistributionData,
    saveDistributedSales,
    closeDistributeSalesDialog,
  };
});
