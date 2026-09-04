import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import TroopCurrentInventoryDataTable from '@/components/inventory/TroopCurrentInventoryDataTable.vue';

const DataTableStub = {
  template: '<div><slot /></div>',
};
const ColumnGroupStub = {
  template: '<div><slot /></div>',
};
const RowStub = {
  template: '<div><slot /></div>',
};
const ColumnStub = {
  template: '<div><slot name="header" /><slot /></div>',
};
const ButtonStub = {
  props: ['icon', 'ariaLabel', 'label'],
  template:
    '<button :aria-label="ariaLabel" :data-icon="icon"><slot /></button>',
};
const ClientOnlyStub = {
  template: '<div><slot /></div>',
};

describe('TroopCurrentInventoryDataTable', () => {
  const mockCookies = [
    {
      id: 1,
      abbreviation: 'ADV',
      name: 'Adventurefuls',
      is_virtual: false,
      onHand: 24,
      afterPending: 12,
      afterPendingIncludingRequests: 10,
      afterPendingIncludingBooths: 8,
      totalReceivedByTroop: 36,
    },
    {
      id: 2,
      abbreviation: 'TRE',
      name: 'Trefoils',
      is_virtual: false,
      onHand: 15,
      afterPending: 15,
      afterPendingIncludingRequests: 15,
      afterPendingIncludingBooths: 10,
      totalReceivedByTroop: 20,
    },
    {
      id: 3,
      abbreviation: 'TM',
      name: 'Thin Mints',
      is_virtual: false,
      onHand: 0,
      afterPending: -5,
      afterPendingIncludingRequests: -10,
      afterPendingIncludingBooths: -15,
      totalReceivedByTroop: 48,
    },
    {
      id: 4,
      abbreviation: 'CS',
      name: 'Cookie Share',
      is_virtual: true,
      onHand: 0,
      afterPending: 0,
      afterPendingIncludingRequests: 0,
      afterPendingIncludingBooths: 0,
      totalReceivedByTroop: 0,
    },
  ];

  let writeTextMock: ReturnType<typeof vi.fn>;
  let toastAddMock: ReturnType<typeof vi.fn>;

  let currentCookies = mockCookies;

  beforeEach(() => {
    vi.useFakeTimers();
    currentCookies = mockCookies;
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
      writable: true,
    });

    toastAddMock = vi.fn();
    (globalThis as unknown as { useToast: () => unknown }).useToast = () => ({
      add: toastAddMock,
    });

    (
      globalThis as unknown as { useCookiesStore: () => unknown }
    ).useCookiesStore = () => ({
      allCookiesWithInventoryTotals: (_includeVirtual: boolean = true) =>
        currentCookies,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const mountComponent = (cookies = mockCookies) => {
    currentCookies = cookies;
    return mount(TroopCurrentInventoryDataTable, {
      global: {
        stubs: {
          DataTable: DataTableStub,
          ColumnGroup: ColumnGroupStub,
          Row: RowStub,
          Column: ColumnStub,
          Button: ButtonStub,
          Badge: true,
          ClientOnly: ClientOnlyStub,
        },
        directives: {
          tooltip: () => {},
        },
      },
    });
  };

  it('renders without crashing', () => {
    expect(() => {
      mountComponent();
    }).not.toThrow();
  });

  it('mounts successfully', () => {
    const wrapper = mountComponent();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders copy buttons for On Hand, After Pending, Inc. Requests, Inc. Booths, and Total Received', () => {
    const wrapper = mountComponent();
    const buttons = wrapper.findAll('button');

    const labels = buttons.map((b) => b.attributes('aria-label'));
    expect(labels).toContain('Copy On Hand');
    expect(labels).toContain('Copy After Pending');
    expect(labels).toContain('Copy Inc. Requests');
    expect(labels).toContain('Copy Inc. Booths');
    expect(labels).toContain('Copy Total Received');
  });

  it('copies On Hand inventory formatted with cookie abbreviations excluding virtual cookies', async () => {
    const wrapper = mountComponent();
    const onHandBtn = wrapper.find('button[aria-label="Copy On Hand"]');
    expect(onHandBtn.exists()).toBe(true);

    await onHandBtn.trigger('click');

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('ADV: 24\nTRE: 15\nTM: 0');
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Copied',
        detail: 'Copied On Hand inventory to clipboard',
      }),
    );
  });

  it('copies After Pending inventory formatted with cookie abbreviations', async () => {
    const wrapper = mountComponent();
    const btn = wrapper.find('button[aria-label="Copy After Pending"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('ADV: 12\nTRE: 15\nTM: -5');
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Copied',
        detail: 'Copied After Pending inventory to clipboard',
      }),
    );
  });

  it('copies Inc. Requests inventory formatted with cookie abbreviations', async () => {
    const wrapper = mountComponent();
    const btn = wrapper.find('button[aria-label="Copy Inc. Requests"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('ADV: 10\nTRE: 15\nTM: -10');
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Copied',
        detail: 'Copied Inc. Requests inventory to clipboard',
      }),
    );
  });

  it('copies Inc. Booths inventory formatted with cookie abbreviations', async () => {
    const wrapper = mountComponent();
    const btn = wrapper.find('button[aria-label="Copy Inc. Booths"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('ADV: 8\nTRE: 10\nTM: -15');
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Copied',
        detail: 'Copied Inc. Booths inventory to clipboard',
      }),
    );
  });

  it('copies Total Received inventory formatted with cookie abbreviations', async () => {
    const wrapper = mountComponent();
    const btn = wrapper.find('button[aria-label="Copy Total Received"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('ADV: 36\nTRE: 20\nTM: 48');
    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        summary: 'Copied',
        detail: 'Copied Total Received inventory to clipboard',
      }),
    );
  });

  it('toggles check icon and aria-label to Copied for 2 seconds after copying', async () => {
    const wrapper = mountComponent();
    const onHandBtn = wrapper.find('button[aria-label="Copy On Hand"]');

    await onHandBtn.trigger('click');

    expect(onHandBtn.attributes('aria-label')).toBe('Copied');
    expect(onHandBtn.attributes('data-icon')).toBe('pi pi-check');

    vi.advanceTimersByTime(2000);
    await wrapper.vm.$nextTick();

    expect(onHandBtn.attributes('aria-label')).toBe('Copy On Hand');
    expect(onHandBtn.attributes('data-icon')).toBe('pi pi-copy');
  });

  it('handles clipboard API errors gracefully', async () => {
    writeTextMock.mockRejectedValueOnce(new Error('Permission denied'));
    const wrapper = mountComponent();
    const onHandBtn = wrapper.find('button[aria-label="Copy On Hand"]');

    await onHandBtn.trigger('click');

    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to copy On Hand inventory to clipboard',
      }),
    );
  });

  it('handles missing clipboard API gracefully', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const wrapper = mountComponent();
    const onHandBtn = wrapper.find('button[aria-label="Copy On Hand"]');

    await onHandBtn.trigger('click');

    expect(toastAddMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Error',
        detail: 'Clipboard API not available in this browser',
      }),
    );
  });
});
