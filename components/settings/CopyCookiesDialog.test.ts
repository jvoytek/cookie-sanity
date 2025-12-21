import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import CopyCookiesDialog from '@/components/settings/CopyCookiesDialog.vue';

describe('CopyCookiesDialog', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(CopyCookiesDialog, {
        props: {
          visible: false,
        },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Dialog: true,
            Select: true,
            Button: true,
            DataTable: true,
            Column: true,
            ProgressSpinner: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(CopyCookiesDialog, {
      props: {
        visible: false,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Dialog: true,
          Select: true,
          Button: true,
          DataTable: true,
          Column: true,
          ProgressSpinner: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
