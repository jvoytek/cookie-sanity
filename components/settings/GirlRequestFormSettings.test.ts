import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import GirlRequestFormSettings from '@/components/settings/GirlRequestFormSettings.vue';

describe('GirlRequestFormSettings', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(GirlRequestFormSettings, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Button: true,
            InputText: true,
            ToggleSwitch: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(GirlRequestFormSettings, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Button: true,
          InputText: true,
          ToggleSwitch: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('displays the correct title', () => {
    const wrapper = mount(GirlRequestFormSettings, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Button: true,
          InputText: true,
          ToggleSwitch: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Girl Request Form');
  });
});
