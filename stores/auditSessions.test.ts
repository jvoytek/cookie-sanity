import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuditSessionsStore } from './auditSessions';

describe('auditSessions store', () => {
  let mockSupabaseClient: ReturnType<typeof vi.fn>;
  let mockSeasonsStore: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock Supabase client
    mockSupabaseClient = {
      from: vi.fn(() => mockSupabaseClient),
      insert: vi.fn(() => mockSupabaseClient),
      select: vi.fn(() => mockSupabaseClient),
      single: vi.fn(() => mockSupabaseClient),
      eq: vi.fn(() => mockSupabaseClient),
      neq: vi.fn(() => mockSupabaseClient),
      order: vi.fn(() => mockSupabaseClient),
      update: vi.fn(() => mockSupabaseClient),
    };

    // Mock seasons store
    mockSeasonsStore = {
      currentSeason: { id: 1, name: 'Test Season' },
    };

    vi.stubGlobal(
      'useSupabaseClient',
      vi.fn(() => mockSupabaseClient),
    );
    vi.stubGlobal('useSupabaseUser', () => ({
      value: { id: 'test-user-id' },
    }));
    vi.stubGlobal('useSeasonsStore', () => mockSeasonsStore);
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
        season: 1,
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

    it('should throw error if no current season is selected', async () => {
      mockSeasonsStore.currentSeason = null;

      const store = useAuditSessionsStore();

      await expect(
        store.insertAuditSession('test.csv', 1024, {}, []),
      ).rejects.toThrow('No current season selected');
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

      const orderMock = vi.fn().mockResolvedValue({
        data: [mockAuditSession],
        error: null,
      });

      const neqMock = {
        order: orderMock,
      };

      const secondEqMock = {
        neq: vi.fn(() => neqMock),
      };

      const firstEqMock = {
        eq: vi.fn(() => secondEqMock),
      };

      mockSupabaseClient.eq = vi.fn(() => firstEqMock);

      const store = useAuditSessionsStore();
      await store.fetchMostRecentAuditSession();

      expect(store.mostRecentAuditSession).toEqual(mockAuditSession);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_sessions');
    });

    it('should set mostRecentAuditSession to null when no sessions exist', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const neqMock = {
        order: orderMock,
      };

      const secondEqMock = {
        neq: vi.fn(() => neqMock),
      };

      const firstEqMock = {
        eq: vi.fn(() => secondEqMock),
      };

      mockSupabaseClient.eq = vi.fn(() => firstEqMock);

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

    it('should throw error if no current season is selected', async () => {
      mockSeasonsStore.currentSeason = null;

      const store = useAuditSessionsStore();

      await expect(store.fetchMostRecentAuditSession()).rejects.toThrow(
        'No current season selected',
      );
    });

    it('should throw error for database errors other than no rows', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'SOME_ERROR', message: 'Database error' },
      });

      const neqMock = {
        order: orderMock,
      };

      const secondEqMock = {
        neq: vi.fn(() => neqMock),
      };

      const firstEqMock = {
        eq: vi.fn(() => secondEqMock),
      };

      mockSupabaseClient.eq = vi.fn(() => firstEqMock);

      const store = useAuditSessionsStore();

      await expect(store.fetchMostRecentAuditSession()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('fetchAllAuditSessions', () => {
    it('should fetch all active audit sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          profile: 'test-user-id',
          file_name: 'file1.csv',
          file_size: 1024,
          created_at: new Date().toISOString(),
          status: 'complete',
          original_file_data: {},
          parsed_rows: [],
        },
        {
          id: 'session-2',
          profile: 'test-user-id',
          file_name: 'file2.csv',
          file_size: 2048,
          created_at: new Date().toISOString(),
          status: 'pending',
          original_file_data: {},
          parsed_rows: [],
        },
      ];

      mockSupabaseClient.neq = vi.fn(() => mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const store = useAuditSessionsStore();
      await store.fetchAllAuditSessions(false);

      expect(store.allAuditSessions).toEqual(mockSessions);
      expect(mockSupabaseClient.neq).toHaveBeenCalledWith('status', 'archived');
    });

    it('should fetch all audit sessions including archived when requested', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          profile: 'test-user-id',
          file_name: 'file1.csv',
          file_size: 1024,
          created_at: new Date().toISOString(),
          status: 'archived',
          original_file_data: {},
          parsed_rows: [],
        },
        {
          id: 'session-2',
          profile: 'test-user-id',
          file_name: 'file2.csv',
          file_size: 2048,
          created_at: new Date().toISOString(),
          status: 'complete',
          original_file_data: {},
          parsed_rows: [],
        },
      ];

      mockSupabaseClient.order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const store = useAuditSessionsStore();
      await store.fetchAllAuditSessions(true);

      expect(store.allAuditSessions).toEqual(mockSessions);
    });

    it('should throw error if user is not authenticated', async () => {
      vi.stubGlobal('useSupabaseUser', () => ({
        value: null,
      }));

      const store = useAuditSessionsStore();

      await expect(store.fetchAllAuditSessions()).rejects.toThrow(
        'User not authenticated',
      );
    });

    it('should throw error if no current season is selected', async () => {
      mockSeasonsStore.currentSeason = null;

      const store = useAuditSessionsStore();

      await expect(store.fetchAllAuditSessions()).rejects.toThrow(
        'No current season selected',
      );
    });
  });

  describe('archiveAuditSession', () => {
    beforeEach(() => {
      mockSupabaseClient.update = vi.fn(() => mockSupabaseClient);
      mockSupabaseClient.neq = vi.fn(() => mockSupabaseClient);
    });

    it('should successfully archive an audit session', async () => {
      const secondEqMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const firstEqMock = {
        eq: secondEqMock,
      };

      mockSupabaseClient.eq = vi.fn(() => firstEqMock);

      // Mock for fetchAllAuditSessions
      const orderMockForFetch = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const neqMockForFetch = {
        order: orderMockForFetch,
      };

      const secondEqMockForFetch = {
        neq: vi.fn(() => neqMockForFetch),
      };

      const firstEqMockForFetch = {
        eq: vi.fn(() => secondEqMockForFetch),
      };

      // Set up the from mock to return different chains for different calls
      let callCount = 0;
      mockSupabaseClient.from = vi.fn((table) => {
        callCount++;
        if (callCount === 1) {
          // First call is for update
          return {
            ...mockSupabaseClient,
            update: vi.fn(() => ({
              eq: vi.fn(() => firstEqMock),
            })),
          };
        } else {
          // Subsequent calls are for select (in fetchAllAuditSessions and fetchMostRecentAuditSession)
          return {
            ...mockSupabaseClient,
            select: vi.fn(() => ({
              eq: vi.fn(() => firstEqMockForFetch),
            })),
          };
        }
      });

      const store = useAuditSessionsStore();
      await store.archiveAuditSession('test-session-id');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_sessions');
    });

    it('should throw error if user is not authenticated', async () => {
      vi.stubGlobal('useSupabaseUser', () => ({
        value: null,
      }));

      const store = useAuditSessionsStore();

      await expect(
        store.archiveAuditSession('test-session-id'),
      ).rejects.toThrow('User not authenticated');
    });

    it('should throw error if database operation fails', async () => {
      const secondEqMock = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const firstEqMock = {
        eq: secondEqMock,
      };

      mockSupabaseClient.update = vi.fn(() => ({
        eq: vi.fn(() => firstEqMock),
      }));

      const store = useAuditSessionsStore();

      await expect(
        store.archiveAuditSession('test-session-id'),
      ).rejects.toThrow('Database error');
    });

    it('should refresh audit sessions after archiving', async () => {
      const secondEqMock = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      const firstEqMock = {
        eq: secondEqMock,
      };

      // Mock for fetchAllAuditSessions
      const orderMockForFetch = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const neqMockForFetch = {
        order: orderMockForFetch,
      };

      const secondEqMockForFetch = {
        neq: vi.fn(() => neqMockForFetch),
      };

      const firstEqMockForFetch = {
        eq: vi.fn(() => secondEqMockForFetch),
      };

      // Set up the from mock to return different chains for different calls
      let callCount = 0;
      mockSupabaseClient.from = vi.fn((table) => {
        callCount++;
        if (callCount === 1) {
          // First call is for update
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => firstEqMock),
            })),
          };
        } else {
          // Subsequent calls are for select
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => firstEqMockForFetch),
            })),
          };
        }
      });

      const store = useAuditSessionsStore();

      await store.archiveAuditSession('test-session-id');

      // Verify that from was called multiple times (once for update, twice for refresh)
      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe('fetchMostRecentAuditSession with archived filter', () => {
    it('should exclude archived sessions when fetching most recent', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          profile: 'test-user-id',
          file_name: 'recent-file.csv',
          file_size: 2048,
          created_at: new Date().toISOString(),
          status: 'pending',
          original_file_data: {},
          parsed_rows: [],
        },
      ];

      mockSupabaseClient.neq = vi.fn(() => mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const store = useAuditSessionsStore();
      await store.fetchMostRecentAuditSession();

      expect(mockSupabaseClient.neq).toHaveBeenCalledWith('status', 'archived');
      expect(store.mostRecentAuditSession).toEqual(mockSessions[0]);
    });
  });

  describe('fetchMatches', () => {
    beforeEach(() => {
      // Mock $fetch
      global.$fetch = vi.fn();
    });

    it('should set empty array when no audit session exists', async () => {
      const store = useAuditSessionsStore();
      store.mostRecentAuditSession = null;

      await store.fetchMatches();

      expect(store.perfectMatches).toEqual([]);
      expect(store.partialMatches).toEqual([]);
      expect(global.$fetch).not.toHaveBeenCalled();
    });

    it('should fetch perfect and partial matches successfully', async () => {
      const mockMatches = [
        {
          auditRow: { DATE: '2025-01-01', TYPE: 'T2G' },
          order: { id: 1, order_num: '12345' },
          seller: { id: 1, first_name: 'Alice', last_name: 'Smith' },
        },
      ];

      const mockPartialMatches = [
        {
          auditRow: { DATE: '2025-01-02', TYPE: 'T2G' },
          matchedOrders: [
            {
              order: { id: 2, order_num: '12346' },
              matchScore: 75.0,
            },
          ],
        },
      ];

      const mockResponse = {
        matches: mockMatches,
        partialMatches: mockPartialMatches,
        unmatchedOrders: [],
        auditExtraRows: [],
        totalAuditRows: 10,
        totalOrders: 5,
        matchCount: 1,
        partialMatchCount: 1,
      };

      (global.$fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse,
      );

      const store = useAuditSessionsStore();
      store.mostRecentAuditSession = {
        id: 'test-id',
        profile: 'test-user-id',
        file_name: 'test.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
      };

      await store.fetchMatches();

      expect(store.perfectMatches).toEqual(mockMatches);
      expect(store.partialMatches).toEqual(mockPartialMatches);
      expect(global.$fetch).toHaveBeenCalledWith('/api/audit/matches', {
        method: 'POST',
        body: {
          auditSessionId: 'test-id',
          seasonId: 1,
        },
      });
    });

    it('should set loading state during fetch', async () => {
      (global.$fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  matches: [],
                  partialMatches: [],
                  unmatchedOrders: [],
                  auditExtraRows: [],
                }),
              100,
            );
          }),
      );

      const store = useAuditSessionsStore();
      store.mostRecentAuditSession = {
        id: 'test-id',
        profile: 'test-user-id',
        file_name: 'test.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
      };

      const fetchPromise = store.fetchMatches();

      expect(store.matchesLoading).toBe(true);

      await fetchPromise;

      expect(store.matchesLoading).toBe(false);
    });

    it('should handle fetch errors', async () => {
      (global.$fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error'),
      );

      const store = useAuditSessionsStore();
      store.mostRecentAuditSession = {
        id: 'test-id',
        profile: 'test-user-id',
        file_name: 'test.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
      };

      await expect(store.fetchMatches()).rejects.toThrow('Network error');

      expect(store.perfectMatches).toEqual([]);
      expect(store.partialMatches).toEqual([]);
      expect(store.matchesLoading).toBe(false);
    });

    it('should throw error if no current season is selected', async () => {
      mockSeasonsStore.currentSeason = null;

      const store = useAuditSessionsStore();
      store.mostRecentAuditSession = {
        id: 'test-id',
        profile: 'test-user-id',
        file_name: 'test.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
      };

      await expect(store.fetchMatches()).rejects.toThrow(
        'No current season selected',
      );
    });
  });
});
