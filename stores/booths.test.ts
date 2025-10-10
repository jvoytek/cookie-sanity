import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Import the store after setting up global mocks in setup.ts
import { useBoothsStore } from '@/stores/booths';
import type { BoothSale } from '~/types/types';

describe('stores/booths', () => {
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

    const useCookiesStoreMock = vi.fn(() => ({
      allCookies: [
        { id: 1, abbreviation: 'TM', percent_of_sale: 40 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 30 },
      ],
    }));
    vi.stubGlobal('useCookiesStore', useCookiesStoreMock);

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

      boothsStore.allBoothSales = [
        {
          id: 1,
          sale_date: yesterday.toISOString().split('T')[0],
          sale_time: '10:00',
          inventory_type: 'girl',
        },
        {
          id: 2,
          sale_date: tomorrow.toISOString().split('T')[0],
          sale_time: '14:00',
          inventory_type: 'troop',
        },
        {
          id: 3,
          sale_date: tomorrow.toISOString().split('T')[0],
          sale_time: '16:00',
          inventory_type: 'girl',
        },
      ] as BoothSale[];
    });

    it('filters upcoming booth sales correctly', () => {
      const upcoming = boothsStore.upcomingBoothSales;
      expect(upcoming).toHaveLength(2);
      expect(
        upcoming.every(
          (sale) => sale.sale_date >= new Date().toISOString().split('T')[0],
        ),
      ).toBe(true);
    });

    it('filters troop inventory booth sales correctly', () => {
      const troopSales = boothsStore.boothSalesUsingTroopInventory;
      expect(troopSales).toHaveLength(1);
      expect(troopSales[0].inventory_type).toBe('troop');
    });

    it('calculates predicted cookie amounts from troop inventory booths', () => {
      boothsStore.allBoothSales = [
        {
          id: 1,
          created_at: '',
          expected_sales: null,
          inventory_type: 'troop',
          location: '',
          notes: null,
          predicted_cookies: { TM: 10, SM: 5 },
          profile: '',
          sale_date: '',
          sale_time: null,
          scouts_attending: {},
          season: 0,
        },
        {
          id: 2,
          created_at: '',
          expected_sales: null,
          inventory_type: 'troop',
          location: '',
          notes: null,
          predicted_cookies: { TM: 15, TS: 8 },
          profile: '',
          sale_date: '',
          sale_time: null,
          scouts_attending: {},
          season: 0,
        },
        {
          id: 3,
          created_at: '',
          expected_sales: null,
          inventory_type: 'girl',
          location: '',
          notes: null,
          predicted_cookies: { TM: 100 }, // Should be ignored
          profile: '',
          sale_date: '',
          sale_time: null,
          scouts_attending: {},
          season: 0,
        },
      ];

      const predictions = boothsStore.predictedCookieAmounts;
      expect(predictions).toEqual({
        TM: 25, // 10 + 15
        SM: 5,
        TS: 8,
      });
    });
  });

  describe('fetchBoothSales', () => {
    it('successfully fetches booth sales', async () => {
      const mockBoothSales = [
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

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({ data: mockBoothSales, error: null }),
                ),
              })),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(newBoothsStore.allBoothSales).toEqual(mockBoothSales);
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
      expect(mockBoothSale.predicted_cookies).toEqual(expectedPredictions);
      expect(newBoothsStore.allBoothSales).toHaveLength(1);
      expect(newBoothsStore.allBoothSales[0]).toEqual(mockInsertedSale);
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
      }));

      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => Promise.resolve({ error: null })),
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
          upsert: vi.fn(() =>
            Promise.resolve({ error: { message: 'Upsert failed' } }),
          ),
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

  describe('getPredictedCookiesFromExpectedSales', () => {
    beforeEach(() => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
          { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
          { id: 3, abbreviation: 'TS', percent_of_sale: 20 },
        ],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);
      // Create new store instance with the new mock
      setActivePinia(createPinia());
      boothsStore = useBoothsStore();
    });

    it('returns 1 cookie for the cookie type with highest percentage when expected sales is 1', () => {
      const predictions = boothsStore.getPredictedCookiesFromExpectedSales(1);
      expect(predictions).toEqual({ TM: 1, SM: 0, TS: 0 });
    });

    it('returns 1 cookie for top two cookie types when expected sales is 2', () => {
      const predictions = boothsStore.getPredictedCookiesFromExpectedSales(2);
      expect(predictions).toEqual({ TM: 1, SM: 1, TS: 0 });
    });

    it('returns 1 cookie for the first 2 cookies in the list when percentages are equal and expected sales is 2', () => {
      const useCookiesStorMock = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: 'CA', percent_of_sale: 20 },
          { id: 2, abbreviation: 'CB', percent_of_sale: 20 },
          { id: 3, abbreviation: 'CC', percent_of_sale: 20 },
          { id: 3, abbreviation: 'CD', percent_of_sale: 20 },
          { id: 3, abbreviation: 'CE', percent_of_sale: 20 },
        ],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStorMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      const predictions =
        newBoothsStore.getPredictedCookiesFromExpectedSales(2);
      expect(predictions).toEqual({ CA: 1, CB: 1, CC: 0, CD: 0, CE: 0 });
    });

    it('returns 1 cookie for the first cookies in the list with the largest percentage when cookies are tied', () => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: 'CA', percent_of_sale: 20 },
          { id: 2, abbreviation: 'CB', percent_of_sale: 40 },
          { id: 3, abbreviation: 'CC', percent_of_sale: 40 },
          { id: 3, abbreviation: 'CD', percent_of_sale: 10 },
          { id: 3, abbreviation: 'CE', percent_of_sale: 10 },
        ],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);
      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      const predictions =
        newBoothsStore.getPredictedCookiesFromExpectedSales(1);
      expect(predictions).toEqual({ CA: 0, CB: 1, CC: 0, CD: 0, CE: 0 });
    });

    it('returns 1 cookie for all three types when expected sales is 3', () => {
      const predictions = boothsStore.getPredictedCookiesFromExpectedSales(3);
      expect(predictions).toEqual({ TM: 1, SM: 1, TS: 1 });
    });

    it('returns 2 cookies for TM, 1 for SM, and 1 for TS when expected sales is 4', () => {
      const predictions = boothsStore.getPredictedCookiesFromExpectedSales(4);
      expect(predictions).toEqual({ TM: 2, SM: 1, TS: 1 });
    });

    it('returns correct distribution for expected sales of 10', () => {
      const predictions = boothsStore.getPredictedCookiesFromExpectedSales(10);
      expect(predictions).toEqual({ TM: 5, SM: 3, TS: 2 });
    });

    it('returns 0 when expected sales is 0', () => {
      const predictions = boothsStore.getPredictedCookiesFromExpectedSales(0);
      expect(predictions).toEqual({ TM: 0, SM: 0, TS: 0 });
    });

    it('handles rounding correctly for expected sales of 7', () => {
      const predictions = boothsStore.getPredictedCookiesFromExpectedSales(7);
      expect(predictions).toEqual({ TM: 4, SM: 2, TS: 1 });
    });

    it('returns an even distribution when no cookies have percentage_of_sale', () => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: 'TM' }, // No percent_of_sale
          { id: 2, abbreviation: 'SM' },
          { id: 3, abbreviation: 'TS' },
        ],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);
      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const predictions =
        newBoothsStore.getPredictedCookiesFromExpectedSales(6);
      expect(predictions).toEqual({ TM: 2, SM: 2, TS: 2 });
    });

    it("prefers cookies with percentage_of_sale when some have it and some don't", () => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: 'TM', percent_of_sale: 70 },
          { id: 2, abbreviation: 'SM', percent_of_sale: 30 }, // No percent_of_sale
          { id: 3, abbreviation: 'TS' }, // No percent_of_sale
        ],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);
      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const predictions =
        newBoothsStore.getPredictedCookiesFromExpectedSales(100);
      expect(predictions).toEqual({ TM: 70, SM: 30, TS: 0 }); // TM gets majority due to percent_of_sale
    });

    it('returns the correct number of cookies when percent_of_sale sums to less than 100', () => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: 'TM', percent_of_sale: 20 },
          { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
          { id: 3, abbreviation: 'TS', percent_of_sale: 10 }, // Sums to 60
        ],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);
      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const predictions =
        newBoothsStore.getPredictedCookiesFromExpectedSales(100);
      expect(predictions).toEqual({ TM: 33, SM: 50, TS: 17 }); // Total still equals expected sales
    });

    it('returns the correct number of cookies when percent_of_sale sums to more than 100', () => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
          { id: 2, abbreviation: 'SM', percent_of_sale: 40 },
          { id: 3, abbreviation: 'TS', percent_of_sale: 30 }, // Sums to 120
        ],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);
      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const predictions =
        newBoothsStore.getPredictedCookiesFromExpectedSales(100);
      expect(predictions).toEqual({ TM: 42, SM: 33, TS: 25 }); // Total still equals expected sales
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
    };

    it('getPredictedBoothSaleQuantityByCookie returns correct negative total', () => {
      boothsStore.allBoothSales = [
        {
          ...baseBoothSale,
          id: 1,
          predicted_cookies: { TM: 10, SM: 5 },
          inventory_type: 'troop',
        },
        {
          ...baseBoothSale,
          id: 2,
          predicted_cookies: { TM: 15, TS: 8 },
          inventory_type: 'troop',
        },
      ];

      const predicted = boothsStore.getPredictedBoothSaleQuantityByCookie('TM');
      expect(predicted).toBe(-25); // Negative for inventory purposes
    });

    it('getPredictedBoothSaleQuantityByCookie returns 0 for non-existent cookie', () => {
      boothsStore.allBoothSales = [
        {
          ...baseBoothSale,
          id: 1,
          inventory_type: 'troop',
          predicted_cookies: { TM: 10 },
        },
      ];

      const predicted =
        boothsStore.getPredictedBoothSaleQuantityByCookie('NONEXISTENT');
      expect(predicted).toBe(-0); // The function returns total * -1, so 0 * -1 = -0
    });

    it('setActiveBoothSalePredictedCookies calculates predictions correctly', () => {
      boothsStore.activeBoothSale = baseBoothSale;

      boothsStore.setActiveBoothSalePredictedCookies(100);

      expect(boothsStore.activeBoothSale.predicted_cookies).toEqual({
        TM: 40,
        SM: 30,
        TS: 30,
      });
    });

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

  describe('prediction calculations with equal distribution', () => {
    it('calculates equal distribution when no cookie ratios defined', () => {
      const useCookiesStoreMock = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: 'TM' }, // No percent_of_sale
          { id: 2, abbreviation: 'SM' },
          { id: 3, abbreviation: 'TS' },
        ],
      }));
      vi.stubGlobal('useCookiesStore', useCookiesStoreMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      newBoothsStore.activeBoothSale = {
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
      };

      newBoothsStore.setActiveBoothSalePredictedCookies(99);

      // Should distribute 99 equally across 3 cookies: 33, 33, 33
      const predictions = newBoothsStore.activeBoothSale.predicted_cookies;
      expect(predictions).toEqual({ TM: 33, SM: 33, TS: 33 });
      expect(Object.keys(predictions)).toHaveLength(3);
    });
  });

  describe('auto-calculate behavior', () => {
    it('calculates expected_sales from predicted_cookies when auto-calculate is off', () => {
      const baseBoothSale = {
        created_at: '',
        expected_sales: 0,
        id: 0,
        inventory_type: '',
        location: '',
        notes: null,
        predicted_cookies: { TM: 25, SM: 15, TS: 10 },
        profile: '',
        sale_date: '',
        sale_time: null,
        scouts_attending: {},
        season: 0,
        auto_calculate_predicted_cookies: false,
      };

      boothsStore.activeBoothSale = baseBoothSale;
      boothsStore.setActiveBoothSaleTotalExpectedSales();

      expect(boothsStore.activeBoothSale.expected_sales).toBe(50);
    });

    it('calculates predicted_cookies from expected_sales when auto-calculate is on', () => {
      const baseBoothSale = {
        created_at: '',
        expected_sales: 100,
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
        auto_calculate_predicted_cookies: true,
      };

      boothsStore.activeBoothSale = baseBoothSale;
      boothsStore.setActiveBoothSalePredictedCookies(100);

      expect(boothsStore.activeBoothSale.predicted_cookies).toEqual({
        TM: 40,
        SM: 30,
        TS: 30,
      });
    });
  });

  describe('private functions integration', () => {
    it('sorts booth sales by date and time correctly', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      // Add a booth sale that should sort first chronologically
      const mockBoothSale = {
        sale_date: '2024-01-01',
        sale_time: '08:00',
        expected_sales: 50,
      } as BoothSale;

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

      // Set initial state with existing booth sales
      boothsStore.allBoothSales = [
        {
          id: 2,
          sale_date: '2024-01-01',
          sale_time: '10:00',
          expected_sales: 100,
        },
        {
          id: 3,
          sale_date: '2024-01-02',
          sale_time: '09:00',
          expected_sales: 75,
        },
      ] as BoothSale[];

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      newBoothsStore.allBoothSales = [
        {
          id: 2,
          sale_date: '2024-01-01',
          sale_time: '10:00',
          expected_sales: 100,
        },
        {
          id: 3,
          sale_date: '2024-01-02',
          sale_time: '09:00',
          expected_sales: 75,
        },
      ] as BoothSale[];

      await newBoothsStore.insertBoothSale(mockBoothSale);

      // Should be sorted by date and time
      expect(newBoothsStore.allBoothSales[0].sale_time).toBe('08:00'); // Earlier time on same day
      expect(newBoothsStore.allBoothSales[1].sale_time).toBe('10:00');
      expect(newBoothsStore.allBoothSales[2].sale_date).toBe('2024-01-02');
    });
  });
});
