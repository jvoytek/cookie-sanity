import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import GirlList from '@/components/settings/GirlList.vue';

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('GirlList', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(GirlList, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            Button: true,
            InputText: true,
            InputNumber: true,
            Dropdown: true,
            Toolbar: true,
            Dialog: true,
            Checkbox: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(GirlList, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Button: true,
          InputText: true,
          InputNumber: true,
          Dropdown: true,
          Toolbar: true,
          Dialog: true,
          Checkbox: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
