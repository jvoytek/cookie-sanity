import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTransactionsStore } from './transactions';
import type { Order } from '@/types/types';

describe('Transactions Store - DIRECT_SHIP Functionality', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should exclude DIRECT_SHIP orders from totalTransactionsByStatusAllCookies', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -10, ADV: -5 },
        created_at: '2024-01-01',
        order_date: '2024-01-01',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
      {
        id: 2,
        status: 'complete',
        type: 'DIRECT_SHIP',
        cookies: { TM: -5, ADV: -3 },
        created_at: '2024-01-02',
        order_date: '2024-01-02',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
      {
        id: 3,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -7 },
        created_at: '2024-01-03',
        order_date: '2024-01-03',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
    ];

    vi.stubGlobal('useCookiesStore', () => ({
      allCookies: [
        { abbreviation: 'TM', price: 5 },
        { abbreviation: 'ADV', price: 5 },
      ],
    }));

    const store = useTransactionsStore();
    store.allTransactions = mockOrders;

    const totals = store.totalTransactionsByStatusAllCookies(
      'complete',
      'girl',
    );

    // Should only count non-DIRECT_SHIP orders: -10 + -7 = -17 for TM
    expect(totals.TM).toBe(-17);
    // Should only count non-DIRECT_SHIP orders: -5 for ADV
    expect(totals.ADV).toBe(-5);
  });

  it('should exclude DIRECT_SHIP orders from sumTransactionsByCookie', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -10 },
        created_at: '2024-01-01',
        order_date: '2024-01-01',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
      {
        id: 2,
        status: 'complete',
        type: 'DIRECT_SHIP',
        cookies: { TM: -5 },
        created_at: '2024-01-02',
        order_date: '2024-01-02',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
    ];

    vi.stubGlobal('useCookiesStore', () => ({
      allCookies: [
        { abbreviation: 'TM', price: 5 },
        { abbreviation: 'ADV', price: 5 },
        { abbreviation: 'LEM', price: 5 },
      ],
      getCookieByAbbreviation: vi.fn((abbreviation) => {
        if (abbreviation === 'ABC') {
          return {
            abbreviation: 'ABC',
            price: 5,
            percent_of_sale: 20,
            is_virtual: false,
          };
        } else if (abbreviation === 'DEF') {
          return {
            abbreviation: 'DEF',
            price: 5,
            percent_of_sale: 80,
            is_virtual: true,
          };
        }
        return null;
      }),
    }));

    const store = useTransactionsStore();

    store.allTransactions = mockOrders;

    const sum = store.sumTransactionsByCookie('TM');

    // Should only count non-DIRECT_SHIP orders: -10
    expect(sum).toBe(-10);
  });

  it('should recognize DIRECT_SHIP as a girl transaction type', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'DIRECT_SHIP',
        cookies: { TM: -10 },
        created_at: '2024-01-01',
        order_date: '2024-01-01',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
    ];

    vi.stubGlobal('useCookiesStore', () => ({
      allCookies: [{ abbreviation: 'TM', price: 5 }],
    }));

    const store = useTransactionsStore();
    store.allTransactions = mockOrders;

    // Even though DIRECT_SHIP is excluded from calculations, it should still be
    // recognized as a girl transaction type for filtering purposes
    const girlList = store.completedGirlTransactionList;
    expect(girlList).toHaveLength(1);
    expect(girlList[0].type).toBe('DIRECT_SHIP');
  });

  it('should handle pending DIRECT_SHIP orders', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'pending',
        type: 'T2G',
        cookies: { TM: -10 },
        created_at: '2024-01-01',
        order_date: '2024-01-01',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
      {
        id: 2,
        status: 'pending',
        type: 'DIRECT_SHIP',
        cookies: { TM: -5 },
        created_at: '2024-01-02',
        order_date: '2024-01-02',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
    ];

    vi.stubGlobal('useCookiesStore', () => ({
      allCookies: [{ abbreviation: 'TM', price: 5 }],
    }));

    const store = useTransactionsStore();
    store.allTransactions = mockOrders;

    const totals = store.totalTransactionsByStatusAllCookies('pending', 'girl');

    // Should only count non-DIRECT_SHIP orders even when pending
    expect(totals.TM).toBe(-10);
  });

  it('should correctly filter multiple cookie types with DIRECT_SHIP', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -10, ADV: -5, LEM: -3 },
        created_at: '2024-01-01',
        order_date: '2024-01-01',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
      {
        id: 2,
        status: 'complete',
        type: 'DIRECT_SHIP',
        cookies: { TM: -7, ADV: -4, LEM: -2 },
        created_at: '2024-01-02',
        order_date: '2024-01-02',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: 1,
        from: null,
        supplier: null,
        notes: null,
      },
    ];

    vi.stubGlobal('useCookiesStore', () => ({
      allCookies: [
        { abbreviation: 'TM', price: 5 },
        { abbreviation: 'ADV', price: 5 },
        { abbreviation: 'LEM', price: 5 },
      ],
      getCookieByAbbreviation: vi.fn((abbreviation) => {
        if (abbreviation === 'ABC') {
          return {
            abbreviation: 'ABC',
            price: 5,
            percent_of_sale: 20,
            is_virtual: false,
          };
        } else if (abbreviation === 'DEF') {
          return {
            abbreviation: 'DEF',
            price: 5,
            percent_of_sale: 80,
            is_virtual: true,
          };
        }
        return null;
      }),
    }));

    const store = useTransactionsStore();
    store.allTransactions = mockOrders;

    // Test each cookie type - should exclude DIRECT_SHIP
    expect(store.sumTransactionsByCookie('TM')).toBe(-10);
    expect(store.sumTransactionsByCookie('ADV')).toBe(-5);
    expect(store.sumTransactionsByCookie('LEM')).toBe(-3);
  });

  it('should have DIRECT_SHIP in transaction type options', () => {
    const store = useTransactionsStore();

    const directShipOption = store.transactionTypeOptions.find(
      (opt) => opt.value === 'DIRECT_SHIP',
    );

    expect(directShipOption).toBeDefined();
    expect(directShipOption?.label).toBe('Direct Ship');
  });

  it('should return friendly name for DIRECT_SHIP type', () => {
    const store = useTransactionsStore();

    expect(store.friendlyTransactionTypes('DIRECT_SHIP')).toBe('Direct Ship');
  });
});
