import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AuditPerfectMatchesDataTable from '@/components/audit/AuditPerfectMatchesDataTable.vue';

describe('AuditPerfectMatchesDataTable', () => {
  let mockAuditSessionsStore: ReturnType<typeof vi.fn>;
  let mockCookiesStore: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuditSessionsStore = {
      mostRecentAuditSession: null,
      perfectMatches: [],
      perfectMatchesLoading: false,
      fetchMatches: vi.fn().mockResolvedValue(undefined),
    };

    mockCookiesStore = {
      allCookies: [
        { id: 1, abbreviation: 'ADV', name: 'Adventurefuls' },
        { id: 2, abbreviation: 'TM', name: 'Thin Mints' },
        { id: 3, abbreviation: 'LEM', name: 'Lemonades' },
      ],
    };

    vi.stubGlobal('useAuditSessionsStore', () => mockAuditSessionsStore);
    vi.stubGlobal('useCookiesStore', () => mockCookiesStore);
  });

  it('renders without crashing', () => {
    expect(() => {
      mount(AuditPerfectMatchesDataTable, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            Column: true,
            ProgressSpinner: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('displays message when no audit session exists', () => {
    mockAuditSessionsStore.mostRecentAuditSession = null;

    const wrapper = mount(AuditPerfectMatchesDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain(
      'No audit data uploaded yet. Upload a file to see perfect matches.',
    );
  });

  it('displays loading spinner when fetching matches', () => {
    mockAuditSessionsStore.mostRecentAuditSession = {
      id: 'test-id',
      profile: 'test-user-id',
      file_name: 'test.csv',
      file_size: 1024,
      created_at: '2025-01-01T12:00:00Z',
      status: 'pending',
      original_file_data: { headers: [] },
      parsed_rows: [],
    };
    mockAuditSessionsStore.perfectMatchesLoading = true;

    const wrapper = mount(AuditPerfectMatchesDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Finding perfect matches...');
    expect(wrapper.findComponent({ name: 'ProgressSpinner' }).exists()).toBe(
      true,
    );
  });

  it('displays message when no matches found', () => {
    mockAuditSessionsStore.mostRecentAuditSession = {
      id: 'test-id',
      profile: 'test-user-id',
      file_name: 'test.csv',
      file_size: 1024,
      created_at: '2025-01-01T12:00:00Z',
      status: 'pending',
      original_file_data: { headers: [] },
      parsed_rows: [{ rowNumber: 1, data: ['value'] }],
    };
    mockAuditSessionsStore.perfectMatches = [];
    mockAuditSessionsStore.perfectMatchesLoading = false;

    const wrapper = mount(AuditPerfectMatchesDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain('No perfect matches found.');
  });

  it('displays perfect matches in DataTable', async () => {
    const mockMatches = [
      {
        auditRow: {
          DATE: '2025-01-01',
          TYPE: 'T2G',
          TO: 'Alice Smith',
          ADV: 10,
          TM: 5,
        },
        order: {
          id: 1,
          order_num: '12345',
          order_date: '2025-01-01',
          type: 'T2G',
        },
        seller: {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
        },
      },
      {
        auditRow: {
          DATE: '2025-01-02',
          TYPE: 'T2G',
          TO: 'Bob Johnson',
          ADV: 15,
          TM: 8,
        },
        order: {
          id: 2,
          order_num: '12346',
          order_date: '2025-01-02',
          type: 'T2G',
        },
        seller: {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
        },
      },
    ];

    mockAuditSessionsStore.mostRecentAuditSession = {
      id: 'test-id',
      profile: 'test-user-id',
      file_name: 'test.csv',
      file_size: 1024,
      created_at: '2025-01-01T12:00:00Z',
      status: 'pending',
      original_file_data: { headers: ['DATE', 'TYPE', 'TO', 'ADV', 'TM'] },
      parsed_rows: [
        { rowNumber: 1, data: ['2025-01-01', 'T2G', 'Alice Smith', 10, 5] },
        { rowNumber: 2, data: ['2025-01-02', 'T2G', 'Bob Johnson', 15, 8] },
      ],
    };
    mockAuditSessionsStore.perfectMatches = mockMatches;
    mockAuditSessionsStore.perfectMatchesLoading = false;

    const wrapper = mount(AuditPerfectMatchesDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('2');
    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
  });

  it('displays match summary statistics', async () => {
    const mockMatches = [
      {
        auditRow: {
          DATE: '2025-01-01',
          TYPE: 'T2G',
          TO: 'Alice Smith',
        },
        order: { id: 1, order_num: '12345' },
        seller: { id: 1, first_name: 'Alice', last_name: 'Smith' },
      },
    ];

    mockAuditSessionsStore.mostRecentAuditSession = {
      id: 'test-id',
      profile: 'test-user-id',
      file_name: 'test.csv',
      file_size: 1024,
      created_at: '2025-01-01T12:00:00Z',
      status: 'pending',
      original_file_data: { headers: [] },
      parsed_rows: [
        { rowNumber: 1, data: [] },
        { rowNumber: 2, data: [] },
      ],
    };
    mockAuditSessionsStore.perfectMatches = mockMatches;
    mockAuditSessionsStore.perfectMatchesLoading = false;

    const wrapper = mount(AuditPerfectMatchesDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Perfect Matches Found');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('50.0%'); // 1 match out of 2 rows
  });

  it('formats matches correctly with seller information', async () => {
    const mockMatches = [
      {
        auditRow: {
          DATE: '2025-01-01',
          TYPE: 'T2G',
          TO: 'Alice Smith',
          ADV: 10,
          TM: 5,
          LEM: 3,
        },
        order: { id: 1, order_num: '12345' },
        seller: { id: 1, first_name: 'Alice', last_name: 'Smith' },
      },
    ];

    mockAuditSessionsStore.mostRecentAuditSession = {
      id: 'test-id',
      profile: 'test-user-id',
      file_name: 'test.csv',
      file_size: 1024,
      created_at: '2025-01-01T12:00:00Z',
      status: 'pending',
      original_file_data: { headers: [] },
      parsed_rows: [{ rowNumber: 1, data: [] }],
    };
    mockAuditSessionsStore.perfectMatches = mockMatches;
    mockAuditSessionsStore.perfectMatchesLoading = false;

    const wrapper = mount(AuditPerfectMatchesDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    await wrapper.vm.$nextTick();

    // Check that the component renders the DataTable with matches
    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    // Verify the match summary is displayed
    expect(wrapper.text()).toContain('Perfect Matches Found');
    expect(wrapper.text()).toContain('1');
  });
});
