import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Girl } from '@/types/types';

// Import the store after setting up global mocks in setup.ts
import { useGirlsStore } from '@/stores/girls';

describe('stores/girls', () => {
  let girlsStore: ReturnType<typeof useGirlsStore>;

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

    girlsStore = useGirlsStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('state management', () => {
    it('initializes with empty arrays', () => {
      setActivePinia(createPinia());
      const freshStore = useGirlsStore();

      expect(freshStore.allGirls).toEqual([]);
    });
  });

  describe('computed properties', () => {
    it('generates girl options correctly', () => {
      girlsStore.allGirls = [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];

      const options = girlsStore.girlOptions;

      expect(options).toEqual([
        { label: 'Alice S.', value: 1 },
        { label: 'Bob J.', value: 2 },
      ]);
    });

    it('returns empty array when no girls', () => {
      girlsStore.allGirls = [];

      const options = girlsStore.girlOptions;

      expect(options).toEqual([]);
    });
  });

  describe('fetchGirls', () => {
    it('successfully fetches girls', async () => {
      const mockGirls = [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          profile: 'test-profile-id',
          season: 1,
        },
      ];

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({ data: mockGirls, error: null }),
                ),
              })),
            })),
          })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newGirlsStore = useGirlsStore();

      await newGirlsStore.fetchGirls();

      expect(newGirlsStore.allGirls).toEqual(mockGirls);
    });

    it('returns early if no profile id', async () => {
      const useProfileStoreMock = vi.fn(() => ({
        currentProfile: null,
      }));
      vi.stubGlobal('useProfileStore', useProfileStoreMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newGirlsStore = useGirlsStore();

      await newGirlsStore.fetchGirls();

      expect(newGirlsStore.allGirls).toEqual([]);
    });

    it('returns early if no current season id', async () => {
      const useSeasonsStoreMock = vi.fn(() => ({
        currentSeason: null,
      }));
      vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newGirlsStore = useGirlsStore();

      await newGirlsStore.fetchGirls();

      expect(newGirlsStore.allGirls).toEqual([]);
    });

    it('handles fetch error and shows toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addError: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

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
      const newGirlsStore = useGirlsStore();

      await newGirlsStore.fetchGirls();

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Fetch failed',
      });
    });
  });

  describe('insertGirl', () => {
    it('successfully inserts girl and shows success toast', async () => {
      const toastSpy = vi.fn();
      const useNotificationHelpersMock = vi.fn(() => ({
        addSuccess: toastSpy,
      }));
      vi.stubGlobal('useNotificationHelpers', useNotificationHelpersMock);

      const mockGirl = {
        first_name: 'Charlie',
        last_name: 'Brown',
        season: 1,
      } as Girl;
      const mockInsertedGirl = { ...mockGirl, profile: 'test-user-id' };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockInsertedGirl, error: null }),
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
      const newGirlsStore = useGirlsStore();

      await newGirlsStore.insertGirl(mockGirl);

      expect(mockGirl.profile).toBe('test-user-id');
      expect(newGirlsStore.allGirls).toHaveLength(1);
      expect(newGirlsStore.allGirls[0]).toEqual(mockInsertedGirl);
      expect(toastSpy).toHaveBeenCalledWith('Girl Created');
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
      const newGirlsStore = useGirlsStore();

      const mockGirl = {
        first_name: 'Charlie',
        last_name: 'Brown',
        season: 1,
      } as Girl;
      await newGirlsStore.insertGirl(mockGirl);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Insert failed',
      });
    });
  });

  describe('upsertGirl', () => {
    beforeEach(() => {
      girlsStore.allGirls = [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];
    });

    it('successfully upserts girl and shows success toast', async () => {
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
      const newGirlsStore = useGirlsStore();
      newGirlsStore.allGirls = [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];

      const updatedGirl = {
        id: 1,
        first_name: 'Alice Updated',
        last_name: 'Smith',
        profile: 'test-profile-id',
        season: 1,
      } as Girl;

      await newGirlsStore.upsertGirl(updatedGirl);

      expect(newGirlsStore.allGirls[0].first_name).toBe('Alice Updated');
      expect(toastSpy).toHaveBeenCalledWith('Girl Updated');
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
      const newGirlsStore = useGirlsStore();

      const updatedGirl = {
        id: 1,
        first_name: 'Alice Updated',
        last_name: 'Smith',
        profile: 'test-profile-id',
        season: 1,
      } as Girl;
      await newGirlsStore.upsertGirl(updatedGirl);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Upsert failed',
      });
    });
  });

  describe('deleteGirl', () => {
    beforeEach(() => {
      girlsStore.allGirls = [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];
    });

    it('successfully deletes girl and shows success toast', async () => {
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
      const newGirlsStore = useGirlsStore();
      newGirlsStore.allGirls = [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];

      const girlToDelete = {
        id: 1,
        first_name: 'Alice',
        last_name: 'Smith',
        profile: 'test-profile-id',
        season: 1,
      } as Girl;
      await newGirlsStore.deleteGirl(girlToDelete);

      expect(newGirlsStore.allGirls).toHaveLength(1);
      expect(newGirlsStore.allGirls[0].id).toBe(2);
      expect(toastSpy).toHaveBeenCalledWith('Girl Deleted');
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
      const newGirlsStore = useGirlsStore();

      const girlToDelete = {
        id: 1,
        first_name: 'Alice',
        last_name: 'Smith',
        profile: 'test-profile-id',
        season: 1,
      } as Girl;
      await newGirlsStore.deleteGirl(girlToDelete);

      expect(toastSpy).toHaveBeenCalledWith({
        message: 'Delete failed',
      });
    });
  });

  describe('utility functions', () => {
    beforeEach(() => {
      girlsStore.allGirls = [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 3,
          first_name: 'Charlie',
          last_name: 'Brown',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];
    });

    it('getGirlNameById returns correct name for existing girl', () => {
      const name = girlsStore.getGirlNameById(1);
      expect(name).toBe('Alice S.');
    });

    it('getGirlNameById returns "No girl found" for non-existing girl', () => {
      const name = girlsStore.getGirlNameById(999);
      expect(name).toBe('No girl found');
    });

    it('getGirlNamesByIdList returns joined names for existing girls', () => {
      const names = girlsStore.getGirlNamesByIdList([1, 2]);
      expect(names).toBe('Alice S., Bob J.');
    });

    it('getGirlNamesByIdList handles mix of existing and non-existing girls', () => {
      const names = girlsStore.getGirlNamesByIdList([1, 999, 2]);
      expect(names).toBe('Alice S., No girl found, Bob J.');
    });

    it('getGirlNamesByIdList returns empty string for empty array', () => {
      const names = girlsStore.getGirlNamesByIdList([]);
      expect(names).toBe('');
    });

    it('getGirlNamesByIdList returns empty string for null', () => {
      const names = girlsStore.getGirlNamesByIdList(null);
      expect(names).toBe('');
    });

    it('getGirlNamesByIdList returns empty string for undefined', () => {
      const names = girlsStore.getGirlNamesByIdList(undefined);
      expect(names).toBe('');
    });
  });

  describe('private functions integration', () => {
    it('sorts girls correctly after adding', async () => {
      // Add a girl that should sort first alphabetically
      const mockGirl = {
        first_name: 'Aaron',
        last_name: 'Anderson',
        season: 1,
      } as Girl;
      const mockInsertedGirl = { ...mockGirl, profile: 'test-user-id' };

      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: mockInsertedGirl, error: null }),
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

      // Set initial state with existing girls
      girlsStore.allGirls = [
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 3,
          first_name: 'Charlie',
          last_name: 'Brown',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newGirlsStore = useGirlsStore();
      newGirlsStore.allGirls = [
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 3,
          first_name: 'Charlie',
          last_name: 'Brown',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];

      await newGirlsStore.insertGirl(mockGirl);

      // Should be sorted by first name
      expect(newGirlsStore.allGirls[0].first_name).toBe('Aaron');
      expect(newGirlsStore.allGirls[1].first_name).toBe('Bob');
      expect(newGirlsStore.allGirls[2].first_name).toBe('Charlie');
    });

    it('updates girl correctly in place', async () => {
      const useSupabaseClientMock = vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));
      vi.stubGlobal('useSupabaseClient', useSupabaseClientMock);

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newGirlsStore = useGirlsStore();
      newGirlsStore.allGirls = [
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          profile: 'test-profile-id',
          season: 1,
        },
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Johnson',
          profile: 'test-profile-id',
          season: 1,
        },
      ] as Girl[];

      const updatedGirl = {
        id: 1,
        first_name: 'Alice Updated',
        last_name: 'Smith',
        profile: 'test-profile-id',
        season: 1,
      } as Girl;
      await newGirlsStore.upsertGirl(updatedGirl);

      expect(newGirlsStore.allGirls).toHaveLength(2);
      expect(newGirlsStore.allGirls[0].first_name).toBe('Alice Updated');
      expect(newGirlsStore.allGirls[1].first_name).toBe('Bob');
    });
  });
});
