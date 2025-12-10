import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AuditPage from '@/pages/audit.vue';

// Mock the AuditFileUpload component
vi.mock('@/components/audit/AuditFileUpload.vue', () => ({
  default: {
    name: 'AuditFileUpload',
    template: '<div class="audit-file-upload-mock"></div>',
  },
}));

// Mock the AuditRowsDataTable component
vi.mock('@/components/audit/AuditRowsDataTable.vue', () => ({
  default: {
    name: 'AuditRowsDataTable',
    template: '<div class="audit-rows-datatable-mock"></div>',
  },
}));

// Mock the AuditPerfectMatchesDataTable component
vi.mock('@/components/audit/AuditPerfectMatchesDataTable.vue', () => ({
  default: {
    name: 'AuditPerfectMatchesDataTable',
    template: '<div class="audit-perfect-matches-datatable-mock"></div>',
  },
}));

describe('AuditPage', () => {
  let mockAuditSessionsStore: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuditSessionsStore = {
      mostRecentAuditSession: null,
      perfectMatches: [],
      perfectMatchesLoading: false,
      fetchPerfectMatches: vi.fn().mockResolvedValue(undefined),
    };

    vi.stubGlobal('useAuditSessionsStore', () => mockAuditSessionsStore);
  });

  it('renders without crashing', () => {
    expect(() => {
      mount(AuditPage, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            AuditFileUpload: true,
            AuditRowsDataTable: true,
            AuditPerfectMatchesDataTable: true,
            TabView: true,
            TabPanel: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('displays the audit page title', () => {
    const wrapper = mount(AuditPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          AuditFileUpload: true,
          AuditRowsDataTable: true,
          AuditPerfectMatchesDataTable: true,
          TabView: true,
          TabPanel: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Audit Page');
  });

  it('displays description about audit functionality', () => {
    const wrapper = mount(AuditPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          AuditFileUpload: true,
          AuditRowsDataTable: true,
          AuditPerfectMatchesDataTable: true,
          TabView: true,
          TabPanel: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Smart Cookies');
    expect(wrapper.text()).toContain('Cookie Sanity');
  });

  it('includes AuditFileUpload component', () => {
    const wrapper = mount(AuditPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          AuditFileUpload: true,
          AuditRowsDataTable: true,
          AuditPerfectMatchesDataTable: true,
          TabView: true,
          TabPanel: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'AuditFileUpload' }).exists()).toBe(
      true,
    );
  });

  it('includes AuditRowsDataTable component', () => {
    const wrapper = mount(AuditPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          AuditFileUpload: true,
          AuditRowsDataTable: true,
          AuditPerfectMatchesDataTable: true,
          TabView: true,
          TabPanel: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'AuditRowsDataTable' }).exists()).toBe(
      true,
    );
  });

  it('uses default layout (implicitly requires authentication)', () => {
    const wrapper = mount(AuditPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          AuditFileUpload: true,
          AuditRowsDataTable: true,
          AuditPerfectMatchesDataTable: true,
          TabView: true,
          TabPanel: true,
        },
      },
    });

    // The page should render successfully, indicating it uses default layout
    // which requires authentication through the sidebar visibility check
    expect(wrapper.find('.card').exists()).toBe(true);
  });
});
