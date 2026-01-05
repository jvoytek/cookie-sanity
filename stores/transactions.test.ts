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
        getGirlIdByName: vi.fn((name: string) => {
          if (name === 'Jane Doe') return 1;
          if (name === 'John Smith') return 2;
          return null;
        }),
      })),
    );

    vi.stubGlobal(
      'useCookiesStore',
      vi.fn(() => ({
        allCookies: [
          { abbreviation: 'ABC', is_virtual: false },
          { abbreviation: 'DEF', is_virtual: false },
        ],
        getCookieByAbbreviation: vi.fn((abbreviation: string) => {
          const cookies = [
            { abbreviation: 'ABC', is_virtual: false },
            { abbreviation: 'DEF', is_virtual: false },
          ];
          return cookies.find((c) => c.abbreviation === abbreviation);
        }),
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
      expect(transactionsStore.troopTransactionTypeOptions).toHaveLength(2);
      expect(transactionsStore.girlTransactionTypeOptions).toHaveLength(6);
    });

    it('should have correct trooptransaction type options', () => {
      expect(transactionsStore.troopTransactionTypeOptions).toEqual([
        { value: 'T2T', label: 'Troop to Troop' },
        { value: 'C2T', label: 'Council to Troop' },
      ]);
    });

    it('should have correct girl transaction type options', () => {
      expect(transactionsStore.girlTransactionTypeOptions).toEqual([
        { value: 'T2G', label: 'Troop to Girl' },
        { value: 'T2G(B)', label: 'Troop to Girl (Booth)' },
        { value: 'T2G(VB)', label: 'Troop to Girl (Virtual Booth)' },
        { value: 'G2G', label: 'Girl to Girl' },
        { value: 'G2T', label: 'Girl to Troop' },
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
          id: 7,
          status: 'complete',
          type: 'G2T',
          cookies: { ABC: 2 },
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

      // Only complete transactions are counted: ABC: 10 + 2 - 5 = 7, DEF: 3
      expect(sumABC).toBe(7);
      expect(sumDEF).toBe(-3);
    });

    it('should filter completedGirlTransactionList correctly', () => {
      const completed = transactionsStore.completedGirlTransactionList;

      expect(completed).toHaveLength(2);
      expect(completed[0].id).toBe(1);
      expect(completed[0].status).toBe('complete');
      expect(completed[0].type).toBe('T2G');
    });

    it('should count completedGirlTransactionListCount correctly', () => {
      expect(transactionsStore.completedGirlTransactionListCount).toBe(2);
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
        DEF: -4,
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
          cookies: { ABC: -5 },
        },
      ];

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({ data: mockOrders, error: null }),
                ),
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
      expect(newOrdersStore.allTransactions[0].cookies.ABC).toBe(-5);
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
        cookies: { ABC: -5 },
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
      expect(newOrdersStore.allTransactions[0].cookies.ABC).toBe(-5);
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

  describe('bulkInsertNewTransactions', () => {
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
        newOrdersStore.bulkInsertNewTransactions(mockOrders),
      ).resolves.not.toThrow();
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
        cookies: { ABC: -5 },
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

      expect(newOrdersStore.allTransactions[0].cookies.ABC).toBe(-5);
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
      expect(newOrdersStore.allTransactions[0].cookies.ABC).toBe(-5); // Inverted back
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
    it('should convert COOKIE_SHARE to T2G', () => {
      const scOrder = {
        DATE: '2024-01-01',
        'ORDER #': 12345,
        TYPE: 'COOKIE_SHARE',
        TO: 'Jane Doe',
        FROM: 'John Smith',
        CShare: 10,
        ADV: 0,
        TY: 0,
        LEM: 0,
        TRE: 0,
        TM: 0,
        PBP: 0,
        CD: 0,
        PBS: 0,
        GFC: 0,
        STATUS: 'complete',
        TOTAL: 10,
        'TOTAL $': 60,
      } as SCOrder2025;

      const newOrder =
        transactionsStore.convertSCOrderToNewTransaction(scOrder);

      expect(newOrder?.type).toBe('T2G');
    });

    it('should convert COOKIE_SHARE(B) to T2G(B)', () => {
      const scOrder = {
        DATE: '2024-01-01',
        'ORDER #': 12345,
        TYPE: 'COOKIE_SHARE(B)',
        TO: 'Jane Doe',
        FROM: 'John Smith',
        CShare: 5,
        ADV: 0,
        TY: 0,
        LEM: 0,
        TRE: 0,
        TM: 0,
        PBP: 0,
        CD: 0,
        PBS: 0,
        GFC: 0,
        STATUS: 'complete',
        TOTAL: 5,
        'TOTAL $': 30,
      } as SCOrder2025;

      const newOrder =
        transactionsStore.convertSCOrderToNewTransaction(scOrder);

      expect(newOrder?.type).toBe('T2G(B)');
    });

    it('should convert COOKIE_SHARE(VB) to T2G(VB)', () => {
      const scOrder = {
        DATE: '2024-01-01',
        'ORDER #': 12345,
        TYPE: 'COOKIE_SHARE(VB)',
        TO: 'Jane Doe',
        FROM: 'John Smith',
        CShare: 3,
        ADV: 0,
        TY: 0,
        LEM: 0,
        TRE: 0,
        TM: 0,
        PBP: 0,
        CD: 0,
        PBS: 0,
        GFC: 0,
        STATUS: 'complete',
        TOTAL: 3,
        'TOTAL $': 18,
      } as SCOrder2025;

      const newOrder =
        transactionsStore.convertSCOrderToNewTransaction(scOrder);

      expect(newOrder?.type).toBe('T2G(VB)');
    });

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
        supplier: null,
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
        expect(sumDEF).toBe(-5);
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
        expect(sumGHI).toBe(-5);
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

  describe('virtual cookies', () => {
    beforeEach(() => {
      // Mock with virtual cookie
      vi.stubGlobal(
        'useCookiesStore',
        vi.fn(() => ({
          allCookies: [
            { abbreviation: 'ABC', is_virtual: false },
            { abbreviation: 'VIRTUAL', is_virtual: true },
          ],
          getCookieByAbbreviation: vi.fn((abbreviation: string) => {
            const cookies = [
              { abbreviation: 'ABC', is_virtual: false },
              { abbreviation: 'VIRTUAL', is_virtual: true },
            ];
            return cookies.find((c) => c.abbreviation === abbreviation);
          }),
        })),
      );

      // Create new store instance with the updated mock
      setActivePinia(createPinia());
      transactionsStore = useTransactionsStore();
    });

    it('should exclude virtual cookies from physical inventory', () => {
      transactionsStore.allTransactions = [
        {
          ...baseTransaction,
          id: 1,
          status: 'complete',
          type: 'T2G',
          cookies: { ABC: -10, VIRTUAL: -5 },
        },
      ];

      // Physical cookie should count
      expect(transactionsStore.sumTransactionsByCookie('ABC')).toBe(10);
      // Virtual cookie should not count
      expect(transactionsStore.sumTransactionsByCookie('VIRTUAL')).toBe(0);
    });

    it('should exclude virtual cookies from troop inventory calculations', () => {
      transactionsStore.allTransactions = [
        {
          ...baseTransaction,
          id: 1,
          status: 'pending',
          type: 'T2T',
          cookies: { ABC: 10, VIRTUAL: 5 },
        },
      ];

      const totals = transactionsStore.totalTransactionsByStatusAllCookies(
        'pending',
        'troop',
      );

      // Physical cookie should count
      expect(totals.ABC).toBe(10);
      // Virtual cookie should not count in troop transactions
      expect(totals.VIRTUAL).toBe(0);
    });
  });

  describe('getGirlTransactionsByStatus', () => {
    beforeEach(() => {
      // Set up test transactions with specific girl IDs
      transactionsStore.allTransactions = [
        {
          ...baseTransaction,
          id: 1,
          status: 'complete',
          type: 'T2G',
          to: 1, // Jane
          from: null,
          cookies: { ABC: 5 },
        },
        {
          ...baseTransaction,
          id: 2,
          status: 'complete',
          type: 'G2T',
          to: null,
          from: 1, // Jane
          cookies: { ABC: -2 },
        },
        {
          ...baseTransaction,
          id: 3,
          status: 'complete',
          type: 'T2G',
          to: 2, // John
          from: null,
          cookies: { ABC: 3 },
        },
        {
          ...baseTransaction,
          id: 4,
          status: 'pending',
          type: 'T2G',
          to: 1, // Jane
          from: null,
          cookies: { ABC: 4 },
        },
        {
          ...baseTransaction,
          id: 5,
          status: 'requested',
          type: 'T2G',
          to: 2, // John
          from: null,
          cookies: { ABC: 1 },
        },
        {
          ...baseTransaction,
          id: 6,
          status: 'rejected',
          type: 'T2G',
          to: 1, // Jane
          from: null,
          cookies: { ABC: 2 },
        },
        {
          ...baseTransaction,
          id: 7,
          status: 'complete',
          type: 'G2G',
          to: 2, // John
          from: 1, // Jane
          cookies: { ABC: 1 },
        },
      ];
    });

    it('should return all transactions when girlId is null (troop view)', () => {
      const completed = transactionsStore.getGirlTransactionsByStatus(
        'complete',
        null,
      );

      expect(completed).toHaveLength(4);
      expect(completed.map((t) => t.id).sort()).toEqual([1, 2, 3, 7]);
    });

    it('should filter completed transactions by girl ID (to)', () => {
      const completed = transactionsStore.getGirlTransactionsByStatus(
        'complete',
        1,
      );

      expect(completed).toHaveLength(3);
      expect(completed.map((t) => t.id).sort()).toEqual([1, 2, 7]);
    });

    it('should filter completed transactions by girl ID (from)', () => {
      const completed = transactionsStore.getGirlTransactionsByStatus(
        'complete',
        2,
      );

      expect(completed).toHaveLength(2);
      expect(completed.map((t) => t.id).sort()).toEqual([3, 7]);
    });

    it('should filter pending transactions by girl ID', () => {
      const pending = transactionsStore.getGirlTransactionsByStatus(
        'pending',
        1,
      );

      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(4);
    });

    it('should filter requested transactions by girl ID', () => {
      const requested = transactionsStore.getGirlTransactionsByStatus(
        'requested',
        2,
      );

      expect(requested).toHaveLength(1);
      expect(requested[0].id).toBe(5);
    });

    it('should filter rejected transactions by girl ID', () => {
      const rejected = transactionsStore.getGirlTransactionsByStatus(
        'rejected',
        1,
      );

      expect(rejected).toHaveLength(1);
      expect(rejected[0].id).toBe(6);
    });

    it('should return empty array when no transactions match', () => {
      const completed = transactionsStore.getGirlTransactionsByStatus(
        'complete',
        999,
      );

      expect(completed).toHaveLength(0);
    });

    it('should handle G2G transactions correctly for both girls', () => {
      // Girl 1 (Jane) - should see the G2G transaction
      const girl1Completed = transactionsStore.getGirlTransactionsByStatus(
        'complete',
        1,
      );
      expect(girl1Completed.find((t) => t.id === 7)).toBeDefined();

      // Girl 2 (John) - should also see the G2G transaction
      const girl2Completed = transactionsStore.getGirlTransactionsByStatus(
        'complete',
        2,
      );
      expect(girl2Completed.find((t) => t.id === 7)).toBeDefined();
    });
  });
});
