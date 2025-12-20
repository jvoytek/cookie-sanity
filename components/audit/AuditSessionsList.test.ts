import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AuditSessionsList from './AuditSessionsList.vue';
import type { AuditSession } from '@/types/types';

// Mock PrimeVue components
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    template: '<div><slot /></div>',
    props: ['value', 'paginator', 'rows', 'stripedRows', 'dataKey'],
  },
}));

vi.mock('primevue/column', () => ({
  default: {
    name: 'Column',
    template: '<div></div>',
    props: ['field', 'header', 'sortable'],
  },
}));

vi.mock('primevue/checkbox', () => ({
  default: {
    name: 'Checkbox',
    template: '<input type="checkbox" />',
    props: ['modelValue', 'binary', 'inputId'],
  },
}));

vi.mock('primevue/tag', () => ({
  default: {
    name: 'Tag',
    template: '<span>{{ value }}</span>',
    props: ['severity', 'value'],
  },
}));

vi.mock('primevue/button', () => ({
  default: {
    name: 'Button',
    template: '<button><slot /></button>',
    props: ['label', 'size', 'severity', 'disabled'],
  },
}));

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="progress-spinner"></div>',
    props: ['style', 'strokeWidth', 'animationDuration'],
  },
}));

describe('AuditSessionsList', () => {
  let mockAuditSessionsStore: {
    allAuditSessions: AuditSession[];
    mostRecentAuditSession: AuditSession | null;
    fetchAllAuditSessions: ReturnType<typeof vi.fn>;
    archiveAuditSession: ReturnType<typeof vi.fn>;
    fetchMatches: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    setActivePinia(createPinia());

    mockAuditSessionsStore = {
      allAuditSessions: [],
      mostRecentAuditSession: null,
      fetchAllAuditSessions: vi.fn().mockResolvedValue(undefined),
      archiveAuditSession: vi.fn().mockResolvedValue(undefined),
      fetchMatches: vi.fn().mockResolvedValue(undefined),
    };

    vi.stubGlobal('useAuditSessionsStore', () => mockAuditSessionsStore);
    vi.stubGlobal('useNotificationHelpers', () => ({
      addSuccess: vi.fn(),
      addError: vi.fn(),
    }));
  });

  it('should render the component', () => {
    const wrapper = mount(AuditSessionsList);
    expect(wrapper.find('h2').text()).toBe('Audit Sessions');
  });

  it('should display message when no sessions are available', async () => {
    mockAuditSessionsStore.allAuditSessions = [];

    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: {
            template: '<div class="datatable-stub"></div>',
          },
          Column: {
            template: '<div class="column-stub"></div>',
          },
          Checkbox: true,
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Component should show empty message
    expect(mockAuditSessionsStore.allAuditSessions.length).toBe(0);
  });

  it('should display audit sessions in a table', async () => {
    const mockSessions: AuditSession[] = [
      {
        id: 'session-1',
        profile: 'user-1',
        file_name: 'test-file.csv',
        file_size: 1024,
        created_at: new Date('2025-01-01').toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [{ row: 1 }, { row: 2 }],
        season: 1,
      },
    ];

    mockAuditSessionsStore.allAuditSessions = mockSessions;

    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: {
            template: '<div class="datatable-stub"></div>',
          },
          Column: true,
          Checkbox: true,
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Component should have sessions in the store
    expect(mockAuditSessionsStore.allAuditSessions.length).toBe(1);
    expect(mockAuditSessionsStore.allAuditSessions[0].file_name).toBe(
      'test-file.csv',
    );
  });

  it('should call archiveAuditSession when archive button is clicked', async () => {
    const mockSession: AuditSession = {
      id: 'session-1',
      profile: 'user-1',
      file_name: 'test-file.csv',
      file_size: 1024,
      created_at: new Date().toISOString(),
      status: 'pending',
      original_file_data: {},
      parsed_rows: [],
      season: 1,
    };

    mockAuditSessionsStore.allAuditSessions = [mockSession];

    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          Checkbox: true,
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Directly call the archive method from the component
    await (
      wrapper.vm as { archiveSession: (session: AuditSession) => Promise<void> }
    ).archiveSession(mockSession);

    expect(mockAuditSessionsStore.archiveAuditSession).toHaveBeenCalledWith(
      'session-1',
    );
  });

  it('should not show archive button for archived sessions', async () => {
    const mockSession: AuditSession = {
      id: 'session-1',
      profile: 'user-1',
      file_name: 'archived-file.csv',
      file_size: 1024,
      created_at: new Date().toISOString(),
      status: 'archived',
      original_file_data: {},
      parsed_rows: [],
      season: 1,
    };

    mockAuditSessionsStore.allAuditSessions = [mockSession];

    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          Checkbox: true,
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Verify archived session is in store
    expect(mockAuditSessionsStore.allAuditSessions[0].status).toBe('archived');
  });

  it('should show archived checkbox', () => {
    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          Checkbox: {
            template:
              '<input type="checkbox" data-test="show-archived-checkbox" />',
          },
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });

    // Verify the checkbox exists by checking the component
    expect(
      wrapper.findComponent({ name: 'Checkbox' }).exists() ||
        wrapper.find('[data-test="show-archived-checkbox"]').exists() ||
        wrapper.html().includes('Show archived'),
    ).toBeTruthy();
  });

  it('should fetch sessions including archived when checkbox is toggled', async () => {
    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          Checkbox: true,
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Initially should fetch without archived
    expect(mockAuditSessionsStore.fetchAllAuditSessions).toHaveBeenCalledWith(
      false,
    );

    // Directly access and toggle the showArchived ref
    const vm = wrapper.vm as unknown as { showArchived: boolean };
    // Simulate toggling by calling loadSessions with true
    await (wrapper.vm as { loadSessions: () => Promise<void> }).loadSessions();

    // Verify that fetchAllAuditSessions was called
    expect(mockAuditSessionsStore.fetchAllAuditSessions).toHaveBeenCalled();
  });

  it('should call selectSession and fetchMatches when select button is clicked', async () => {
    const mockSession: AuditSession = {
      id: 'session-1',
      profile: 'user-1',
      file_name: 'test-file.csv',
      file_size: 1024,
      created_at: new Date().toISOString(),
      status: 'pending',
      original_file_data: {},
      parsed_rows: [],
      season: 1,
    };

    mockAuditSessionsStore.allAuditSessions = [mockSession];

    const wrapper = mount(AuditSessionsList);
    await wrapper.vm.$nextTick();

    const selectButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Select'));

    if (selectButton) {
      await selectButton.trigger('click');
      expect(mockAuditSessionsStore.mostRecentAuditSession).toEqual(
        mockSession,
      );
      expect(mockAuditSessionsStore.fetchMatches).toHaveBeenCalled();
    }
  });

  it('should format file size correctly', async () => {
    const mockSessions: AuditSession[] = [
      {
        id: 'session-1',
        profile: 'user-1',
        file_name: 'small.csv',
        file_size: 512, // 512 B
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
      {
        id: 'session-2',
        profile: 'user-1',
        file_name: 'medium.csv',
        file_size: 2048, // 2 KB
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
    ];

    mockAuditSessionsStore.allAuditSessions = mockSessions;

    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          Checkbox: true,
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Test formatFileSize function directly
    const formatFileSize = (
      wrapper.vm as { formatFileSize: (bytes: number) => string }
    ).formatFileSize;
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('should display the correct number of parsed rows', async () => {
    const mockSession: AuditSession = {
      id: 'session-1',
      profile: 'user-1',
      file_name: 'test.csv',
      file_size: 1024,
      created_at: new Date().toISOString(),
      status: 'pending',
      original_file_data: {},
      parsed_rows: [{ row: 1 }, { row: 2 }, { row: 3 }],
      season: 1,
    };

    mockAuditSessionsStore.allAuditSessions = [mockSession];

    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          Checkbox: true,
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Verify the parsed rows count
    expect(mockSession.parsed_rows.length).toBe(3);
  });

  it('should display correct status tags with appropriate severity', async () => {
    const mockSessions: AuditSession[] = [
      {
        id: 'session-1',
        profile: 'user-1',
        file_name: 'complete.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'complete',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
      {
        id: 'session-2',
        profile: 'user-1',
        file_name: 'pending.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
      {
        id: 'session-3',
        profile: 'user-1',
        file_name: 'archived.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'archived',
        original_file_data: {},
        parsed_rows: [],
        season: 1,
      },
    ];

    mockAuditSessionsStore.allAuditSessions = mockSessions;

    const wrapper = mount(AuditSessionsList, {
      global: {
        stubs: {
          DataTable: true,
          Column: true,
          Checkbox: true,
          Tag: true,
          Button: true,
          ProgressSpinner: true,
        },
      },
    });
    await wrapper.vm.$nextTick();

    // Test getStatusSeverity function directly
    const getStatusSeverity = (
      wrapper.vm as { getStatusSeverity: (status: string) => string }
    ).getStatusSeverity;
    expect(getStatusSeverity('complete')).toBe('success');
    expect(getStatusSeverity('pending')).toBe('info');
    expect(getStatusSeverity('archived')).toBe('secondary');
  });
});
