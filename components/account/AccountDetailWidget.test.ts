import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AccountDetailWidget from '@/components/account/AccountDetailWidget.vue';

describe('AccountDetailWidget', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(AccountDetailWidget, {
        props: {
          girlId: 1,
        },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Card: true,
            DataTable: true,
            Column: true,
            Button: true,
            Badge: true,
            Dialog: true,
            PaymentDialog: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(AccountDetailWidget, {
      props: {
        girlId: 1,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Card: true,
          DataTable: true,
          Column: true,
          Button: true,
          Badge: true,
          Dialog: true,
          PaymentDialog: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
