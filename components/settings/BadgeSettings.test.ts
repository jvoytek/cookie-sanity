import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { ref } from 'vue';
import BadgeSettings from '@/components/settings/BadgeSettings.vue';

describe('BadgeSettings', () => {
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

  it('renders without crashing', () => {
    expect(() => {
      mount(BadgeSettings, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            DataView: DataViewStub,
            ClientOnly: ClientOnlyStub,
            Button: true,
            Toolbar: true,
            Dialog: true,
            Checkbox: true,
            Message: true,
            InputText: true,
            IconField: true,
            InputIcon: true,
            Column: true,
            FormKit: true,
            FormKitSchema: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('renders the desktop table on non-mobile screens', () => {
    vi.stubGlobal('useDevice', () => ({ isMobile: ref(false) }));

    const wrapper = mount(BadgeSettings, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          DataView: DataViewStub,
          ClientOnly: ClientOnlyStub,
          Button: true,
          Toolbar: true,
          Dialog: true,
          Checkbox: true,
          Message: true,
          InputText: true,
          IconField: true,
          InputIcon: true,
          Column: true,
          FormKit: true,
          FormKitSchema: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    expect(wrapper.findComponent(DataViewStub).exists()).toBe(false);
  });

  it('renders the mobile cards on mobile screens', () => {
    vi.stubGlobal('useDevice', () => ({ isMobile: ref(true) }));

    const wrapper = mount(BadgeSettings, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          DataView: DataViewStub,
          ClientOnly: ClientOnlyStub,
          Button: true,
          Toolbar: true,
          Dialog: true,
          Checkbox: true,
          Message: true,
          InputText: true,
          IconField: true,
          InputIcon: true,
          Column: true,
          FormKit: true,
          FormKitSchema: true,
        },
      },
    });

    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(false);
    expect(wrapper.findComponent(DataViewStub).exists()).toBe(true);
  });
});
