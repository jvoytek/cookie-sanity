import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AllTransactions from '@/components/inventory/AllTransactions.vue';

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('AllTransactions', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(AllTransactions, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            Button: true,
            InputText: true,
            Dropdown: true,
            Toolbar: true,
            Dialog: true,
            TransactionDialog: true,
            Badge: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(AllTransactions, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Button: true,
          InputText: true,
          Dropdown: true,
          Toolbar: true,
          Dialog: true,
          TransactionDialog: true,
          Badge: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
