import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BankDepositsPage from '@/pages/bank-deposits.vue';
import { ref } from 'vue';

const mockIsMobile = ref(false);
const mockDeposits = ref<
  Array<{
    id: number;
    deposit_date: string;
    amount: number;
    deposited_by: string;
    notes: string;
  }>
>([]);

describe('BankDepositsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsMobile.value = false;
    mockDeposits.value = [];

    vi.stubGlobal('useDevice', () => ({
      isMobile: mockIsMobile,
    }));

    vi.stubGlobal('useDepositsStore', () => ({
      allDeposits: mockDeposits.value,
      totalDeposits: mockDeposits.value.reduce(
        (sum, d) => sum + (d.amount || 0),
        0,
      ),
      activeDeposit: null,
      depositDialogVisible: false,
      depositDialogFormSchema: { value: [] },
      setActiveDeposit: vi.fn(),
      insertDeposit: vi.fn(),
      upsertDeposit: vi.fn(),
      deleteDeposit: vi.fn(),
    }));
  });

  it('renders without crashing', () => {
    expect(() => {
      mount(BankDepositsPage, {
        global: {
          stubs: {
            Toolbar: true,
            Button: true,
            DataTable: true,
            Column: true,
            Fieldset: true,
            Message: true,
            Dialog: true,
            FormKit: true,
            FormKitSchema: true,
            NuxtTime: true,
            ClientOnly: {
              template: '<div><slot /></div>',
            },
          },
        },
      });
    }).not.toThrow();
  });

  it('renders DataTable on desktop view (!isMobile)', () => {
    mockIsMobile.value = false;
    mockDeposits.value = [
      {
        id: 1,
        deposit_date: '2026-03-01',
        amount: 150,
        deposited_by: 'Jane Doe',
        notes: 'Bank branch deposit',
      },
    ];

    const wrapper = mount(BankDepositsPage, {
      global: {
        stubs: {
          Toolbar: true,
          Button: true,
          DataTable: true,
          Column: true,
          Fieldset: true,
          Message: true,
          Dialog: true,
          FormKit: true,
          FormKitSchema: true,
          NuxtTime: true,
          ClientOnly: {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
  });

  it('renders card layout on mobile view (isMobile)', () => {
    mockIsMobile.value = true;
    mockDeposits.value = [
      {
        id: 1,
        deposit_date: '2026-03-01',
        amount: 150,
        deposited_by: 'Jane Doe',
        notes: 'Bank branch deposit',
      },
    ];

    const wrapper = mount(BankDepositsPage, {
      global: {
        stubs: {
          Toolbar: true,
          Button: true,
          DataTable: true,
          Column: true,
          Fieldset: true,
          Message: true,
          Dialog: true,
          FormKit: true,
          FormKitSchema: true,
          NuxtTime: true,
          ClientOnly: {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(false);
    expect(wrapper.text()).toContain('$150.00');
    expect(wrapper.text()).toContain('Jane Doe');
    expect(wrapper.text()).toContain('Bank branch deposit');
  });

  it('shows no deposits message on mobile when deposits list is empty', () => {
    mockIsMobile.value = true;
    mockDeposits.value = [];

    const wrapper = mount(BankDepositsPage, {
      global: {
        stubs: {
          Toolbar: true,
          Button: true,
          DataTable: true,
          Column: true,
          Fieldset: true,
          Message: true,
          Dialog: true,
          FormKit: true,
          FormKitSchema: true,
          NuxtTime: true,
          ClientOnly: {
            template: '<div><slot /></div>',
          },
        },
      },
    });

    expect(wrapper.text()).toContain('No deposits found.');
  });
});
