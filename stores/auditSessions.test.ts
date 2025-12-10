import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuditSessionsStore } from './auditSessions';

describe('auditSessions store', () => {
  let mockSupabaseClient: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock Supabase client
    mockSupabaseClient = {
      from: vi.fn(() => mockSupabaseClient),
      insert: vi.fn(() => mockSupabaseClient),
      select: vi.fn(() => mockSupabaseClient),
      single: vi.fn(() => mockSupabaseClient),
    };

    vi.stubGlobal(
      'useSupabaseClient',
      vi.fn(() => mockSupabaseClient),
    );
    vi.stubGlobal('useSupabaseUser', () => ({
      value: { id: 'test-user-id' },
    }));
  });

  describe('insertAuditSession', () => {
    it('should successfully insert an audit session', async () => {
      const mockAuditSession = {
        id: 'test-id',
        profile: 'test-user-id',
        file_name: 'test-file.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: { headers: ['col1', 'col2'], rows: [] },
        parsed_rows: [],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockAuditSession,
        error: null,
      });

      const store = useAuditSessionsStore();
      const result = await store.insertAuditSession(
        'test-file.csv',
        1024,
        { headers: ['col1', 'col2'], rows: [] },
        [],
      );

      expect(result).toEqual(mockAuditSession);
      expect(store.mostRecentAuditSession).toEqual(mockAuditSession);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_sessions');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        profile: 'test-user-id',
        file_name: 'test-file.csv',
        file_size: 1024,
        original_file_data: { headers: ['col1', 'col2'], rows: [] },
        parsed_rows: [],
      });
    });

    it('should throw error if user is not authenticated', async () => {
      vi.stubGlobal('useSupabaseUser', () => ({
        value: null,
      }));

      const store = useAuditSessionsStore();

      await expect(
        store.insertAuditSession('test.csv', 1024, {}, []),
      ).rejects.toThrow('User not authenticated');
    });

    it('should throw error if database operation fails', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const store = useAuditSessionsStore();

      await expect(
        store.insertAuditSession('test.csv', 1024, {}, []),
      ).rejects.toThrow('Database error');
    });

    it('should store original file data and parsed rows', async () => {
      const originalFileData = {
        headers: ['DATE', 'ORDER', 'TYPE'],
        rows: [
          ['2025-01-01', '12345', 'T2G'],
          ['2025-01-02', '12346', 'G2T'],
        ],
      };

      const parsedRows = [
        { date: '2025-01-01', order: '12345', type: 'T2G' },
        { date: '2025-01-02', order: '12346', type: 'G2T' },
      ];

      const mockAuditSession = {
        id: 'test-id',
        profile: 'test-user-id',
        file_name: 'data.csv',
        file_size: 2048,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: originalFileData,
        parsed_rows: parsedRows,
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockAuditSession,
        error: null,
      });

      const store = useAuditSessionsStore();
      const result = await store.insertAuditSession(
        'data.csv',
        2048,
        originalFileData,
        parsedRows,
      );

      expect(result.original_file_data).toEqual(originalFileData);
      expect(result.parsed_rows).toEqual(parsedRows);
    });
  });

  describe('fetchMostRecentAuditSession', () => {
    beforeEach(() => {
      mockSupabaseClient.eq = vi.fn(() => mockSupabaseClient);
      mockSupabaseClient.order = vi.fn(() => mockSupabaseClient);
      mockSupabaseClient.limit = vi.fn(() => mockSupabaseClient);
    });

    it('should fetch the most recent audit session', async () => {
      const mockAuditSession = {
        id: 'test-id',
        profile: 'test-user-id',
        file_name: 'recent-file.csv',
        file_size: 2048,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: { headers: ['col1'], rows: [] },
        parsed_rows: [{ rowNumber: 1, data: ['value1'] }],
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: mockAuditSession,
        error: null,
      });

      const store = useAuditSessionsStore();
      await store.fetchMostRecentAuditSession();

      expect(store.mostRecentAuditSession).toEqual(mockAuditSession);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_sessions');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith(
        'profile',
        'test-user-id',
      );
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(1);
    });

    it('should set mostRecentAuditSession to null when no sessions exist', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows returned' },
      });

      const store = useAuditSessionsStore();
      await store.fetchMostRecentAuditSession();

      expect(store.mostRecentAuditSession).toBeNull();
    });

    it('should throw error if user is not authenticated', async () => {
      vi.stubGlobal('useSupabaseUser', () => ({
        value: null,
      }));

      const store = useAuditSessionsStore();

      await expect(store.fetchMostRecentAuditSession()).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('should throw error for database errors other than no rows', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'SOME_ERROR', message: 'Database error' },
      });

      const store = useAuditSessionsStore();

      await expect(store.fetchMostRecentAuditSession()).rejects.toThrow(
        'Database error',
      );
    });
  });
});
