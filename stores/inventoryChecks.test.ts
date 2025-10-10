import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Import the store after setting up global mocks in setup.ts
import { useInventoryChecksStore } from '@/stores/inventoryChecks';
import type { InventoryCheck } from '~/types/types';

describe('stores/inventoryChecks', () => {
  let inventoryChecksStore: ReturnType<typeof useInventoryChecksStore>;

  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia());

    // Set up the profileStore, seasonsStore, cookiesStore, and transactionsStore mocks
    const useProfileStoreMock = vi.fn(() => ({
      currentProfile: {
        id: 'test-profile-id',
        display_name: 'Test User',
      },
    }));
    vi.stubGlobal('useProfileStore', useProfileStoreMock);

    const useSeasonsStoreMock = vi.fn(() => ({
      currentSeason: {
        id: 1,
      },
    }));
    vi.stubGlobal('useSeasonsStore', useSeasonsStoreMock);

    const useCookiesStoreMock = vi.fn(() => ({
      allCookies: [
        {
          id: 1,
          abbreviation: 'TM',
          name: 'Thin Mints',
          is_virtual: false,
        },
        {
          id: 2,
          abbreviation: 'SM',
          name: 'Samoas',
          is_virtual: false,
        },
        {
          id: 3,
          abbreviation: 'VIRTUAL',
          name: 'Virtual Cookie',
          is_virtual: true,
        },
      ],
    }));
    vi.stubGlobal('useCookiesStore', useCookiesStoreMock);

    const useTransactionsStoreMock = vi.fn(() => ({
      sumTransactionsByCookie: vi.fn((abbreviation: string) => {
        const inventory: Record<string, number> = {
          TM: 100,
          SM: 50,
        };
        return inventory[abbreviation] || 0;
      }),
    }));
    vi.stubGlobal('useTransactionsStore', useTransactionsStoreMock);

    inventoryChecksStore = useInventoryChecksStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('state management', () => {
    it('initializes with default values', () => {
      setActivePinia(createPinia());
      const freshStore = useInventoryChecksStore();

      expect(freshStore.allInventoryChecks).toEqual([]);
      expect(freshStore.activeInventoryCheck).toEqual(null);
      expect(freshStore.inventoryCheckDialogVisible).toBe(false);
      expect(freshStore.deleteInventoryCheckDialogVisible).toBe(false);
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      inventoryChecksStore.allInventoryChecks = [
        {
          id: 1,
          check_date: '2025-01-15T10:00:00Z',
          conducted_by: 'User 1',
          physical_inventory: { TM: 95, SM: 48 },
          expected_inventory: { TM: 100, SM: 50 },
          discrepancies: { TM: -5, SM: -2 },
          total_discrepancies: 7,
          status: 'completed',
          notes: 'Regular check',
          profile: 'test-profile-id',
          season: 1,
          created_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 2,
          check_date: '2025-01-10T10:00:00Z',
          conducted_by: 'User 2',
          physical_inventory: { TM: 100, SM: 50 },
          expected_inventory: { TM: 100, SM: 50 },
          discrepancies: { TM: 0, SM: 0 },
          total_discrepancies: 0,
          status: 'completed',
          notes: 'Perfect match',
          profile: 'test-profile-id',
          season: 1,
          created_at: '2025-01-10T10:00:00Z',
        },
      ] as InventoryCheck[];
    });

    it('sorts inventory checks by date descending', () => {
      const sorted = inventoryChecksStore.sortedInventoryChecks;
      expect(sorted).toHaveLength(2);
      expect(sorted[0].id).toBe(1); // Most recent first
      expect(sorted[1].id).toBe(2);
    });

    it('returns the latest inventory check', () => {
      const latest = inventoryChecksStore.latestInventoryCheck;
      expect(latest).not.toBeNull();
      expect(latest?.id).toBe(1);
      expect(latest?.check_date).toBe('2025-01-15T10:00:00Z');
    });

    it('returns null when no inventory checks exist', () => {
      inventoryChecksStore.allInventoryChecks = [];
      const latest = inventoryChecksStore.latestInventoryCheck;
      expect(latest).toBeNull();
    });
  });

  describe('calculateExpectedInventory', () => {
    it('calculates expected inventory correctly', () => {
      const expected = inventoryChecksStore.calculateExpectedInventory();

      expect(expected.TM).toBe(100);
      expect(expected.SM).toBe(50);
      expect(expected.VIRTUAL).toBeUndefined(); // Virtual cookies should not be included
    });

    it('excludes virtual cookies from expected inventory', () => {
      const expected = inventoryChecksStore.calculateExpectedInventory();
      const keys = Object.keys(expected);

      expect(keys).not.toContain('VIRTUAL');
      expect(keys).toContain('TM');
      expect(keys).toContain('SM');
    });
  });

  describe('calculateDiscrepancies', () => {
    it('calculates discrepancies correctly', () => {
      const physicalInventory = {
        TM: { cases: 8, packages: 0 }, // 96 packages (8 * 12)
        SM: { cases: 4, packages: 3 }, // 51 packages (4 * 12 + 3)
      };

      const expectedInventory = {
        TM: 100,
        SM: 50,
      };

      const result = inventoryChecksStore.calculateDiscrepancies(
        physicalInventory,
        expectedInventory,
      );

      expect(result.discrepancies.TM).toBe(-4); // 96 - 100 = -4
      expect(result.discrepancies.SM).toBe(1); // 51 - 50 = 1
      expect(result.totalDiscrepancies).toBe(5); // |−4| + |1| = 5
    });

    it('handles zero cases and packages', () => {
      const physicalInventory = {
        TM: { cases: 0, packages: 0 },
        SM: { cases: 0, packages: 0 },
      };

      const expectedInventory = {
        TM: 100,
        SM: 50,
      };

      const result = inventoryChecksStore.calculateDiscrepancies(
        physicalInventory,
        expectedInventory,
      );

      expect(result.discrepancies.TM).toBe(-100);
      expect(result.discrepancies.SM).toBe(-50);
      expect(result.totalDiscrepancies).toBe(150);
    });

    it('handles perfect match', () => {
      const physicalInventory = {
        TM: { cases: 8, packages: 4 }, // 100 packages
        SM: { cases: 4, packages: 2 }, // 50 packages
      };

      const expectedInventory = {
        TM: 100,
        SM: 50,
      };

      const result = inventoryChecksStore.calculateDiscrepancies(
        physicalInventory,
        expectedInventory,
      );

      expect(result.discrepancies.TM).toBe(0);
      expect(result.discrepancies.SM).toBe(0);
      expect(result.totalDiscrepancies).toBe(0);
    });

    it('handles undefined physical inventory values', () => {
      const physicalInventory = {
        TM: { cases: 8, packages: 4 },
        // SM is missing
      };

      const expectedInventory = {
        TM: 100,
        SM: 50,
      };

      const result = inventoryChecksStore.calculateDiscrepancies(
        physicalInventory as Record<string, { cases: number; packages: number }>,
        expectedInventory,
      );

      expect(result.discrepancies.TM).toBe(0);
      expect(result.discrepancies.SM).toBe(-50); // 0 - 50 = -50
      expect(result.totalDiscrepancies).toBe(50);
    });
  });

  describe('setActiveInventoryCheck', () => {
    it('sets the active inventory check', () => {
      const check: InventoryCheck = {
        id: 1,
        check_date: '2025-01-15T10:00:00Z',
        conducted_by: 'Test User',
        physical_inventory: { TM: 100 },
        expected_inventory: { TM: 100 },
        discrepancies: { TM: 0 },
        total_discrepancies: 0,
        status: 'completed',
        notes: 'Test',
        profile: 'test-profile-id',
        season: 1,
        created_at: '2025-01-15T10:00:00Z',
      };

      inventoryChecksStore.setActiveInventoryCheck(check);
      expect(inventoryChecksStore.activeInventoryCheck).toEqual(check);
    });

    it('can clear the active inventory check', () => {
      const check: InventoryCheck = {
        id: 1,
        check_date: '2025-01-15T10:00:00Z',
        conducted_by: 'Test User',
        physical_inventory: { TM: 100 },
        expected_inventory: { TM: 100 },
        discrepancies: { TM: 0 },
        total_discrepancies: 0,
        status: 'completed',
        notes: 'Test',
        profile: 'test-profile-id',
        season: 1,
        created_at: '2025-01-15T10:00:00Z',
      };

      inventoryChecksStore.setActiveInventoryCheck(check);
      expect(inventoryChecksStore.activeInventoryCheck).toEqual(check);

      inventoryChecksStore.setActiveInventoryCheck(null);
      expect(inventoryChecksStore.activeInventoryCheck).toBeNull();
    });
  });
});
