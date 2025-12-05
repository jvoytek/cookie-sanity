import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useDepositsStore } from './deposits';
import type { Deposit } from '@/types/types';

describe('stores/deposits', () => {
  let depositsStore: ReturnType<typeof useDepositsStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up the profileStore and seasonsStore mocks
    const useProfileStoreMock = vi.fn(() => ({
      currentProfile: {
        id: 'test-profile-id',
      },
    }));
    vi.stubGlobal('useProfileStore', useProfileStoreMock);

    const useSeasonsStoreMock = vi.fn(() => ({
      currentSeason: {
        id: 1,
      },
    }));
    vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

    const useSupabaseUserMock = vi.fn(() => ({
      value: { id: 'test-user-id' },
    }));
    vi.stubGlobal('useSupabaseUser', useSupabaseUserMock);

    depositsStore = useDepositsStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('state management', () => {
    it('initializes with default values', () => {
      setActivePinia(createPinia());
      const freshStore = useDepositsStore();

      expect(freshStore.allDeposits).toEqual([]);
      expect(freshStore.depositDialogFormSchema).toEqual([]);
      expect(freshStore.activeDeposit).toEqual(null);
      expect(freshStore.depositDialogVisible).toBe(false);
      expect(freshStore.deleteDepositDialogVisible).toBe(false);
    });

    it('sets active deposit correctly', () => {
      const testDeposit: Deposit = {
        id: 1,
        amount: 100,
        deposit_date: '2024-12-01',
        deposited_by: 'John Doe',
        notes: 'Test deposit',
        created_at: '2024-12-01',
        profile: 'test-profile-id',
        season: 1,
      };

      depositsStore.setActiveDeposit(testDeposit);
      expect(depositsStore.activeDeposit).toEqual(testDeposit);
    });

    it('clears active deposit when set to null', () => {
      const testDeposit: Deposit = {
        id: 1,
        amount: 100,
        deposit_date: '2024-12-01',
        deposited_by: null,
        notes: null,
        created_at: '2024-12-01',
        profile: 'test-profile-id',
        season: 1,
      };

      depositsStore.setActiveDeposit(testDeposit);
      expect(depositsStore.activeDeposit).toEqual(testDeposit);

      depositsStore.setActiveDeposit(null);
      expect(depositsStore.activeDeposit).toBeNull();
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      depositsStore.allDeposits = [
        {
          id: 1,
          amount: 100,
          deposit_date: '12/01/2024',
          deposited_by: 'John Doe',
          notes: 'First deposit',
          created_at: '2024-12-01',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 2,
          amount: 250.5,
          deposit_date: '12/02/2024',
          deposited_by: 'Jane Smith',
          notes: null,
          created_at: '2024-12-02',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 3,
          amount: 75.25,
          deposit_date: '12/03/2024',
          deposited_by: null,
          notes: 'Third deposit',
          created_at: '2024-12-03',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Deposit[];
    });

    it('calculates total deposits correctly', () => {
      expect(depositsStore.totalDeposits).toBe(425.75);
    });

    it('calculates total deposits as 0 when no deposits exist', () => {
      depositsStore.allDeposits = [];
      expect(depositsStore.totalDeposits).toBe(0);
    });
  });

  describe('fetchDeposits', () => {
    it('fetches deposits from Supabase successfully', async () => {
      const mockData = [
        {
          id: 1,
          amount: 100,
          deposit_date: '2024-12-01',
          deposited_by: 'John Doe',
          notes: 'Test deposit',
          created_at: '2024-12-01',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 2,
          amount: 200,
          deposit_date: '2024-12-02',
          deposited_by: 'Jane Smith',
          notes: null,
          created_at: '2024-12-02',
          profile: 'test-profile-id',
          season: 1,
        },
      ];

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: mockData,
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();

      await depositsStore.fetchDeposits();

      expect(depositsStore.allDeposits).toHaveLength(2);
      expect(depositsStore.allDeposits[0].deposit_date).toBe('12/01/2024');
      expect(depositsStore.allDeposits[1].deposit_date).toBe('12/02/2024');
    });

    it('handles errors when fetching deposits', async () => {
      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: new Error('Fetch error'),
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();

      await depositsStore.fetchDeposits();
      expect(depositsStore.allDeposits).toEqual([]);
    });

    it('returns early when profile or season is not set', async () => {
      const useProfileStoreMock = vi.fn(() => ({
        currentProfile: null,
      }));
      vi.stubGlobal('useProfileStore', useProfileStoreMock);

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();

      await depositsStore.fetchDeposits();

      expect(depositsStore.allDeposits).toEqual([]);
    });
  });

  describe('insertDeposit', () => {
    it('inserts a new deposit successfully', async () => {
      const newDeposit = {
        amount: 150,
        deposit_date: '2024-12-05',
        deposited_by: 'Test User',
        notes: 'New deposit',
      };

      const mockReturnData = {
        ...newDeposit,
        id: 1,
        created_at: '2024-12-05',
        profile: 'test-user-id',
        season: 1,
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: mockReturnData,
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();

      await depositsStore.insertDeposit(newDeposit);

      expect(depositsStore.allDeposits).toHaveLength(1);
      expect(depositsStore.allDeposits[0].amount).toBe(150);
      expect(depositsStore.allDeposits[0].deposited_by).toBe('Test User');
      expect(depositsStore.allDeposits[0].deposit_date).toBe('12/05/2024');
    });

    it('handles errors when inserting a deposit', async () => {
      const newDeposit = {
        amount: 150,
        deposit_date: '2024-12-05',
        deposited_by: 'Test User',
        notes: 'New deposit',
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: new Error('Insert error'),
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();

      await depositsStore.insertDeposit(newDeposit);
      expect(depositsStore.allDeposits).toEqual([]);
    });

    it('returns early when season or user is not set', async () => {
      const useSeasonsStoreMock = vi.fn(() => ({
        currentSeason: null,
      }));
      vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();

      const newDeposit = {
        amount: 150,
        deposit_date: '2024-12-05',
      };

      await depositsStore.insertDeposit(newDeposit);
      expect(depositsStore.allDeposits).toEqual([]);
    });
  });

  describe('upsertDeposit', () => {
    it('updates an existing deposit successfully', async () => {
      const existingDeposit: Deposit = {
        id: 1,
        amount: 100,
        deposit_date: '12/01/2024',
        deposited_by: 'John Doe',
        notes: 'Original deposit',
        created_at: '2024-12-01',
        profile: 'test-profile-id',
        season: 1,
      };

      const updatedDeposit: Deposit = {
        ...existingDeposit,
        amount: 200,
        notes: 'Updated deposit',
        deposit_date: '2024-12-01', // API returns yyyy-mm-dd format
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: updatedDeposit,
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();
      depositsStore.allDeposits = [existingDeposit];

      await depositsStore.upsertDeposit(updatedDeposit);

      expect(depositsStore.allDeposits).toHaveLength(1);
      expect(depositsStore.allDeposits[0].amount).toBe(200);
      expect(depositsStore.allDeposits[0].notes).toBe('Updated deposit');
    });

    it('handles errors when updating a deposit', async () => {
      const depositToUpdate: Deposit = {
        id: 1,
        amount: 100,
        deposit_date: '12/01/2024',
        deposited_by: 'John Doe',
        notes: 'Test deposit',
        created_at: '2024-12-01',
        profile: 'test-profile-id',
        season: 1,
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: new Error('Update error'),
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();
      depositsStore.allDeposits = [depositToUpdate];

      await depositsStore.upsertDeposit(depositToUpdate);
      expect(depositsStore.allDeposits[0]).toEqual(depositToUpdate);
    });
  });

  describe('deleteDeposit', () => {
    it('deletes a deposit successfully', async () => {
      const depositToDelete: Deposit = {
        id: 1,
        amount: 100,
        deposit_date: '12/01/2024',
        deposited_by: 'John Doe',
        notes: 'Test deposit',
        created_at: '2024-12-01',
        profile: 'test-profile-id',
        season: 1,
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                error: null,
              }),
            ),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();
      depositsStore.allDeposits = [depositToDelete];

      await depositsStore.deleteDeposit(depositToDelete);

      expect(depositsStore.allDeposits).toHaveLength(0);
    });

    it('handles errors when deleting a deposit', async () => {
      const depositToDelete: Deposit = {
        id: 1,
        amount: 100,
        deposit_date: '12/01/2024',
        deposited_by: 'John Doe',
        notes: 'Test deposit',
        created_at: '2024-12-01',
        profile: 'test-profile-id',
        season: 1,
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({
                error: new Error('Delete error'),
              }),
            ),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();
      depositsStore.allDeposits = [depositToDelete];

      await depositsStore.deleteDeposit(depositToDelete);
      expect(depositsStore.allDeposits).toHaveLength(1);
    });

    it('throws error when deposit is null', async () => {
      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      await depositsStore.deleteDeposit(null);
      expect(depositsStore.allDeposits).toEqual([]);
    });
  });

  describe('date transformation', () => {
    it('transforms date from yyyy-mm-dd to mm/dd/yyyy format', async () => {
      const mockData = [
        {
          id: 1,
          amount: 100,
          deposit_date: '2024-12-01',
          deposited_by: 'John Doe',
          notes: 'Test deposit',
          created_at: '2024-12-01',
          profile: 'test-profile-id',
          season: 1,
        },
      ];

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: mockData,
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();

      await depositsStore.fetchDeposits();

      expect(depositsStore.allDeposits[0].deposit_date).toBe('12/01/2024');
    });

    it('handles date transformation with single-digit months and days', async () => {
      const mockData = [
        {
          id: 1,
          amount: 100,
          deposit_date: '2024-01-05',
          deposited_by: 'John Doe',
          notes: 'Test deposit',
          created_at: '2024-01-05',
          profile: 'test-profile-id',
          season: 1,
        },
      ];

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: mockData,
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();

      await depositsStore.fetchDeposits();

      expect(depositsStore.allDeposits[0].deposit_date).toBe('01/05/2024');
    });
  });

  describe('sorting', () => {
    it('sorts deposits by date in descending order after insert', async () => {
      const newDeposit = {
        amount: 200,
        deposit_date: '2024-12-03',
        deposited_by: 'Jane Smith',
        notes: 'Second deposit',
      };

      const mockReturnData = {
        ...newDeposit,
        id: 2,
        created_at: '2024-12-03',
        profile: 'test-user-id',
        season: 1,
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: mockReturnData,
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Need to recreate store with new mocks
      setActivePinia(createPinia());
      depositsStore = useDepositsStore();
      depositsStore.allDeposits = [
        {
          id: 1,
          amount: 100,
          deposit_date: '12/01/2024',
          deposited_by: 'John Doe',
          notes: 'First deposit',
          created_at: '2024-12-01',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Deposit[];

      await depositsStore.insertDeposit(newDeposit);

      expect(depositsStore.allDeposits).toHaveLength(2);
      // Most recent date should be first
      expect(depositsStore.allDeposits[0].deposit_date).toBe('12/03/2024');
      expect(depositsStore.allDeposits[1].deposit_date).toBe('12/01/2024');
    });
  });
});
