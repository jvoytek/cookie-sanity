import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TroopInventoryTabs from '@/components/inventory/TroopInventoryTabs.vue';

describe('TroopInventoryTabs', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(TroopInventoryTabs, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            TabView: true,
            TabPanel: true,
            TroopCurrentInventoryDataTable: true,
            DataTable: true,
            Column: true,
            Button: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(TroopInventoryTabs, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          TabView: true,
          TabPanel: true,
          TroopCurrentInventoryDataTable: true,
          DataTable: true,
          Column: true,
          Button: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
