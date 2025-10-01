import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { SCOrder2025 } from '@/types/types';

// Import the store after setting up global mocks in setup.ts
import { useUploadsStore } from '@/stores/uploads';

describe('stores/uploads', () => {
  let uploadsStore: ReturnType<typeof useUploadsStore>;
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

  describe('getOnlyGirlOrders', () => {
    it('filters and converts girl orders correctly', () => {
      const mockJsonData = [
        { ...baseSCOrder2025, TO: 'Jane Doe', 'ORDER #': 12345 },
        { ...baseSCOrder2025, TO: 'Troop', 'ORDER #': 12346 },
        { ...baseSCOrder2025, TO: 'Mary Smith', 'ORDER #': 12347 },
        { ...baseSCOrder2025, TO: 'Council', 'ORDER #': 12348 },
      ];

      // Mock the conversion function to return different values based on 'TO' field
      vi.stubGlobal(
        'useTransactionsStore',
        vi.fn(() => ({
          convertSCOrderToNewTransaction: vi.fn((order) => {
            const hasSpace =
              order['TO'].indexOf && order['TO'].indexOf(' ') >= 0;
            return {
              id: Math.floor(Math.random() * 1000),
              to: hasSpace ? 1 : 0,
              cookies: {},
              order_num: order['ORDER'],
              order_date: new Date().toISOString().split('T')[0],
            };
          }),
        })),
      );

      // Create new store instance to get fresh mocked behavior
      setActivePinia(createPinia());
      const newUploadsStore = useUploadsStore();

      const result = newUploadsStore.getOnlyGirlOrders(mockJsonData);

      // Should filter out orders without spaces (Troop, Council) and convert the rest
      expect(result).toHaveLength(2);
      expect(result.every((order) => order?.to === 1)).toBe(true);
    });

    it('filters out orders with to field equal to 0', () => {
      const mockJsonData = [
        { ...baseSCOrder2025, TO: 'Jane Doe', 'ORDER #': 12345 },
        { ...baseSCOrder2025, TO: 'Mary Smith', 'ORDER #': 12347 },
      ];

      // Mock the conversion to return some orders with to: 0
      vi.stubGlobal(
        'useTransactionsStore',
        vi.fn(() => ({
          convertSCOrderToNewTransaction: vi.fn((order, index) => {
            return {
              id: index,
              to: index === 0 ? 0 : 1, // First order has to: 0
              cookies: {},
              order_num: order['ORDER'],
              order_date: new Date().toISOString().split('T')[0],
            };
          }),
        })),
      );

      // Create new store instance to get fresh mocked behavior
      setActivePinia(createPinia());
      const newUploadsStore = useUploadsStore();

      const result = newUploadsStore.getOnlyGirlOrders(mockJsonData);

      // Should filter out the order with to: 0
      expect(result).toHaveLength(1);
      expect(result[0]).toBeDefined();
      expect(result[0]!.to).toBe(1);
    });

    it('handles mixed valid and invalid TO fields', () => {
      const mockJsonData = [
        { ...baseSCOrder2025, TO: 'Jane Doe', 'ORDER #': 12345 },
        { ...baseSCOrder2025, TO: '', 'ORDER #': 12346 },
        { ...baseSCOrder2025, TO: 'Mary Smith', 'ORDER #': 12347 },
        { ...baseSCOrder2025, TO: 'NoSpace', 'ORDER #': 12348 },
      ];

      vi.stubGlobal(
        'useTransactionsStore',
        vi.fn(() => ({
          convertSCOrderToNewTransaction: vi.fn((order) => ({
            id: Math.floor(Math.random() * 1000),
            to: 1,
            cookies: {},
            order_num: order['ORDER'],
            order_date: new Date().toISOString().split('T')[0],
          })),
        })),
      );

      // Create new store instance to get fresh mocked behavior
      setActivePinia(createPinia());
      const newUploadsStore = useUploadsStore();

      const result = newUploadsStore.getOnlyGirlOrders(mockJsonData);

      // Should only include orders with spaces in TO field
      expect(result).toHaveLength(2); // 'Jane Doe' and 'Mary Smith'
    });

    it('returns empty array for empty input', () => {
      const result = uploadsStore.getOnlyGirlOrders([]);
      expect(result).toEqual([]);
    });
  });
});
