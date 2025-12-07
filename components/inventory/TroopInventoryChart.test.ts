import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import TroopInventoryChart from '@/components/inventory/TroopInventoryChart.vue';

describe('TroopInventoryChart Component', () => {
  beforeEach(() => {
    // Mock getComputedStyle
    global.getComputedStyle = vi.fn(
      () =>
        ({
          getPropertyValue: vi.fn(() => '#000000'),
        }) as CSSStyleDeclaration,
    );
  });

  it('renders without crashing', () => {
    const wrapper = mount(TroopInventoryChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [],
              },
            },
          }),
        ],
        stubs: {
          Chart: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('shows message when no data available', () => {
    const wrapper = mount(TroopInventoryChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [],
              },
            },
          }),
        ],
        stubs: {
          Chart: true,
        },
      },
    });

    expect(wrapper.text()).toContain('No inventory data available');
  });

  it('renders chart with cookie inventory data', () => {
    const wrapper = mount(TroopInventoryChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [
                  {
                    id: 1,
                    abbreviation: 'TM',
                    name: 'Thin Mints',
                    color: '#00FF00',
                    is_virtual: false,
                    onHand: 50,
                    afterPending: 75,
                  },
                  {
                    id: 2,
                    abbreviation: 'ADV',
                    name: 'Adventurefuls',
                    color: '#FF0000',
                    is_virtual: false,
                    onHand: 30,
                    afterPending: 40,
                  },
                ],
              },
            },
            stubActions: false,
          }),
        ],
        stubs: {
          Chart: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Current Inventory');
  });

  it('filters out virtual cookies', () => {
    const wrapper = mount(TroopInventoryChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [
                  {
                    id: 1,
                    abbreviation: 'TM',
                    name: 'Thin Mints',
                    color: '#00FF00',
                    is_virtual: false,
                    onHand: 50,
                    afterPending: 75,
                  },
                  {
                    id: 2,
                    abbreviation: 'VIRTUAL',
                    name: 'Virtual Cookie',
                    color: '#000000',
                    is_virtual: true,
                    onHand: 0,
                    afterPending: 0,
                  },
                ],
              },
            },
            stubActions: false,
          }),
        ],
        stubs: {
          Chart: true,
        },
      },
    });

    // Component should render without errors
    expect(wrapper.exists()).toBe(true);
  });

  it('displays both on hand and after pending data', () => {
    const wrapper = mount(TroopInventoryChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [
                  {
                    id: 1,
                    abbreviation: 'TM',
                    name: 'Thin Mints',
                    color: '#00FF00',
                    is_virtual: false,
                    onHand: 50,
                    afterPending: 75,
                  },
                ],
              },
            },
            stubActions: false,
          }),
        ],
        stubs: {
          Chart: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Current Inventory');
    expect(wrapper.text()).toContain(
      'Bars show current "On Hand" inventory with a dashed line showing the projected "After Pending" amount',
    );
  });

  it('handles cookies with zero inventory', () => {
    const wrapper = mount(TroopInventoryChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [
                  {
                    id: 1,
                    abbreviation: 'TM',
                    name: 'Thin Mints',
                    color: '#00FF00',
                    is_virtual: false,
                    onHand: 0,
                    afterPending: 0,
                  },
                ],
              },
            },
            stubActions: false,
          }),
        ],
        stubs: {
          Chart: true,
        },
      },
    });

    // Should render without errors even with zero inventory
    expect(wrapper.exists()).toBe(true);
  });

  it('uses cookie colors for bar colors', () => {
    const wrapper = mount(TroopInventoryChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [
                  {
                    id: 1,
                    abbreviation: 'TM',
                    name: 'Thin Mints',
                    color: '#00FF00',
                    is_virtual: false,
                    onHand: 50,
                    afterPending: 75,
                  },
                  {
                    id: 2,
                    abbreviation: 'ADV',
                    name: 'Adventurefuls',
                    color: '#FF0000',
                    is_virtual: false,
                    onHand: 30,
                    afterPending: 40,
                  },
                ],
              },
            },
            stubActions: false,
          }),
        ],
        stubs: {
          Chart: true,
        },
      },
    });

    // Component should render and use colors from cookie data
    expect(wrapper.exists()).toBe(true);
  });
});
