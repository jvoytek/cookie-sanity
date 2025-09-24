import { describe, it, expect } from 'vitest'
import { useFormatHelpers } from '@/composables/useFormatHelpers'

describe('useFormatHelpers', () => {
  describe('formatCurrency', () => {
    it('formats positive numbers as USD currency', () => {
      const { formatCurrency } = useFormatHelpers()
      expect(formatCurrency(5.00)).toBe('$5.00')
      expect(formatCurrency(12.50)).toBe('$12.50')
      expect(formatCurrency(100)).toBe('$100.00')
    })

    it('formats zero as currency', () => {
      const { formatCurrency } = useFormatHelpers()
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('formats negative numbers as currency', () => {
      const { formatCurrency } = useFormatHelpers()
      expect(formatCurrency(-5.50)).toBe('-$5.50')
    })

    it('handles decimal precision', () => {
      const { formatCurrency } = useFormatHelpers()
      expect(formatCurrency(5.999)).toBe('$6.00')
      expect(formatCurrency(5.123)).toBe('$5.12')
    })

    it('handles edge cases', () => {
      const { formatCurrency } = useFormatHelpers()
      expect(formatCurrency(0.01)).toBe('$0.01')
      expect(formatCurrency(999999.99)).toBe('$999,999.99')
      expect(formatCurrency(-0.01)).toBe('-$0.01')
    })

    it('handles very small numbers', () => {
      const { formatCurrency } = useFormatHelpers()
      expect(formatCurrency(0.001)).toBe('$0.00')
      expect(formatCurrency(0.006)).toBe('$0.01')
    })
  })

  describe('composable structure', () => {
    it('returns an object with formatCurrency function', () => {
      const helpers = useFormatHelpers()
      expect(helpers).toHaveProperty('formatCurrency')
      expect(typeof helpers.formatCurrency).toBe('function')
    })

    it('can be destructured correctly', () => {
      const { formatCurrency } = useFormatHelpers()
      expect(typeof formatCurrency).toBe('function')
      expect(formatCurrency(10)).toBe('$10.00')
    })
  })
})