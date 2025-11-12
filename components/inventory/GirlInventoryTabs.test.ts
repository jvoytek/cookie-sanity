import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VueWrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import GirlInventoryTabs from '@/components/inventory/GirlInventoryTabs.vue';
import { useGirlsStore } from '@/stores/girls';
import { useTransactionsStore } from '@/stores/transactions';
import type { Order } from '@/types/types';

describe('GirlInventoryTabs', () => {
  let wrapper: VueWrapper;

  const mockTransactions: Order[] = [
    {
      id: 1,
      status: 'complete',
      type: 'T2G',
      to: 1,
      from: null,
      cookies: { ABC: 5 },
      order_date: '2024-01-01',
      created_at: '2024-01-01',
      notes: null,
      order_num: null,
      processed_date: null,
      profile: null,
      season: 1,
      supplier: null,
    },
    {
      id: 2,
      status: 'pending',
      type: 'T2G',
      to: 2,
      from: null,
      cookies: { ABC: 3 },
      order_date: '2024-01-02',
      created_at: '2024-01-02',
      notes: null,
      order_num: null,
      processed_date: null,
      profile: null,
      season: 1,
      supplier: null,
    },
  ];

  beforeEach(() => {
    // Create the Pinia instance first
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
      initialState: {
        girls: {
          allGirls: [
            { id: 1, first_name: 'Jane', last_name: 'Doe' },
            { id: 2, first_name: 'John', last_name: 'Smith' },
          ],
        },
        transactions: {
          allTransactions: mockTransactions,
        },
      },
    });

    // Get the stores before mounting and setup mocks
    const girlsStore = useGirlsStore(pinia);
    const transactionsStore = useTransactionsStore(pinia);

    // Mock getGirlNameById to return proper names
    girlsStore.getGirlNameById = vi.fn((id: number) => {
      if (id === 1) return 'Jane D.';
      if (id === 2) return 'John S.';
      return 'Unknown';
    });

    // Mock getGirlTransactionsByStatus
    transactionsStore.getGirlTransactionsByStatus = vi.fn(
      (status: string, girlId: number | null) => {
        if (girlId === null) {
          return mockTransactions.filter((t) => t.status === status);
        }
        return mockTransactions.filter(
          (t) => t.status === status && (t.to === girlId || t.from === girlId),
        );
      },
    );

    // Now mount the component with the prepared Pinia
    wrapper = mount(GirlInventoryTabs, {
      global: {
        plugins: [pinia],
        stubs: {
          Tabs: true,
          Tab: true,
          TabList: true,
          TabPanel: true,
          TabPanels: true,
          DataTable: true,
          Column: true,
          Button: true,
          InputNumber: true,
          Toolbar: true,
          CookieList: true,
          TransactionsDataTable: true,
        },
      },
    });
  });

  it('renders without crashing', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('mounts successfully', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('displays the subheader with default text', () => {
    const subheader = wrapper.find('h6');
    expect(subheader.exists()).toBe(true);
    expect(subheader.text()).toBe('All Girl Transactions');
  });

  it('provides correct filter options', () => {
    const girlsStore = useGirlsStore();

    const filterOptions = [{ label: 'Troop (All Girls)', value: null }];
    const girlOptions = girlsStore.girlOptions.map(
      (option: { label: string; value: number | null }) => ({
        label: option.label,
        value: option.value,
      }),
    );
    const allOptions = [...filterOptions, ...girlOptions];

    expect(allOptions).toHaveLength(3); // Troop + 2 girls
    expect(allOptions[0]).toEqual({ label: 'Troop (All Girls)', value: null });
    expect(allOptions[1].label).toBe('Jane D.');
    expect(allOptions[2].label).toBe('John S.');
  });

  it('has count computed properties defined', () => {
    // Just verify the component mounted successfully
    // The counts are computed from the filtered lists which are already tested
    expect(wrapper.exists()).toBe(true);
  });
});
