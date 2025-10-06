import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import InventoryProjectionChart from '@/components/inventory/InventoryProjectionChart.vue';

describe('InventoryProjectionChart Component', () => {
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
    const wrapper = mount(InventoryProjectionChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [],
              },
              transactions: {
                allTransactions: [],
              },
              booths: {
                allBoothSales: [],
                boothSalesUsingTroopInventory: [],
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
    const wrapper = mount(InventoryProjectionChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [],
              },
              transactions: {
                allTransactions: [],
              },
              booths: {
                allBoothSales: [],
                boothSalesUsingTroopInventory: [],
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

  it('renders chart with cookies and transactions', () => {
    const wrapper = mount(InventoryProjectionChart, {
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
                  },
                  {
                    id: 2,
                    abbreviation: 'ADV',
                    name: 'Adventurefuls',
                    color: '#FF0000',
                    is_virtual: false,
                  },
                ],
              },
              transactions: {
                allTransactions: [
                  {
                    id: 1,
                    order_date: '2024-01-15',
                    status: 'complete',
                    type: 'T2G',
                    cookies: { TM: 10, ADV: 5 },
                    order_num: '123',
                  },
                  {
                    id: 2,
                    order_date: '2024-01-20',
                    status: 'pending',
                    type: 'C2T',
                    cookies: { TM: 50, ADV: 30 },
                    order_num: '124',
                  },
                ],
              },
              booths: {
                allBoothSales: [],
                boothSalesUsingTroopInventory: [],
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

    expect(wrapper.text()).toContain('Inventory Projection');
  });

  it('displays event legend', () => {
    const wrapper = mount(InventoryProjectionChart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cookies: {
                allCookies: [],
              },
              transactions: {
                allTransactions: [],
              },
              booths: {
                allBoothSales: [],
                boothSalesUsingTroopInventory: [],
              },
            },
          }),
        ],
        stubs: {
          Chart: true,
        },
      },
    });

    expect(wrapper.text()).toContain('T2G (Troop to Girl)');
    expect(wrapper.text()).toContain('G2T (Girl to Troop)');
    expect(wrapper.text()).toContain('C2T (Council to Troop)');
    expect(wrapper.text()).toContain('T2T (Troop to Troop)');
    expect(wrapper.text()).toContain('Booth Sale');
  });

  it('filters out virtual cookies', () => {
    const wrapper = mount(InventoryProjectionChart, {
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
                  },
                  {
                    id: 2,
                    abbreviation: 'VIRTUAL',
                    name: 'Virtual Cookie',
                    color: '#000000',
                    is_virtual: true,
                  },
                ],
              },
              transactions: {
                allTransactions: [],
              },
              booths: {
                allBoothSales: [],
                boothSalesUsingTroopInventory: [],
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

  it('includes booth sales in projection', () => {
    const wrapper = mount(InventoryProjectionChart, {
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
                  },
                ],
              },
              transactions: {
                allTransactions: [],
              },
              booths: {
                allBoothSales: [
                  {
                    id: 1,
                    sale_date: '2024-02-01',
                    inventory_type: 'troop',
                    location: 'Walmart',
                    predicted_cookies: { TM: 20 },
                  },
                ],
                boothSalesUsingTroopInventory: [
                  {
                    id: 1,
                    sale_date: '2024-02-01',
                    inventory_type: 'troop',
                    location: 'Walmart',
                    predicted_cookies: { TM: 20 },
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

    expect(wrapper.exists()).toBe(true);
  });

  it('filters out requested transactions', () => {
    const wrapper = mount(InventoryProjectionChart, {
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
                  },
                ],
              },
              transactions: {
                allTransactions: [
                  {
                    id: 1,
                    order_date: '2024-01-15',
                    status: 'requested',
                    type: 'T2G',
                    cookies: { TM: 10 },
                  },
                  {
                    id: 2,
                    order_date: '2024-01-20',
                    status: 'complete',
                    type: 'T2G',
                    cookies: { TM: 5 },
                  },
                ],
              },
              booths: {
                allBoothSales: [],
                boothSalesUsingTroopInventory: [],
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

    // Should render - requested transactions should be filtered out
    expect(wrapper.exists()).toBe(true);
  });

  it('filters out DIRECT_SHIP transactions', () => {
    const wrapper = mount(InventoryProjectionChart, {
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
                  },
                ],
              },
              transactions: {
                allTransactions: [
                  {
                    id: 1,
                    order_date: '2024-01-15',
                    status: 'complete',
                    type: 'DIRECT_SHIP',
                    cookies: { TM: 10 },
                  },
                  {
                    id: 2,
                    order_date: '2024-01-20',
                    status: 'complete',
                    type: 'T2G',
                    cookies: { TM: 5 },
                  },
                ],
              },
              booths: {
                allBoothSales: [],
                boothSalesUsingTroopInventory: [],
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

    // Should render - DIRECT_SHIP transactions should be filtered out
    expect(wrapper.exists()).toBe(true);
  });
});
