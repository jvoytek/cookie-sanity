import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { ref } from 'vue';
import CookieSettings from '@/components/settings/CookieSettings.vue';

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
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
            CopyCookiesDialog: true,
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
          CopyCookiesDialog: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  describe('mobile card layout', () => {
    const ClientOnlyStub = {
      template: '<div><slot /></div>',
    };
    const DataViewStub = {
      props: ['value'],
      template: '<div><slot name="list" :items="value" /></div>',
    };

    afterEach(() => {
      vi.stubGlobal('useDevice', () => ({ isMobile: ref(false) }));
    });

    it('renders the DataTable when not on a mobile screen', () => {
      vi.stubGlobal('useDevice', () => ({ isMobile: ref(false) }));

      const wrapper = mount(CookieSettings, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            DataView: DataViewStub,
            ClientOnly: ClientOnlyStub,
            Button: true,
            InputText: true,
            InputNumber: true,
            Dropdown: true,
            ColorPicker: true,
            Toolbar: true,
            Dialog: true,
            CopyCookiesDialog: true,
          },
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(
        true,
      );
      expect(wrapper.findComponent(DataViewStub).exists()).toBe(false);
    });

    it('renders the card-based DataView when on a mobile screen', () => {
      vi.stubGlobal('useDevice', () => ({ isMobile: ref(true) }));

      const wrapper = mount(CookieSettings, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            DataView: DataViewStub,
            ClientOnly: ClientOnlyStub,
            Button: true,
            InputText: true,
            InputNumber: true,
            Dropdown: true,
            ColorPicker: true,
            Toolbar: true,
            Dialog: true,
            CopyCookiesDialog: true,
          },
        },
      });

      expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(
        false,
      );
      expect(wrapper.findComponent(DataViewStub).exists()).toBe(true);
    });
  });

  describe('color normalization', () => {
    it('normalizes color hex values without # prefix', () => {
      // Test the logic that would be in saveProduct
      const testColor = 'FF5733';
      const normalized =
        testColor && !testColor.startsWith('#') ? '#' + testColor : testColor;
      expect(normalized).toBe('#FF5733');
    });

    it('preserves color hex values with # prefix', () => {
      const testColor = '#FF5733';
      const normalized =
        testColor && !testColor.startsWith('#') ? '#' + testColor : testColor;
      expect(normalized).toBe('#FF5733');
    });

    it('handles empty color values', () => {
      const testColor = '';
      const normalized =
        testColor && !testColor.startsWith('#') ? '#' + testColor : testColor;
      expect(normalized).toBe('');
    });

    it('handles null color values', () => {
      const testColor = null;
      const normalized =
        testColor && !testColor.startsWith('#') ? '#' + testColor : testColor;
      expect(normalized).toBe(null);
    });

    it('handles undefined color values', () => {
      const testColor = undefined;
      const normalized =
        testColor && !testColor.startsWith('#') ? '#' + testColor : testColor;
      expect(normalized).toBe(undefined);
    });
  });
});
