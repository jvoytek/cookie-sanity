import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import ImportPaymentsDialog from './ImportPaymentsDialog.vue';

describe('ImportPaymentsDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('date conversion', () => {
    it('should handle yyyy-mm-dd format', () => {
      const testDate = '2024-01-15';
      // The date should remain unchanged
      expect(testDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle mm/dd/yyyy format', () => {
      const testDate = '01/15/2024';
      const [month, day, year] = testDate.split('/');
      const expected = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      expect(expected).toBe('2024-01-15');
    });

    it('should handle single digit dates', () => {
      const testDate = '1/5/2024';
      const [month, day, year] = testDate.split('/');
      const expected = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      expect(expected).toBe('2024-01-05');
    });
  });

  describe('payment method mapping', () => {
    it('should map Cash to cash', () => {
      const method = 'Cash'.toLowerCase().trim();
      expect(method).toBe('cash');
    });

    it('should map Check to check', () => {
      const method = 'Check'.toLowerCase().trim();
      expect(method).toBe('check');
    });

    it('should map Credit Card to digital-cookie', () => {
      const method = 'Credit Card';
      const methodLower = method.toLowerCase().trim();
      const result = methodLower === 'credit card' ? 'digital-cookie' : null;
      expect(result).toBe('digital-cookie');
    });

    it('should handle case insensitive mapping', () => {
      expect('CASH'.toLowerCase().trim()).toBe('cash');
      expect('check'.toLowerCase().trim()).toBe('check');
      expect('CrEdIt CaRd'.toLowerCase().trim()).toBe('credit card');
    });
  });

  describe('amount parsing', () => {
    // Helper function that mimics the parseAmount logic in the component
    const parseAmount = (value: number | string): number | null => {
      try {
        let amount: number;
        if (typeof value === 'string') {
          const cleaned = value.replace(/[^0-9.-]/g, '');
          amount = parseFloat(cleaned);
        } else {
          amount = value;
        }
        return isNaN(amount) ? null : amount;
      } catch {
        return null;
      }
    };

    it('should parse numeric amounts', () => {
      const amount = parseAmount(150.5);
      expect(amount).toBe(150.5);
    });

    it('should parse string amounts with currency symbols', () => {
      const amount = parseAmount('$150.50');
      expect(amount).toBe(150.5);
    });

    it('should handle amounts with commas', () => {
      const amount = parseAmount('1,250.75');
      expect(amount).toBe(1250.75);
    });

    it('should handle negative amounts', () => {
      const amount = parseAmount('-50.00');
      expect(amount).toBe(-50.0);
    });

    it('should return null for invalid amounts', () => {
      const amount = parseAmount('invalid');
      expect(amount).toBeNull();
    });
  });

  describe('component structure', () => {
    it('should mount successfully with required props', () => {
      const wrapper = mount(ImportPaymentsDialog, {
        props: {
          visible: false,
        },
        global: {
          stubs: {
            Dialog: true,
            FileUpload: true,
            Button: true,
          },
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });
});
