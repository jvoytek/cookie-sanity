import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAccountsStore } from './accounts';
import type { Payment } from '@/types/types';

describe('Accounts Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with default values', () => {
    const store = useAccountsStore();
    expect(store.allPayments).toEqual([]);
    expect(store.editPaymentDialogVisible).toBe(false);
    expect(store.activePayment).toEqual(null);
    expect(store.paymentDialogFormSchema).toEqual([]);
  });

  it('should calculate girl account balances correctly', async () => {
    const mockTransactions = [
      {
        to: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { ABC: 5, DEF: 5 },
      },
      {
        to: 1,
        status: 'recorded',
        type: 'G2T',
        cookies: { ABC: 1 },
      },
      {
        to: 2,
        status: 'complete',
        type: 'T2G',
        cookies: { DEF: 5, ABC: 3 },
      },
    ];
    const useTransactionsStoreMock = vi.fn(() => ({
      allTransactions: mockTransactions,
    }));
    vi.stubGlobal('useTransactionsStore', useTransactionsStoreMock);

    const store = useAccountsStore();
    const summaries = store.girlGirlAccountSummarys;
    expect(summaries[0].girl.id).toBe(1);
    expect(summaries[0].balance).toBe(-9 * 5);
    expect(summaries[0].paymentsReceived).toBe(0);
    expect(summaries[0].status).toBe('Balance Due');
    expect(summaries[0].estimatedSales).toBe(0);
    expect(summaries[0].cookieSummary).toBeDefined();
  });

  it('should calculate troop account summary correctly', async () => {
    const mockTransactions = [
      {
        to: 1,
        status: 'complete',
        type: 'T2G',
        cookies: { ABC: 5, DEF: 5 },
      },
      {
        to: 1,
        status: 'recorded',
        type: 'G2T',
        cookies: { ABC: 1 },
      },
      {
        to: 2,
        status: 'complete',
        type: 'T2G',
        cookies: { DEF: 5, ABC: 3 },
      },
    ];
    const useTransactionsStoreMock = vi.fn(() => ({
      allTransactions: mockTransactions,
    }));
    vi.stubGlobal('useTransactionsStore', useTransactionsStoreMock);

    const store = useAccountsStore();
    const summary = store.troopAccountSummary;
    expect(summary.totalDistributedValue).toBe(-17 * 5);
    expect(summary.troopBalance).toBe(-17 * 5);
    expect(summary.estimatedTotalSales).toBe(0);
    expect(summary.totalAllCookiesDistributed).toBe(17);
    expect(summary.totalGirlDelivery).toBe(17);
    expect(summary.totalCookiesRemaining).toBe(10);
    expect(summary.cookieSummary).toBeDefined();
  });

  it('should fetch payments from Supabase', async () => {
    const mockData = [{ id: 1, amount: 100 }];

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockData,
              error: null,
            })),
          })),
        })),
      })),
    }));
    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    await store.fetchPayments();
    expect(store.allPayments).toEqual(mockData);
  });

  it('should handle errors when fetching payments', async () => {
    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: null,
                error: new Error('Fetch error'),
              })),
            })),
          })),
        })),
      })),
    }));
    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    await store.fetchPayments();
    expect(store.allPayments).toEqual([]);
  });

  it('should insert a new payment', async () => {
    const newPayment = { amount: 50, seller_id: 1 };

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { ...newPayment, id: 1 },
              error: null,
            })),
          })),
        })),
      })),
    }));
    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    await store.insertNewPayment(newPayment);
    expect(store.allPayments).toContainEqual({ ...newPayment, id: 1 });
  });

  it('should update an existing payment', async () => {
    const updatedPayment = { id: 1, amount: 75, seller_id: 1 } as Payment;

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: updatedPayment,
              error: null,
            })),
          })),
        })),
      })),
    }));
    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    store.allPayments.push({ id: 1, amount: 50, seller_id: 1 } as Payment);
    await store.upsertPayment(updatedPayment);
    expect(store.allPayments).toContainEqual(updatedPayment);
  });

  it('should delete a payment', async () => {
    const paymentToDelete = { id: 1, amount: 50, seller_id: 1 } as Payment;

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null,
          })),
        })),
      })),
    }));
    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    store.allPayments.push(paymentToDelete);
    await store.deletePayment(paymentToDelete);
    expect(store.allPayments).not.toContainEqual(paymentToDelete);
  });

  it('should insert multiple payments in batch', async () => {
    const newPayments = [
      { amount: 50, seller_id: 1 },
      { amount: 100, seller_id: 2 },
      { amount: 75, seller_id: 3 },
    ];

    const mockReturnedData = [
      { ...newPayments[0], id: 1 },
      { ...newPayments[1], id: 2 },
      { ...newPayments[2], id: 3 },
    ];

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            data: mockReturnedData,
            error: null,
          })),
        })),
      })),
    }));
    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    await store.insertBatchPayments(newPayments);
    expect(store.allPayments.length).toBe(3);
    expect(store.allPayments).toContainEqual(
      expect.objectContaining({ id: 1, amount: 50 }),
    );
    expect(store.allPayments).toContainEqual(
      expect.objectContaining({ id: 2, amount: 100 }),
    );
    expect(store.allPayments).toContainEqual(
      expect.objectContaining({ id: 3, amount: 75 }),
    );
  });

  it('should handle errors when batch inserting payments', async () => {
    const newPayments = [
      { amount: 50, seller_id: 1 },
      { amount: 100, seller_id: 2 },
    ];

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            data: null,
            error: new Error('Batch insert error'),
          })),
        })),
      })),
    }));
    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    await expect(store.insertBatchPayments(newPayments)).rejects.toThrow(
      'Batch insert error',
    );
    expect(store.allPayments.length).toBe(0);
  });

  it('should handle missing season when batch inserting payments', async () => {
    const newPayments = [
      { amount: 50, seller_id: 1 },
      { amount: 100, seller_id: 2 },
    ];

    // Mock empty seasons array
    const useSeasonsStoreMock = vi.fn(() => ({
      allSeasons: [],
    }));
    vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

    const store = useAccountsStore();
    await expect(store.insertBatchPayments(newPayments)).rejects.toThrow(
      'No season available',
    );
    expect(store.allPayments.length).toBe(0);
  });
});
