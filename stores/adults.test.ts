import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Adult } from '@/types/types';

import { useAdultsStore } from '@/stores/adults';

describe('stores/adults', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    vi.stubGlobal(
      'useProfileStore',
      vi.fn(() => ({
        currentProfile: {
          id: 'test-profile-id',
        },
      })),
    );

    vi.stubGlobal(
      'useSeasonsStore',
      vi.fn(() => ({
        currentSeason: {
          id: 1,
        },
      })),
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches adults', async () => {
    const mockAdults = [
      {
        id: 1,
        first_name: 'Amy',
        last_name: 'Adams',
        profile: 'test-profile-id',
        season: 1,
        sellers: [1, 2],
      },
    ] as Adult[];

    vi.stubGlobal(
      'useSupabaseClient',
      vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({ data: mockAdults, error: null }),
              ),
            })),
          })),
        })),
      })),
    );

    setActivePinia(createPinia());
    const newAdultsStore = useAdultsStore();

    await newAdultsStore.fetchAdults();

    expect(newAdultsStore.allAdults).toEqual(mockAdults);
  });

  it('inserts adults and defaults sellers to empty array', async () => {
    const toastSpy = vi.fn();
    vi.stubGlobal(
      'useNotificationHelpers',
      vi.fn(() => ({
        addSuccess: toastSpy,
      })),
    );

    const mockAdult = {
      first_name: 'Pat',
      last_name: 'Parent',
      season: 1,
      sellers: undefined,
    } as unknown as Adult;
    const insertedAdult = {
      ...mockAdult,
      id: 1,
      profile: 'test-user-id',
      sellers: [],
    } as Adult;

    vi.stubGlobal(
      'useSupabaseClient',
      vi.fn(() => ({
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: insertedAdult, error: null }),
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

    setActivePinia(createPinia());
    const newAdultsStore = useAdultsStore();

    await newAdultsStore.insertAdult(mockAdult);

    expect(newAdultsStore.allAdults).toHaveLength(1);
    expect(newAdultsStore.allAdults[0].sellers).toEqual([]);
    expect(toastSpy).toHaveBeenCalledWith('Adult Created');
  });

  it('removes a girl id from related adults', async () => {
    const upsertMock = vi.fn(() => Promise.resolve({ error: null }));
    vi.stubGlobal(
      'useSupabaseClient',
      vi.fn(() => ({
        from: vi.fn(() => ({
          upsert: upsertMock,
        })),
      })),
    );

    setActivePinia(createPinia());
    const newAdultsStore = useAdultsStore();
    newAdultsStore.allAdults = [
      {
        id: 1,
        first_name: 'Amy',
        last_name: 'Adams',
        profile: 'test-profile-id',
        season: 1,
        sellers: [1, 2],
      },
      {
        id: 2,
        first_name: 'Ben',
        last_name: 'Baker',
        profile: 'test-profile-id',
        season: 1,
        sellers: [2],
      },
    ] as Adult[];

    await newAdultsStore.removeGirlFromAdults(2);

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(newAdultsStore.allAdults[0].sellers).toEqual([1]);
    expect(newAdultsStore.allAdults[1].sellers).toEqual([]);
  });
});
