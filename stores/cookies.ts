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
  const seasonCookies = ref<Cookie[]>([]);
  const customCookieValidationRules = {
    overBooking: (node) => {
      const boothType = node.parent.name === 'predicted_cookies';
      return overBooking(node.value, node.name, boothType);
    },
  };
  /* Computed */

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
      return ['warn', 'Ok'];
    } else {
      return ['danger', 'Low'];
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
    allCookies.value.sort(
      (a: Cookie, b: Cookie) => (a.order ?? 0) - (b.order ?? 0),
    );
    seasonCookies.value.sort(
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

  const _supabaseFetchSeasonCookies = async () => {
    if (user.value == null || seasonsStore.settingsSelectedSeason == null)
      return { data: null, error: { message: 'No user or season selected' } };

    return await supabaseClient
      .from('cookies')
      .select(`*`)
      .eq('profile', user.value.id)
      .eq('season', seasonsStore.settingsSelectedSeason.id)
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

  const _supabaseUpdateSeasonCookies = async () => {
    return await supabaseClient.from('cookies').upsert(seasonCookies.value);
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
    if (!seasonsStore.settingsSelectedSeason || !user.value) return;
    cookie.profile = user.value.id;
    cookie.season = seasonsStore.settingsSelectedSeason.id;
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
      const index = seasonCookies.value.findIndex((c) => c.id === cookie.id);
      seasonCookies.value[index].order = i;
    });

    if (
      seasonsStore.currentSeason?.id === seasonsStore.settingsSelectedSeason?.id
    ) {
      allCookies.value = seasonCookies.value;
    }

    _sortCookies();

    try {
      const { error } = await _supabaseUpdateSeasonCookies();
      if (error) throw error;
      if (
        seasonsStore.currentSeason?.id ===
        seasonsStore.settingsSelectedSeason?.id
      ) {
        const { error: allError } = await _supabaseUpdateAllCookies();
        if (allError) throw allError;
      }
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

  return {
    allCookies,
    allCookiesWithInventoryTotals,
    seasonCookies,
    cookieFormFields,
    cookieFormFieldsNotVirtual,
    averageCookiePrice,
    customCookieValidationRules,
    fetchSeasonCookies,
    fetchCookies,
    getCookieByAbbreviation,
    insertCookie,
    upsertCookie,
    deleteCookie,
    reorderCookies,
  };
});
