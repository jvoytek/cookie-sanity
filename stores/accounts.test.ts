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
    const mockData = [
      {
        amount: 5,
        payment_date: '2025-09-16',
        seller_id: 1,
      },
    ];

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockData,
                error: null,
              })),
            })),
          })),
        })),
      })),
    }));

    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    await store.fetchPayments();

    const balances = store.girlAccountBalances;
    expect(balances).toHaveLength(2);
    expect(balances[0]).toMatchObject({
      girl: { id: 1, name: 'Test Girl' },
      distributedValue: 10,
      paymentsReceived: 5,
      balance: -5,
      status: 'Balance Due',
      numCookiesDistributed: 2,
      estimatedSales: 1,
    });
  });

  it('should calculate troop account summary correctly', async () => {
    const mockData = [
      {
        amount: 5,
        payment_date: '2025-09-16',
        seller_id: 1,
      },
      {
        amount: 2,
        payment_date: '2025-09-16',
        seller_id: 2,
      },
    ];

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockData,
                error: null,
              })),
            })),
          })),
        })),
      })),
    }));
    vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

    const store = useAccountsStore();
    await store.fetchPayments();

    const summary = store.troopAccountSummary;
    expect(summary).toMatchObject({
      totalDistributedValue: 35,
      totalPaymentsReceived: 7,
      troopBalance: -28,
      estimatedTotalSales: 1,
      activeAccounts: 2,
      numCookiesDistributed: 7,
    });
  });

  it('should fetch payments from Supabase', async () => {
    const mockData = [{ id: 1, amount: 100 }];

    const useSupabaseClientMock = vi.fn(() => ({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                data: mockData,
                error: null,
              })),
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
});
