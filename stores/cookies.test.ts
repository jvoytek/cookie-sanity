import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Cookie } from '@/types/types';

// Import the store after setting up global mocks in setup.ts
import { useCookiesStore } from '@/stores/cookies';

describe('stores/cookies', () => {
  let cookiesStore: ReturnType<typeof useCookiesStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up the orders store mock for this test
    const useTransactionsStoreMock = vi.fn(() => ({
      sumTransactionsByCookie: vi.fn((abbreviation: string) => {
        // Mock different inventory amounts based on cookie type
        const mockInventory: Record<string, number> = {
          ADV: 100,
          TM: 75,
          LEM: 50,
          TRE: 25,
          CD: 15,
        };
        return mockInventory[abbreviation] || 0;
      }),
      //Adventurefuls (ADV): onHand=100, requestedGirl=10, pendingGirl=3, pendingTroop=2, pendedBooth=-9
      // Thin Mints (TM): onHand=75, requestedGirl=5, pendingGirl=8, pendingTroop=2, pendedBooth=-9
      // Test Lemon-Ups (LEM): onHand=50, requestedGirl=5, pendingGirl=3, pendingTroop=12
      totalTransactionsByStatusAllCookies: vi.fn(
        (status: string, type: string) => {
          // Mock total requested amounts for all cookies
          if (status === 'requested' && type === 'girl') {
            return {
              ADV: 10,
              TM: 5,
              LEM: 5,
              TRE: 3,
              CD: 3,
            };
          }
          if (status === 'pending' && type === 'girl') {
            return {
              ADV: 3,
              TM: 8,
              LEM: 3,
              TRE: 1,
              CD: 1,
            };
          }
          if (status === 'pending' && type === 'troop') {
            return {
              ADV: 2,
              TM: 2,
              LEM: 12,
              TRE: 4,
              CD: 4,
            };
          }
          return {};
        },
      ),
    }));
    vi.stubGlobal('useTransactionsStore', useTransactionsStoreMock);

    cookiesStore = useCookiesStore();

    // Set up some mock cookie data
    cookiesStore.allCookies = [
      {
        id: 1,
        name: 'Adventurefuls',
        abbreviation: 'ADV',
        price: 5.0,
        order: 1,
        profile: 'test-profile-id',
        season: 1,
      },
      {
        id: 2,
        name: 'Thin Mints',
        abbreviation: 'TM',
        price: 5.0,
        order: 2,
        profile: 'test-profile-id',
        season: 1,
      },
      {
        id: 3,
        name: 'Lemon-Ups',
        abbreviation: 'LEM',
        price: 5.0,
        order: 3,
        profile: 'test-profile-id',
        season: 1,
      },
      {
        id: 4,
        name: 'Trefoils',
        abbreviation: 'TRE',
        price: 5.0,
        order: 4,
        profile: 'test-profile-id',
        season: 1,
      },
      {
        id: 5,
        name: 'Caramel deLites',
        abbreviation: 'CD',
        price: 5.0,
        order: 5,
        profile: 'test-profile-id',
        season: 1,
      },
    ] as Cookie[];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('allCookiesWithInventoryTotals computed property', () => {
    it('calculates inventory totals correctly for each cookie', () => {
      const inventoryTotals = cookiesStore.allCookiesWithInventoryTotals;

      expect(inventoryTotals).toHaveLength(5);

      // Test Adventurefuls (ADV): onHand=100, requestedGirl=10, pendingGirl=3, pendingTroop=2, pendedBooth=-9
      const advCookie = inventoryTotals.find((c) => c.abbreviation === 'ADV');
      expect(advCookie?.onHand).toBe(100);
      expect(advCookie?.requestedGirl).toBe(10);
      expect(advCookie?.pendingGirl).toBe(3);
      expect(advCookie?.pendingTroop).toBe(2);
      expect(advCookie?.afterPending).toBe(96); // 100 + 3 + 2 -9
      expect(advCookie?.afterPendingIncludingRequests).toBe(106); // 105 + 10

      // Test Thin Mints (TM): onHand=75, requestedGirl=5, pendingGirl=8, pendingTroop=2, pendedBooth=-9
      const tmCookie = inventoryTotals.find((c) => c.abbreviation === 'TM');
      expect(tmCookie?.onHand).toBe(75);
      expect(tmCookie?.requestedGirl).toBe(5);
      expect(tmCookie?.pendingGirl).toBe(8);
      expect(tmCookie?.pendingTroop).toBe(2);
      expect(tmCookie?.afterPending).toBe(76); // 75 + 8 + 2 -9
      expect(tmCookie?.afterPendingIncludingRequests).toBe(81); // 85 + 5 -9

      // Test Lemon-Ups (LEM): onHand=50, requestedGirl=5, pendingGirl=3, pendingTroop=12
      const lemCookie = inventoryTotals.find((c) => c.abbreviation === 'LEM');
      expect(lemCookie?.onHand).toBe(50);
      expect(lemCookie?.requestedGirl).toBe(5);
      expect(lemCookie?.pendingGirl).toBe(3);
      expect(lemCookie?.pendingTroop).toBe(12);
      expect(lemCookie?.afterPending).toBe(56); // 50 + 3 + 12 -9
      expect(lemCookie?.afterPendingIncludingRequests).toBe(61); // 65 + 5 -9
    });

    it('assigns correct status severity based on afterPending quantity', () => {
      const inventoryTotals = cookiesStore.allCookiesWithInventoryTotals;

      // ADV: afterPending=96 (>50) should be "success"/"Good"
      const advCookie = inventoryTotals.find((c) => c.abbreviation === 'ADV');
      expect(advCookie?.afterPending).toBe(96);
      expect(advCookie?.afterPendingStatusSeverity).toBe('success');
      expect(advCookie?.afterPendingStatus).toBe('Good');

      // TM: afterPending=85 (>50) should be "success"/"Good"
      const tmCookie = inventoryTotals.find((c) => c.abbreviation === 'TM');
      expect(tmCookie?.afterPendingStatusSeverity).toBe('success');
      expect(tmCookie?.afterPendingStatus).toBe('Good');

      // LEM: afterPending=65 (>50) should be "success"/"Good"
      const lemCookie = inventoryTotals.find((c) => c.abbreviation === 'LEM');
      expect(lemCookie?.afterPendingStatusSeverity).toBe('success');
      expect(lemCookie?.afterPendingStatus).toBe('Good');

      // TRE: afterPending=21 (>20 but <=50) should be "warn"/"Ok"
      const treCookie = inventoryTotals.find((c) => c.abbreviation === 'TRE');
      expect(treCookie?.afterPending).toBe(21); // 25 + 3 + 2 -9
      expect(treCookie?.afterPendingStatusSeverity).toBe('warn');
      expect(treCookie?.afterPendingStatus).toBe('Ok');

      // CD: afterPending=11 (<=20) should be "danger"/"Low"
      const cdCookie = inventoryTotals.find((c) => c.abbreviation === 'CD');
      expect(cdCookie?.afterPending).toBe(11); // 15 + 3 + 2 -9
      expect(cdCookie?.afterPendingStatusSeverity).toBe('danger');
      expect(cdCookie?.afterPendingStatus).toBe('Low');
    });

    it('preserves original cookie properties in inventory totals', () => {
      const inventoryTotals = cookiesStore.allCookiesWithInventoryTotals;

      inventoryTotals.forEach((cookie) => {
        const originalCookie = cookiesStore.allCookies.find(
          (c) => c.id === cookie.id,
        );
        expect(cookie.id).toBe(originalCookie?.id);
        expect(cookie.name).toBe(originalCookie?.name);
        expect(cookie.abbreviation).toBe(originalCookie?.abbreviation);
        expect(cookie.price).toBe(originalCookie?.price);
        expect(cookie.order).toBe(originalCookie?.order);
        expect(cookie.profile).toBe(originalCookie?.profile);
        expect(cookie.season).toBe(originalCookie?.season);
      });
    });

    it('returns empty array when no current season', () => {
      // Mock the seasons store to return no current season
      const useSeasonsStoreMock = vi.fn(() => ({
        currentSeason: null,
        settingsSelectedSeason: { id: 1 },
      }));
      vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

      // Create a new store instance to get the mocked behavior
      setActivePinia(createPinia());
      const newCookiesStore = useCookiesStore();
      newCookiesStore.allCookies = [
        {
          id: 1,
          name: 'Test Cookie',
          abbreviation: 'TEST',
          price: 5.0,
          order: 1,
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Cookie[];

      const inventoryTotals = newCookiesStore.allCookiesWithInventoryTotals;
      expect(inventoryTotals).toEqual([]);
    });
  });

  describe('state management', () => {
    it('initializes with empty arrays', () => {
      setActivePinia(createPinia());
      const freshStore = useCookiesStore();

      expect(freshStore.allCookies).toEqual([]);
      expect(freshStore.seasonCookies).toEqual([]);
    });
  });

  describe('averageCookiePrice computed property', () => {
    it('returns 0 when there are no cookies', () => {
      setActivePinia(createPinia());
      const store = useCookiesStore();
      store.allCookies = [];
      expect(store.averageCookiePrice).toBe(0);
    });

    it('calculates the average price for multiple cookies', () => {
      setActivePinia(createPinia());
      const store = useCookiesStore();
      store.allCookies = [
        {
          id: 1,
          name: 'A',
          abbreviation: 'A',
          price: 4,
          order: 1,
          profile: '',
          season: 1,
        },
        {
          id: 2,
          name: 'B',
          abbreviation: 'B',
          price: 6,
          order: 2,
          profile: '',
          season: 1,
        },
        {
          id: 3,
          name: 'C',
          abbreviation: 'C',
          price: 5,
          order: 3,
          profile: '',
          season: 1,
        },
      ] as Cookie[];
      expect(store.averageCookiePrice).toBe(5);
    });

    it('ignores cookies with undefined price', () => {
      setActivePinia(createPinia());
      const store = useCookiesStore();
      store.allCookies = [
        {
          id: 1,
          name: 'A',
          abbreviation: 'A',
          order: 1,
          profile: '',
          season: 1,
        },
        {
          id: 2,
          name: 'B',
          abbreviation: 'B',
          price: 6,
          order: 2,
          profile: '',
          season: 1,
        },
        {
          id: 3,
          name: 'C',
          abbreviation: 'C',
          price: 4,
          order: 3,
          profile: '',
          season: 1,
        },
      ] as Cookie[];
      expect(store.averageCookiePrice).toBe(3.3333333333333335);
    });

    it('calculates average price for a single cookie', () => {
      setActivePinia(createPinia());
      const store = useCookiesStore();
      store.allCookies = [
        {
          id: 1,
          name: 'Solo',
          abbreviation: 'S',
          price: 7,
          order: 1,
          profile: '',
          season: 1,
        },
      ] as Cookie[];
      expect(store.averageCookiePrice).toBe(7);
    });

    describe('getCookieByAbbreviation', () => {
      it('returns the correct cookie object for a valid abbreviation', () => {
        const cookie = cookiesStore.getCookieByAbbreviation('ADV');
        expect(cookie).toBeDefined();
        expect(cookie?.name).toBe('Adventurefuls');
        expect(cookie?.abbreviation).toBe('ADV');
      });

      it('returns undefined for an abbreviation that does not exist', () => {
        const cookie = cookiesStore.getCookieByAbbreviation('XYZ');
        expect(cookie).toBeUndefined();
      });

      it('returns undefined when allCookies is empty', () => {
        cookiesStore.allCookies = [];
        const cookie = cookiesStore.getCookieByAbbreviation('ADV');
        expect(cookie).toBeUndefined();
      });

      describe('reorderCookies action', () => {
        let cookiesStore: ReturnType<typeof useCookiesStore>;
        let supabaseUpdateSeasonCookiesMock: any;
        let supabaseUpdateAllCookiesMock: any;
        let notificationHelpersMock: any;
        let useSeasonsStoreMock: any;
        let errorSpy: ReturnType<typeof vi.fn>;
        let successSpy: ReturnType<typeof vi.fn>;

        beforeEach(() => {
          setActivePinia(createPinia());

          errorSpy = vi.fn();
          successSpy = vi.fn();

          vi.stubGlobal(
            'useNotificationHelpers',
            vi.fn(() => ({
              addSuccess: successSpy,
              addError: errorSpy,
            })),
          );

          // Mock _supabaseUpdateSeasonCookies and _supabaseUpdateAllCookies
          supabaseUpdateSeasonCookiesMock = vi
            .fn()
            .mockResolvedValue({ error: null });
          supabaseUpdateAllCookiesMock = vi
            .fn()
            .mockResolvedValue({ error: null });

          // Mock seasonsStore
          useSeasonsStoreMock = vi.fn(() => ({
            currentSeason: { id: 1 },
            settingsSelectedSeason: { id: 1 },
          }));
          vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

          // Mock orders store and booths store
          vi.stubGlobal(
            'useTransactionsStore',
            vi.fn(() => ({})),
          );
          vi.stubGlobal(
            'useBoothsStore',
            vi.fn(() => ({
              getPredictedBoothSaleQuantityByCookie: vi.fn(() => -9),
            })),
          );

          // Create store and override private methods
          cookiesStore = useCookiesStore();
          // @ts-expect-error override private
          cookiesStore._supabaseUpdateSeasonCookies =
            supabaseUpdateSeasonCookiesMock;
          // @ts-expect-error override private
          cookiesStore._supabaseUpdateAllCookies = supabaseUpdateAllCookiesMock;

          // Set up initial cookies
          cookiesStore.seasonCookies = [
            {
              id: 1,
              name: 'A',
              abbreviation: 'A',
              order: 0,
              profile: '',
              season: 1,
            },
            {
              id: 2,
              name: 'B',
              abbreviation: 'B',
              order: 1,
              profile: '',
              season: 1,
            },
            {
              id: 3,
              name: 'C',
              abbreviation: 'C',
              order: 2,
              profile: '',
              season: 1,
            },
          ] as Cookie[];
          cookiesStore.allCookies = [...cookiesStore.seasonCookies];
        });

        it('updates order property for each cookie in seasonCookies', async () => {
          const newOrder = [
            {
              id: 3,
              name: 'C',
              abbreviation: 'C',
              order: 2,
              profile: '',
              season: 1,
            },
            {
              id: 1,
              name: 'A',
              abbreviation: 'A',
              order: 0,
              profile: '',
              season: 1,
            },
            {
              id: 2,
              name: 'B',
              abbreviation: 'B',
              order: 1,
              profile: '',
              season: 1,
            },
          ] as Cookie[];

          await cookiesStore.reorderCookies(newOrder);

          expect(cookiesStore.seasonCookies[0].order).toBe(0); // id:1
          expect(cookiesStore.seasonCookies[0].id).toBe(3); // id:1
          expect(cookiesStore.seasonCookies[1].order).toBe(1); // id:2
          expect(cookiesStore.seasonCookies[1].id).toBe(1); // id:2
          expect(cookiesStore.seasonCookies[2].order).toBe(2); // id:3
          expect(cookiesStore.seasonCookies[2].id).toBe(2); // id:3
        });

        it('sets allCookies to seasonCookies when currentSeason matches settingsSelectedSeason', async () => {
          await cookiesStore.reorderCookies(cookiesStore.seasonCookies);
          expect(cookiesStore.allCookies).toEqual(cookiesStore.seasonCookies);
        });

        it('does not set allCookies if currentSeason does not match settingsSelectedSeason', async () => {
          useSeasonsStoreMock.mockReturnValueOnce({
            currentSeason: { id: 1 },
            settingsSelectedSeason: { id: 2 },
          });
          setActivePinia(createPinia());
          const store = useCookiesStore();
          store.seasonCookies = [
            {
              id: 1,
              name: 'A',
              abbreviation: 'A',
              order: 0,
              profile: '',
              season: 1,
            },
          ] as Cookie[];
          store.allCookies = [];
          // @ts-expect-error override private
          store._supabaseUpdateSeasonCookies = supabaseUpdateSeasonCookiesMock;
          await store.reorderCookies(store.seasonCookies);
          expect(store.allCookies).not.toEqual(store.seasonCookies);
        });
      });
    });
  });
});
