import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTransactionHelpers } from '@/composables/useTransactionHelpers';
import type { Order } from '@/types/types';
import { setActivePinia, createPinia } from 'pinia';

describe('useTransactionHelpers', () => {
  let transactionHelpers: ReturnType<typeof useTransactionHelpers>;
  let mockOrdersStore: any;
  let mockCookiesStore: any;
  let mockGirlsStore: any;
  let toastSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Mock the stores and dependencies
    mockOrdersStore = {
      activeTransaction: {} as Order,
      transactionDialogFormSchema: { value: [] },
      editTransactionDialogVisible: false,
      deleteTransactionDialogVisible: false,
      transactionTypeOptions: [
        { label: 'Council to Troop', value: 'C2T' },
        { label: 'Troop to Troop', value: 'T2T' },
        { label: 'Troop to Girl', value: 'T2G' },
        { label: 'Girl to Troop', value: 'G2T' },
        { label: 'Girl to Girl', value: 'G2G' },
      ],
      upsertTransaction: vi.fn(),
      insertNewTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
    };
    vi.stubGlobal('useTransactionsStore', () => mockOrdersStore);

    mockCookiesStore = {
      allCookies: [
        { name: 'Thin Mints', abbreviation: 'TM', id: 1 },
        { name: 'Adventurefuls', abbreviation: 'ADV', id: 2 },
      ],
    };
    vi.stubGlobal('useCookiesStore', () => mockCookiesStore);

    mockGirlsStore = {
      girlOptions: [
        { label: 'Alice', value: 1 },
        { label: 'Bob', value: 2 },
      ],
    };
    vi.stubGlobal('useGirlsStore', () => mockGirlsStore);

    toastSpy = vi.fn();
    vi.stubGlobal(
      'useNotificationHelpers',
      vi.fn(() => ({
        addError: toastSpy,
      })),
    );

    transactionHelpers = useTransactionHelpers();
  });

  describe('transactionTypeBadgeSeverity', () => {
    it('returns correct severity for each transaction type', () => {
      expect(transactionHelpers.transactionTypeBadgeSeverity('C2T')).toBe(
        'success',
      );
      expect(transactionHelpers.transactionTypeBadgeSeverity('T2T')).toBe(
        'success',
      );
      expect(transactionHelpers.transactionTypeBadgeSeverity('T2G')).toBe(
        'success',
      );
      expect(transactionHelpers.transactionTypeBadgeSeverity('G2T')).toBe(
        'warn',
      );
      expect(transactionHelpers.transactionTypeBadgeSeverity('G2G')).toBe(
        'info',
      );
      expect(transactionHelpers.transactionTypeBadgeSeverity('UNKNOWN')).toBe(
        null,
      );
      expect(transactionHelpers.transactionTypeBadgeSeverity('')).toBe(null);
    });
  });

  describe('editTransaction', () => {
    it('sets up the edit transaction dialog correctly', () => {
      const testOrder: Order = {
        id: 1,
        order_date: '2024-01-15',
        order_num: 'TEST123',
        type: 'order',
        status: 'pending',
        profile: 'test-profile',
        season: 1,
        cookies: { TM: 5, ADV: 3 },
        to: null,
        from: null,
        supplier: null,
        notes: null,
        processed_date: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      transactionHelpers.editTransaction(testOrder, 'troop');

      expect(mockOrdersStore.activeTransaction).toEqual(testOrder);
      expect(mockOrdersStore.transactionDialogFormSchema.value).toBeDefined();
      expect(mockOrdersStore.editTransactionDialogVisible).toBe(true);
    });

    it('uses default type when not specified', () => {
      const testOrder = { id: 1 } as Order;

      transactionHelpers.editTransaction(testOrder);

      expect(mockOrdersStore.transactionDialogFormSchema.value).toBeDefined();
    });
  });

  describe('hideDialog', () => {
    it('hides the transaction dialog and resets submitted state', () => {
      mockOrdersStore.editTransactionDialogVisible = true;
      transactionHelpers.submitted.value = true;

      transactionHelpers.hideDialog();

      expect(mockOrdersStore.editTransactionDialogVisible).toBe(false);
      expect(transactionHelpers.submitted.value).toBe(false);
    });
  });

  describe('saveTransaction', () => {
    it('calls upsertTransaction when transaction has an id', async () => {
      const testTransaction = { id: 1, order_num: 'TEST123' } as Order;
      mockOrdersStore.activeTransaction = testTransaction;
      mockOrdersStore.editTransactionDialogVisible = true;
      transactionHelpers.submitted.value = true;

      await transactionHelpers.saveTransaction();

      expect(mockOrdersStore.upsertTransaction).toHaveBeenCalledWith(
        testTransaction,
      );
      expect(mockOrdersStore.insertNewTransaction).not.toHaveBeenCalled();
      expect(mockOrdersStore.editTransactionDialogVisible).toBe(false);
      expect(mockOrdersStore.activeTransaction).toEqual(null);
      expect(transactionHelpers.submitted.value).toBe(false);
    });

    it('calls insertNewTransaction when transaction has no id', async () => {
      const testTransaction = { order_num: 'NEW123' } as Order;
      mockOrdersStore.activeTransaction = testTransaction;
      mockOrdersStore.editTransactionDialogVisible = true;
      transactionHelpers.submitted.value = true;

      await transactionHelpers.saveTransaction();

      expect(mockOrdersStore.insertNewTransaction).toHaveBeenCalledWith(
        testTransaction,
      );
      expect(mockOrdersStore.upsertTransaction).not.toHaveBeenCalled();
      expect(mockOrdersStore.editTransactionDialogVisible).toBe(false);
      expect(mockOrdersStore.activeTransaction).toEqual(null);
      expect(transactionHelpers.submitted.value).toBe(false);
    });
  });

  describe('confirmDeleteTransaction', () => {
    it('sets up delete confirmation dialog correctly', () => {
      const testOrder: Order = {
        id: 1,
        order_date: '2024-01-15',
        order_num: 'TEST123',
        type: 'order',
        status: 'pending',
        profile: 'test-profile',
        season: 1,
        cookies: { TM: 5, ADV: 3 },
        to: null,
        from: null,
        supplier: null,
        notes: null,
        processed_date: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      transactionHelpers.confirmDeleteTransaction(testOrder);

      expect(mockOrdersStore.activeTransaction).toEqual(testOrder);
      expect(mockOrdersStore.deleteTransactionDialogVisible).toBe(true);
    });
  });

  describe('deleteTransaction', () => {
    it('successfully deletes transaction', async () => {
      const testOrder = { id: 1 } as Order;
      mockOrdersStore.activeTransaction = testOrder;
      mockOrdersStore.deleteTransactionDialogVisible = true;

      await transactionHelpers.deleteTransaction();

      expect(mockOrdersStore.deleteTransaction).toHaveBeenCalledWith(1);
      expect(mockOrdersStore.deleteTransactionDialogVisible).toBe(false);
      expect(mockOrdersStore.activeTransaction).toEqual(null);
    });

    it('handles deletion error gracefully', async () => {
      mockOrdersStore.activeTransaction = null;

      await transactionHelpers.deleteTransaction();

      expect(toastSpy).toHaveBeenCalled();
    });
  });

  describe('form and submitted refs', () => {
    it('returns form and submitted refs correctly', () => {
      expect(transactionHelpers.submitted.value).toBe(false);

      // Test that they're reactive
      transactionHelpers.submitted.value = true;
      expect(transactionHelpers.submitted.value).toBe(true);
    });
  });

  describe('composable structure', () => {
    it('returns all expected methods and properties', () => {
      expect(transactionHelpers).toHaveProperty('submitted');
      expect(transactionHelpers).toHaveProperty('editTransaction');
      expect(transactionHelpers).toHaveProperty('hideDialog');
      expect(transactionHelpers).toHaveProperty('saveTransaction');
      expect(transactionHelpers).toHaveProperty('confirmDeleteTransaction');
      expect(transactionHelpers).toHaveProperty('deleteTransaction');
      expect(transactionHelpers).toHaveProperty('transactionTypeBadgeSeverity');

      expect(typeof transactionHelpers.editTransaction).toBe('function');
      expect(typeof transactionHelpers.hideDialog).toBe('function');
      expect(typeof transactionHelpers.saveTransaction).toBe('function');
      expect(typeof transactionHelpers.confirmDeleteTransaction).toBe(
        'function',
      );
      expect(typeof transactionHelpers.deleteTransaction).toBe('function');
      expect(typeof transactionHelpers.transactionTypeBadgeSeverity).toBe(
        'function',
      );
    });
  });

  describe('virtual cookie validation', () => {
    it('should prevent troop-type transactions with virtual cookies', async () => {
      mockCookiesStore.allCookies = [
        { name: 'Thin Mints', abbreviation: 'TM', id: 1, is_virtual: false },
        { name: 'Cookie Share', abbreviation: 'CS', id: 2, is_virtual: true },
      ];

      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'C2T',
        cookies: { TM: 5, CS: 3 },
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).toHaveBeenCalledWith(
        new Error('Virtual cookies cannot be used in troop-type transactions'),
      );
      expect(mockOrdersStore.insertNewTransaction).not.toHaveBeenCalled();
    });

    it('should allow troop-type transactions without virtual cookies', async () => {
      mockCookiesStore.allCookies = [
        { name: 'Thin Mints', abbreviation: 'TM', id: 1, is_virtual: false },
        { name: 'Cookie Share', abbreviation: 'CS', id: 2, is_virtual: true },
      ];

      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'T2T',
        cookies: { TM: 5, CS: 0 },
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).not.toHaveBeenCalled();
      expect(mockOrdersStore.insertNewTransaction).toHaveBeenCalled();
    });

    it('should allow girl-type transactions with virtual cookies', async () => {
      mockCookiesStore.allCookies = [
        { name: 'Thin Mints', abbreviation: 'TM', id: 1, is_virtual: false },
        { name: 'Cookie Share', abbreviation: 'CS', id: 2, is_virtual: true },
      ];

      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'T2G',
        cookies: { TM: 5, CS: 3 },
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).not.toHaveBeenCalled();
      expect(mockOrdersStore.insertNewTransaction).toHaveBeenCalled();
    });
  });

  describe('DIRECT_SHIP transaction type', () => {
    it('returns correct severity for DIRECT_SHIP type', () => {
      expect(
        transactionHelpers.transactionTypeBadgeSeverity('DIRECT_SHIP'),
      ).toBe('info');
    });

    it('includes DIRECT_SHIP help text in form schema', () => {
      const testOrder: Order = {
        id: 1,
        order_date: '2024-01-15',
        order_num: 'TEST123',
        type: 'DIRECT_SHIP',
        status: 'pending',
        profile: 'test-profile',
        season: 1,
        cookies: { TM: -5 },
        to: 1,
        from: null,
        supplier: null,
        notes: null,
        processed_date: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      transactionHelpers.editTransaction(testOrder, 'girl');
      const schema = mockOrdersStore.transactionDialogFormSchema.value;

      // Check that help text for DIRECT_SHIP is present
      const directShipHelp = schema.find(
        (field: { if?: string; children?: { children?: string }[] }) =>
          field.if?.includes('DIRECT_SHIP') &&
          field.children?.[0]?.children ===
            'Cookies shipped directly from baker to customer',
      );
      expect(directShipHelp).toBeDefined();
    });

    it('shows "to" field for DIRECT_SHIP transactions', () => {
      const testOrder: Order = {
        id: 1,
        order_date: '2024-01-15',
        order_num: 'TEST123',
        type: 'DIRECT_SHIP',
        status: 'pending',
        profile: 'test-profile',
        season: 1,
        cookies: { TM: -5 },
        to: 1,
        from: null,
        supplier: null,
        notes: null,
        processed_date: null,
        created_at: '2024-01-15T10:00:00Z',
      };

      transactionHelpers.editTransaction(testOrder, 'girl');
      const schema = mockOrdersStore.transactionDialogFormSchema.value;

      // Check that "to" field shows for DIRECT_SHIP
      const toField = schema.find(
        (field: { name?: string; if?: string }) =>
          field.name === 'to' && field.if?.includes('DIRECT_SHIP'),
      );
      expect(toField).toBeDefined();
    });
  });

  describe('overbooking validation', () => {
    beforeEach(() => {
      mockCookiesStore.allCookies = [
        {
          name: 'Thin Mints',
          abbreviation: 'TM',
          id: 1,
          is_virtual: false,
          overbooking_allowed: true,
        },
        {
          name: 'Lemon-Ups',
          abbreviation: 'LEM',
          id: 2,
          is_virtual: false,
          overbooking_allowed: false,
        },
        {
          name: 'Cookie Share',
          abbreviation: 'CS',
          id: 3,
          is_virtual: true,
          overbooking_allowed: false,
        },
      ];
    });

    it('should prevent T2G transactions that would result in negative inventory for cookies with overbooking_allowed=false', async () => {
      // Mock current inventory: LEM has 10 packages
      mockOrdersStore.sumTransactionsByCookie = vi.fn(
        (abbreviation: string) => {
          if (abbreviation === 'LEM') return 10;
          return 50;
        },
      );

      // Attempt to give 15 LEM cookies to a girl (would result in -5)
      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'T2G',
        cookies: { LEM: -15 },
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).toHaveBeenCalled();
      const errorMessage = toastSpy.mock.calls[0][0].message;
      expect(errorMessage).toContain(
        'Cannot process transaction - overbooking not allowed for',
      );
      expect(errorMessage).toContain(
        'Lemon-Ups: Would result in -5 packages (15 requested, 10 available)',
      );
      expect(mockOrdersStore.insertNewTransaction).not.toHaveBeenCalled();
    });

    it('should allow T2G transactions that stay within inventory for cookies with overbooking_allowed=false', async () => {
      // Mock current inventory: LEM has 10 packages
      mockOrdersStore.sumTransactionsByCookie = vi.fn(
        (abbreviation: string) => {
          if (abbreviation === 'LEM') return 10;
          return 50;
        },
      );

      // Give 8 LEM cookies to a girl (would result in 2, which is valid)
      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'T2G',
        cookies: { LEM: -8 },
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).not.toHaveBeenCalled();
      expect(mockOrdersStore.insertNewTransaction).toHaveBeenCalled();
    });

    it('should allow T2G transactions for cookies with overbooking_allowed=true even if result is negative', async () => {
      // Mock current inventory: TM has 10 packages
      mockOrdersStore.sumTransactionsByCookie = vi.fn(
        (abbreviation: string) => {
          if (abbreviation === 'TM') return 10;
          return 50;
        },
      );

      // Give 15 TM cookies to a girl (would result in -5, but TM allows overbooking)
      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'T2G',
        cookies: { TM: -15 },
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).not.toHaveBeenCalled();
      expect(mockOrdersStore.insertNewTransaction).toHaveBeenCalled();
    });

    it('should not check overbooking for non-T2G transaction types', async () => {
      // Mock current inventory: LEM has 10 packages
      mockOrdersStore.sumTransactionsByCookie = vi.fn(
        (abbreviation: string) => {
          if (abbreviation === 'LEM') return 10;
          return 50;
        },
      );

      // C2T transaction (Council to Troop) should not check overbooking
      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'C2T',
        cookies: { LEM: 20 }, // positive, adding to inventory
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).not.toHaveBeenCalled();
      expect(mockOrdersStore.insertNewTransaction).toHaveBeenCalled();
    });

    it('should skip virtual cookies in overbooking validation', async () => {
      // Mock current inventory: CS (virtual) has 0 packages
      mockOrdersStore.sumTransactionsByCookie = vi.fn(
        (abbreviation: string) => {
          if (abbreviation === 'CS') return 0;
          return 50;
        },
      );

      // Give 5 CS cookies to a girl (virtual cookie, should be skipped)
      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'T2G',
        cookies: { CS: -5 },
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).not.toHaveBeenCalled();
      expect(mockOrdersStore.insertNewTransaction).toHaveBeenCalled();
    });

    it('should report multiple overbooking violations', async () => {
      mockCookiesStore.allCookies = [
        {
          name: 'Lemon-Ups',
          abbreviation: 'LEM',
          id: 2,
          is_virtual: false,
          overbooking_allowed: false,
        },
        {
          name: 'Trefoils',
          abbreviation: 'TRE',
          id: 4,
          is_virtual: false,
          overbooking_allowed: false,
        },
      ];

      // Mock current inventory: LEM has 5, TRE has 3
      mockOrdersStore.sumTransactionsByCookie = vi.fn(
        (abbreviation: string) => {
          if (abbreviation === 'LEM') return 5;
          if (abbreviation === 'TRE') return 3;
          return 50;
        },
      );

      // Attempt to give 10 LEM and 10 TRE cookies to a girl
      mockOrdersStore.activeTransaction = {
        id: null,
        type: 'T2G',
        cookies: { LEM: -10, TRE: -10 },
      };

      await transactionHelpers.saveTransaction();

      expect(toastSpy).toHaveBeenCalled();
      const errorMessage = toastSpy.mock.calls[0][0].message;
      expect(errorMessage).toContain(
        'Cannot process transaction - overbooking not allowed for',
      );
      expect(errorMessage).toContain('Lemon-Ups');
      expect(errorMessage).toContain('Trefoils');
      expect(mockOrdersStore.insertNewTransaction).not.toHaveBeenCalled();
    });
  });
});
