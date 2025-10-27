import type { Database } from '@/types/supabase';
import type { Cookie } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useCookiesStore = defineStore('cookies', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const ordersStore = useTransactionsStore();
  const boothsStore = useBoothsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allCookies = ref<Cookie[]>([]);

  const customCookieValidationRules = {
    overBooking: (node) => {
      const boothType = node.parent.name === 'predicted_cookies';
      return overBooking(node.value, node.name, boothType);
    },
  };
  /* Computed */

  const allCookiesNotVirtual = computed(() => {
    return allCookies.value.filter((cookie) => !cookie.is_virtual);
  });

  const overBooking = (
    transactionQuantity: number,
    cookieAbbreviation: string,
    boothType: boolean = false,
  ): boolean => {
    const cookieWithTotals = getCookieByAbbreviation(cookieAbbreviation, true);

    if (boothType) transactionQuantity = -transactionQuantity; // Booth sales reduce inventory
    const transactionType = ordersStore.activeTransaction?.type;
    // Girl to girl transactions don't affect inventory
    if (transactionType === 'G2G') return true;

    // If cookie not found or is virtual, allow transaction
    if (!cookieWithTotals || cookieWithTotals.is_virtual) return true;

    // If overbooking is allowed, allow transaction
    if (cookieWithTotals.overbooking_allowed !== false) return true;

    // For troop inventory, negative quantities remove inventory
    if (transactionQuantity < 0) {
      const originalQuantity = boothType
        ? boothsStore.activeBoothSaleOriginal?.predicted_cookies?.[
            cookieAbbreviation
          ] || 0
        : ordersStore.activeTransactionOriginal?.cookies?.[cookieAbbreviation] *
            -1 || 0;
      // Calculate the net change in quantity for this cookie
      const netChange = transactionQuantity + originalQuantity;
      // Calculate the new inventory after applying the net change
      const newInventory = cookieWithTotals.afterPending + netChange;
      // If new inventory would be negative, overbooking violation
      if (newInventory < 0) return false;
    }

    return true;
  };

  const cookieFormFields = computed(() => {
    return allCookies.value.map((cookie) => ({
      $formkit: 'primeInputNumber',
      name: cookie.abbreviation,
      label: cookie.is_virtual
        ? `${cookie.name} <i class="pi pi-info-circle text-blue-500 ml-1" style="font-size: 0.75rem" title="Virtual packages don't count against your inventory"></i>`
        : cookie.name,
      validation: 'integer|overBooking',
      validationRules: '$validationRules',
      validationMessages: {
        overBooking:
          'This would result in negative inventory. Overbooking is not allowed for this cookie',
      },
      wrapperClass: 'grid grid-cols-3 gap-4 items-center',
      labelClass: 'col-span-1',
      innerClass: 'col-span-2 mt-1 mb-1',
      class: 'w-full',
    }));
  });

  const cookieFormFieldsNotVirtual = computed(() => {
    return allCookies.value
      .filter((cookie) => !cookie.is_virtual)
      .map((cookie) => ({
        $formkit: 'primeInputNumber',
        name: cookie.abbreviation,
        label: cookie.is_virtual
          ? `${cookie.name} <i class="pi pi-info-circle text-blue-500 ml-1" style="font-size: 0.75rem" title="Virtual packages don't count against your inventory"></i>`
          : cookie.name,
        validation: 'integer|overBooking',
        validationRules: '$validationRules',
        validationMessages: {
          overBooking:
            'This would result in negative inventory. Overbooking is not allowed for this cookie',
        },
        wrapperClass: 'grid grid-cols-3 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-2 mt-1 mb-1',
        class: 'w-full',
      }));
  });

  const cookieFormFieldsForBoothSales = computed(() => {
    return allCookies.value
      .filter((cookie) => !cookie.is_virtual)
      .map((cookie) => ({
        $formkit: 'primeInputNumber',
        name: cookie.abbreviation,
        label: cookie.is_virtual
          ? `${cookie.name} <i class="pi pi-info-circle text-blue-500 ml-1" style="font-size: 0.75rem" title="Virtual packages don't count against your inventory"></i>`
          : cookie.name,
        validation: 'integer|min:0|overBooking',
        validationRules: '$validationRules',
        validationMessages: {
          overBooking:
            'This would result in negative inventory. Overbooking is not allowed for this cookie',
        },
        wrapperClass: 'grid grid-cols-3 gap-4 items-center',
        labelClass: 'col-span-1',
        innerClass: 'col-span-2 mt-1 mb-1',
        class: 'w-full',
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
    if (!seasonsStore.currentSeason) return [];
    const requestedGirlMap = ordersStore.totalTransactionsByStatusAllCookies(
      'requested',
      'girl',
    );
    const pendingGirlMap = ordersStore.totalTransactionsByStatusAllCookies(
      'pending',
      'girl',
    );
    const pendingTroopMap = ordersStore.totalTransactionsByStatusAllCookies(
      'pending',
      'troop',
    );

    return allCookies.value.map((cookie) => {
      const onHand = ordersStore.sumTransactionsByCookie(cookie.abbreviation);
      const requestedGirl = requestedGirlMap[cookie.abbreviation];
      const pendingGirl = pendingGirlMap[cookie.abbreviation];
      const pendingTroop = pendingTroopMap[cookie.abbreviation];
      const pendingBooth = boothsStore.getPredictedBoothSaleQuantityByCookie(
        cookie.abbreviation,
      );
      const afterPending = onHand + pendingGirl + pendingTroop + pendingBooth;
      const afterPendingIncludingRequests = afterPending + requestedGirl;
      const [afterPendingStatusSeverity, afterPendingStatus] =
        _afterPendingStatusSeverity(afterPending);

      return {
        ...cookie,
        onHand,
        requestedGirl,
        pendingGirl,
        pendingTroop,
        pendingBooth,
        afterPending,
        afterPendingIncludingRequests,
        afterPendingStatusSeverity,
        afterPendingStatus,
        is_virtual: !!cookie.is_virtual,
      };
    });
  });

  /* Private Functions */

  const _afterPendingStatusSeverity = (quantity: number) => {
    if (quantity > 50) {
      return ['success', 'Good'];
    } else if (quantity > 20) {
      return ['secondary', 'Ok'];
    } else if (quantity >= 0) {
      return ['warn', 'Low'];
    } else {
      return ['danger', 'Critical'];
    }
  };

  const _updateCookie = (cookie: Cookie) => {
    const index = allCookies.value.findIndex((c) => c.id === cookie.id);
    if (index !== -1) {
      allCookies.value[index] = cookie;
    }
  };

  const _sortCookies = () => {
    allCookies.value.sort(
      (a: Cookie, b: Cookie) => (a.order ?? 0) - (b.order ?? 0),
    );
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
    if (
      profileStore.currentProfile == null ||
      seasonsStore.currentSeason == null
    )
      return {
        data: null,
        error: { message: 'No profile or season selected' },
      };

    return await supabaseClient
      .from('cookies')
      .select(`*`)
      .eq('profile', profileStore.currentProfile.id)
      .eq('season', seasonsStore.currentSeason.id)
      .order('order');
  };

  const _supabaseInsertCookie = async (cookie: Cookie) => {
    return await supabaseClient
      .from('cookies')
      .insert(cookie)
      .select()
      .single();
  };

  const _supabaseDeleteCookie = async (cookie: Cookie) => {
    return await supabaseClient.from('cookies').delete().eq('id', cookie.id);
  };

  const _supabaseUpdateAllCookies = async () => {
    return await supabaseClient.from('cookies').upsert(allCookies.value);
  };

  const _getCookiePercentages = (
    cookieRatioTotal?: number,
  ): Record<string, number> => {
    const safeCookieRatioTotal =
      typeof cookieRatioTotal === 'number' ? cookieRatioTotal : 0;
    return allCookies.value.reduce(
      (acc: Record<string, number>, cookie: Cookie) => {
        const percentOfSale =
          safeCookieRatioTotal > 0 ? (cookie.percent_of_sale ?? 0) : 1;
        acc[cookie.abbreviation] =
          safeCookieRatioTotal > 0
            ? percentOfSale / safeCookieRatioTotal
            : percentOfSale / allCookies.value.length;
        return acc;
      },
      {} as Record<string, number>,
    );
  };

  const _getTotalPercentOfSale = (): number => {
    return allCookies.value.reduce(
      (total: number, cookie: Cookie) => total + (cookie.percent_of_sale ?? 0),
      0,
    );
  };

  const _getBaseCookiePredictions = (
    cookie: Cookie,
    expectedSales: number,
    cookiePercentages: Record<string, number>,
  ): Record<string, Prediction> => {
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

  interface Prediction {
    floor: number;
    remainder: number;
    final: number;
    exact: number;
  }

  const _distributeRemainder = (
    predictions: Record<string, Prediction>,
    remainder: number,
  ): Record<string, Prediction> => {
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

  const insertCookie = async (cookie: Cookie) => {
    if (!seasonsStore.currentSeason || !user.value) return;
    cookie.profile = user.value.id;
    cookie.season = seasonsStore.currentSeason.id;
    try {
      const { data, error } = await _supabaseInsertCookie(cookie);

      if (error) throw error;

      _addCookie(data as Cookie);
      _sortCookies();
      notificationHelpers.addSuccess('Cookie Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertCookie = async (cookie: Cookie) => {
    try {
      const { error } = await supabaseClient.from('cookies').upsert(cookie);

      if (error) throw error;

      _updateCookie(cookie);
      _sortCookies();
      notificationHelpers.addSuccess('Cookie Updated');
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
      notificationHelpers.addSuccess('Cookie Deleted');
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
      const { error: allError } = await _supabaseUpdateAllCookies();
      if (allError) throw allError;
      notificationHelpers.addSuccess('Cookies Reordered');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const getCookieByAbbreviation = (
    abbreviation: string,
    withTotals: boolean = false,
  ): (Cookie & { afterPending?: number }) | undefined => {
    if (withTotals) {
      // allCookiesWithInventoryTotals includes afterPending and other computed fields
      return allCookiesWithInventoryTotals.value.find(
        (cookie) => cookie.abbreviation === abbreviation,
      );
    }
    return allCookies.value.find(
      (cookie) => cookie.abbreviation === abbreviation,
    );
  };

  const getPredictedCookiesFromExpectedSales = (
    expectedSales: number,
  ): Record<string, number> => {
    const predictions: Record<string, number> = {};

    const cookieRatioTotal = _getTotalPercentOfSale();
    const cookiePercentages = _getCookiePercentages(cookieRatioTotal);

    const predictionCalculations = allCookies.value
      .map((cookie: Cookie) =>
        _getBaseCookiePredictions(cookie, expectedSales, cookiePercentages),
      )
      .reduce(
        (
          acc: Record<string, Prediction>,
          curr: Record<string, Prediction>,
        ) => ({ ...acc, ...curr }),
        {} as Record<string, Prediction>,
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

  return {
    allCookies,
    allCookiesNotVirtual,
    allCookiesWithInventoryTotals,
    cookieFormFields,
    cookieFormFieldsNotVirtual,
    cookieFormFieldsForBoothSales,
    averageCookiePrice,
    customCookieValidationRules,
    fetchCookies,
    getCookieByAbbreviation,
    insertCookie,
    upsertCookie,
    deleteCookie,
    reorderCookies,
    getPredictedCookiesFromExpectedSales,
  };
});
