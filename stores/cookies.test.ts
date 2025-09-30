import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

// Import the store after setting up global mocks in setup.ts
import { useCookiesStore } from "@/stores/cookies";

describe("stores/cookies", () => {
  let cookiesStore: ReturnType<typeof useCookiesStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up the orders store mock for this test
    global.useTransactionsStore = vi.fn(() => ({
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
      totalTransactionsByStatusAndCookie: vi.fn(
        (status: string, type: string, abbreviation: string) => {
          // Mock different pending amounts based on parameters
          if (status === "requested" && type === "girl") {
            return abbreviation === "ADV" ? 10 : 5;
          }
          if (status === "pending" && type === "girl") {
            return abbreviation === "TM" ? 8 : 3;
          }
          if (status === "pending" && type === "troop") {
            return abbreviation === "LEM" ? 12 : 2;
          }
          return 0;
        },
      ),
    }));

    cookiesStore = useCookiesStore();

    // Set up some mock cookie data
    cookiesStore.allCookies = [
      {
        id: 1,
        name: "Adventurefuls",
        abbreviation: "ADV",
        price: 5.0,
        order: 1,
        profile: "test-profile-id",
        season: 1,
      },
      {
        id: 2,
        name: "Thin Mints",
        abbreviation: "TM",
        price: 5.0,
        order: 2,
        profile: "test-profile-id",
        season: 1,
      },
      {
        id: 3,
        name: "Lemon-Ups",
        abbreviation: "LEM",
        price: 5.0,
        order: 3,
        profile: "test-profile-id",
        season: 1,
      },
      {
        id: 4,
        name: "Trefoils",
        abbreviation: "TRE",
        price: 5.0,
        order: 4,
        profile: "test-profile-id",
        season: 1,
      },
      {
        id: 5,
        name: "Caramel deLites",
        abbreviation: "CD",
        price: 5.0,
        order: 5,
        profile: "test-profile-id",
        season: 1,
      },
    ];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("allCookiesWithInventoryTotals computed property", () => {
    it("calculates inventory totals correctly for each cookie", () => {
      const inventoryTotals = cookiesStore.allCookiesWithInventoryTotals;

      expect(inventoryTotals).toHaveLength(5);

      // Test Adventurefuls (ADV): onHand=100, requestedGirl=10, pendingGirl=3, pendingTroop=2, pendedBooth=-9
      const advCookie = inventoryTotals.find((c) => c.abbreviation === "ADV");
      expect(advCookie?.onHand).toBe(100);
      expect(advCookie?.requestedGirl).toBe(10);
      expect(advCookie?.pendingGirl).toBe(3);
      expect(advCookie?.pendingTroop).toBe(2);
      expect(advCookie?.afterPending).toBe(96); // 100 + 3 + 2 -9
      expect(advCookie?.afterPendingIncludingRequests).toBe(106); // 105 + 10

      // Test Thin Mints (TM): onHand=75, requestedGirl=5, pendingGirl=8, pendingTroop=2, pendedBooth=-9
      const tmCookie = inventoryTotals.find((c) => c.abbreviation === "TM");
      expect(tmCookie?.onHand).toBe(75);
      expect(tmCookie?.requestedGirl).toBe(5);
      expect(tmCookie?.pendingGirl).toBe(8);
      expect(tmCookie?.pendingTroop).toBe(2);
      expect(tmCookie?.afterPending).toBe(76); // 75 + 8 + 2 -9
      expect(tmCookie?.afterPendingIncludingRequests).toBe(81); // 85 + 5 -9

      // Test Lemon-Ups (LEM): onHand=50, requestedGirl=5, pendingGirl=3, pendingTroop=12
      const lemCookie = inventoryTotals.find((c) => c.abbreviation === "LEM");
      expect(lemCookie?.onHand).toBe(50);
      expect(lemCookie?.requestedGirl).toBe(5);
      expect(lemCookie?.pendingGirl).toBe(3);
      expect(lemCookie?.pendingTroop).toBe(12);
      expect(lemCookie?.afterPending).toBe(56); // 50 + 3 + 12 -9
      expect(lemCookie?.afterPendingIncludingRequests).toBe(61); // 65 + 5 -9
    });

    it("assigns correct status severity based on afterPending quantity", () => {
      const inventoryTotals = cookiesStore.allCookiesWithInventoryTotals;

      // ADV: afterPending=105 (>50) should be "success"/"Good"
      const advCookie = inventoryTotals.find((c) => c.abbreviation === "ADV");
      expect(advCookie?.afterPendingStatusSeverity).toBe("success");
      expect(advCookie?.afterPendingStatus).toBe("Good");

      // TM: afterPending=85 (>50) should be "success"/"Good"
      const tmCookie = inventoryTotals.find((c) => c.abbreviation === "TM");
      expect(tmCookie?.afterPendingStatusSeverity).toBe("success");
      expect(tmCookie?.afterPendingStatus).toBe("Good");

      // LEM: afterPending=65 (>50) should be "success"/"Good"
      const lemCookie = inventoryTotals.find((c) => c.abbreviation === "LEM");
      expect(lemCookie?.afterPendingStatusSeverity).toBe("success");
      expect(lemCookie?.afterPendingStatus).toBe("Good");

      // TRE: afterPending=21 (>20 but <=50) should be "warn"/"Ok"
      const treCookie = inventoryTotals.find((c) => c.abbreviation === "TRE");
      expect(treCookie?.afterPending).toBe(21); // 25 + 3 + 2 -9
      expect(treCookie?.afterPendingStatusSeverity).toBe("warn");
      expect(treCookie?.afterPendingStatus).toBe("Ok");

      // CD: afterPending=11 (<=20) should be "danger"/"Low"
      const cdCookie = inventoryTotals.find((c) => c.abbreviation === "CD");
      expect(cdCookie?.afterPending).toBe(11); // 15 + 3 + 2 -9
      expect(cdCookie?.afterPendingStatusSeverity).toBe("danger");
      expect(cdCookie?.afterPendingStatus).toBe("Low");
    });

    it("preserves original cookie properties in inventory totals", () => {
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

    it("returns empty array when no current season", () => {
      // Mock the seasons store to return no current season
      const originalMock = global.useSeasonsStore;
      global.useSeasonsStore = vi.fn(() => ({
        currentSeason: null,
        settingsSelectedSeason: { id: 1 },
      }));

      // Create a new store instance to get the mocked behavior
      setActivePinia(createPinia());
      const newCookiesStore = useCookiesStore();
      newCookiesStore.allCookies = [
        {
          id: 1,
          name: "Test Cookie",
          abbreviation: "TEST",
          price: 5.0,
          order: 1,
          profile: "test-profile-id",
          season: 1,
        },
      ];

      const inventoryTotals = newCookiesStore.allCookiesWithInventoryTotals;
      expect(inventoryTotals).toEqual([]);

      // Restore original mock
      global.useSeasonsStore = originalMock;
    });
  });

  describe("state management", () => {
    it("initializes with empty arrays", () => {
      setActivePinia(createPinia());
      const freshStore = useCookiesStore();

      expect(freshStore.allCookies).toEqual([]);
      expect(freshStore.seasonCookies).toEqual([]);
    });

    it("maintains reactive state when cookies are updated", () => {
      expect(cookiesStore.allCookies).toHaveLength(5);

      // Add a new cookie
      cookiesStore.allCookies.push({
        id: 6,
        name: "Test Cookie",
        abbreviation: "TEST",
        price: 6.0,
        order: 6,
        profile: "test-profile-id",
        season: 1,
      });

      expect(cookiesStore.allCookies).toHaveLength(6);
      expect(cookiesStore.allCookiesWithInventoryTotals).toHaveLength(6);

      const testCookie = cookiesStore.allCookiesWithInventoryTotals.find(
        (c) => c.abbreviation === "TEST",
      );
      expect(testCookie?.name).toBe("Test Cookie");
      expect(testCookie?.price).toBe(6.0);
    });
  });
});
