import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import DashboardQuickNumbers from '@/components/inventory/DashboardQuickNumbers.vue';

describe('DashboardQuickNumbers', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(DashboardQuickNumbers, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Fieldset: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(DashboardQuickNumbers, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Fieldset: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders four fieldsets for dashboard metrics', () => {
    const wrapper = mount(DashboardQuickNumbers, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Fieldset: true,
        },
      },
    });

    const fieldsets = wrapper.findAllComponents({ name: 'Fieldset' });
    expect(fieldsets).toHaveLength(4);
  });

  it('renders with proper grid layout structure', () => {
    const wrapper = mount(DashboardQuickNumbers, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Fieldset: true,
        },
      },
    });

    // Check for grid container
    const gridContainer = wrapper.find('.grid');
    expect(gridContainer.exists()).toBe(true);
    expect(gridContainer.classes()).toContain('grid-cols-12');
  });
});
