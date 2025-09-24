import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

// Import the store after setting up global mocks in setup.ts
import { useBoothsStore } from "@/stores/booths";

describe("stores/booths", () => {
  let boothsStore: ReturnType<typeof useBoothsStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up the profileStore, seasonsStore, and cookiesStore mocks
    global.useProfileStore = vi.fn(() => ({
      currentProfile: {
        id: "test-profile-id",
      },
    }));

    global.useSeasonsStore = vi.fn(() => ({
      currentSeason: {
        id: 1,
      },
    }));

    global.useCookiesStore = vi.fn(() => ({
      allCookies: [
        { id: 1, abbreviation: "TM", percent_of_sale: 40 },
        { id: 2, abbreviation: "SM", percent_of_sale: 30 },
        { id: 3, abbreviation: "TS", percent_of_sale: 30 },
      ],
    }));

    boothsStore = useBoothsStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("state management", () => {
    it("initializes with default values", () => {
      setActivePinia(createPinia());
      const freshStore = useBoothsStore();

      expect(freshStore.allBoothSales).toEqual([]);
      expect(freshStore.boothDialogFormSchema).toEqual([]);
      expect(freshStore.activeBoothSale).toEqual({});
      expect(freshStore.boothDialogVisible).toBe(false);
    });
  });

  describe("computed properties", () => {
    beforeEach(() => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      boothsStore.allBoothSales = [
        {
          id: 1,
          sale_date: yesterday.toISOString().split("T")[0],
          sale_time: "10:00",
          inventory_type: "girl",
        },
        {
          id: 2,
          sale_date: tomorrow.toISOString().split("T")[0],
          sale_time: "14:00",
          inventory_type: "troop",
        },
        {
          id: 3,
          sale_date: tomorrow.toISOString().split("T")[0],
          sale_time: "16:00",
          inventory_type: "girl",
        },
      ];
    });

    it("filters upcoming booth sales correctly", () => {
      const upcoming = boothsStore.upcomingBoothSales;
      expect(upcoming).toHaveLength(2);
      expect(
        upcoming.every(
          (sale) => sale.sale_date >= new Date().toISOString().split("T")[0],
        ),
      ).toBe(true);
    });

    it("filters troop inventory booth sales correctly", () => {
      const troopSales = boothsStore.troopInventoryBoothSales;
      expect(troopSales).toHaveLength(1);
      expect(troopSales[0].inventory_type).toBe("troop");
    });

    it("calculates predicted cookie amounts from troop inventory booths", () => {
      boothsStore.allBoothSales = [
        {
          id: 1,
          inventory_type: "troop",
          predicted_cookies: { TM: 10, SM: 5 },
        },
        {
          id: 2,
          inventory_type: "troop",
          predicted_cookies: { TM: 15, TS: 8 },
        },
        {
          id: 3,
          inventory_type: "girl",
          predicted_cookies: { TM: 100 }, // Should be ignored
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

  describe("fetchBoothSales", () => {
    it("successfully fetches booth sales", async () => {
      const mockBoothSales = [
        {
          id: 1,
          sale_date: "2024-01-01",
          sale_time: "10:00",
          inventory_type: "troop",
        },
        {
          id: 2,
          sale_date: "2024-01-02",
          sale_time: "14:00",
          inventory_type: "girl",
        },
      ];

      global.useSupabaseClient = vi.fn(() => ({
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

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(newBoothsStore.allBoothSales).toEqual(mockBoothSales);
    });

    it("returns early if no profile id", async () => {
      global.useProfileStore = vi.fn(() => ({
        currentProfile: null,
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(newBoothsStore.allBoothSales).toEqual([]);
    });

    it("returns early if no current season id", async () => {
      global.useSeasonsStore = vi.fn(() => ({
        currentSeason: null,
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(newBoothsStore.allBoothSales).toEqual([]);
    });

    it("handles fetch error and shows toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: "Fetch failed" },
                  }),
                ),
              })),
            })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.fetchBoothSales();

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Fetch failed",
        life: 3000,
      });
    });
  });

  describe("insertBoothSale", () => {
    it("successfully inserts booth sale with auto-calculated predictions", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      const mockBoothSale = {
        sale_date: "2024-01-01",
        sale_time: "10:00",
        expected_sales: 100,
        inventory_type: "troop",
      };

      const expectedPredictions = { TM: 40, SM: 30, TS: 30 };
      const mockInsertedSale = {
        id: 1,
        ...mockBoothSale,
        profile: "test-user-id",
        season: 1,
        predicted_cookies: expectedPredictions,
      };

      global.useSupabaseClient = vi.fn(() => ({
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

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(mockBoothSale.profile).toBe("test-user-id");
      expect(mockBoothSale.season).toBe(1);
      expect(mockBoothSale.predicted_cookies).toEqual(expectedPredictions);
      expect(newBoothsStore.allBoothSales).toHaveLength(1);
      expect(newBoothsStore.allBoothSales[0]).toEqual(mockInsertedSale);
      expect(toastSpy).toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Booth Sale Created",
        life: 3000,
      });
    });

    it("returns early if no current season", async () => {
      global.useSeasonsStore = vi.fn(() => ({
        currentSeason: null,
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const mockBoothSale = { sale_date: "2024-01-01", expected_sales: 100 };
      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(newBoothsStore.allBoothSales).toHaveLength(0);
    });

    it("preserves existing predicted cookies if provided", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      const customPredictions = { TM: 50, SM: 25, TS: 25 };
      const mockBoothSale = {
        sale_date: "2024-01-01",
        expected_sales: 100,
        predicted_cookies: customPredictions,
      };

      const mockInsertedSale = {
        id: 1,
        ...mockBoothSale,
        profile: "test-user-id",
        season: 1,
      };

      global.useSupabaseClient = vi.fn(() => ({
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

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(mockBoothSale.predicted_cookies).toEqual(customPredictions);
    });

    it("removes auto_calculate_predicted_cookies property if present", async () => {
      const mockBoothSale = {
        sale_date: "2024-01-01",
        expected_sales: 100,
        auto_calculate_predicted_cookies: true,
      };

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: { id: 1, ...mockBoothSale },
                  error: null,
                }),
              ),
            })),
          })),
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(mockBoothSale.auto_calculate_predicted_cookies).toBeUndefined();
    });

    it("handles insert error and shows error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: "Insert failed" },
                }),
              ),
            })),
          })),
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const mockBoothSale = { sale_date: "2024-01-01", expected_sales: 100 };
      await newBoothsStore.insertBoothSale(mockBoothSale);

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Insert failed",
        life: 3000,
      });
    });
  });

  describe("upsertBoothSale", () => {
    beforeEach(() => {
      boothsStore.allBoothSales = [
        {
          id: 1,
          sale_date: "2024-01-01",
          expected_sales: 100,
          inventory_type: "troop",
        },
      ];
    });

    it("successfully upserts booth sale and shows success toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      newBoothsStore.allBoothSales = [
        {
          id: 1,
          sale_date: "2024-01-01",
          expected_sales: 100,
          inventory_type: "troop",
        },
      ];

      const updatedSale = {
        id: 1,
        sale_date: "2024-01-01",
        expected_sales: 150,
        inventory_type: "troop",
      };
      await newBoothsStore.upsertBoothSale(updatedSale);

      expect(newBoothsStore.allBoothSales[0].expected_sales).toBe(150);
      expect(toastSpy).toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Booth Sale Updated",
        life: 3000,
      });
    });

    it("handles upsert error and shows error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() =>
            Promise.resolve({ error: { message: "Upsert failed" } }),
          ),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const updatedSale = {
        id: 1,
        sale_date: "2024-01-01",
        expected_sales: 150,
      };
      await newBoothsStore.upsertBoothSale(updatedSale);

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Upsert failed",
        life: 3000,
      });
    });
  });

  describe("deleteBoothSale", () => {
    beforeEach(() => {
      boothsStore.allBoothSales = [
        { id: 1, sale_date: "2024-01-01", inventory_type: "troop" },
        { id: 2, sale_date: "2024-01-02", inventory_type: "girl" },
      ];
    });

    it("successfully deletes booth sale and shows success toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      newBoothsStore.allBoothSales = [
        { id: 1, sale_date: "2024-01-01", inventory_type: "troop" },
        { id: 2, sale_date: "2024-01-02", inventory_type: "girl" },
      ];

      const saleToDelete = {
        id: 1,
        sale_date: "2024-01-01",
        inventory_type: "troop",
      };
      await newBoothsStore.deleteBoothSale(saleToDelete);

      expect(newBoothsStore.allBoothSales).toHaveLength(1);
      expect(newBoothsStore.allBoothSales[0].id).toBe(2);
      expect(toastSpy).toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Booth Sale Deleted",
        life: 3000,
      });
    });

    it("handles delete error and shows error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          delete: vi.fn(() => ({
            eq: vi.fn(() =>
              Promise.resolve({ error: { message: "Delete failed" } }),
            ),
          })),
        })),
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      const saleToDelete = {
        id: 1,
        sale_date: "2024-01-01",
        inventory_type: "troop",
      };
      await newBoothsStore.deleteBoothSale(saleToDelete);

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Delete failed",
        life: 3000,
      });
    });
  });

  describe("utility functions", () => {
    it("getPredictedAmountForCookie returns correct negative total", () => {
      boothsStore.allBoothSales = [
        {
          id: 1,
          inventory_type: "troop",
          predicted_cookies: { TM: 10, SM: 5 },
        },
        {
          id: 2,
          inventory_type: "troop",
          predicted_cookies: { TM: 15, TS: 8 },
        },
      ];

      const predicted = boothsStore.getPredictedAmountForCookie("TM");
      expect(predicted).toBe(-25); // Negative for inventory purposes
    });

    it("getPredictedAmountForCookie returns 0 for non-existent cookie", () => {
      boothsStore.allBoothSales = [
        {
          id: 1,
          inventory_type: "troop",
          predicted_cookies: { TM: 10 },
        },
      ];

      const predicted = boothsStore.getPredictedAmountForCookie("NONEXISTENT");
      expect(predicted).toBe(-0); // The function returns total * -1, so 0 * -1 = -0
    });

    it("setActiveBoothSalePredictedCookies calculates predictions correctly", () => {
      boothsStore.activeBoothSale = {};

      boothsStore.setActiveBoothSalePredictedCookies(100);

      expect(boothsStore.activeBoothSale.predicted_cookies).toEqual({
        TM: 40,
        SM: 30,
        TS: 30,
      });
    });

    it("setActiveBoothSaleTotalExpectedSales updates total from predictions", () => {
      boothsStore.activeBoothSale = {
        predicted_cookies: { TM: 25, SM: 15, TS: 10 },
      };

      boothsStore.setActiveBoothSaleTotalExpectedSales();

      expect(boothsStore.activeBoothSale.expected_sales).toBe(50);
    });

    it("setActiveBoothSaleTotalExpectedSales sets to 0 when no predictions", () => {
      boothsStore.activeBoothSale = {};

      boothsStore.setActiveBoothSaleTotalExpectedSales();

      expect(boothsStore.activeBoothSale.expected_sales).toBe(0);
    });
  });

  describe("prediction calculations with equal distribution", () => {
    it("calculates equal distribution when no cookie ratios defined", () => {
      global.useCookiesStore = vi.fn(() => ({
        allCookies: [
          { id: 1, abbreviation: "TM" }, // No percent_of_sale
          { id: 2, abbreviation: "SM" },
          { id: 3, abbreviation: "TS" },
        ],
      }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();

      newBoothsStore.setActiveBoothSalePredictedCookies(99);

      // Should distribute 99 equally across 3 cookies: 33, 33, 33
      const predictions = newBoothsStore.activeBoothSale.predicted_cookies;
      expect(Object.values(predictions).reduce((a, b) => a + b, 0)).toBe(99);
      expect(Object.keys(predictions)).toHaveLength(3);
    });
  });

  describe("private functions integration", () => {
    it("sorts booth sales by date and time correctly", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      // Add a booth sale that should sort first chronologically
      const mockBoothSale = {
        sale_date: "2024-01-01",
        sale_time: "08:00",
        expected_sales: 50,
      };

      const mockInsertedSale = {
        id: 1,
        ...mockBoothSale,
        profile: "test-user-id",
        season: 1,
      };

      global.useSupabaseClient = vi.fn(() => ({
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

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Set initial state with existing booth sales
      boothsStore.allBoothSales = [
        {
          id: 2,
          sale_date: "2024-01-01",
          sale_time: "10:00",
          expected_sales: 100,
        },
        {
          id: 3,
          sale_date: "2024-01-02",
          sale_time: "09:00",
          expected_sales: 75,
        },
      ];

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newBoothsStore = useBoothsStore();
      newBoothsStore.allBoothSales = [
        {
          id: 2,
          sale_date: "2024-01-01",
          sale_time: "10:00",
          expected_sales: 100,
        },
        {
          id: 3,
          sale_date: "2024-01-02",
          sale_time: "09:00",
          expected_sales: 75,
        },
      ];

      await newBoothsStore.insertBoothSale(mockBoothSale);

      // Should be sorted by date and time
      expect(newBoothsStore.allBoothSales[0].sale_time).toBe("08:00"); // Earlier time on same day
      expect(newBoothsStore.allBoothSales[1].sale_time).toBe("10:00");
      expect(newBoothsStore.allBoothSales[2].sale_date).toBe("2024-01-02");
    });
  });
});
