import type { Database } from '@/types/supabase';
import type {
  AuditSession,
  PerfectMatch,
  PartialMatch,
  Order,
  NewOrder,
  SCOrder2025,
} from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useAuditSessionsStore = defineStore('auditSessions', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const seasonsStore = useSeasonsStore();
  const transactionsStore = useTransactionsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const selectedAuditSessionIds = ref<number[] | []>([]);
  const selectedAuditSessions = ref<AuditSession[] | []>([]);
  const allAuditSessions = ref<AuditSession[]>([]);
  const perfectMatches = ref<PerfectMatch[]>([]);
  const partialMatches = ref<PartialMatch[]>([]);
  const unmatchedOrders = ref<Order[]>([]);
  const auditExtraRows = ref<Record<string, unknown>[]>([]);
  const numParsedRows = ref<number>(0);
  const auditSessionError = ref<string | null>(null);
  const matchesLoading = ref(false);

  watch(selectedAuditSessionIds, async (sessionIds) => {
    if (sessionIds.length > 0) {
      _syncSelectedAuditSessions();
      await fetchMatches();
    }
  });

  /* Computed */

  /* Private Functions */

  function _generateUniqueId(): string {
    // Prefer native UUID when available
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }

    // Fallback to crypto.getRandomValues for high-quality randomness
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      // Convert to hex string
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Last-resort fallback using timestamp + Math.random
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function _addSelectedAuditSessionNoDupes(sessionId: string): void {
    if (!selectedAuditSessionIds.value.includes(sessionId)) {
      selectedAuditSessionIds.value.push(sessionId);
      selectedAuditSessions.value.push(
        allAuditSessions.value.find(
          (session) => session.id === sessionId,
        ) as AuditSession,
      );
    }
  }

  function _removeSelectedAuditSession(sessionId: string): void {
    selectedAuditSessionIds.value = selectedAuditSessionIds.value.filter(
      (id) => id !== sessionId,
    );
    selectedAuditSessions.value = selectedAuditSessions.value.filter(
      (session) => session.id !== sessionId,
    );
  }

  function _syncSelectedAuditSessions(): void {
    selectedAuditSessions.value = allAuditSessions.value.filter((session) =>
      selectedAuditSessionIds.value.includes(session.id),
    );

    numParsedRows.value = selectedAuditSessions.value.reduce(
      (total, session) => total + (session.parsed_rows?.length || 0),
      0,
    );
  }

  /* Actions */

  const insertAuditSession = async (
    fileName: string,
    fileSize: number,
    originalFileData: object,
    parsedRows: object[],
  ): Promise<AuditSession> => {
    if (!user.value?.id) throw new Error('User not authenticated');
    if (!seasonsStore.currentSeason?.id)
      throw new Error('No current season selected');

    const auditSession = {
      profile: user.value.id,
      file_name: fileName,
      file_size: fileSize,
      original_file_data: originalFileData,
      parsed_rows: parsedRows,
      season: seasonsStore.currentSeason?.id,
    };

    const { data, error } = await supabaseClient
      .from('audit_sessions')
      .insert(auditSession)
      .select()
      .single();

    if (error) throw new Error(error.message);

    allAuditSessions.value.push(data);

    // Update the most recent session after insert
    _addSelectedAuditSessionNoDupes(data.id);

    return data;
  };

  const fetchMostRecentAuditSession = async (): Promise<void> => {
    if (!user.value?.id) throw new Error('User not authenticated');
    if (!seasonsStore.currentSeason?.id)
      throw new Error('No current season selected');

    const { data, error } = await supabaseClient
      .from('audit_sessions')
      .select()
      .eq('profile', user.value.id)
      .eq('season', seasonsStore.currentSeason?.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is not an error in this case
      throw new Error(error.message);
    }
    if (data.length > 0) {
      selectedAuditSessionIds.value = [data[0].id];
      selectedAuditSessions.value = [data[0]];
    }
  };

  const fetchAllAuditSessions = async (
    includeArchived: boolean = false,
  ): Promise<void> => {
    if (!user.value?.id) throw new Error('User not authenticated');
    if (!seasonsStore.currentSeason?.id)
      throw new Error('No current season selected');

    let query = supabaseClient
      .from('audit_sessions')
      .select()
      .eq('profile', user.value.id)
      .eq('season', seasonsStore.currentSeason?.id);

    if (!includeArchived) {
      query = query.neq('status', 'archived');
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    allAuditSessions.value = data || [];
    if (selectedAuditSessionIds.value.length > 0) {
      _syncSelectedAuditSessions();
    }
  };

  const archiveAuditSession = async (sessionId: string): Promise<void> => {
    if (!user.value?.id) throw new Error('User not authenticated');

    const { error } = await supabaseClient
      .from('audit_sessions')
      .update({ status: 'archived' })
      .eq('id', sessionId)
      .eq('profile', user.value.id);

    if (error) throw new Error(error.message);

    _removeSelectedAuditSession(sessionId);

    // Refresh the audit sessions list
    await fetchAllAuditSessions();
    await fetchMostRecentAuditSession();
  };

  const fetchMatches = async (): Promise<void> => {
    if (selectedAuditSessionIds.value.length === 0) {
      perfectMatches.value = [];
      partialMatches.value = [];
      return;
    }

    if (!seasonsStore.currentSeason?.id)
      throw new Error('No current season selected');

    matchesLoading.value = true;

    try {
      const response = await $fetch('/api/audit/matches', {
        method: 'POST',
        body: {
          auditSessionIds: selectedAuditSessionIds.value,
          seasonId: seasonsStore.currentSeason.id,
        },
      });

      perfectMatches.value =
        (response as { matches: PerfectMatch[] }).matches || [];
      partialMatches.value =
        (response as { partialMatches: PartialMatch[] }).partialMatches || [];
      unmatchedOrders.value =
        (response as { unmatchedOrders: Order[] }).unmatchedOrders || [];

      // Convert auditExtraRows to NewOrder format
      auditExtraRows.value = (
        (response as { auditExtraRows: Record<string, unknown>[] })
          .auditExtraRows || []
      )
        .map((obj: Record<string, unknown>) => {
          const order =
            transactionsStore.convertSCOrderToNewTransaction(
              obj as SCOrder2025,
            ) || {};
          // add temporary unique id for front-end tracking
          order.id = _generateUniqueId();
          return order;
        })
        .filter(
          (order) =>
            order !== undefined &&
            typeof order.profile === 'string' &&
            typeof order.order_num === 'string' &&
            typeof order.type === 'string' &&
            typeof order.status === 'string',
        ) as NewOrder[];

      auditSessionError.value = (response as { error?: string }).error || null;
    } catch (error) {
      notificationHelpers.addError(
        new Error('Failed to fetch perfect matches', error as Error),
      );
      perfectMatches.value = [];
      partialMatches.value = [];
      unmatchedOrders.value = [];
      throw error;
    } finally {
      matchesLoading.value = false;
    }
  };

  const confirmPartialMatch = async (
    auditRow: Order | NewOrder,
    matchedOrderId: number,
  ): Promise<void> => {
    const matchedOrder = transactionsStore.getTransactionsById([
      matchedOrderId,
    ])[0];
    if (!matchedOrder) {
      throw new Error(`Matched order with ID ${matchedOrderId} not found`);
    }
    const updatedTransaction = {
      ...matchedOrder,
      ...auditRow,
    } as Order;
    // Convert order_date to MM/DD/YYYY format if needed
    updatedTransaction.order_date = new Date(
      updatedTransaction.order_date || '',
    )
      .toISOString()
      .split('T')[0];
    updatedTransaction.supplier =
      updatedTransaction.supplier?.toString() || null;
    await transactionsStore.upsertTransaction(updatedTransaction);
    // Refresh matches after confirming
    await fetchMatches();
  };

  return {
    selectedAuditSessionIds,
    selectedAuditSessions,
    numParsedRows,
    allAuditSessions,
    perfectMatches,
    partialMatches,
    unmatchedOrders,
    auditExtraRows,
    matchesLoading,
    auditSessionError,
    insertAuditSession,
    fetchMostRecentAuditSession,
    fetchAllAuditSessions,
    archiveAuditSession,
    fetchMatches,
    confirmPartialMatch,
  };
});
