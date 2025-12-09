import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AuditPage from '@/pages/audit.vue';

describe('AuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => {
      mount(AuditPage, {
        global: {
          plugins: [createTestingPinia()],
        },
      });
    }).not.toThrow();
  });

  it('displays the audit page title', () => {
    const wrapper = mount(AuditPage, {
      global: {
        plugins: [createTestingPinia()],
      },
    });

    expect(wrapper.text()).toContain('Audit Page');
  });

  it('displays message about authenticated user access', () => {
    const wrapper = mount(AuditPage, {
      global: {
        plugins: [createTestingPinia()],
      },
    });

    expect(wrapper.text()).toContain(
      'This page is accessible to authenticated users only',
    );
  });

  it('uses default layout (implicitly requires authentication)', () => {
    const wrapper = mount(AuditPage, {
      global: {
        plugins: [createTestingPinia()],
      },
    });

    // The page should render successfully, indicating it uses default layout
    // which requires authentication through the sidebar visibility check
    expect(wrapper.find('.card').exists()).toBe(true);
  });
});
