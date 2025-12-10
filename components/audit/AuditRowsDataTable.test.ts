import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AuditRowsDataTable from '@/components/audit/AuditRowsDataTable.vue';

describe('AuditRowsDataTable', () => {
  let mockAuditSessionsStore: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuditSessionsStore = {
      mostRecentAuditSession: null,
      fetchMostRecentAuditSession: vi.fn().mockResolvedValue(undefined),
    };

    vi.stubGlobal('useAuditSessionsStore', () => mockAuditSessionsStore);
  });

  it('renders without crashing', () => {
    expect(() => {
      mount(AuditRowsDataTable, {
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

  it('displays loading state initially', () => {
    const wrapper = mount(AuditRowsDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Loading audit data...');
  });

  it('displays empty state when no audit session exists', async () => {
    mockAuditSessionsStore.mostRecentAuditSession = null;

    const wrapper = mount(AuditRowsDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    // Wait for mounted hook to complete
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('No audit data uploaded yet');
  });

  it('displays file metadata when audit session exists', async () => {
    const mockSession = {
      id: 'test-id',
      profile: 'test-user-id',
      file_name: 'test-file.csv',
      file_size: 2048,
      created_at: '2025-01-01T12:00:00Z',
      status: 'pending',
      original_file_data: {
        headers: ['Column1', 'Column2'],
        rows: [['value1', 'value2']],
      },
      parsed_rows: [{ rowNumber: 1, data: ['value1', 'value2'] }],
    };

    mockAuditSessionsStore.mostRecentAuditSession = mockSession;

    const wrapper = mount(AuditRowsDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    // Wait for mounted hook to complete
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('test-file.csv');
    expect(wrapper.text()).toContain('2.00 KB');
  });

  it('calls fetchMostRecentAuditSession on mount', () => {
    mount(AuditRowsDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(
      mockAuditSessionsStore.fetchMostRecentAuditSession,
    ).toHaveBeenCalled();
  });

  it('formats rows correctly for DataTable display', async () => {
    const mockSession = {
      id: 'test-id',
      profile: 'test-user-id',
      file_name: 'test.csv',
      file_size: 1024,
      created_at: '2025-01-01T12:00:00Z',
      status: 'pending',
      original_file_data: {
        headers: ['Name', 'Age', 'City'],
      },
      parsed_rows: [
        { rowNumber: 1, data: ['Alice', '30', 'NYC'] },
        { rowNumber: 2, data: ['Bob', '25', 'LA'] },
      ],
    };

    mockAuditSessionsStore.mostRecentAuditSession = mockSession;

    const wrapper = mount(AuditRowsDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    // Wait for mounted hook to complete
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Component should be rendered with DataTable
    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
  });

  it('displays row count in metadata', async () => {
    const mockSession = {
      id: 'test-id',
      profile: 'test-user-id',
      file_name: 'data.csv',
      file_size: 5120,
      created_at: '2025-01-01T12:00:00Z',
      status: 'pending',
      original_file_data: {
        headers: ['Col1'],
      },
      parsed_rows: [
        { rowNumber: 1, data: ['val1'] },
        { rowNumber: 2, data: ['val2'] },
        { rowNumber: 3, data: ['val3'] },
      ],
    };

    mockAuditSessionsStore.mostRecentAuditSession = mockSession;

    const wrapper = mount(AuditRowsDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    // Wait for mounted hook to complete
    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.text()).toContain('3');
  });
});
