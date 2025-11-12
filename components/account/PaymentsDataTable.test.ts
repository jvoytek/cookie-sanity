import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import PaymentsDataTable from '@/components/account/PaymentsDataTable.vue';
import type { GirlAccountSummary } from '@/types/types';

describe('PaymentsDataTable', () => {
  const mockGirlAccount: GirlAccountSummary = {
    girl: {
      id: 1,
      first_name: 'Jane',
      last_name: 'Doe',
      profile: 'test-profile',
      season: 1,
      created_at: '2024-01-01',
    },
    distributedValue: 100,
    paymentsReceived: 50,
    balance: -50,
    status: 'Balance Due',
    totalAllCookiesDistributed: 20,
    totalDirectShipCookies: 5,
    totalVirtualCookiesDistributed: 3,
    totalPhysicalCookiesDistributed: 17,
    cookieTotalsByVariety: { TM: 10, SM: 10 },
    estimatedSales: 25,
    girlPaymentsList: [],
    cookieSummary: {
      directShipped: {},
      directShippedTotals: {},
      countDirectShipped: 0,
      girlDelivery: {},
      girlDeliveryTotals: {},
      countGirlDelivery: 0,
      boothSales: {},
      boothSalesTotals: {},
      countBoothSales: 0,
      virtualBoothSales: {},
      virtualBoothSalesTotals: {},
      countVirtualBoothSales: 0,
      countAllPackages: 0,
      totalDue: 0,
    },
  };

  it('renders without crashing', () => {
    expect(() => {
      mount(PaymentsDataTable, {
        props: {
          girlId: 1,
          girlAccount: mockGirlAccount,
        },
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            DataTable: true,
            Column: true,
            Button: true,
            InputText: true,
            Toolbar: true,
            ConfirmDialog: true,
            PaymentDialog: true,
            Badge: true,
            NuxtTime: true,
          },
        },
      });
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mount(PaymentsDataTable, {
      props: {
        girlId: 1,
        girlAccount: mockGirlAccount,
      },
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          DataTable: true,
          Column: true,
          Button: true,
          InputText: true,
          Toolbar: true,
          ConfirmDialog: true,
          PaymentDialog: true,
          Badge: true,
          NuxtTime: true,
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
  });
});
