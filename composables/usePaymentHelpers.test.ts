import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePaymentHelpers } from "@/composables/usePaymentHelpers";
import type { Payment } from "@/types/types";

// Mock the stores and dependencies
const mockAccountsStore = {
  activePayment: {} as Payment,
  paymentDialogFormSchema: { value: [] },
  editPaymentDialogVisible: false,
  deletePaymentDialogVisible: false,
  upsertPayment: vi.fn(),
  insertNewPayment: vi.fn(),
  deletePayment: vi.fn(),
};

const mockGirlsStore = {
  girlOptions: [
    { label: "Alice", value: 1 },
    { label: "Bob", value: 2 },
  ],
};

const mockToast = {
  add: vi.fn(),
};

// Mock the global functions
vi.mocked(useAccountsStore).mockReturnValue(mockAccountsStore);
vi.mocked(useGirlsStore).mockReturnValue(mockGirlsStore);
vi.mocked(useToast).mockReturnValue(mockToast);

describe("usePaymentHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    mockAccountsStore.activePayment = {};
    mockAccountsStore.editPaymentDialogVisible = false;
    mockAccountsStore.deletePaymentDialogVisible = false;
  });

  describe("editPayment", () => {
    it("sets up the edit payment dialog correctly", () => {
      const { editPayment } = usePaymentHelpers();
      const testPayment: Payment = {
        id: 1,
        seller_id: 2,
        amount: 25.5,
        payment_date: "2024-01-15",
        notes: "Test payment",
        profile: "test-profile",
        season: 1,
        created_at: "2024-01-15T10:00:00Z",
      };

      editPayment(testPayment);

      expect(mockAccountsStore.activePayment).toEqual(testPayment);
      expect(mockAccountsStore.paymentDialogFormSchema.value).toBeDefined();
      expect(mockAccountsStore.editPaymentDialogVisible).toBe(true);
    });
  });

  describe("hideDialog", () => {
    it("hides the payment dialog and resets submitted state", () => {
      const { hideDialog, submitted } = usePaymentHelpers();

      mockAccountsStore.editPaymentDialogVisible = true;
      submitted.value = true;

      hideDialog();

      expect(mockAccountsStore.editPaymentDialogVisible).toBe(false);
      expect(submitted.value).toBe(false);
    });
  });

  describe("savePayment", () => {
    it("calls upsertPayment when payment has an id", async () => {
      const { savePayment, submitted } = usePaymentHelpers();

      const testPayment = { id: 1, amount: 25.5 } as Payment;
      mockAccountsStore.activePayment = testPayment;
      mockAccountsStore.editPaymentDialogVisible = true;
      submitted.value = true;

      await savePayment();

      expect(mockAccountsStore.upsertPayment).toHaveBeenCalledWith(testPayment);
      expect(mockAccountsStore.insertNewPayment).not.toHaveBeenCalled();
      expect(mockAccountsStore.editPaymentDialogVisible).toBe(false);
      expect(mockAccountsStore.activePayment).toEqual({});
      expect(submitted.value).toBe(false);
    });

    it("calls insertNewPayment when payment has no id", async () => {
      const { savePayment, submitted } = usePaymentHelpers();

      const testPayment = { amount: 25.5 } as Payment;
      mockAccountsStore.activePayment = testPayment;
      mockAccountsStore.editPaymentDialogVisible = true;
      submitted.value = true;

      await savePayment();

      expect(mockAccountsStore.insertNewPayment).toHaveBeenCalledWith(
        testPayment,
      );
      expect(mockAccountsStore.upsertPayment).not.toHaveBeenCalled();
      expect(mockAccountsStore.editPaymentDialogVisible).toBe(false);
      expect(mockAccountsStore.activePayment).toEqual({});
      expect(submitted.value).toBe(false);
    });
  });

  describe("confirmDeletePayment", () => {
    it("sets up delete confirmation dialog correctly", () => {
      const { confirmDeletePayment } = usePaymentHelpers();
      const testPayment: Payment = {
        id: 1,
        seller_id: 2,
        amount: 25.5,
        payment_date: "2024-01-15",
        notes: "Test payment",
        profile: "test-profile",
        season: 1,
        created_at: "2024-01-15T10:00:00Z",
      };

      confirmDeletePayment(testPayment);

      expect(mockAccountsStore.activePayment).toEqual(testPayment);
      expect(mockAccountsStore.deletePaymentDialogVisible).toBe(true);
    });
  });

  describe("deletePayment", () => {
    it("successfully deletes payment", async () => {
      const { deletePayment } = usePaymentHelpers();

      const testPayment = { id: 1 } as Payment;
      mockAccountsStore.activePayment = testPayment;
      mockAccountsStore.deletePaymentDialogVisible = true;

      await deletePayment();

      expect(mockAccountsStore.deletePayment).toHaveBeenCalledWith(testPayment);
      expect(mockAccountsStore.deletePaymentDialogVisible).toBe(false);
      expect(mockAccountsStore.activePayment).toEqual({});
    });

    it("handles deletion error gracefully", async () => {
      const { deletePayment } = usePaymentHelpers();

      const testError = new Error("Delete failed");
      mockAccountsStore.deletePayment.mockImplementation(() => {
        throw testError;
      });

      const testPayment = { id: 1 } as Payment;
      mockAccountsStore.activePayment = testPayment;

      await deletePayment();

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: "error",
        summary: "Error",
        detail: "Delete failed",
        life: 3000,
      });
    });
  });

  describe("form and submitted refs", () => {
    it("returns form and submitted refs correctly", () => {
      const { form, submitted } = usePaymentHelpers();

      expect(form.value).toBe(null);
      expect(submitted.value).toBe(false);

      // Test that they're reactive
      submitted.value = true;
      expect(submitted.value).toBe(true);
    });
  });

  describe("composable structure", () => {
    it("returns all expected methods and properties", () => {
      const helpers = usePaymentHelpers();

      expect(helpers).toHaveProperty("form");
      expect(helpers).toHaveProperty("submitted");
      expect(helpers).toHaveProperty("editPayment");
      expect(helpers).toHaveProperty("hideDialog");
      expect(helpers).toHaveProperty("savePayment");
      expect(helpers).toHaveProperty("confirmDeletePayment");
      expect(helpers).toHaveProperty("deletePayment");

      expect(typeof helpers.editPayment).toBe("function");
      expect(typeof helpers.hideDialog).toBe("function");
      expect(typeof helpers.savePayment).toBe("function");
      expect(typeof helpers.confirmDeletePayment).toBe("function");
      expect(typeof helpers.deletePayment).toBe("function");
    });
  });
});
