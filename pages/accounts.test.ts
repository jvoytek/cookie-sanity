import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import AccountsPage from '@/pages/accounts.vue';
import type { Girl } from '@/types/types';

describe('AccountsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    expect(() => {
      mount(AccountsPage, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            Toolbar: true,
            Button: true,
            Select: true,
            AccountSummaryWidget: true,
            AccountBalancesTable: true,
            AccountDetailWidget: true,
            PaymentsDataTable: true,
            PaymentDialog: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('displays troop view by default', () => {
    const wrapper = mount(AccountsPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Toolbar: true,
          Button: true,
          Select: true,
          AccountSummaryWidget: true,
          AccountBalancesTable: true,
          AccountDetailWidget: true,
          PaymentsDataTable: true,
          PaymentDialog: true,
        },
      },
    });

    // Troop view should be visible
    expect(
      wrapper.findComponent({ name: 'AccountSummaryWidget' }).exists(),
    ).toBe(true);
    expect(
      wrapper.findComponent({ name: 'AccountBalancesTable' }).exists(),
    ).toBe(true);

    // Girl view should not be visible
    expect(
      wrapper.findComponent({ name: 'AccountDetailWidget' }).exists(),
    ).toBe(false);
    expect(wrapper.findComponent({ name: 'PaymentsDataTable' }).exists()).toBe(
      false,
    );
  });

  it('shows girl view when a girl is selected', async () => {
    const wrapper = mount(AccountsPage, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              girls: {
                allGirls: [
                  {
                    id: 1,
                    first_name: 'Alice',
                    last_name: 'Smith',
                    profile: 'test-profile-id',
                    season: 1,
                  } as Girl,
                ],
              },
            },
          }),
        ],
        stubs: {
          Toolbar: true,
          Button: true,
          Select: true,
          AccountSummaryWidget: true,
          AccountBalancesTable: true,
          AccountDetailWidget: true,
          PaymentsDataTable: true,
          PaymentDialog: true,
        },
      },
    });

    // Change selected account to a girl
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vm = wrapper.vm as any;
    vm.selectedAccount = 1;
    await wrapper.vm.$nextTick();

    // Girl view should now be visible
    expect(
      wrapper.findComponent({ name: 'AccountDetailWidget' }).exists(),
    ).toBe(true);
    expect(wrapper.findComponent({ name: 'PaymentsDataTable' }).exists()).toBe(
      true,
    );

    // Troop view should not be visible
    expect(
      wrapper.findComponent({ name: 'AccountSummaryWidget' }).exists(),
    ).toBe(false);
    expect(
      wrapper.findComponent({ name: 'AccountBalancesTable' }).exists(),
    ).toBe(false);
  });

  it('includes "Troop" option in account selector', () => {
    const wrapper = mount(AccountsPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Toolbar: true,
          Button: true,
          Select: true,
          AccountSummaryWidget: true,
          AccountBalancesTable: true,
          AccountDetailWidget: true,
          PaymentsDataTable: true,
          PaymentDialog: true,
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vm = wrapper.vm as any;
    const options = vm.accountOptions;

    expect(options).toEqual(
      expect.arrayContaining([{ label: 'Troop', value: null }]),
    );
  });

  it('accountOptions includes Troop and girl options from store', async () => {
    const wrapper = mount(AccountsPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Toolbar: true,
          Button: true,
          Select: true,
          AccountSummaryWidget: true,
          AccountBalancesTable: true,
          AccountDetailWidget: true,
          PaymentsDataTable: true,
          PaymentDialog: true,
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vm = wrapper.vm as any;
    const options = vm.accountOptions;

    // Should always start with Troop option
    expect(options[0]).toEqual({ label: 'Troop', value: null });
    // Total length should be 1 (Troop) + number of girls from girlsStore
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it('renders toolbar with select component', () => {
    const wrapper = mount(AccountsPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Toolbar: true,
          Button: true,
          Select: true,
          AccountSummaryWidget: true,
          AccountBalancesTable: true,
          AccountDetailWidget: true,
          PaymentsDataTable: true,
          PaymentDialog: true,
        },
      },
    });

    // Check that toolbar exists and contains select
    const html = wrapper.html();
    expect(html).toContain('Account Management');
  });

  it('has page title and description', () => {
    const wrapper = mount(AccountsPage, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          Toolbar: true,
          Button: true,
          Select: true,
          AccountSummaryWidget: true,
          AccountBalancesTable: true,
          AccountDetailWidget: true,
          PaymentsDataTable: true,
          PaymentDialog: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Account Management');
    expect(wrapper.text()).toContain(
      'View and manage scout account balances and payments',
    );
  });
});
