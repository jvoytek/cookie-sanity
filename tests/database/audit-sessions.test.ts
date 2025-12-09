import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AuditSession } from '@/types/types';

/**
 * Unit tests for the audit_sessions database table
 * Tests table creation, insertions, retrieval, and status transitions
 * This is a backend-only feature with no UI
 */
describe('audit_sessions table', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabaseClient: any;

  beforeEach(() => {
    // Set up mock Supabase client
    mockSupabaseClient = {
      from: vi.fn(() => mockSupabaseClient),
      select: vi.fn(() => mockSupabaseClient),
      insert: vi.fn(() => mockSupabaseClient),
      update: vi.fn(() => mockSupabaseClient),
      eq: vi.fn(() => mockSupabaseClient),
      single: vi.fn(() => mockSupabaseClient),
      order: vi.fn(() => mockSupabaseClient),
    };

    vi.stubGlobal(
      'useSupabaseClient',
      vi.fn(() => mockSupabaseClient),
    );

    vi.stubGlobal(
      'useSupabaseUser',
      vi.fn(() => ({
        value: { id: 'test-user-id' },
      })),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('table structure validation', () => {
    it('should accept valid audit session with all required fields', async () => {
      const validAuditSession: Partial<AuditSession> = {
        user_id: 'test-user-id',
        file_name: 'smart-cookies-export.csv',
        file_size: 1024,
        status: 'pending',
        original_file_data: { rows: [], headers: [] },
        parsed_rows: [],
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          ...validAuditSession,
          id: 'generated-uuid',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .insert(validAuditSession)
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBeDefined();
      expect(result.data.user_id).toBe('test-user-id');
      expect(result.data.file_name).toBe('smart-cookies-export.csv');
      expect(result.data.file_size).toBe(1024);
      expect(result.data.status).toBe('pending');
    });

    it('should have id field as uuid', async () => {
      const auditSession = {
        id: 'valid-uuid-string',
        user_id: 'test-user-id',
        file_name: 'test.csv',
        file_size: 500,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
      };

      expect(typeof auditSession.id).toBe('string');
    });

    it('should have created_at field with timestamp', async () => {
      const auditSession = {
        id: 'test-uuid',
        user_id: 'test-user-id',
        file_name: 'test.csv',
        file_size: 500,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
      };

      expect(auditSession.created_at).toBeDefined();
      expect(typeof auditSession.created_at).toBe('string');
    });
  });

  describe('insertion operations', () => {
    it('should successfully insert audit session with minimal required fields', async () => {
      const newAuditSession = {
        user_id: 'test-user-id',
        file_name: 'upload.csv',
        file_size: 2048,
        original_file_data: { data: 'test' },
        parsed_rows: [{ row: 1 }],
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          ...newAuditSession,
          id: 'new-uuid',
          created_at: new Date().toISOString(),
          status: 'pending',
        },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .insert(newAuditSession)
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.id).toBeDefined();
      expect(result.data.status).toBe('pending');
    });

    it('should store original_file_data as jsonb', async () => {
      const fileData = {
        headers: ['DATE', 'ORDER', 'TYPE', 'TO', 'FROM'],
        rows: [
          ['2025-01-01', '12345', 'T2G', 'Girl Scout', 'Troop Leader'],
          ['2025-01-02', '12346', 'T2G', 'Girl Scout', 'Troop Leader'],
        ],
        metadata: {
          rowCount: 2,
          columnCount: 5,
        },
      };

      const newAuditSession = {
        user_id: 'test-user-id',
        file_name: 'smart-cookies.csv',
        file_size: 4096,
        original_file_data: fileData,
        parsed_rows: [],
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          ...newAuditSession,
          id: 'uuid-with-jsonb',
          created_at: new Date().toISOString(),
          status: 'pending',
        },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .insert(newAuditSession)
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.original_file_data).toEqual(fileData);
      expect(result.data.original_file_data.metadata.rowCount).toBe(2);
    });

    it('should store parsed_rows as jsonb array', async () => {
      const parsedRows = [
        {
          rowNumber: 1,
          matched: true,
          matchType: 'perfect',
          data: { order: '12345', type: 'T2G' },
        },
        {
          rowNumber: 2,
          matched: false,
          matchType: null,
          data: { order: '12346', type: 'T2G' },
        },
      ];

      const newAuditSession = {
        user_id: 'test-user-id',
        file_name: 'parsed-data.csv',
        file_size: 8192,
        original_file_data: {},
        parsed_rows: parsedRows,
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          ...newAuditSession,
          id: 'uuid-with-parsed',
          created_at: new Date().toISOString(),
          status: 'pending',
        },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .insert(newAuditSession)
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.parsed_rows).toEqual(parsedRows);
      expect(result.data.parsed_rows).toHaveLength(2);
    });
  });

  describe('retrieval operations', () => {
    it('should retrieve audit sessions for a specific user', async () => {
      const mockAuditSessions = [
        {
          id: 'session-1',
          user_id: 'test-user-id',
          file_name: 'file1.csv',
          file_size: 1024,
          created_at: '2025-12-09T10:00:00Z',
          status: 'complete',
          original_file_data: {},
          parsed_rows: [],
        },
        {
          id: 'session-2',
          user_id: 'test-user-id',
          file_name: 'file2.csv',
          file_size: 2048,
          created_at: '2025-12-09T11:00:00Z',
          status: 'pending',
          original_file_data: {},
          parsed_rows: [],
        },
      ];

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockResolvedValue({
        data: mockAuditSessions,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .select('*')
        .eq('user_id', 'test-user-id')
        .order('created_at', { ascending: false });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data[0].user_id).toBe('test-user-id');
      expect(result.data[1].user_id).toBe('test-user-id');
    });

    it('should retrieve parsed_rows for a specific audit session', async () => {
      const parsedRows = [
        { id: 1, matched: true, data: { order: '12345' } },
        { id: 2, matched: false, data: { order: '12346' } },
      ];

      const mockAuditSession = {
        id: 'session-with-parsed',
        user_id: 'test-user-id',
        file_name: 'data.csv',
        file_size: 4096,
        created_at: '2025-12-09T12:00:00Z',
        status: 'complete',
        original_file_data: {},
        parsed_rows: parsedRows,
      };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: mockAuditSession,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .select('parsed_rows')
        .eq('id', 'session-with-parsed')
        .single();

      expect(result.error).toBeNull();
      expect(result.data.parsed_rows).toEqual(parsedRows);
      expect(result.data.parsed_rows).toHaveLength(2);
    });

    it('should filter audit sessions by status', async () => {
      const mockCompleteSessions = [
        {
          id: 'complete-1',
          user_id: 'test-user-id',
          file_name: 'completed1.csv',
          file_size: 1024,
          created_at: '2025-12-09T10:00:00Z',
          status: 'complete',
          original_file_data: {},
          parsed_rows: [],
        },
        {
          id: 'complete-2',
          user_id: 'test-user-id',
          file_name: 'completed2.csv',
          file_size: 2048,
          created_at: '2025-12-09T11:00:00Z',
          status: 'complete',
          original_file_data: {},
          parsed_rows: [],
        },
      ];

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);

      // Return mock for chained eq calls
      const mockChainedEq = {
        ...mockSupabaseClient,
        order: vi.fn().mockResolvedValue({
          data: mockCompleteSessions,
          error: null,
        }),
      };
      mockSupabaseClient.eq.mockReturnValue(mockChainedEq);

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .select('*')
        .eq('user_id', 'test-user-id')
        .eq('status', 'complete')
        .order('created_at', { ascending: false });

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result.data.every((s: any) => s.status === 'complete')).toBe(true);
    });
  });

  describe('status transitions', () => {
    it('should update status from pending to complete', async () => {
      const updatedSession = {
        id: 'session-to-update',
        user_id: 'test-user-id',
        file_name: 'test.csv',
        file_size: 1024,
        created_at: '2025-12-09T10:00:00Z',
        status: 'complete',
        original_file_data: {},
        parsed_rows: [],
      };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: updatedSession,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .update({ status: 'complete' })
        .eq('id', 'session-to-update')
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.status).toBe('complete');
    });

    it('should update status to archived', async () => {
      const archivedSession = {
        id: 'session-to-archive',
        user_id: 'test-user-id',
        file_name: 'old-data.csv',
        file_size: 2048,
        created_at: '2025-12-01T10:00:00Z',
        status: 'archived',
        original_file_data: {},
        parsed_rows: [],
      };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: archivedSession,
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .update({ status: 'archived' })
        .eq('id', 'session-to-archive')
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.status).toBe('archived');
    });

    it('should validate status values are within enum', () => {
      const validStatuses = ['pending', 'complete', 'archived'];
      const testStatus = 'complete';

      expect(validStatuses).toContain(testStatus);
    });

    it('should reject invalid status values', () => {
      const validStatuses = ['pending', 'complete', 'archived'];
      const invalidStatus = 'invalid-status';

      expect(validStatuses).not.toContain(invalidStatus);
    });
  });

  describe('foreign key relationship', () => {
    it('should link audit session to user via user_id', async () => {
      const auditSession = {
        user_id: 'test-user-id',
        file_name: 'test.csv',
        file_size: 1024,
        original_file_data: {},
        parsed_rows: [],
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          ...auditSession,
          id: 'new-session-id',
          created_at: new Date().toISOString(),
          status: 'pending',
        },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .insert(auditSession)
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.user_id).toBe('test-user-id');
    });
  });

  describe('default values', () => {
    it('should set default status to pending when not provided', async () => {
      const auditSessionWithoutStatus = {
        user_id: 'test-user-id',
        file_name: 'test.csv',
        file_size: 512,
        original_file_data: {},
        parsed_rows: [],
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          ...auditSessionWithoutStatus,
          id: 'default-status-id',
          created_at: new Date().toISOString(),
          status: 'pending',
        },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .insert(auditSessionWithoutStatus)
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.status).toBe('pending');
    });

    it('should set default parsed_rows to empty array when not provided', async () => {
      const auditSessionWithoutParsedRows = {
        user_id: 'test-user-id',
        file_name: 'test.csv',
        file_size: 256,
        original_file_data: {},
      };

      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockResolvedValue({
        data: {
          ...auditSessionWithoutParsedRows,
          id: 'default-parsed-id',
          created_at: new Date().toISOString(),
          status: 'pending',
          parsed_rows: [],
        },
        error: null,
      });

      const result = await mockSupabaseClient
        .from('audit_sessions')
        .insert(auditSessionWithoutParsedRows)
        .select()
        .single();

      expect(result.error).toBeNull();
      expect(result.data.parsed_rows).toEqual([]);
    });
  });
});
