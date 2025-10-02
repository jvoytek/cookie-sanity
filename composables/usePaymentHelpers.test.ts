import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePaymentHelpers } from '@/composables/usePaymentHelpers';
import type { Payment } from '@/types/types';
import { setActivePinia, createPinia } from 'pinia';

describe('usePaymentHelpers', () => {
  let paymentHelpers: ReturnType<typeof usePaymentHelpers>;
  let accountsStoreMock: any;
  let toastSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    accountsStoreMock = {
      activePayment: null,
      paymentDialogFormSchema: { value: [] },
      editPaymentDialogVisible: false,
      deletePaymentDialogVisible: false,
      upsertPayment: vi.fn(),
      insertNewPayment: vi.fn(),
      deletePayment: vi.fn(),
      troopBalance: { value: 0 },
      allBalances: [],
      getGirlAccountById: vi.fn(() => ({
        balance: 0,
        payments: [],
        girl: { first_name: 'Test Girl', last_name: 'Test' },
        girlPaymentsList: [],
      })),
      troopAccountSummary: {
        troopBalance: 0,
        totalPaid: 0,
        totalOwed: 0,
      },
    };

    vi.stubGlobal('useAccountsStore', () => accountsStoreMock);

    toastSpy = vi.fn();
    vi.stubGlobal(
      'useNotificationHelpers',
      vi.fn(() => ({
        addError: toastSpy,
      })),
    );

    paymentHelpers = usePaymentHelpers();
  });

  describe('editPayment', () => {
    it('sets up the edit payment dialog correctly', () => {
      const testPayment = {
        id: 1,
        seller_id: 2,
        amount: 25.5,
        payment_date: '2024-01-15',
        notes: 'Test payment',
        profile: 'test-profile',
        season: 1,
        created_at: '2024-01-15T10:00:00Z',
      };

      paymentHelpers.editPayment(testPayment);

      expect(accountsStoreMock.activePayment).toEqual(testPayment);
      expect(accountsStoreMock.paymentDialogFormSchema.value).toBeDefined();
      expect(accountsStoreMock.editPaymentDialogVisible).toBe(true);
    });
  });

  describe('hideDialog', () => {
    it('hides the payment dialog and resets submitted state', () => {
      const { hideDialog, submitted } = usePaymentHelpers();

      accountsStoreMock.editPaymentDialogVisible = true;
      submitted.value = true;

      hideDialog();

      expect(accountsStoreMock.editPaymentDialogVisible).toBe(false);
      expect(submitted.value).toBe(false);
    });
  });

  describe('savePayment', () => {
    it('calls upsertPayment when payment has an id', async () => {
      const { savePayment, submitted } = usePaymentHelpers();

      const testPayment = { id: 1, amount: 25.5 } as Payment;
      accountsStoreMock.activePayment = testPayment;
      accountsStoreMock.editPaymentDialogVisible = true;
      submitted.value = true;

      await savePayment();

      expect(accountsStoreMock.upsertPayment).toHaveBeenCalledWith(testPayment);
      expect(accountsStoreMock.insertNewPayment).not.toHaveBeenCalled();
      expect(accountsStoreMock.editPaymentDialogVisible).toBe(false);
      expect(accountsStoreMock.activePayment).toEqual(null);
      expect(submitted.value).toBe(false);
    });

    it('calls insertNewPayment when payment has no id', async () => {
      const { savePayment, submitted } = usePaymentHelpers();

      const testPayment = { amount: 25.5 } as Payment;
      accountsStoreMock.activePayment = testPayment;
      accountsStoreMock.editPaymentDialogVisible = true;
      submitted.value = true;

      await savePayment();

      expect(accountsStoreMock.insertNewPayment).toHaveBeenCalledWith(
        testPayment,
      );
      expect(accountsStoreMock.upsertPayment).not.toHaveBeenCalled();
      expect(accountsStoreMock.editPaymentDialogVisible).toBe(false);
      expect(accountsStoreMock.activePayment).toEqual(null);
      expect(submitted.value).toBe(false);
    });
  });

  describe('confirmDeletePayment', () => {
    it('sets up delete confirmation dialog correctly', () => {
      const { confirmDeletePayment } = usePaymentHelpers();

      const testPayment: Payment = {
        id: 1,
        seller_id: 2,
        amount: 25.5,
        payment_date: '2024-01-15',
        notes: 'Test payment',
        profile: 'test-profile',
        season: 1,
        created_at: '2024-01-15T10:00:00Z',
      };

      confirmDeletePayment(testPayment);

      expect(accountsStoreMock.activePayment).toEqual(testPayment);
      expect(accountsStoreMock.deletePaymentDialogVisible).toBe(true);
    });
  });

  describe('deletePayment', () => {
    it('successfully deletes payment', async () => {
      const { deletePayment } = usePaymentHelpers();

      const testPayment = { id: 1 } as Payment;
      accountsStoreMock.activePayment = testPayment;
      accountsStoreMock.deletePaymentDialogVisible = true;

      await deletePayment();

      expect(accountsStoreMock.deletePayment).toHaveBeenCalledWith(testPayment);
      expect(accountsStoreMock.deletePaymentDialogVisible).toBe(false);
      expect(accountsStoreMock.activePayment).toEqual(null);
    });

    it('handles deletion error gracefully', async () => {
      const { deletePayment } = usePaymentHelpers();

      accountsStoreMock.activePayment = null; // No active payment to trigger error

      await deletePayment();

      expect(accountsStoreMock.activePayment).toBe(null);
      expect(toastSpy).toHaveBeenCalled();
    });
  });

  describe('form and submitted refs', () => {
    it('returns form and submitted refs correctly', () => {
      const { submitted } = usePaymentHelpers();

      expect(submitted.value).toBe(false);

      // Test that they're reactive
      submitted.value = true;
      expect(submitted.value).toBe(true);
    });
  });

  describe('composable structure', () => {
    it('returns all expected methods and properties', () => {
      const helpers = usePaymentHelpers();

      expect(helpers).toHaveProperty('submitted');
      expect(helpers).toHaveProperty('editPayment');
      expect(helpers).toHaveProperty('hideDialog');
      expect(helpers).toHaveProperty('savePayment');
      expect(helpers).toHaveProperty('confirmDeletePayment');
      expect(helpers).toHaveProperty('deletePayment');

      expect(typeof helpers.editPayment).toBe('function');
      expect(typeof helpers.hideDialog).toBe('function');
      expect(typeof helpers.savePayment).toBe('function');
      expect(typeof helpers.confirmDeletePayment).toBe('function');
      expect(typeof helpers.deletePayment).toBe('function');
    });
  });
});
