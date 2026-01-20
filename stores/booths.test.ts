import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Import the store after setting up global mocks in setup.ts
import { useBoothsStore } from '@/stores/booths';
import type { BoothSale } from '~/types/types';
import { add } from 'date-fns';

describe('useBoothsStore', () => {
  let boothsStore: ReturnType<typeof useBoothsStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up the profileStore, seasonsStore, and cookiesStore mocks
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

    boothsStore = useBoothsStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('state management', () => {
    it('initializes with default values', () => {
      setActivePinia(createPinia());
      const freshStore = useBoothsStore();

      expect(freshStore.allBoothSales).toEqual([]);
      expect(freshStore.boothDialogFormSchema).toEqual([]);
      expect(freshStore.activeBoothSale).toEqual(null);
      expect(freshStore.boothDialogVisible).toBe(false);
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Format dates as mm/dd/yyyy to match how they are stored in the app
      const formatDate = (date: Date) => {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
      };

      boothsStore.allBoothSales = [
        {
          id: 1,
          sale_date: formatDate(yesterday),
          sale_time: '10:00',
          inventory_type: 'girl',
        },
        {
          id: 2,
          sale_date: formatDate(tomorrow),
          sale_time: '14:00',
          inventory_type: 'troop',
        },
        {
          id: 3,
          sale_date: formatDate(tomorrow),
          sale_time: '16:00',
          inventory_type: 'girl',
        },
      ] as BoothSale[];
    });

    it('filters upcoming booth sales correctly', () => {
      const upcoming = boothsStore.upcomingBoothSales;
      expect(upcoming).toHaveLength(2);
      // Check that all upcoming sales have a future or today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(
        upcoming.every((sale) => {
          const saleDate = new Date(sale.sale_date);
          return saleDate >= today;
        }),
      ).toBe(true);
    });

    it('filters troop inventory booth sales correctly', () => {
      const troopSales = boothsStore.upcomingBoothSalesUsingTroopInventory;
      expect(troopSales).toHaveLength(1);
      expect(troopSales[0].inventory_type).toBe('troop');
    });

    it('visibleBoothSales shows only non-archived by default', () => {
      boothsStore.allBoothSales = [
        {
          id: 1,
          created_at: '',
          expected_sales: null,
          inventory_type: 'troop',
          location: '',
          notes: null,
          predicted_cookies: {},
          cookies_sold: {},
          profile: '',
          sale_date: '',
          sale_time: null,
          scouts_attending: {},
          season: 0,
          status: null,
        },
        {
          id: 2,
          created_at: '',
          expected_sales: null,
          inventory_type: 'troop',
          location: '',
          notes: null,
          predicted_cookies: {},
          cookies_sold: {},
          profile: '',
          sale_date: '',
          sale_time: null,
          scouts_attending: {},
          season: 0,
          status: 'archived',
        },
      ];

      boothsStore.showArchivedBoothSales = false;
      const visible = boothsStore.visibleBoothSales;
      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe(1);
    });

    it('visibleBoothSales shows all when showArchived is true', () => {
      boothsStore.allBoothSales = [
        {
          id: 1,
          created_at: '',
          expected_sales: null,
          inventory_type: 'troop',
          location: '',
          notes: null,
          predicted_cookies: {},
          cookies_sold: {},
          profile: '',
          sale_date: '',
          sale_time: null,
          scouts_attending: {},
          season: 0,
          status: null,
        },
        {
          id: 2,
          created_at: '',
          expected_sales: null,
          inventory_type: 'troop',
          location: '',
          notes: null,
          predicted_cookies: {},
          cookies_sold: {},
          profile: '',
          sale_date: '',
          sale_time: null,
          scouts_attending: {},
          season: 0,
          status: 'archived',
        },
      ];

      boothsStore.showArchivedBoothSales = true;
      const visible = boothsStore.visibleBoothSales;
      expect(visible).toHaveLength(2);
    });
  });

  describe('fetchBoothSales', () => {
    it('successfully fetches booth sales', async () => {
      const mockBoothSalesReturn = [
        {
          id: 1,
          sale_date: '2024-01-01',
          sale_time: '10:00',
          inventory_type: 'troop',
        },
        {
          id: 2,
          sale_date: '2024-01-02',
          sale_time: '14:00',
          inventory_type: 'girl',
        },
      ];

      const mockBoothSalesTransformed = [
        {
          id: 1,
          sale_date: '01/01/2024',
          sale_time: '10:00',
          inventory_type: 'troop',
          packages_sold: 0,
          total_sales: 0,
        },
        {
          id: 2,
          sale_date: '01/02/2024',
          sale_time: '14:00',
          inventory_type: 'girl',
          packages_sold: 0,
          total_sales: 0,
        },
      ];

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({ data: mockBoothSalesReturn, error: null }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(newBoothsStore.allBoothSales).toEqual(mockBoothSalesTransformed);
    });

    it('returns early if no profile id', async () => {
      const useProfileStoreMock = vi.fn(() => ({
        currentProfile: null,
      }));
      vi.stubGlobal('useProfileStore', useProfileStoreMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(newBoothsStore.allBoothSales).toEqual([]);
    });

    it('returns early if no current season id', async () => {
      const useSeasonsStore = vi.fn(() => ({
        currentSeason: null,
      }));
      vi.stubGlobal('useSeasonsStore', useSeasonsStore);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(newBoothsStore.allBoothSales).toEqual([]);
    });

    it('handles fetch error and shows toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpers = vi.fn(() => ({
        addError: toastSpy,
      }));

      vi.stubGlobal('useNotificationHelpers', useNotificationHelpers);

      const useSupabaseClientMock = vi.fn(() => ({
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
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Fetch failed',
      });
    });
  });

  describe('insertBoothSale', () => {
    it('successfully inserts booth sale with auto-calculated predictions', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addSuccess: toastSpy,
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const mockBoothSale = {
        sale_date: '2024-01-01',
        sale_time: '10:00',
        expected_sales: 100,
        inventory_type: 'troop',
      } as BoothSale;

      const expectedPredictions = { TM: 40, SM: 30, TS: 30 };
      const mockInsertedSale = {
        ...mockBoothSale,
        profile: 'test-user-id',
        season: 1,
        predicted_cookies: expectedPredictions,
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockInsertedSale, error: null }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      const useSupabaseUserMock = vi.fn(() => ({
        value: { id: 'test-user-id' },
      }));
      vi.stubGlobal('useSupabaseUser', useSupabaseUserMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(mockBoothSale.profile).toBe('test-user-id');
      expect(mockBoothSale.season).toBe(1);
      expect(newBoothsStore.allBoothSales).toHaveLength(1);
      expect(newBoothsStore.allBoothSales[0]).toEqual({
        ...mockInsertedSale,
        sale_date: '01/01/2024',
        packages_sold: 0,
        total_sales: 0,
      });
      expect(toastSpy).toHaveBeenCalledWith('Booth Sale Created');
    });

    it('returns early if no current season', async () => {
      const useSeasonsStoreMock = vi.fn(() => ({
        currentSeason: null,
      }));
      vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const mockBoothSale = {
        sale_date: '2024-01-01',
        expected_sales: 100,
      } as BoothSale;
      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(newBoothsStore.allBoothSales).toHaveLength(0);
    });

    it('preserves existing predicted cookies if provided', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const customPredictions = { TM: 50, SM: 25, TS: 25 };
      const mockBoothSale = {
        sale_date: '2024-01-01',
        expected_sales: 100,
        predicted_cookies: customPredictions,
      } as Partial<BoothSale>;

      const mockInsertedSale = {
        ...mockBoothSale,
        profile: 'test-user-id',
        season: 1,
      };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockInsertedSale, error: null }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      const useSupabaseUserMock = vi.fn(() => ({
        value: { id: 'test-user-id' },
      }));
      vi.stubGlobal('useSupabaseUser', useSupabaseUserMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.insertBoothSale(mockBoothSale as BoothSale);

      expect(mockBoothSale.predicted_cookies).toEqual(customPredictions);
    });

    it('removes auto_calculate_predicted_cookies property if present', async () => {
      const mockBoothSale = {
        sale_date: '2024-01-01',
        expected_sales: 100,
        auto_calculate_predicted_cookies: true,
      } as BoothSale;

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { ...mockBoothSale },
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      const useSupabaseUserMock = vi.fn(() => ({
        value: { id: 'test-user-id' },
      }));
      vi.stubGlobal('useSupabaseUser', useSupabaseUserMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(mockBoothSale.auto_calculate_predicted_cookies).toBeUndefined();
    });

    it('handles insert error and shows error toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addError: toastSpy,
      }));

      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const useSupabaseClientMock = vi.fn(() => ({
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
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      const useSupabaseUserMock = vi.fn(() => ({
        value: { id: 'test-user-id' },
      }));
      vi.stubGlobal('useSupabaseUser', useSupabaseUserMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const mockBoothSale = {
        sale_date: '2024-01-01',
        expected_sales: 100,
      } as BoothSale;
      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Insert failed',
      });
    });
  });

  describe('upsertBoothSale', () => {
    beforeEach(() => {
      boothsStore.allBoothSales = [
        {
          id: 1,
          sale_date: '2024-01-01',
          expected_sales: 100,
          inventory_type: 'troop',
        },
      ] as BoothSale[];
    });

    it('successfully upserts booth sale and shows success toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addSuccess: toastSpy,
        addError: toastSpy,
      }));

      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: 1,
                    sale_date: '2024-01-01',
                    expected_sales: 150,
                    inventory_type: 'troop',
                  },
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      newBoothsStore.allBoothSales = [
        {
          id: 1,
          sale_date: '2024-01-01',
          expected_sales: 100,
          inventory_type: 'troop',
        },
      ] as BoothSale[];

      const updatedSale = {
        id: 1,
        sale_date: '2024-01-01',
        expected_sales: 150,
        inventory_type: 'troop',
      } as BoothSale;
      await newBoothsStore.upsertBoothSale(updatedSale);

      expect(newBoothsStore.allBoothSales[0].expected_sales).toBe(150);
      expect(toastSpy).toHaveBeenCalledWith('Booth Sale Updated');
    });

    it('handles upsert error and shows error toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ error: { message: 'Upsert failed' } }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const updatedSale = {
        id: 1,
        sale_date: '2024-01-01',
        expected_sales: 150,
      } as BoothSale;
      await newBoothsStore.upsertBoothSale(updatedSale);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Upsert failed',
      });
    });
  });

  describe('deleteBoothSale', () => {
    beforeEach(() => {
      boothsStore.allBoothSales = [
        { id: 1, sale_date: '2024-01-01', inventory_type: 'troop' },
        { id: 2, sale_date: '2024-01-02', inventory_type: 'girl' },
      ] as BoothSale[];
    });

    it('successfully deletes booth sale and shows success toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addSuccess: toastSpy,
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      newBoothsStore.allBoothSales = [
        { id: 1, sale_date: '2024-01-01', inventory_type: 'troop' },
        { id: 2, sale_date: '2024-01-02', inventory_type: 'girl' },
      ] as BoothSale[];

      const saleToDelete = {
        id: 1,
        sale_date: '2024-01-01',
        inventory_type: 'troop',
      } as BoothSale;
      await newBoothsStore.deleteBoothSale(saleToDelete);

      expect(newBoothsStore.allBoothSales).toHaveLength(1);
      expect(newBoothsStore.allBoothSales[0].id).toBe(2);
      expect(toastSpy).toHaveBeenCalledWith('Booth Sale Deleted');
    });

    it('handles delete error and shows error toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);
      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({ error: { message: 'Delete failed' } }),
            ),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const saleToDelete = {
        id: 1,
        sale_date: '2024-01-01',
        inventory_type: 'troop',
      } as BoothSale;
      await newBoothsStore.deleteBoothSale(saleToDelete);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Delete failed',
      });
    });
  });

  describe('archiveBoothSale', () => {
    it('successfully archives booth sale and shows success toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addSuccess: toastSpy,
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    id: 1,
                    sale_date: '2024-01-01',
                    expected_sales: 100,
                    inventory_type: 'troop',
                    status: 'archived',
                  },
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      newBoothsStore.allBoothSales = [
        {
          id: 1,
          sale_date: '2024-01-01',
          expected_sales: 100,
          inventory_type: 'troop',
          status: null,
        },
      ] as BoothSale[];

      const saleToArchive = {
        id: 1,
        sale_date: '2024-01-01',
        expected_sales: 100,
        inventory_type: 'troop',
        status: null,
      } as BoothSale;
      await newBoothsStore.archiveBoothSale(saleToArchive);

      expect(newBoothsStore.allBoothSales[0].status).toBe('archived');
      expect(toastSpy).toHaveBeenCalledWith('Booth Sale Archived');
    });

    it('handles archive error and shows error toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ error: { message: 'Archive failed' } }),
              ),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const saleToArchive = {
        id: 1,
        sale_date: '2024-01-01',
        expected_sales: 100,
        inventory_type: 'troop',
        status: null,
      } as BoothSale;
      await newBoothsStore.archiveBoothSale(saleToArchive);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Archive failed',
      });
    });
  });

  describe('utility functions', () => {
    const baseBoothSale = {
      created_at: '',
      expected_sales: null,
      id: 0,
      inventory_type: '',
      location: '',
      notes: null,
      predicted_cookies: {},
      profile: '',
      sale_date: '',
      sale_time: null,
      scouts_attending: {},
      season: 0,
      status: null,
    };

    it('setActiveBoothSaleTotalExpectedSales updates total from predictions', () => {
      boothsStore.activeBoothSale = {
        ...baseBoothSale,
        predicted_cookies: { TM: 25, SM: 15, TS: 10 },
      };

      boothsStore.setActiveBoothSaleTotalExpectedSales();

      expect(boothsStore.activeBoothSale.expected_sales).toBe(50);
    });

    it('setActiveBoothSaleTotalExpectedSales sets to 0 when no predictions', () => {
      boothsStore.activeBoothSale = {
        ...baseBoothSale,
        predicted_cookies: {},
      };

      boothsStore.setActiveBoothSaleTotalExpectedSales();

      expect(boothsStore.activeBoothSale.expected_sales).toBe(0);
    });
  });

  describe('cash receipts functionality', () => {
    const baseBoothSale = {
      created_at: '',
      expected_sales: null,
      id: 0,
      inventory_type: '',
      location: '',
      notes: null,
      predicted_cookies: {},
      cookies_sold: null,
      profile: '',
      sale_date: '',
      sale_time: null,
      scouts_attending: {},
      season: 0,
      status: null,
      cash_receipts: null,
      cash_breakdown: null,
    };

    const createEmptyCashBreakdown = () => ({
      ones: 0,
      fives: 0,
      tens: 0,
      twenties: 0,
      fifties: 0,
      hundreds: 0,
      cents: 0,
    });

    beforeEach(() => {
      boothsStore.cashBreakdownActiveSale = createEmptyCashBreakdown();
    });

    it('calculates total cash receipts correctly with bills only', () => {
      boothsStore.cashBreakdownActiveSale = {
        ones: 5, // $5
        fives: 3, // $15
        tens: 2, // $20
        twenties: 1, // $20
        fifties: 1, // $50
        hundreds: 1, // $100
        cents: 0,
      };

      expect(boothsStore.computedTotalCashReceiptsActiveSale).toBe(210);
    });

    it('calculates total cash receipts correctly with coins only', () => {
      boothsStore.cashBreakdownActiveSale = {
        ones: 0,
        fives: 0,
        tens: 0,
        twenties: 0,
        fifties: 0,
        hundreds: 0,
        cents: 1.75,
      };

      expect(boothsStore.computedTotalCashReceiptsActiveSale).toBe(1.75);
    });

    it('calculates total cash receipts correctly with bills and coins', () => {
      boothsStore.cashBreakdownActiveSale = {
        ones: 3, // $3
        fives: 1, // $5
        tens: 2, // $20
        twenties: 0,
        fifties: 0,
        hundreds: 0,
        cents: 0.5,
      };

      expect(boothsStore.computedTotalCashReceiptsActiveSale).toBe(28.5);
    });

    it('rounds total cash receipts to 2 decimal places', () => {
      boothsStore.cashBreakdownActiveSale = {
        ones: 0,
        fives: 0,
        tens: 0,
        twenties: 0,
        fifties: 0,
        hundreds: 0,
        cents: 1.999,
      };

      expect(boothsStore.computedTotalCashReceiptsActiveSale).toBe(2);
    });

    it('initializes cash breakdown when opening record sales dialog', () => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookiesNotVirtual: [],
        allCookies: [],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const mockBoothSale = {
        ...baseBoothSale,
        id: 1,
        sale_date: '2024-01-01',
        inventory_type: 'troop',
        predicted_cookies: { TM: 10, SM: 20 },
        cookies_sold: null,
        cash_breakdown: {
          ones: 2,
          fives: 1,
          tens: 3,
          twenties: 0,
          fifties: 0,
          hundreds: 1,
          cents: 0.25,
        },
      } as BoothSale;

      newBoothsStore.openRecordSalesDialog(mockBoothSale);

      expect(newboothsStore.cashBreakdownActiveSale.ones).toBe(2);
      expect(newboothsStore.cashBreakdownActiveSale.fives).toBe(1);
      expect(newboothsStore.cashBreakdownActiveSale.tens).toBe(3);
      expect(newboothsStore.cashBreakdownActiveSale.hundreds).toBe(1);
      expect(newboothsStore.cashBreakdownActiveSale.cents).toBe(0.25);
    });

    it('resets cash breakdown to zero when booth sale has no cash_breakdown', () => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookiesNotVirtual: [],
        allCookies: [],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      // First set some values
      newboothsStore.cashBreakdownActiveSale = {
        ones: 5,
        fives: 3,
        tens: 2,
        twenties: 1,
        fifties: 1,
        hundreds: 1,
        cents: 1.5,
      };

      const mockBoothSale = {
        ...baseBoothSale,
        id: 1,
        sale_date: '2024-01-01',
        inventory_type: 'troop',
        predicted_cookies: { TM: 10 },
        cash_breakdown: null,
      } as BoothSale;

      newBoothsStore.openRecordSalesDialog(mockBoothSale);

      expect(newboothsStore.cashBreakdownActiveSale.ones).toBe(0);
      expect(newboothsStore.cashBreakdownActiveSale.fives).toBe(0);
      expect(newboothsStore.cashBreakdownActiveSale.tens).toBe(0);
      expect(newboothsStore.cashBreakdownActiveSale.twenties).toBe(0);
      expect(newboothsStore.cashBreakdownActiveSale.fifties).toBe(0);
      expect(newboothsStore.cashBreakdownActiveSale.hundreds).toBe(0);
      expect(newboothsStore.cashBreakdownActiveSale.cents).toBe(0);
    });

    it('saves cash receipts data when recording sales', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addSuccess: toastSpy,
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const useCookiesStoreMock = vi.fn(() => ({
        allCookiesNotVirtual: [],
        allCookies: [],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);

      const mockBoothSale = {
        ...baseBoothSale,
        id: 1,
        sale_date: '2024-01-01',
        inventory_type: 'troop',
        predicted_cookies: { TM: 10 },
      } as BoothSale;

      let savedBoothSale: any = null;
      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn((data) => {
            savedBoothSale = data;
            return Promise.resolve({ error: null });
          }),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      newBoothsStore.allBoothSales = [mockBoothSale];

      // Open dialog and set cash breakdown
      newBoothsStore.openRecordSalesDialog(mockBoothSale);
      newboothsStore.cashBreakdownActiveSale = {
        ones: 10,
        fives: 5,
        tens: 3,
        twenties: 2,
        fifties: 1,
        hundreds: 1,
        cents: 0.75,
      };

      await newBoothsStore.saveRecordedSales();

      expect(savedBoothSale).not.toBeNull();
      expect(savedBoothSale.cash_receipts).toBe(255.75); // 10*1 + 5*5 + 3*10 + 2*20 + 1*50 + 1*100 + 0.75
      expect(savedBoothSale.cash_breakdown).toEqual({
        ones: 10,
        fives: 5,
        tens: 3,
        twenties: 2,
        fifties: 1,
        hundreds: 1,
        cents: 0.75,
      });
    });

    it('resets cash breakdown when closing record sales dialog', () => {
      boothsStore.cashBreakdownActiveSale = {
        ones: 5,
        fives: 3,
        tens: 2,
        twenties: 1,
        fifties: 1,
        hundreds: 1,
        cents: 1.5,
      };

      boothsStore.closeRecordSalesDialog();

      expect(boothsStore.cashBreakdownActiveSale.ones).toBe(0);
      expect(boothsStore.cashBreakdownActiveSale.fives).toBe(0);
      expect(boothsStore.cashBreakdownActiveSale.tens).toBe(0);
      expect(boothsStore.cashBreakdownActiveSale.twenties).toBe(0);
      expect(boothsStore.cashBreakdownActiveSale.fifties).toBe(0);
      expect(boothsStore.cashBreakdownActiveSale.hundreds).toBe(0);
      expect(boothsStore.cashBreakdownActiveSale.cents).toBe(0);
    });
  });
});
