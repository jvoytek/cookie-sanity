import type { Database } from '@/types/supabase';
import type { AuditSession, PerfectMatch, Order } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useAuditSessionsStore = defineStore('auditSessions', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const seasonsStore = useSeasonsStore();
  const notificationHelpers = useNotificationHelpers();

  /* State */
  const mostRecentAuditSession = ref<AuditSession | null>(null);
  const perfectMatches = ref<PerfectMatch[]>([]);
  const unmatchedOrders = ref<Order[]>([]);
  const auditSessionError = ref<string | null>(null);
  const perfectMatchesLoading = ref(false);

  /* Computed */

  /* Private Functions */

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

    // Update the most recent session after insert
    mostRecentAuditSession.value = data;

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
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is not an error in this case
      throw new Error(error.message);
    }

    mostRecentAuditSession.value = data[0] || null;
  };

  const fetchPerfectMatches = async (): Promise<void> => {
    if (!mostRecentAuditSession.value?.id) {
      perfectMatches.value = [];
      return;
    }

    if (!seasonsStore.currentSeason?.id)
      throw new Error('No current season selected');

    perfectMatchesLoading.value = true;

    try {
      const response = await $fetch('/api/audit/perfect-matches', {
        method: 'POST',
        body: {
          auditSessionId: mostRecentAuditSession.value.id,
          seasonId: seasonsStore.currentSeason.id,
        },
      });

      perfectMatches.value =
        (response as { matches: PerfectMatch[] }).matches || [];
      unmatchedOrders.value =
        (response as { unmatchedOrders: Order[] }).unmatchedOrders || [];
      auditSessionError.value = (response as { error?: string }).error || null;
    } catch (error) {
      notificationHelpers.addError(
        new Error('Failed to fetch perfect matches', error as Error),
      );
      perfectMatches.value = [];
      unmatchedOrders.value = [];
      throw error;
    } finally {
      perfectMatchesLoading.value = false;
    }
  };

  return {
    mostRecentAuditSession,
    perfectMatches,
    unmatchedOrders,
    perfectMatchesLoading,
    auditSessionError,
    insertAuditSession,
    fetchMostRecentAuditSession,
    fetchPerfectMatches,
  };
});
