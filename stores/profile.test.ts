import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Import the store after setting up global mocks in setup.ts
import { useProfileStore } from '@/stores/profile';

describe('stores/profile', () => {
  let profileStore: ReturnType<typeof useProfileStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up other store mocks

    vi.stubGlobal(
      'useSeasonsStore',
      vi.fn(() => ({
        currentSeason: { id: 1 },
        fetchSeasons: vi.fn(),
      })),
    );

    vi.stubGlobal(
      'useCookiesStore',
      vi.fn(() => ({
        fetchCookies: vi.fn(),
      })),
    );

    vi.stubGlobal(
      'useGirlsStore',
      vi.fn(() => ({
        fetchGirls: vi.fn(),
      })),
    );

    vi.stubGlobal(
      'useTransactionsStore',
      vi.fn(() => ({
        fetchTransactions: vi.fn(),
      })),
    );

    vi.stubGlobal(
      'useAccountsStore',
      vi.fn(() => ({
        fetchPayments: vi.fn(),
      })),
    );

    vi.stubGlobal(
      'useBoothsStore',
      vi.fn(() => ({
        fetchBoothSales: vi.fn(),
      })),
    );

    vi.stubGlobal(
      'useInventoryChecksStore',
      vi.fn(() => ({
        fetchInventoryChecks: vi.fn(),
      })),
    );

    vi.stubGlobal(
      'useDepositsStore',
      vi.fn(() => ({
        fetchDeposits: vi.fn(),
      })),
    );

    vi.stubGlobal(
      'useAuditSessionsStore',
      vi.fn(() => ({
        fetchMostRecentAuditSession: vi.fn(),
      })),
    );

    profileStore = useProfileStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('state management', () => {
    it('initializes with default values', () => {
      setActivePinia(createPinia());
      const freshStore = useProfileStore();

      expect(freshStore.currentProfile).toBeUndefined();
      expect(freshStore.display_name).toBe('');
    });
  });

  describe('fetchProfile', () => {
    it('returns early when no user', async () => {
      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: null })),
      );

      // Create new store instance
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.fetchProfile();

      expect(newProfileStore.currentProfile).toBeUndefined();
    });

    it('handles fetch error and shows toast', async () => {
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
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'Profile not found' },
                  }),
                ),
              })),
            })),
          })),
        })),
      );

      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: { id: 'test-user-id' } })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.fetchProfile();

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Profile not found',
      });
    });

    it('handles missing profile fields gracefully', async () => {
      const mockProfile = {
        id: 'test-user-id',
        // Missing display_name, season, state
      };

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: mockProfile, error: null }),
                ),
              })),
            })),
          })),
        })),
      );

      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: { id: 'test-user-id' } })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.fetchProfile();

      expect(newProfileStore.currentProfile).toEqual(mockProfile);
      expect(newProfileStore.display_name).toBe('');
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      profileStore.display_name = 'Updated Name';
    });

    it('successfully updates profile and shows success toast', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addSuccess: toastSpy,
          addError: vi.fn(),
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      );

      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: { id: 'test-user-id' } })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();
      newProfileStore.display_name = 'Updated Name';

      await newProfileStore.updateProfile();

      expect(toastSpy).toHaveBeenCalledWith('Profile Updated');
    });

    it('updates profile silently when silent flag is true', async () => {
      const toastSpy = vi.fn();
      vi.stubGlobal(
        'useNotificationHelpers',
        vi.fn(() => ({
          addSuccess: toastSpy,
          addError: vi.fn(),
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      );

      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: { id: 'test-user-id' } })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.updateProfile(true);

      expect(toastSpy).not.toHaveBeenCalledWith({
        severity: 'success',
        summary: 'Successful',
        detail: 'Profile Updated',
        life: 3000,
      });
    });

    it('returns early when no user id', async () => {
      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: null })),
      );

      // Create new store instance
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.updateProfile();

      // No assertions needed, just ensuring no error is thrown
    });

    it('handles update error and shows error toast', async () => {
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
            upsert: vi.fn(() =>
              Promise.resolve({ error: { message: 'Update failed' } }),
            ),
          })),
        })),
      );

      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: { id: 'test-user-id' } })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.updateProfile();

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Update failed',
      });
    });

    it('includes display_name in update when it has a value', async () => {
      const upsertSpy = vi.fn(() => Promise.resolve({ error: null }));

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: upsertSpy,
          })),
        })),
      );

      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: { id: 'test-user-id' } })),
      );

      // Create new store instance with the mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();
      newProfileStore.display_name = 'Test User';

      await newProfileStore.updateProfile(true);

      // display_name should be included when it has a value
      expect(upsertSpy).toHaveBeenCalledWith({
        id: 'test-user-id',
        display_name: 'Test User',
        season: -1,
      });
    });

    it('excludes display_name from update when it is empty', async () => {
      const upsertSpy = vi.fn(() => Promise.resolve({ error: null }));

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: upsertSpy,
          })),
        })),
      );

      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: { id: 'test-user-id' } })),
      );

      // Create new store instance with the mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();
      newProfileStore.display_name = ''; // Empty display name

      await newProfileStore.updateProfile(true);

      // display_name should NOT be included to avoid DB constraint violation
      expect(upsertSpy).toHaveBeenCalledWith({
        id: 'test-user-id',
        season: -1,
      });
    });
  });

  describe('saveCurrentSeasonInProfile', () => {
    it('saves current season id and updates profile silently', async () => {
      const upsertSpy = vi.fn(() => Promise.resolve({ error: null }));

      vi.stubGlobal(
        'useSeasonsStore',
        vi.fn(() => ({
          currentSeason: { id: 2 },
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: upsertSpy,
          })),
        })),
      );

      vi.stubGlobal(
        'useSupabaseUser',
        vi.fn(() => ({ value: { id: 'test-user-id' } })),
      );

      // Create new store instance with the mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.saveCurrentSeasonInProfile();

      // Check that the upsert was called with the season id set
      // display_name should not be included when empty to avoid DB constraint violation
      expect(upsertSpy).toHaveBeenCalledWith({
        id: 'test-user-id',
        season: 2,
      });
    });

    it('returns early when no current season', async () => {
      const upsertSpy = vi.fn();

      vi.stubGlobal(
        'useSeasonsStore',
        vi.fn(() => ({
          currentSeason: null,
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: upsertSpy,
          })),
        })),
      );

      // Create new store instance with the mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.saveCurrentSeasonInProfile();

      expect(upsertSpy).not.toHaveBeenCalled();
    });

    it('returns early when current season has no id', async () => {
      const upsertSpy = vi.fn();

      vi.stubGlobal(
        'useSeasonsStore',
        vi.fn(() => ({
          currentSeason: { name: 'Test Season' }, // no id
        })),
      );

      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            upsert: upsertSpy,
          })),
        })),
      );

      // Create new store instance with the mock
      setActivePinia(createPinia());
      const newProfileStore = useProfileStore();

      await newProfileStore.saveCurrentSeasonInProfile();

      expect(upsertSpy).not.toHaveBeenCalled();
    });
  });
});
