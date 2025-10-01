import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TransactionDialog from '@/components/inventory/TransactionDialog.vue';

describe('TransactionDialog', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(TransactionDialog, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Dialog: true,
            FormKit: true,
            Button: true,
            InputText: true,
            InputNumber: true,
            Dropdown: true,
            Calendar: true,
            Textarea: true,
            CookieList: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(TransactionDialog, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Dialog: true,
          FormKit: true,
          Button: true,
          InputText: true,
          InputNumber: true,
          Dropdown: true,
          Calendar: true,
          Textarea: true,
          CookieList: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
