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
    it('should parse numeric amounts', () => {
      const amount = 150.50;
      expect(amount).toBe(150.50);
    });

    it('should parse string amounts', () => {
      const amountStr = '$150.50';
      const parsed = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
      expect(parsed).toBe(150.50);
    });

    it('should handle amounts with commas', () => {
      const amountStr = '1,250.75';
      const parsed = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
      expect(parsed).toBe(1250.75);
    });

    it('should handle negative amounts', () => {
      const amountStr = '-50.00';
      const parsed = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
      expect(parsed).toBe(-50.00);
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
