import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AuditPartialMatchesDataTable from '@/components/audit/AuditPartialMatchesDataTable.vue';

describe('AuditPartialMatchesDataTable', () => {
  let mockAuditSessionsStore: ReturnType<typeof vi.fn>;
  let mockCookiesStore: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuditSessionsStore = {
      mostRecentAuditSession: null,
      partialMatches: [],
      matchesLoading: false,
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
      mount(AuditPartialMatchesDataTable, {
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

    const wrapper = mount(AuditPartialMatchesDataTable, {
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
      'No audit data uploaded yet. Upload a file to see partial matches.',
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
    mockAuditSessionsStore.matchesLoading = true;

    const wrapper = mount(AuditPartialMatchesDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Finding partial matches...');
    expect(wrapper.findComponent({ name: 'ProgressSpinner' }).exists()).toBe(
      true,
    );
  });

  it('displays message when no partial matches found', () => {
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
    mockAuditSessionsStore.partialMatches = [];
    mockAuditSessionsStore.matchesLoading = false;

    const wrapper = mount(AuditPartialMatchesDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain('No partial matches found.');
  });

  it('displays partial matches in DataTable', async () => {
    const mockPartialMatches = [
      {
        auditRow: {
          DATE: '2025-01-01',
          TYPE: 'T2G',
          TO: 'Alice Smith',
          FROM: null,
          ADV: 10,
          TM: 5,
        },
        matchedOrders: [
          {
            order: {
              id: 1,
              order_num: '12345',
              order_date: '2025-01-03',
              type: 'T2G',
              cookies: { ADV: 11, TM: 5, LEM: 0 },
            },
            orderToGirl: {
              id: 1,
              first_name: 'Alice',
              last_name: 'Smyth',
            },
            orderFromGirl: null,
            matchScore: 66.7,
            matchDetails: {
              dateMatch: true,
              typeMatch: true,
              toMatch: true,
              fromMatch: true,
              cookieMatchPercent: 66.7,
              nonCookieFieldsMatched: 3,
            },
          },
        ],
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
      ],
    };
    mockAuditSessionsStore.partialMatches = mockPartialMatches;
    mockAuditSessionsStore.matchesLoading = false;

    const wrapper = mount(AuditPartialMatchesDataTable, {
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

    expect(wrapper.text()).toContain('1');
    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
  });

  it('displays match summary statistics', async () => {
    const mockPartialMatches = [
      {
        auditRow: {
          DATE: '2025-01-01',
          TYPE: 'T2G',
          TO: 'Alice Smith',
        },
        matchedOrders: [
          {
            order: { id: 1, order_num: '12345' },
            orderToGirl: { id: 1, first_name: 'Alice', last_name: 'Smyth' },
            orderFromGirl: null,
            matchScore: 75.0,
            matchDetails: {
              dateMatch: true,
              typeMatch: true,
              toMatch: true,
              fromMatch: true,
              cookieMatchPercent: 75.0,
              nonCookieFieldsMatched: 3,
            },
          },
        ],
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
    mockAuditSessionsStore.partialMatches = mockPartialMatches;
    mockAuditSessionsStore.matchesLoading = false;

    const wrapper = mount(AuditPartialMatchesDataTable, {
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

    expect(wrapper.text()).toContain('Partial Matches Found');
    expect(wrapper.text()).toContain('1');
  });
});
