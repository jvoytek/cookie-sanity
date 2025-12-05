import type { Database } from '@/types/supabase';
import type { Deposit } from '@/types/types';

export const useDepositsStore = defineStore('deposits', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const profileStore = useProfileStore();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const allDeposits = ref<Deposit[]>([]);
  const depositDialogFormSchema = ref([]);
  const activeDeposit = ref<Deposit | null>(null);
  const depositDialogVisible = ref(false);
  const deleteDepositDialogVisible = ref(false);

  /* Computed */
  const totalDeposits = computed(() => {
    return allDeposits.value.reduce((sum, deposit) => sum + deposit.amount, 0);
  });

  /* Private Functions */

  const _updateDeposit = (deposit: Deposit) => {
    const index = allDeposits.value.findIndex(
      (d: Deposit) => d.id === deposit.id,
    );
    if (index !== -1) {
      allDeposits.value[index] = deposit;
    }
  };

  const _sortDeposits = () => {
    allDeposits.value.sort(
      (a: Deposit, b: Deposit) =>
        new Date(b.deposit_date).getTime() - new Date(a.deposit_date).getTime(),
    );
  };

  const _addDeposit = (deposit: Deposit) => {
    allDeposits.value.push(deposit);
  };

  const _removeDeposit = (deposit: Deposit) => {
    const index = allDeposits.value.findIndex(
      (d: Deposit) => d.id === deposit.id,
    );
    if (index !== -1) {
      allDeposits.value.splice(index, 1);
    }
  };

  const _supabaseSelectDeposits = async () => {
    return await supabaseClient
      .from('deposits')
      .select(`*`)
      .eq('season', seasonsStore.currentSeason?.id ?? 0)
      .order('deposit_date', { ascending: false });
  };

  const _supabaseInsertDeposit = async (deposit: Deposit) => {
    return await supabaseClient
      .from('deposits')
      .insert(deposit)
      .select()
      .single();
  };

  const _supabaseUpsertDeposit = async (deposit: Deposit) => {
    return await supabaseClient
      .from('deposits')
      .upsert(deposit)
      .select()
      .single();
  };

  const _supabaseDeleteDeposit = async (deposit: Deposit) => {
    return await supabaseClient.from('deposits').delete().eq('id', deposit.id);
  };

  const _transformDataForDeposit = (deposit: Deposit) => {
    // transform deposit_date from yyyy-mm-dd to mm/dd/yyyy
    if (deposit.deposit_date) {
      const dateParts = deposit.deposit_date.split('-');
      const year = dateParts[0];
      const month = dateParts[1].padStart(2, '0');
      const day = dateParts[2].padStart(2, '0');
      return {
        ...deposit,
        deposit_date: `${month}/${day}/${year}`,
      };
    }
    return deposit;
  };

  /* Actions */

  const fetchDeposits = async () => {
    try {
      if (!profileStore.currentProfile?.id || !seasonsStore.currentSeason?.id)
        return;

      const { data, error } = await _supabaseSelectDeposits();
      if (error) throw error;

      // Convert deposit_date string to mm/dd/yyyy format
      allDeposits.value = data.map(_transformDataForDeposit);
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const insertDeposit = async (deposit: Partial<Deposit>) => {
    if (!seasonsStore.currentSeason?.id || !user.value?.id) return;

    deposit.profile = user.value.id;
    deposit.season = seasonsStore.currentSeason.id;

    try {
      const { data, error } = await _supabaseInsertDeposit(deposit as Deposit);

      if (error) throw error;

      _addDeposit(_transformDataForDeposit(data));
      _sortDeposits();
      notificationHelpers.addSuccess('Deposit Created');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const upsertDeposit = async (deposit: Deposit) => {
    try {
      const { data, error } = await _supabaseUpsertDeposit(deposit);

      if (error) throw error;

      _updateDeposit(_transformDataForDeposit(data));
      _sortDeposits();
      notificationHelpers.addSuccess('Deposit Updated');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const deleteDeposit = async (deposit: Deposit | null) => {
    try {
      if (!deposit) throw new Error('No Deposit Selected');

      const { error } = await _supabaseDeleteDeposit(deposit);

      if (error) throw error;

      _removeDeposit(deposit);
      notificationHelpers.addSuccess('Deposit Deleted');
    } catch (error) {
      notificationHelpers.addError(error as Error);
    }
  };

  const setActiveDeposit = (deposit: Deposit | null) => {
    activeDeposit.value = deposit ? { ...deposit } : null;
  };

  return {
    allDeposits,
    totalDeposits,
    depositDialogFormSchema,
    activeDeposit,
    depositDialogVisible,
    deleteDepositDialogVisible,
    fetchDeposits,
    insertDeposit,
    upsertDeposit,
    deleteDeposit,
    setActiveDeposit,
  };
});
