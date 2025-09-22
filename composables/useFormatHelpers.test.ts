import { describe, it, expect } from 'vitest'
import { useFormatHelpers } from '@/composables/useFormatHelpers'
const { formatCurrency } = useFormatHelpers()

describe('utils/helpers', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers as USD currency', () => {
      expect(formatCurrency(5.00)).toBe('$5.00')
      expect(formatCurrency(12.50)).toBe('$12.50')
      expect(formatCurrency(100)).toBe('$100.00')
    })

    it('formats zero as currency', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('formats negative numbers as currency', () => {
      expect(formatCurrency(-5.50)).toBe('-$5.50')
    })

    it('handles decimal precision', () => {
      expect(formatCurrency(5.999)).toBe('$6.00')
      expect(formatCurrency(5.123)).toBe('$5.12')
    })
  })

})