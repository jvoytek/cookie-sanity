import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ReceiptDialog from '@/components/inventory/ReceiptDialog.vue';

describe('ReceiptDialog', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(ReceiptDialog, {
        props: {
          visible: false,
          transaction: null,
        },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Dialog: true,
            Button: true,
            CookieList: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(ReceiptDialog, {
      props: {
        visible: false,
        transaction: null,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Dialog: true,
          Button: true,
          CookieList: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
