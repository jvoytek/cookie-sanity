import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { SCOrder2025 } from '@/types/types';

// Import the store after setting up global mocks in setup.ts
import { useUploadsStore } from '@/stores/uploads';

describe('stores/uploads', () => {
  const baseSCOrder2025 = {
    DATE: '2025-01-01',
    'ORDER #': 123,
    TYPE: 'T2G',
    TO: 'Jane Doe',
    FROM: 'John Doe',
    CShare: 0,
    ADV: 0,
    TY: 0,
    LEM: 0,
    TRE: 0,
    TM: 0,
    PBP: 0,
    CD: 0,
    PBS: 0,
    GFC: 0,
    STATUS: 'complete',
    TOTAL: 0,
    'TOTAL $': 0,
  };

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up the ordersStore mock for this test
    vi.stubGlobal(
      'useTransactionsStore',
      vi.fn(() => ({
        convertSCOrderToNewTransaction: vi.fn((order) => {
          // Mock conversion logic
          return {
            id: Math.floor(Math.random() * 1000),
            to: order['TO'] === 'Troop' ? 0 : 1,
            cookies: {},
            order_num: order['ORDER'],
            order_date: new Date().toISOString().split('T')[0],
          };
        }),
      })),
    );

    // Set up the profileStore mock
    vi.stubGlobal(
      'useProfileStore',
      vi.fn(() => ({
        currentProfile: {
          id: 'test-profile-id',
          season: 1,
        },
      })),
    );

    uploadsStore = useUploadsStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('insertUpload', () => {
    it('successfully inserts upload with valid profile', async () => {
      const mockJsonData = [
        { ...baseSCOrder2025, TO: 'Girl Scout', 'ORDER #': 12345 },
        { ...baseSCOrder2025, TO: 'Troop Leader', 'ORDER #': 12346 },
      ] as SCOrder2025[];

      const mockResponse = {
        id: 1,
        profile: 'test-profile-id',
        season: 1,
        data: mockJsonData,
        created_at: new Date().toISOString(),
      };

      // Mock successful Supabase response
      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: mockResponse, error: null }),
                ),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newUploadsStore = useUploadsStore();

      const result = await newUploadsStore.insertUpload(mockJsonData);

      expect(result).toEqual(mockResponse);
    });

    it('throws error when profile is not found', async () => {
      // Mock profileStore with missing profile
      vi.stubGlobal(
        'useProfileStore',
        vi.fn(() => ({
          currentProfile: null,
        })),
      );

      // Create new store instance with mocked behavior
      setActivePinia(createPinia());
      const newUploadsStore = useUploadsStore();

      const mockJsonData = [
        { ...baseSCOrder2025, TO: 'Girl Scout', 'ORDER #': 12345 },
      ];

      await expect(newUploadsStore.insertUpload(mockJsonData)).rejects.toThrow(
        'Profile not found',
      );
    });

    it('throws error when profile season is missing', async () => {
      // Mock profileStore with missing season
      vi.stubGlobal(
        'useProfileStore',
        vi.fn(() => ({
          currentProfile: {
            id: 'test-profile-id',
            season: null,
          },
        })),
      );

      // Create new store instance with mocked behavior
      setActivePinia(createPinia());
      const newUploadsStore = useUploadsStore();

      const mockJsonData = [
        { ...baseSCOrder2025, TO: 'Girl Scout', 'ORDER #': 12345 },
      ];

      await expect(newUploadsStore.insertUpload(mockJsonData)).rejects.toThrow(
        'Profile not found',
      );
    });

    it('throws error when profile id is missing', async () => {
      // Mock profileStore with missing id
      vi.stubGlobal(
        'useProfileStore',
        vi.fn(() => ({
          currentProfile: {
            id: null,
            season: 1,
          },
        })),
      );

      // Create new store instance with mocked behavior
      setActivePinia(createPinia());
      const newUploadsStore = useUploadsStore();

      const mockJsonData = [
        { ...baseSCOrder2025, TO: 'Girl Scout', 'ORDER #': 12345 },
      ];

      await expect(newUploadsStore.insertUpload(mockJsonData)).rejects.toThrow(
        'Profile not found',
      );
    });

    it('handles Supabase error', async () => {
      const mockJsonData = [
        { ...baseSCOrder2025, TO: 'Girl Scout', 'ORDER #': 12345 },
      ];

      // Mock Supabase error response
      vi.stubGlobal(
        'useSupabaseClient',
        vi.fn(() => ({
          from: vi.fn(() => ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'Database connection failed' },
                  }),
                ),
              })),
            })),
          })),
        })),
      );

      // Create new store instance with the new mock
      setActivePinia(createPinia());
      const newUploadsStore = useUploadsStore();

      await expect(newUploadsStore.insertUpload(mockJsonData)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
