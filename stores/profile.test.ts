import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";

// Import the store after setting up global mocks in setup.ts
import { useProfileStore } from "@/stores/profile";

describe("stores/profile", () => {
  let profileStore: ReturnType<typeof useProfileStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up other store mocks
    global.useSeasonsStore = vi.fn(() => ({
      currentSeason: { id: 1 },
      fetchSeasons: vi.fn(),
    }));

    global.useCookiesStore = vi.fn(() => ({
      fetchCookies: vi.fn(),
    }));

    global.useGirlsStore = vi.fn(() => ({
      fetchGirls: vi.fn(),
    }));

    global.useTransactionsStore = vi.fn(() => ({
      fetchTransactions: vi.fn(),
    }));

    global.useAccountsStore = vi.fn(() => ({
      fetchPayments: vi.fn(),
    }));

    global.useBoothsStore = vi.fn(() => ({
      fetchBoothSales: vi.fn(),
    }));

    profileStore = useProfileStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("state management", () => {
    it("initializes with default values", () => {
      setActivePinia(createPinia());
      const freshStore = useProfileStore();

      expect(freshStore.currentProfile).toBeUndefined();
      expect(freshStore.display_name).toBe("");
      expect(freshStore.appState).toEqual({});
    });
  });

  describe("fetchProfile", () => {
    it("successfully fetches profile and triggers other store fetches", async () => {
      const mockProfile = {
        id: "test-user-id",
        display_name: "Test User",
        season: 1,
        state: { theme: "light" },
      };

      const fetchSeasonsSpy = vi.fn();
      const fetchCookiesSpy = vi.fn();
      const fetchGirlsSpy = vi.fn();
      const fetchTransactionsSpy = vi.fn();
      const fetchPaymentsSpy = vi.fn();
      const fetchBoothSalesSpy = vi.fn();

      global.useSeasonsStore = vi.fn(() => ({
        fetchSeasons: fetchSeasonsSpy,
      }));

      global.useCookiesStore = vi.fn(() => ({
        fetchCookies: fetchCookiesSpy,
      }));

      global.useGirlsStore = vi.fn(() => ({
        fetchGirls: fetchGirlsSpy,
      }));

      global.useTransactionsStore = vi.fn(() => ({
        fetchTransactions: fetchTransactionsSpy,
      }));

      global.useAccountsStore = vi.fn(() => ({
        fetchPayments: fetchPaymentsSpy,
      }));

      global.useBoothsStore = vi.fn(() => ({
        fetchBoothSales: fetchBoothSalesSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockProfile, error: null }),
              ),
            })),
          })),
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mocks
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.fetchProfile();

      expect(newProfileStore.currentProfile).toEqual(mockProfile);
      expect(newProfileStore.display_name).toBe("Test User");
      expect(newProfileStore.appState).toEqual({ theme: "light" });
      expect(fetchSeasonsSpy).toHaveBeenCalled();
      expect(fetchCookiesSpy).toHaveBeenCalled();
      expect(fetchGirlsSpy).toHaveBeenCalled();
      expect(fetchTransactionsSpy).toHaveBeenCalled();
      expect(fetchPaymentsSpy).toHaveBeenCalled();
      expect(fetchBoothSalesSpy).toHaveBeenCalled();
    });

    it("returns early when no user", async () => {
      global.useSupabaseUser = vi.fn(() => ({ value: null }));

      // Create new store instance
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.fetchProfile();

      expect(newProfileStore.currentProfile).toBeUndefined();
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
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { message: "Profile not found" },
                }),
              ),
            })),
          })),
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.fetchProfile();

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Profile not found",
        life: 3000,
      });
    });

    it("handles missing profile fields gracefully", async () => {
      const mockProfile = {
        id: "test-user-id",
        // Missing display_name, season, state
      };

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockProfile, error: null }),
              ),
            })),
          })),
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.fetchProfile();

      expect(newProfileStore.currentProfile).toEqual(mockProfile);
      expect(newProfileStore.display_name).toBe("");
      expect(newProfileStore.appState).toEqual({});
    });
  });

  describe("updateProfile", () => {
    beforeEach(() => {
      profileStore.display_name = "Updated Name";
      profileStore.appState = { theme: "dark" };
    });

    it("successfully updates profile and shows success toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();
      newProfileStore.display_name = "Updated Name";
      newProfileStore.appState = { theme: "dark" };

      await newProfileStore.updateProfile();

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Profile Updated",
        life: 3000,
      });
    });

    it("updates profile silently when silent flag is true", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.updateProfile(true);

      expect(toastSpy).not.toHaveBeenCalledWith({
        severity: "success",
        summary: "Successful",
        detail: "Profile Updated",
        life: 3000,
      });
    });

    it("returns early when no user id", async () => {
      global.useSupabaseUser = vi.fn(() => ({ value: null }));

      // Create new store instance
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.updateProfile();

      // No assertions needed, just ensuring no error is thrown
    });

    it("handles update error and shows error toast", async () => {
      const toastSpy = vi.fn();
      global.useToast = vi.fn(() => ({
        add: toastSpy,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() =>
            Promise.resolve({ error: { message: "Update failed" } }),
          ),
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.updateProfile();

      expect(toastSpy).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Update failed",
        life: 3000,
      });
    });
  });

  describe("saveCurrentSeasonInProfile", () => {
    it("saves current season id and updates profile silently", async () => {
      const upsertSpy = vi.fn(() => Promise.resolve({ error: null }));

      global.useSeasonsStore = vi.fn(() => ({
        currentSeason: { id: 2 },
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: upsertSpy,
        })),
      }));

      global.useSupabaseUser = vi.fn(() => ({ value: { id: "test-user-id" } }));

      // Create new store instance with the mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.saveCurrentSeasonInProfile();

      // Check that the upsert was called with the season id set
      expect(upsertSpy).toHaveBeenCalledWith({
        id: "test-user-id",
        display_name: "",
        state: {},
        season: 2,
      });
    });

    it("returns early when no current season", async () => {
      const upsertSpy = vi.fn();

      global.useSeasonsStore = vi.fn(() => ({
        currentSeason: null,
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: upsertSpy,
        })),
      }));

      // Create new store instance with the mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.saveCurrentSeasonInProfile();

      expect(upsertSpy).not.toHaveBeenCalled();
    });

    it("returns early when current season has no id", async () => {
      const upsertSpy = vi.fn();

      global.useSeasonsStore = vi.fn(() => ({
        currentSeason: { name: "Test Season" }, // no id
      }));

      global.useSupabaseClient = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: upsertSpy,
        })),
      }));

      // Create new store instance with the mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.saveCurrentSeasonInProfile();

      expect(upsertSpy).not.toHaveBeenCalled();
    });
  });
});
