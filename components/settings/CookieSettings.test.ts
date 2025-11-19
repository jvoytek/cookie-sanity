import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import CookieSettings from '@/components/settings/CookieSettings.vue';

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

// Mock usePermissions composable
vi.stubGlobal('usePermissions', () => ({
  canCreateCookies: true,
}));

describe('CookieSettings', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(CookieSettings, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            Button: true,
            InputText: true,
            InputNumber: true,
            Dropdown: true,
            ColorPicker: true,
            Toolbar: true,
            Dialog: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(CookieSettings, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Button: true,
          InputText: true,
          InputNumber: true,
          Dropdown: true,
          ColorPicker: true,
          Toolbar: true,
          Dialog: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
