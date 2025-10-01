import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TransactionsDataTable from '@/components/inventory/TransactionsDataTable.vue';

describe('TransactionsDataTable', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(TransactionsDataTable, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            Column: true,
            Button: true,
            InputText: true,
            Toolbar: true,
            ConfirmDialog: true,
            TransactionDialog: true,
            Badge: true,
            CookieList: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(TransactionsDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          Button: true,
          InputText: true,
          Toolbar: true,
          ConfirmDialog: true,
          TransactionDialog: true,
          Badge: true,
          CookieList: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
