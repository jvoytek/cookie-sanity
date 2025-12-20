import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AuditFileUpload from './AuditFileUpload.vue';

// Mock PrimeVue components
vi.mock('primevue/fileupload', () => ({
  default: {
    name: 'FileUpload',
    template: '<div class="p-fileupload"></div>',
  },
}));

vi.mock('primevue/progressspinner', () => ({
  default: {
    name: 'ProgressSpinner',
    template: '<div class="p-progressspinner"></div>',
  },
}));

describe('AuditFileUpload', () => {
  let mockAuditSessionsStore: ReturnType<typeof vi.fn>;
  let mockNotificationHelpers: ReturnType<typeof vi.fn>;
  let mockFileUploadHelpers: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuditSessionsStore = {
      insertAuditSession: vi.fn().mockResolvedValue({
        id: 'test-id',
        profile: 'test-user-id',
        file_name: 'test.csv',
        file_size: 1024,
        created_at: new Date().toISOString(),
        status: 'pending',
        original_file_data: {},
        parsed_rows: [],
      }),
    };

    mockNotificationHelpers = {
      addError: vi.fn(),
      addSuccess: vi.fn(),
    };

    mockFileUploadHelpers = {
      validateFile: vi.fn().mockReturnValue({ valid: true }),
      parseFile: vi.fn().mockResolvedValue({
        headers: ['col1', 'col2'],
        rows: [
          ['val1', 'val2'],
          ['val3', 'val4'],
        ],
        rowCount: 2,
      }),
      MAX_ROWS: 2000,
      MAX_FILE_SIZE: 5 * 1024 * 1024,
    };

    vi.stubGlobal('useAuditSessionsStore', () => mockAuditSessionsStore);
    vi.stubGlobal('useNotificationHelpers', () => mockNotificationHelpers);
    vi.stubGlobal('useAuditFileUpload', () => mockFileUploadHelpers);
  });

  it('renders without crashing', () => {
    expect(() => {
      mount(AuditFileUpload, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            FileUpload: true,
            ProgressSpinner: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('displays the upload section title', () => {
    const wrapper = mount(AuditFileUpload, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          FileUpload: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Upload File for Audit');
  });

  it('displays file requirements', () => {
    const wrapper = mount(AuditFileUpload, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          FileUpload: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.text()).toContain('File format: CSV or XLSX only');
    expect(wrapper.text()).toContain('Maximum rows: 2,000');
    expect(wrapper.text()).toContain('Maximum file size');
  });

  it('shows FileUpload component', () => {
    const wrapper = mount(AuditFileUpload, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          FileUpload: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'FileUpload' }).exists()).toBe(true);
  });

  it('does not show progress spinner initially', () => {
    const wrapper = mount(AuditFileUpload, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          FileUpload: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'ProgressSpinner' }).exists()).toBe(
      false,
    );
  });
});
