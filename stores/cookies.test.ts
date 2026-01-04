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
          PBP: 0,
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
              PBP: 0,
            };
          }
          if (status === 'pending' && type === 'girl') {
            return {
              ADV: 3,
              TM: 8,
              LEM: 3,
              TRE: 1,
              CD: 1,
              PBP: -5,
            };
          }
          if (status === 'pending' && type === 'troop') {
            return {
              ADV: 2,
              TM: 2,
              LEM: 12,
              TRE: 4,
              CD: 4,
              PBP: 0,
            };
          }
          return {};
        },
      ),
    }));
    vi.stubGlobal('useTransactionsStore', useTransactionsStoreMock);

    // Now create the cookies store
    cookiesStore = useCookiesStore();

    // Set up booth sales data after all stores are created
    const boothsStore = useBoothsStore();
    boothsStore.allBoothSales = [
      {
        id: 1,
        created_at: '',
        expected_sales: null,
        inventory_type: 'troop',
        location: '',
        notes: null,
        predicted_cookies: { ADV: 9, TM: 9 },
        profile: '',
        sale_date: '',
        sale_time: null,
        scouts_attending: {},
        season: 0,
        status: null, // Active booth sale
        cookies_sold: null,
      } as any,
    ];

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
      {
        id: 6,
        name: 'Peanut Butter Patties',
        abbreviation: 'PBP',
        price: 5.0,
        order: 6,
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
      const inventoryTotals = cookiesStore.allCookiesWithInventoryTotals();

      expect(inventoryTotals).toHaveLength(6);

      // Test Adventurefuls (ADV): onHand=100, requestedGirl=10, pendingGirl=3, pendingTroop=2, pendedBooth=-9
      const advCookie = inventoryTotals.find((c) => c.abbreviation === 'ADV');
      expect(advCookie?.onHand).toBe(100);
      expect(advCookie?.requestedGirl).toBe(10);
      expect(advCookie?.pendingGirl).toBe(3);
      expect(advCookie?.pendingTroop).toBe(2);
      expect(advCookie?.afterPending).toBe(105); // 100 + 3 + 2
      expect(advCookie?.afterPendingIncludingRequests).toBe(115); // 105 + 10
      expect(advCookie?.afterPendingIncludingBooths).toBe(96); // 105 + (-9)

      // Test Thin Mints (TM): onHand=75, requestedGirl=5, pendingGirl=8, pendingTroop=2, pendedBooth=-9
      const tmCookie = inventoryTotals.find((c) => c.abbreviation === 'TM');
      expect(tmCookie?.onHand).toBe(75);
      expect(tmCookie?.requestedGirl).toBe(5);
      expect(tmCookie?.pendingGirl).toBe(8);
      expect(tmCookie?.pendingTroop).toBe(2);
      expect(tmCookie?.afterPending).toBe(85); // 75 + 8 + 2
      expect(tmCookie?.afterPendingIncludingRequests).toBe(90); // 85 + 5
      expect(tmCookie?.afterPendingIncludingBooths).toBe(76); // 85 + (-9)

      // Test Lemon-Ups (LEM): onHand=50, requestedGirl=5, pendingGirl=3, pendingTroop=12
      const lemCookie = inventoryTotals.find((c) => c.abbreviation === 'LEM');
      expect(lemCookie?.onHand).toBe(50);
      expect(lemCookie?.requestedGirl).toBe(5);
      expect(lemCookie?.pendingGirl).toBe(3);
      expect(lemCookie?.pendingTroop).toBe(12);
      expect(lemCookie?.afterPending).toBe(65); // 50 + 3 + 12
      expect(lemCookie?.afterPendingIncludingRequests).toBe(70); // 65 + 5
    });

    it('assigns correct status severity based on afterPending quantity', () => {
      const inventoryTotals = cookiesStore.allCookiesWithInventoryTotals(false);

      // ADV: afterPending=105 (>50) should be "success"/"Good"
      const advCookie = inventoryTotals.find((c) => c.abbreviation === 'ADV');
      expect(advCookie?.afterPending).toBe(105);
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

      // TRE: afterPending=30 (>20 but <=50) should be "secondary"/"Ok"
      const treCookie = inventoryTotals.find((c) => c.abbreviation === 'TRE');
      expect(treCookie?.afterPending).toBe(30); // 25 + 1 + 4
      expect(treCookie?.afterPendingStatusSeverity).toBe('secondary');
      expect(treCookie?.afterPendingStatus).toBe('Ok');

      // CD: afterPending=20 (>=0 but <=20) should be "warn"/"Low"
      const cdCookie = inventoryTotals.find((c) => c.abbreviation === 'CD');
      expect(cdCookie?.afterPending).toBe(20); // 15 + 1 + 4
      expect(cdCookie?.afterPendingStatusSeverity).toBe('warn');
      expect(cdCookie?.afterPendingStatus).toBe('Low');

      // PBP: afterPending=-5 (<0) should be "danger"/"Critical"
      const pbpCookie = inventoryTotals.find((c) => c.abbreviation === 'PBP');
      expect(pbpCookie?.afterPending).toBe(-5); // 0 + (-5) + 0
      expect(pbpCookie?.afterPendingStatusSeverity).toBe('danger');
      expect(pbpCookie?.afterPendingStatus).toBe('Critical');
    });

    it('preserves original cookie properties in inventory totals', () => {
      const inventoryTotals = cookiesStore.allCookiesWithInventoryTotals(false);

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

      const inventoryTotals =
        newCookiesStore.allCookiesWithInventoryTotals(false);
      expect(inventoryTotals).toEqual([]);
    });
  });

  describe('state management', () => {
    it('initializes with empty arrays', () => {
      setActivePinia(createPinia());
      const freshStore = useCookiesStore();

      expect(freshStore.allCookies).toEqual([]);
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
    });
  });

  describe('FormKit overbooking validation', () => {
    let useTransactionsStoreMock: ReturnType<typeof vi.fn>;
    let useBoothsStoreMock: ReturnType<typeof vi.fn>;
    let useSeasonsStoreMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      setActivePinia(createPinia());

      // Mock seasons store
      useSeasonsStoreMock = vi.fn(() => ({
        currentSeason: { id: 1, year: 2024 },
        settingsSelectedSeason: { id: 1 },
      }));
      vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

      // Mock transactions store
      useTransactionsStoreMock = vi.fn(() => ({
        activeTransaction: {
          type: 'T2G',
          cookies: {},
        },
        sumTransactionsByCookie: vi.fn((abbreviation: string) => {
          // Mock inventory levels (onHand)
          const inventory: Record<string, number> = {
            LEM: 10, // Lemon-Ups has 10 packages
            TM: 50, // Thin Mints has 50 packages
            TRE: 5, // Trefoils has 5 packages
            CS: 0, // Cookie Share (virtual) has 0
          };
          return inventory[abbreviation] || 0;
        }),
        totalTransactionsByStatusAllCookies: vi.fn(
          (_status: string, _type: string) => {
            // Return maps with 0 for all cookies to keep calculations simple
            // afterPending = onHand + pendingGirl + pendingTroop + pendingBooth
            return {
              LEM: 0,
              TM: 0,
              TRE: 0,
              CS: 0,
            };
          },
        ),
      }));
      vi.stubGlobal('useTransactionsStore', useTransactionsStoreMock);

      // Mock booths store
      useBoothsStoreMock = vi.fn(() => ({
        getPredictedBoothSaleQuantityByCookie: vi.fn(() => 0),
      }));
      vi.stubGlobal('useBoothsStore', useBoothsStoreMock);

      cookiesStore = useCookiesStore();

      // Set up test cookies
      cookiesStore.allCookies = [
        {
          id: 1,
          name: 'Thin Mints',
          abbreviation: 'TM',
          price: 5.0,
          order: 1,
          profile: 'test',
          season: 1,
          is_virtual: false,
          overbooking_allowed: true, // Allows overbooking
        },
        {
          id: 2,
          name: 'Lemon-Ups',
          abbreviation: 'LEM',
          price: 5.0,
          order: 2,
          profile: 'test',
          season: 1,
          is_virtual: false,
          overbooking_allowed: false, // Does NOT allow overbooking
        },
        {
          id: 3,
          name: 'Trefoils',
          abbreviation: 'TRE',
          price: 5.0,
          order: 3,
          profile: 'test',
          season: 1,
          is_virtual: false,
          overbooking_allowed: false, // Does NOT allow overbooking
        },
        {
          id: 4,
          name: 'Cookie Share',
          abbreviation: 'CS',
          price: 5.0,
          order: 4,
          profile: 'test',
          season: 1,
          is_virtual: true, // Virtual cookie
          overbooking_allowed: false,
        },
      ] as Cookie[];
    });

    describe('customCookieValidationRules.overBooking', () => {
      it('should return validation rules object', () => {
        expect(cookiesStore.customCookieValidationRules).toBeDefined();
        expect(cookiesStore.customCookieValidationRules.overBooking).toBeTypeOf(
          'function',
        );
      });

      it('should prevent T2G transactions that exceed inventory for cookies with overbooking_allowed=false', () => {
        // Get the mocked transactions store
        const transactionsStore = useTransactionsStore();

        // Important: Update the active transaction AFTER getting the store
        transactionsStore.activeTransaction = {
          type: 'T2G',
          cookies: { LEM: -15 }, // Trying to give 15, but only 10 available
        };

        // Verify allCookiesWithInventoryTotals is computed correctly
        const cookieWithTotals = cookiesStore
          .allCookiesWithInventoryTotals(false)
          .find((c) => c.abbreviation === 'LEM');
        expect(cookieWithTotals).toBeDefined();
        expect(cookieWithTotals?.afterPending).toBe(10); // onHand=10, pending=0

        // Mock FormKit node structure
        const mockNode = {
          value: -15,
          name: 'LEM',
          parent: { name: 'cookies' },
        };

        const result =
          cookiesStore.customCookieValidationRules.overBooking(mockNode);
        expect(result).toBe(false); // Should fail validation
      });

      it('should allow T2G transactions within inventory for cookies with overbooking_allowed=false', () => {
        const transactionsStore = useTransactionsStore();
        transactionsStore.activeTransaction = {
          type: 'T2G',
          cookies: { LEM: -8 }, // Trying to give 8, and 10 are available
        };

        const mockNode = {
          value: -8,
          name: 'LEM',
          parent: { name: 'cookies' },
        };

        const result =
          cookiesStore.customCookieValidationRules.overBooking(mockNode);
        expect(result).toBe(true); // Should pass validation
      });

      it('should allow overbooking for cookies with overbooking_allowed=true', () => {
        const transactionsStore = useTransactionsStore();
        transactionsStore.activeTransaction = {
          type: 'T2G',
          cookies: { TM: -100 }, // Trying to give 100, only 50 available, but overbooking allowed
        };

        const mockNode = {
          value: -100,
          name: 'TM',
          parent: { name: 'cookies' },
        };

        const result =
          cookiesStore.customCookieValidationRules.overBooking(mockNode);
        expect(result).toBe(true); // Should pass validation
      });

      it('should allow virtual cookies regardless of inventory', () => {
        const transactionsStore = useTransactionsStore();
        transactionsStore.activeTransaction = {
          type: 'T2G',
          cookies: { CS: -50 }, // Virtual cookie with 0 inventory
        };

        const mockNode = {
          value: -50,
          name: 'CS',
          parent: { name: 'cookies' },
        };

        const result =
          cookiesStore.customCookieValidationRules.overBooking(mockNode);
        expect(result).toBe(true); // Should pass validation
      });

      it('should allow G2G transactions regardless of inventory', () => {
        // Need to update the mock to return G2G type
        useTransactionsStoreMock.mockImplementation(() => ({
          activeTransaction: {
            type: 'G2G', // Girl to Girl doesn't affect troop inventory
            cookies: { LEM: -50 },
          },
          sumTransactionsByCookie: vi.fn((abbreviation: string) => {
            const inventory: Record<string, number> = {
              LEM: 10,
              TM: 50,
              TRE: 5,
              CS: 0,
            };
            return inventory[abbreviation] || 0;
          }),
          totalTransactionsByStatusAllCookies: vi.fn(() => ({
            LEM: 0,
            TM: 0,
            TRE: 0,
            CS: 0,
          })),
        }));

        // Recreate the store with the updated mock
        setActivePinia(createPinia());
        vi.stubGlobal('useTransactionsStore', useTransactionsStoreMock);
        vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);
        vi.stubGlobal('useBoothsStore', useBoothsStoreMock);
        const newCookiesStore = useCookiesStore();
        newCookiesStore.allCookies = cookiesStore.allCookies;

        const mockNode = {
          value: -50,
          name: 'LEM',
          parent: { name: 'cookies' },
        };

        const result =
          newCookiesStore.customCookieValidationRules.overBooking(mockNode);
        expect(result).toBe(true); // Should pass validation
      });

      it('should handle booth type transactions (predicted_cookies)', () => {
        const transactionsStore = useTransactionsStore();
        transactionsStore.activeTransaction = {
          type: 'T2G',
          cookies: {},
        };

        // Booth predictions use positive numbers but reduce inventory
        const mockNode = {
          value: 15, // Booth predicts selling 15 (positive)
          name: 'LEM',
          parent: { name: 'predicted_cookies' }, // Indicates booth sale
        };

        // This should check if 10 (current) - 15 (predicted) would go negative
        const result =
          cookiesStore.customCookieValidationRules.overBooking(mockNode);
        expect(result).toBe(false); // Should fail - would result in -5
      });

      it('should allow booth predictions within inventory', () => {
        const transactionsStore = useTransactionsStore();
        transactionsStore.activeTransaction = {
          type: 'T2G',
          cookies: {},
        };

        const mockNode = {
          value: 8, // Booth predicts selling 8 (positive)
          name: 'LEM',
          parent: { name: 'predicted_cookies' },
        };

        // This should check if 10 (current) - 8 (predicted) = 2 (ok)
        const result =
          cookiesStore.customCookieValidationRules.overBooking(mockNode);
        expect(result).toBe(true); // Should pass
      });

      it('should allow positive quantities (adding to inventory)', () => {
        const transactionsStore = useTransactionsStore();
        transactionsStore.activeTransaction = {
          type: 'C2T', // Council to Troop adds inventory
          cookies: { LEM: 50 }, // Adding 50 packages
        };

        const mockNode = {
          value: 50, // Positive quantity
          name: 'LEM',
          parent: { name: 'cookies' },
        };

        const result =
          cookiesStore.customCookieValidationRules.overBooking(mockNode);
        expect(result).toBe(true); // Should always pass for positive quantities
      });

      it('should handle multiple cookies with different restrictions', () => {
        const transactionsStore = useTransactionsStore();
        transactionsStore.activeTransaction = {
          type: 'T2G',
          cookies: { LEM: -8, TRE: -6 },
        };

        // Test LEM (within limits)
        const lemNode = {
          value: -8,
          name: 'LEM',
          parent: { name: 'cookies' },
        };
        expect(
          cookiesStore.customCookieValidationRules.overBooking(lemNode),
        ).toBe(true);

        // Test TRE (exceeds limits - only 5 available)
        const treNode = {
          value: -6,
          name: 'TRE',
          parent: { name: 'cookies' },
        };
        expect(
          cookiesStore.customCookieValidationRules.overBooking(treNode),
        ).toBe(false);
      });
    });
  });

  describe('cookieFormFieldsForBoothSales computed property', () => {
    it('includes min:0 validation for all non-virtual cookies', () => {
      // Set up cookies with one virtual and some non-virtual
      cookiesStore.allCookies = [
        {
          id: 1,
          name: 'Thin Mints',
          abbreviation: 'TM',
          price: 5.0,
          order: 1,
          profile: 'test-profile-id',
          season: 1,
          is_virtual: false,
        },
        {
          id: 2,
          name: 'Virtual Cookie',
          abbreviation: 'VC',
          price: 5.0,
          order: 2,
          profile: 'test-profile-id',
          season: 1,
          is_virtual: true,
        },
        {
          id: 3,
          name: 'Samoas',
          abbreviation: 'SM',
          price: 5.0,
          order: 3,
          profile: 'test-profile-id',
          season: 1,
          is_virtual: false,
        },
      ] as Cookie[];

      const fields = cookiesStore.cookieFormFieldsForBoothSales;

      // Should only have 2 fields (excluding virtual cookie)
      expect(fields).toHaveLength(2);

      // Each field should have min:0 validation
      fields.forEach((field) => {
        expect(field.validation).toContain('min:0');
        expect(field.validation).toContain('integer');
        expect(field.validation).toContain('overBooking');
      });

      // Verify specific fields
      const tmField = fields.find((f) => f.name === 'TM');
      expect(tmField).toBeDefined();
      expect(tmField?.validation).toBe('integer|min:0|overBooking');

      const smField = fields.find((f) => f.name === 'SM');
      expect(smField).toBeDefined();
      expect(smField?.validation).toBe('integer|min:0|overBooking');

      // Virtual cookie should not be present
      const vcField = fields.find((f) => f.name === 'VC');
      expect(vcField).toBeUndefined();
    });
  });

  describe('cookieFormFieldsNotVirtual computed property', () => {
    it('does not include min:0 validation for transaction forms', () => {
      // Set up cookies
      cookiesStore.allCookies = [
        {
          id: 1,
          name: 'Thin Mints',
          abbreviation: 'TM',
          price: 5.0,
          order: 1,
          profile: 'test-profile-id',
          season: 1,
          is_virtual: false,
        },
      ] as Cookie[];

      const fields = cookiesStore.cookieFormFieldsNotVirtual;

      expect(fields).toHaveLength(1);

      // Should NOT have min:0 validation (to allow negative quantities for transactions)
      const tmField = fields.find((f) => f.name === 'TM');
      expect(tmField).toBeDefined();
      expect(tmField?.validation).toBe('integer|overBooking');
      expect(tmField?.validation).not.toContain('min:0');
    });
  });

  describe('getPredictedCookiesFromExpectedSales', () => {
    beforeEach(() => {
      // Create new store instance with the new mock
      setActivePinia(createPinia());
    });

    it('returns 1 cookie for the cookie type with highest percentage when expected sales is 1', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 20 },
      ];
      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(1);
      expect(predictions).toEqual({ TM: 1, SM: 0, TS: 0 });
    });

    it('returns 1 cookie for top two cookie types when expected sales is 2', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 20 },
      ];
      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(2);
      expect(predictions).toEqual({ TM: 1, SM: 1, TS: 0 });
    });

    it('returns 1 cookie for the first 2 cookies in the list when percentages are equal and expected sales is 2', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'CA', percent_of_sale: 20 },
        { id: 2, abbreviation: 'CB', percent_of_sale: 20 },
        { id: 3, abbreviation: 'CC', percent_of_sale: 20 },
        { id: 3, abbreviation: 'CD', percent_of_sale: 20 },
        { id: 3, abbreviation: 'CE', percent_of_sale: 20 },
      ];

      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(2);
      expect(predictions).toEqual({ CA: 1, CB: 1, CC: 0, CD: 0, CE: 0 });
    });

    it('returns 1 cookie for the first cookies in the list with the largest percentage when cookies are tied', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'CA', percent_of_sale: 20 },
        { id: 2, abbreviation: 'CB', percent_of_sale: 40 },
        { id: 3, abbreviation: 'CC', percent_of_sale: 40 },
        { id: 3, abbreviation: 'CD', percent_of_sale: 10 },
        { id: 3, abbreviation: 'CE', percent_of_sale: 10 },
      ];
      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(1);
      expect(predictions).toEqual({ CA: 0, CB: 1, CC: 0, CD: 0, CE: 0 });
    });

    it('returns 1 cookie for all three types when expected sales is 3', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 20 },
      ];
      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(3);
      expect(predictions).toEqual({ TM: 1, SM: 1, TS: 1 });
    });

    it('returns 2 cookies for TM, 1 for SM, and 1 for TS when expected sales is 4', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 20 },
      ];
      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(4);
      expect(predictions).toEqual({ TM: 2, SM: 1, TS: 1 });
    });

    it('returns correct distribution for expected sales of 10', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 20 },
      ];
      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(10);
      expect(predictions).toEqual({ TM: 5, SM: 3, TS: 2 });
    });

    it('returns 0 when expected sales is 0', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 20 },
      ];
      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(0);
      expect(predictions).toEqual({ TM: 0, SM: 0, TS: 0 });
    });

    it('handles rounding correctly for expected sales of 7', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 20 },
      ];
      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(7);
      expect(predictions).toEqual({ TM: 4, SM: 2, TS: 1 });
    });

    it('returns an even distribution when no cookies have percentage_of_sale', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM' }, // No percent_of_sale
        { id: 2, abbreviation: 'SM' },
        { id: 3, abbreviation: 'TS' },
      ];

      const predictions = cookiesStore.getPredictedCookiesFromExpectedSales(6);
      expect(predictions).toEqual({ TM: 2, SM: 2, TS: 2 });
    });

    it("prefers cookies with percentage_of_sale when some have it and some don't", () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 70 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 }, // No percent_of_sale
        { id: 3, abbreviation: 'TS' }, // No percent_of_sale
      ];

      const predictions =
        cookiesStore.getPredictedCookiesFromExpectedSales(100);
      expect(predictions).toEqual({ TM: 70, SM: 30, TS: 0 }); // TM gets majority due to percent_of_sale
    });

    it('returns the correct number of cookies when percent_of_sale sums to less than 100', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 20 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 30 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 10 }, // Sums to 60
      ];

      const predictions =
        cookiesStore.getPredictedCookiesFromExpectedSales(100);
      expect(predictions).toEqual({ TM: 33, SM: 50, TS: 17 }); // Total still equals expected sales
    });

    it('returns the correct number of cookies when percent_of_sale sums to more than 100', () => {
      cookiesStore.allCookies = [
        { id: 1, abbreviation: 'TM', percent_of_sale: 50 },
        { id: 2, abbreviation: 'SM', percent_of_sale: 40 },
        { id: 3, abbreviation: 'TS', percent_of_sale: 30 }, // Sums to 120
      ];

      const predictions =
        cookiesStore.getPredictedCookiesFromExpectedSales(100);
      expect(predictions).toEqual({ TM: 42, SM: 33, TS: 25 }); // Total still equals expected sales
    });
  });
});
