import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTransactionsStore } from './transactions';
import type { Order } from '@/types/types';

describe('Transactions Store - Direct Ship Functionality', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should exclude direct_ship orders from totalTransactionsByStatusAllCookies', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -10, ADV: -5 },
        direct_ship: false,
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
        type: 'T2G',
        cookies: { TM: -5, ADV: -3 },
        direct_ship: true, // Should be excluded
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
        direct_ship: false,
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

    // Mock the cookies store
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

    // Should only count non-direct-ship orders: -10 + -7 = -17 for TM
    expect(totals.TM).toBe(-17);
    // Should only count non-direct-ship orders: -5 for ADV
    expect(totals.ADV).toBe(-5);
  });

  it('should exclude direct_ship orders from sumTransactionsByCookie', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -10 },
        direct_ship: false,
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
        type: 'T2G',
        cookies: { TM: -5 },
        direct_ship: true, // Should be excluded
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

    const sum = store.sumTransactionsByCookie('TM');

    // Should only count non-direct-ship orders: -10
    expect(sum).toBe(-10);
  });

  it('should handle pending status with direct_ship orders', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'pending',
        type: 'T2G',
        cookies: { TM: -10 },
        direct_ship: false,
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
        type: 'T2G',
        cookies: { TM: -5 },
        direct_ship: true, // Should be excluded even from pending
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

    // Should only count non-direct-ship orders
    expect(totals.TM).toBe(-10);
  });

  it('should handle troop transactions with direct_ship orders', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'C2T',
        cookies: { TM: 100 },
        direct_ship: false,
        created_at: '2024-01-01',
        order_date: '2024-01-01',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: null,
        from: null,
        supplier: 'Council',
        notes: null,
      },
      {
        id: 2,
        status: 'complete',
        type: 'C2T',
        cookies: { TM: 50 },
        direct_ship: true, // Should be excluded
        created_at: '2024-01-02',
        order_date: '2024-01-02',
        order_num: null,
        processed_date: null,
        profile: null,
        season: 1,
        to: null,
        from: null,
        supplier: 'Council',
        notes: null,
      },
    ];

    vi.stubGlobal('useCookiesStore', () => ({
      allCookies: [{ abbreviation: 'TM', price: 5 }],
    }));

    const store = useTransactionsStore();
    store.allTransactions = mockOrders;

    const totals = store.totalTransactionsByStatusAllCookies(
      'complete',
      'troop',
    );

    // Should only count non-direct-ship orders
    expect(totals.TM).toBe(100);
  });

  it('should handle null or undefined direct_ship field as false', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -10 },
        direct_ship: null, // Should be treated as false
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
      } as Order,
      {
        id: 2,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -5 },
        // direct_ship not set, should be treated as false
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
      } as Order,
    ];

    vi.stubGlobal('useCookiesStore', () => ({
      allCookies: [{ abbreviation: 'TM', price: 5 }],
    }));

    const store = useTransactionsStore();
    store.allTransactions = mockOrders;

    const sum = store.sumTransactionsByCookie('TM');

    // Both should be counted (treated as non-direct-ship)
    expect(sum).toBe(-15);
  });

  it('should correctly filter multiple cookie types with direct_ship', () => {
    const mockOrders: Order[] = [
      {
        id: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { TM: -10, ADV: -5, LEM: -3 },
        direct_ship: false,
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
        type: 'T2G',
        cookies: { TM: -7, ADV: -4, LEM: -2 },
        direct_ship: true, // Should be excluded
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
    }));

    const store = useTransactionsStore();
    store.allTransactions = mockOrders;

    // Test each cookie type
    expect(store.sumTransactionsByCookie('TM')).toBe(-10);
    expect(store.sumTransactionsByCookie('ADV')).toBe(-5);
    expect(store.sumTransactionsByCookie('LEM')).toBe(-3);
  });
});
