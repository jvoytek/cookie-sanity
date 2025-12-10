import type { Database } from '@/types/supabase';
import type { AuditSession } from '@/types/types';

/*
ref()s become state properties
computed()s become getters
function()s become actions
*/

export const useAuditSessionsStore = defineStore('auditSessions', () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useSupabaseUser();

  /* State */
  const mostRecentAuditSession = ref<AuditSession | null>(null);

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

    const auditSession = {
      profile: user.value.id,
      file_name: fileName,
      file_size: fileSize,
      original_file_data: originalFileData,
      parsed_rows: parsedRows,
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

    const { data, error } = await supabaseClient
      .from('audit_sessions')
      .select()
      .eq('profile', user.value.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is not an error in this case
      throw new Error(error.message);
    }

    mostRecentAuditSession.value = data || null;
  };

  return {
    mostRecentAuditSession,
    insertAuditSession,
    fetchMostRecentAuditSession,
  };
});
