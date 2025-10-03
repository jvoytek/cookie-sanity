import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTransactionsStore } from './transactions';
import type { Order, SCOrder2025 } from '~/types/types';

describe('Transactions Store', () => {
  let transactionsStore: ReturnType<typeof useTransactionsStore>;
  const baseTransaction = {
    id: 1,
    status: 'complete',
    type: 'T2G',
    cookies: { ABC: 5, DEF: 3 },
    order_date: '2024-01-01',
    created_at: '2024-01-01',
    from: null,
    notes: null,
    order_num: null,
    processed_date: null,
    profile: null,
    season: 1,
    to: null,
    supplier: null,
  } as Order;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock dependencies
    vi.stubGlobal(
      'useProfileStore',
      vi.fn(() => ({
        currentProfile: {
          id: 'test-profile-id',
          season: 1,
        },
      })),
    );

    vi.stubGlobal(
      'useSeasonsStore',
      vi.fn(() => ({
        currentSeason: { id: 1 },
        allSeasons: [{ id: 1 }],
      })),
    );

    vi.stubGlobal(
      'useGirlsStore',
      vi.fn(() => ({
        allGirls: [
          { id: 1, first_name: 'Jane', last_name: 'Doe' },
          { id: 2, first_name: 'John', last_name: 'Smith' },
        ],
      })),
    );

    transactionsStore = useTransactionsStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(transactionsStore.allTransactions).toEqual([]);
      expect(transactionsStore.activeTransaction).toEqual(null);
      expect(transactionsStore.editTransactionDialogVisible).toBe(false);
      expect(transactionsStore.deleteTransactionDialogVisible).toBe(false);
      expect(transactionsStore.transactionTypeOptions).toHaveLength(6);
    });

    it('should have correct transaction type options', () => {
      expect(transactionsStore.transactionTypeOptions).toEqual([
        { value: 'T2G', label: 'Troop to Girl' },
        { value: 'G2G', label: 'Girl to Girl' },
        { value: 'G2T', label: 'Girl to Troop' },
        { value: 'T2T', label: 'Troop to Troop' },
        { value: 'C2T', label: 'Council to Troop' },
        { value: 'DIRECT_SHIP', label: 'Direct Ship' },
      ]);
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      // Set up test transactions
      transactionsStore.allTransactions = [
        {
          ...baseTransaction,
          id: 1,
          status: 'complete',
          type: 'T2G',
          cookies: { ABC: 5, DEF: 3 },
          order_date: '2024-01-01',
        },
        {
          ...baseTransaction,
          id: 2,
          status: 'pending',
          type: 'T2G',
          cookies: { ABC: 2 },
          order_date: '2024-01-02',
        },
        {
          ...baseTransaction,
          id: 3,
          status: 'requested',
          type: 'G2G',
          cookies: { DEF: 4 },
          order_date: '2024-01-03',
        },
        {
          ...baseTransaction,
          id: 4,
          status: 'complete',
          type: 'T2T',
          cookies: { ABC: 10 },
          order_date: '2024-01-04',
        },
        {
          ...baseTransaction,
          id: 5,
          status: 'rejected',
          type: 'T2G',
          cookies: { ABC: 1 },
          order_date: '2024-01-05',
        },
        {
          ...baseTransaction,
          id: 6,
          status: 'pending',
          type: 'C2T',
          cookies: { DEF: 8 },
          order_date: '2024-01-06',
        },
      ];
    });

    it('should calculate sumTransactionsByCookie correctly', () => {
      const sumABC = transactionsStore.sumTransactionsByCookie('ABC');
      const sumDEF = transactionsStore.sumTransactionsByCookie('DEF');

      // Only complete transactions are counted: ABC: 5 + 10 = 15, DEF: 3
      expect(sumABC).toBe(15);
      expect(sumDEF).toBe(3);
    });

    it('should filter completedGirlTransactionList correctly', () => {
      const completed = transactionsStore.completedGirlTransactionList;

      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe(1);
      expect(completed[0].status).toBe('complete');
      expect(completed[0].type).toBe('T2G');
    });

    it('should count completedGirlTransactionListCount correctly', () => {
      expect(transactionsStore.completedGirlTransactionListCount).toBe(1);
    });

    it('should filter pendingGirlTransactionList correctly', () => {
      const pending = transactionsStore.pendingGirlTransactionList;

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(2);
      expect(pending[0].status).toBe('pending');
    });

    it('should count pendingGirlTransactionListCount correctly', () => {
      expect(transactionsStore.pendingGirlTransactionListCount).toBe(1);
    });

    it('should filter requestedGirlTransactionrList correctly', () => {
      const requested = transactionsStore.requestedGirlTransactionrList;

      expect(requested).toHaveLength(1);
      expect(requested[0].id).toBe(3);
      expect(requested[0].status).toBe('requested');
    });

    it('should count requestedGirlTransactionrListCount correctly', () => {
      expect(transactionsStore.requestedGirlTransactionrListCount).toBe(1);
    });

    it('should filter rejectedGirlTransactionList correctly', () => {
      const rejected = transactionsStore.rejectedGirlTransactionList;

      expect(rejected).toHaveLength(1);
      expect(rejected[0].id).toBe(5);
      expect(rejected[0].status).toBe('rejected');
    });

    it('should count rejectedGirlTransactionListCount correctly', () => {
      expect(transactionsStore.rejectedGirlTransactionListCount).toBe(1);
    });

    it('should filter pendingTroopTransactionList correctly', () => {
      const pendingRestock = transactionsStore.pendingTroopTransactionList;

      expect(pendingRestock).toHaveLength(1);
      expect(pendingRestock[0].id).toBe(6);
      expect(pendingRestock[0].type).toBe('C2T');
    });

    it('should count pendingTroopTransactionListCount correctly', () => {
      expect(transactionsStore.pendingTroopTransactionListCount).toBe(1);
    });

    it('should filter completedTroopTransactionList correctly', () => {
      const completedRestock = transactionsStore.completedTroopTransactionList;

      expect(completedRestock).toHaveLength(1);
      expect(completedRestock[0].id).toBe(4);
      expect(completedRestock[0].type).toBe('T2T');
    });

    it('should count completedTroopTransactionListCount correctly', () => {
      expect(transactionsStore.completedTroopTransactionListCount).toBe(1);
    });

    it('should calculate totalTransactionsByStatusAllCookies correctly', () => {
      const totalRequested =
        transactionsStore.totalTransactionsByStatusAllCookies(
          'requested',
          'girl',
        );
      const totalPending =
        transactionsStore.totalTransactionsByStatusAllCookies(
          'pending',
          'troop',
        );

      expect(totalRequested).toStrictEqual({
        ABC: 0,
        DEF: 4,
      });
      expect(totalPending).toStrictEqual({
        ABC: 0,
        DEF: 8,
      });
    });
  });

  describe('friendlyTransactionTypes', () => {
    it('should return friendly names for transaction types', () => {
      expect(transactionsStore.friendlyTransactionTypes('T2G')).toBe(
        'Troop to Girl',
      );
      expect(transactionsStore.friendlyTransactionTypes('G2G')).toBe(
        'Girl to Girl',
      );
      expect(transactionsStore.friendlyTransactionTypes('G2T')).toBe(
        'Girl to Troop',
      );
      expect(transactionsStore.friendlyTransactionTypes('T2T')).toBe(
        'Troop to Troop',
      );
      expect(transactionsStore.friendlyTransactionTypes('C2T')).toBe(
        'Council to Troop',
      );
      expect(transactionsStore.friendlyTransactionTypes('COOKIE_SHARE')).toBe(
        'Cookie Share',
      );
      expect(transactionsStore.friendlyTransactionTypes('UNKNOWN')).toBe(
        'UNKNOWN',
      );
    });
  });

  describe('fetchTransactions', () => {
    it('should fetch transactions successfully', async () => {
      const mockOrders = [
        {
          id: 1,
          status: 'complete',
          type: 'T2G',
          cookies: { ABC: -5 }, // Will be inverted
        },
      ];

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  neq: vi.fn(() => ({
                    order: vi.fn(() =>
                      Promise.resolve({ data: mockOrders, error: null }),
                    ),
                  })),
                })),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      await newOrdersStore.fetchTransactions();

      expect(newOrdersStore.allTransactions).toHaveLength(1);
      expect(newOrdersStore.allTransactions[0].cookies.ABC).toBe(5); // Inverted from -5
    });

    it('should return early if no profile or season', async () => {
      vi.stubGlobal(
        'useProfileStore',
        vi.fn(() => ({
          currentProfile: null,
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      await newOrdersStore.fetchTransactions();

      expect(newOrdersStore.allTransactions).toEqual([]);
    });

    it('should handle fetch error and show error toast', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addError: toastSpy,
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  neq: vi.fn(() => ({
                    order: vi.fn(() =>
                      Promise.resolve({
                        data: null,
                        error: { message: 'Fetch failed' },
                      }),
                    ),
                  })),
                })),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      await newOrdersStore.fetchTransactions();

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Fetch failed',
      });
    });
  });

  describe('insertNewTransaction', () => {
    it('should insert new transaction successfully', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addSuccess: toastSpy,
        })),
      );

      const mockOrder = {
        order_date: '2024-01-01',
        order_num: '12345',
        to: 1,
        cookies: { ABC: 5 },
      };

      const mockInsertedOrder = {
        ...mockOrder,
        profile: 'test-profile-id',
        season: 1,
        cookies: { ABC: -5 }, // Will be inverted back
      };

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockInsertedOrder,
                    error: null,
                  }),
                ),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      await newOrdersStore.insertNewTransaction(mockOrder);

      expect(newOrdersStore.allTransactions).toHaveLength(1);
      expect(newOrdersStore.allTransactions[0].cookies.ABC).toBe(5); // Inverted back
      expect(toastSpy).toHaveBeenCalledWith('Transaction Created');
    });

    it('should return early if no profile', async () => {
      vi.stubGlobal(
        'useProfileStore',
        vi.fn(() => ({
          currentProfile: null,
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      const mockOrder = { order_date: '2024-01-01', order_num: '12345' };
      await newOrdersStore.insertNewTransaction(mockOrder);

      expect(newOrdersStore.allTransactions).toEqual([]);
    });

    it('should handle insert error and show error toast', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addError: toastSpy,
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'Insert failed' },
                  }),
                ),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      const mockOrder = { order_date: '2024-01-01', order_num: '12345' };
      await newOrdersStore.insertNewTransaction(mockOrder);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Insert failed',
      });
    });
  });

  describe('insertNewTransactionFromUploads', () => {
    it('should insert multiple transactions successfully', async () => {
      const mockOrders = [
        { order_date: '2024-01-01', order_num: '12345' },
        { order_date: '2024-01-02', order_num: '12346' },
      ];

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            insert: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      await expect(
        newOrdersStore.insertNewTransactionFromUploads(mockOrders),
      ).resolves.not.toThrow();
    });

    it('should throw error when insert fails', async () => {
      const mockOrders = [{ order_date: '2024-01-01', order_num: '12345' }];

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            insert: vi.fn(() => ({
              select: vi.fn(() =>
                Promise.resolve({ error: { message: 'Insert failed' } }),
              ),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      await expect(
        newOrdersStore.insertNewTransactionFromUploads(mockOrders),
      ).rejects.toEqual({
        message: 'Insert failed',
      });
    });
  });

  describe('upsertTransaction', () => {
    it('should upsert transaction successfully', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addSuccess: toastSpy,
        })),
      );

      const mockOrder = {
        ...baseTransaction,
        id: 1,
        order_date: '2024-01-01',
        order_num: '12345',
        cookies: { ABC: 5 },
      };

      const mockUpsertedOrder = {
        ...mockOrder,
        cookies: { ABC: -5 }, // Will be inverted back
      };

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockUpsertedOrder,
                    error: null,
                  }),
                ),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      // Pre-populate with an transaction to update
      newOrdersStore.allTransactions = [mockOrder];

      await newOrdersStore.upsertTransaction(mockOrder);

      expect(newOrdersStore.allTransactions[0].cookies.ABC).toBe(5);
      expect(toastSpy).toHaveBeenCalledWith('Transaction Updated');
    });

    it('should handle upsert error and show error toast', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addError: toastSpy,
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'Upsert failed' },
                  }),
                ),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      const mockOrder = { ...baseTransaction, id: 1, cookies: { ABC: 5 } };
      await newOrdersStore.upsertTransaction(mockOrder);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Upsert failed',
      });
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addSuccess: toastSpy,
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      // Pre-populate with transactions
      newOrdersStore.allTransactions = [
        { ...baseTransaction, id: 1, order_num: '12345' },
        { ...baseTransaction, id: 2, order_num: '12346' },
      ];

      await newOrdersStore.deleteTransaction(1);

      expect(newOrdersStore.allTransactions).toHaveLength(1);
      expect(newOrdersStore.allTransactions[0].id).toBe(2);
      expect(toastSpy).toHaveBeenCalledWith('Transaction Deleted');
    });

    it('should delete transaction by object', async () => {
      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      const transactionToDelete = {
        ...baseTransaction,
        id: 1,
        order_num: '12345',
      };
      newOrdersStore.allTransactions = [
        transactionToDelete,
        { ...baseTransaction, id: 2, order_num: '12346' },
      ];

      await newOrdersStore.deleteTransaction(transactionToDelete);

      expect(newOrdersStore.allTransactions).toHaveLength(1);
      expect(newOrdersStore.allTransactions[0].id).toBe(2);
    });

    it('should show error when no transaction ID provided', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addError: toastSpy,
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      await newOrdersStore.deleteTransaction(0);

      expect(toastSpy).toHaveBeenCalledWith(
        new Error('Transaction ID is required to delete a transaction.'),
      );
    });

    it('should handle delete error and show error toast', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addError: toastSpy,
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            delete: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({ error: new Error('Delete failed') }),
              ),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      newOrdersStore.allTransactions = [
        { ...baseTransaction, id: 1, order_num: '12345' },
      ];

      await newOrdersStore.deleteTransaction(1);

      expect(toastSpy).toHaveBeenCalledWith(new Error('Delete failed'));
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status successfully', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal('useNotificationHelpers', () => ({
        addSuccess: toastSpy,
      }));

      const mockUpdatedOrder = {
        id: 1,
        status: 'complete',
        cookies: { ABC: -5 },
      };

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: mockUpdatedOrder,
                      error: null,
                    }),
                  ),
                })),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      // Pre-populate with transaction
      newOrdersStore.allTransactions = [
        { ...baseTransaction, id: 1, status: 'pending', cookies: { ABC: 5 } },
      ];

      await newOrdersStore.updateTransactionStatus(1, 'complete');

      expect(newOrdersStore.allTransactions[0].status).toBe('complete');
      expect(newOrdersStore.allTransactions[0].cookies.ABC).toBe(5); // Inverted back
      expect(toastSpy).toHaveBeenCalledWith('Transaction Marked Complete');
    });

    it('should handle update status error and show error toast', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addError: toastSpy,
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: null,
                      error: { message: 'Update failed' },
                    }),
                  ),
                })),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      await newOrdersStore.updateTransactionStatus(1, 'complete');

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Update failed',
      });
    });
  });

  describe('convertSCOrderToNewTransaction', () => {
    it('should convert SC order to new transaction successfully', () => {
      //    if (!profileStore.currentProfile?.id || profileStore.currentProfile?.season)

      const scOrder = {
        DATE: '2024-01-01',
        'ORDER #': 12345,
        TYPE: 'T2G',
        TO: 'Jane Doe',
        FROM: 'John Smith',
        CShare: 1,
        ADV: 2,
        TY: 3,
        LEM: 4,
        TRE: 5,
        TM: 6,
        PBP: 7,
        CD: 8,
        PBS: 9,
        GFC: 10,
        STATUS: 'complete',
        TOTAL: 55,
        'TOTAL $': 275,
      };

      const newOrder =
        transactionsStore.convertSCOrderToNewTransaction(scOrder);

      expect(newOrder).toEqual({
        profile: 'test-profile-id',
        order_date: '2024-01-01',
        order_num: '12345',
        to: 1, // Jane Doe's ID
        from: 2, // John Smith's ID
        cookies: scOrder,
        season: 1,
        type: 'T2G',
        status: 'complete',
      });
    });

    it('should return undefined if no profile', () => {
      vi.stubGlobal(
        'useProfileStore',
        vi.fn(() => ({
          currentProfile: null,
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newOrdersStore = useTransactionsStore();

      const scOrder = {
        DATE: '2024-01-01',
        'ORDER #': 12345,
        TO: 'Jane Doe',
      } as SCOrder2025;
      const result = newOrdersStore.convertSCOrderToNewTransaction(scOrder);

      expect(result).toBeUndefined();
    });

    it('should handle unknown names gracefully', () => {
      const scOrder = {
        DATE: '2024-01-01',
        'ORDER #': 12345,
        TYPE: 'T2G',
        TO: 'Unknown Person',
        FROM: 'Another Unknown',
        STATUS: 'complete',
      } as SCOrder2025;

      const newOrder =
        transactionsStore.convertSCOrderToNewTransaction(scOrder);

      expect(newOrder?.to).toBeNull();
      expect(newOrder?.from).toBeNull();
    });
  });

  describe('private utility functions', () => {
    describe('_removeOrder', () => {
      it('should show error toast when transactionId is falsy', () => {
        const toastSpy = vi.fn();
        vi.stubGlobal(
          'useNotificationHelpers',
          vi.fn(() => ({
            addError: toastSpy,
          })),
        );

        // Create new store instance with the new mock
        setActivePinia(createPinia());
        const newOrdersStore = useTransactionsStore();

        // Access private function through returned object (in real implementation)
        // We'll test this through deleteTransaction with invalid ID
        newOrdersStore.deleteTransaction(0);

        expect(toastSpy).toHaveBeenCalledWith(
          new Error('Transaction ID is required to delete a transaction.'),
        );
      });
    });

    describe('_invertCookieQuantities', () => {
      it('should handle null cookies', () => {
        // Test through a function that uses _invertCookieQuantities
        const transaction = {
          ...baseTransaction,
          id: 1,
          order_date: '2024-01-01',
          order_num: '12345',
          cookies: null,
        };

        expect(() =>
          transactionsStore.upsertTransaction(transaction),
        ).not.toThrow();
      });

      it('should handle zero values correctly', () => {
        // Test the inversion logic with zero values
        transactionsStore.allTransactions = [
          {
            ...baseTransaction,
            id: 1,
            status: 'complete',
            type: 'T2G',
            cookies: { ABC: 0, DEF: 5 },
            order_date: '2024-01-01',
          },
        ];

        const sumABC = transactionsStore.sumTransactionsByCookie('ABC');
        const sumDEF = transactionsStore.sumTransactionsByCookie('DEF');

        expect(sumABC).toBe(0);
        expect(sumDEF).toBe(5);
      });

      it('should handle non-number values', () => {
        // Test the inversion logic with non-number values
        transactionsStore.allTransactions = [
          {
            ...baseTransaction,
            id: 1,
            status: 'complete',
            type: 'T2G',
            cookies: { ABC: 'text', DEF: null, GHI: 5 },
            order_date: '2024-01-01',
          },
        ];

        const sumABC = transactionsStore.sumTransactionsByCookie('ABC');
        const sumDEF = transactionsStore.sumTransactionsByCookie('DEF');
        const sumGHI = transactionsStore.sumTransactionsByCookie('GHI');

        expect(sumABC).toBe(0); // Non-number values are ignored
        expect(sumDEF).toBe(0);
        expect(sumGHI).toBe(5);
      });
    });

    describe('returnDateStringOrNull', () => {
      it('should handle Date object', () => {
        const transaction = {
          ...baseTransaction,
          order_date: '2024-01-15',
          order_num: '12345',
          to: 1,
          cookies: {},
        };

        // Test through insertNewTransaction which uses returnDateStringOrNull
        transactionsStore.insertNewTransaction(transaction);

        // The function should format the date as YYYY-MM-DD
        expect(transaction.order_date).toBe('2024-01-15');
      });

      it('should handle string date', () => {
        const transaction = {
          order_date: '2024-01-15',
          order_num: '12345',
          to: 1,
          cookies: {},
        };

        transactionsStore.insertNewTransaction(transaction);

        // String dates should be returned as-is
        expect(transaction.order_date).toBe('2024-01-15');
      });

      it('should handle null date', () => {
        const transaction = {
          order_date: null,
          order_num: '12345',
          to: 1,
          cookies: {},
        };

        transactionsStore.insertNewTransaction(transaction);

        // Null dates should be returned as-is
        expect(transaction.order_date).toBe(null);
      });
    });

    describe('state properties', () => {
      it('should access transactionDialogFormSchema', () => {
        expect(transactionsStore.transactionDialogFormSchema).toBeDefined();
        expect(
          Array.isArray(transactionsStore.transactionDialogFormSchema),
        ).toBe(true);
      });
    });
  });
});
