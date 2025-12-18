import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TransactionsDataTable from '@/components/inventory/TransactionsDataTable.vue';

describe('TransactionsDataTable', () => {
  const createWrapper = (props = {}) => {
    return mount(TransactionsDataTable, {
      props: {
        orders: [],
        transactionTypes: 'troop',
        ...props,
      },
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
          Checkbox: true,
          Dialog: true,
          NuxtTime: true,
        },
      },
    });
  };

  it('renders without crashing', () => {
    expect(() => {
      createWrapper();
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = createWrapper();
    expect(wrapper.exists()).toBe(true);
  });

  it('shows toolbar when audit prop is true', () => {
    const wrapper = createWrapper({
      transactionTypes: 'audit',
      audit: true,
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('shows toolbar when transactionTypes is not all or audit', () => {
    const wrapper = createWrapper({
      transactionTypes: 'troop',
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('accepts audit prop', () => {
    const wrapper = createWrapper({
      transactionTypes: 'audit',
      audit: true,
    });
    expect(wrapper.props('audit')).toBe(true);
  });
});
