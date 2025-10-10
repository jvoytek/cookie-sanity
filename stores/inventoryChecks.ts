import type { Database } from '@/types/supabase';
import type { InventoryCheck } from '@/types/types';

export const useInventoryChecksStore = defineStore('inventoryChecks', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const cookiesStore = useCookiesStore();
  const transactionsStore = useTransactionsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allInventoryChecks = ref<InventoryCheck[]>([]);
  const activeInventoryCheck = ref<InventoryCheck | null>(null);
  const inventoryCheckDialogVisible = ref(false);
  const deleteInventoryCheckDialogVisible = ref(false);

  /* Computed */
  const sortedInventoryChecks = computed(() => {
    return [...allInventoryChecks.value].sort(
      (a, b) =>
        new Date(b.check_date).getTime() - new Date(a.check_date).getTime(),
    );
  });

  const latestInventoryCheck = computed(() => {
    if (sortedInventoryChecks.value.length === 0) return null;
    return sortedInventoryChecks.value[0];
  });

  /* Actions */
  const fetchInventoryChecks = async () => {
    const { data, error } = await _supabaseFetchInventoryChecks();
    if (error) {
      notificationHelpers.error(
        'Failed to fetch inventory checks',
        error.message,
      );
      return;
    }
    if (data) {
      allInventoryChecks.value = data;
    }
  };

  const insertInventoryCheck = async (
    inventoryCheckData: Partial<InventoryCheck>,
  ) => {
    if (!profileStore.currentProfile || !seasonsStore.currentSeason) {
      notificationHelpers.error(
        'Failed to create inventory check',
        'No profile or season selected',
      );
      return;
    }

    const newCheck: Partial<InventoryCheck> = {
      ...inventoryCheckData,
      profile: profileStore.currentProfile.id,
      season: seasonsStore.currentSeason.id,
    };

    const { data, error } = await _supabaseInsertInventoryCheck(newCheck);
    if (error) {
      notificationHelpers.error(
        'Failed to create inventory check',
        error.message,
      );
      return;
    }
    if (data) {
      allInventoryChecks.value.push(data);
      notificationHelpers.success(
        'Inventory check saved',
        'Physical inventory check has been recorded',
      );
    }
  };

  const deleteInventoryCheck = async (id: number) => {
    const { error } = await _supabaseDeleteInventoryCheck(id);
    if (error) {
      notificationHelpers.error(
        'Failed to delete inventory check',
        error.message,
      );
      return;
    }
    const index = allInventoryChecks.value.findIndex(
      (check) => check.id === id,
    );
    if (index !== -1) {
      allInventoryChecks.value.splice(index, 1);
    }
    notificationHelpers.success(
      'Inventory check deleted',
      'The inventory check record has been removed',
    );
  };

  const setActiveInventoryCheck = (check: InventoryCheck | null) => {
    activeInventoryCheck.value = check;
  };

  const calculateExpectedInventory = (): Record<string, number> => {
    const expected: Record<string, number> = {};
    cookiesStore.allCookies
      .filter((cookie) => !cookie.is_virtual)
      .forEach((cookie) => {
        expected[cookie.abbreviation] =
          transactionsStore.sumTransactionsByCookie(cookie.abbreviation);
      });
    return expected;
  };

  const calculateDiscrepancies = (
    physicalInventory: Record<string, { cases: number; packages: number }>,
    expectedInventory: Record<string, number>,
  ): {
    discrepancies: Record<string, number>;
    totalDiscrepancies: number;
  } => {
    const discrepancies: Record<string, number> = {};
    let totalDiscrepancies = 0;

    Object.keys(expectedInventory).forEach((cookieAbbr) => {
      const physical = physicalInventory[cookieAbbr];
      const expected = expectedInventory[cookieAbbr];
      
      // Calculate total physical packages (cases * 12 + individual packages)
      const totalPhysical =
        (physical?.cases || 0) * 12 + (physical?.packages || 0);
      
      const diff = totalPhysical - expected;
      discrepancies[cookieAbbr] = diff;
      totalDiscrepancies += Math.abs(diff);
    });

    return { discrepancies, totalDiscrepancies };
  };

  /* Private Functions */
  const _supabaseFetchInventoryChecks = async () => {
    if (
      profileStore.currentProfile == null ||
      seasonsStore.currentSeason == null
    )
      return {
        data: null,
        error: { message: 'No profile or season selected' },
      };

    return await supabaseClient
      .from('inventory_checks')
      .select('*')
      .eq('profile', profileStore.currentProfile.id)
      .eq('season', seasonsStore.currentSeason.id)
      .order('check_date', { ascending: false });
  };

  const _supabaseInsertInventoryCheck = async (
    check: Partial<InventoryCheck>,
  ) => {
    return await supabaseClient
      .from('inventory_checks')
      .insert(check)
      .select()
      .single();
  };

  const _supabaseDeleteInventoryCheck = async (id: number) => {
    return await supabaseClient
      .from('inventory_checks')
      .delete()
      .eq('id', id);
  };

  return {
    allInventoryChecks,
    sortedInventoryChecks,
    latestInventoryCheck,
    activeInventoryCheck,
    inventoryCheckDialogVisible,
    deleteInventoryCheckDialogVisible,
    fetchInventoryChecks,
    insertInventoryCheck,
    deleteInventoryCheck,
    setActiveInventoryCheck,
    calculateExpectedInventory,
    calculateDiscrepancies,
  };
});
