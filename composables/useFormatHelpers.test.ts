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

  describe('formatDate', () => {
    it('formats date strings in US format', () => {
      const { formatDate } = useFormatHelpers()
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
      expect(formatDate('2024-12-25')).toBe('Dec 25, 2024')
      expect(formatDate('2023-06-30')).toBe('Jun 30, 2023')
    })

    it('handles ISO datetime strings', () => {
      const { formatDate } = useFormatHelpers()
      expect(formatDate('2024-01-15T10:30:00Z')).toBe('Jan 15, 2024')
      expect(formatDate('2024-01-15T10:30:00.000Z')).toBe('Jan 15, 2024')
    })

    it('handles different date formats', () => {
      const { formatDate } = useFormatHelpers()
      expect(formatDate('2024/01/15')).toBe('Jan 15, 2024')
      expect(formatDate('01-15-2024')).toBe('Jan 15, 2024')
    })

    it('handles edge dates', () => {
      const { formatDate } = useFormatHelpers()
      expect(formatDate('2024-02-29')).toBe('Feb 29, 2024') // Leap year
      expect(formatDate('2024-01-01')).toBe('Jan 1, 2024') // New Year
      expect(formatDate('2024-12-31')).toBe('Dec 31, 2024') // End of year
    })
  })

  describe('formatTime', () => {
    it('formats time strings in 12-hour format', () => {
      const { formatTime } = useFormatHelpers()
      expect(formatTime('09:30')).toBe('9:30 AM')
      expect(formatTime('13:45')).toBe('1:45 PM')
      expect(formatTime('00:00')).toBe('12:00 AM')
      expect(formatTime('12:00')).toBe('12:00 PM')
    })

    it('handles edge time cases', () => {
      const { formatTime } = useFormatHelpers()
      expect(formatTime('01:00')).toBe('1:00 AM')
      expect(formatTime('23:59')).toBe('11:59 PM')
      expect(formatTime('12:30')).toBe('12:30 PM')
      expect(formatTime('00:30')).toBe('12:30 AM')
    })

    it('formats single digit minutes correctly', () => {
      const { formatTime } = useFormatHelpers()
      expect(formatTime('09:05')).toBe('9:05 AM')
      expect(formatTime('15:01')).toBe('3:01 PM')
    })

    it('handles various hour formats', () => {
      const { formatTime } = useFormatHelpers()
      expect(formatTime('08:15')).toBe('8:15 AM')
      expect(formatTime('18:45')).toBe('6:45 PM')
      expect(formatTime('06:00')).toBe('6:00 AM')
      expect(formatTime('22:30')).toBe('10:30 PM')
    })
  })

  describe('composable structure', () => {
    it('returns an object with all format functions', () => {
      const helpers = useFormatHelpers()
      expect(helpers).toHaveProperty('formatCurrency')
      expect(helpers).toHaveProperty('formatDate')
      expect(helpers).toHaveProperty('formatTime')
      expect(typeof helpers.formatCurrency).toBe('function')
      expect(typeof helpers.formatDate).toBe('function')
      expect(typeof helpers.formatTime).toBe('function')
    })

    it('can be destructured correctly', () => {
      const { formatCurrency, formatDate, formatTime } = useFormatHelpers()
      expect(typeof formatCurrency).toBe('function')
      expect(typeof formatDate).toBe('function')
      expect(typeof formatTime).toBe('function')
      expect(formatCurrency(10)).toBe('$10.00')
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
      expect(formatTime('09:30')).toBe('9:30 AM')
    })

    it('functions work independently', () => {
      const helpers1 = useFormatHelpers()
      const helpers2 = useFormatHelpers()
      
      // Test that each instance works correctly
      expect(helpers1.formatCurrency(25.50)).toBe('$25.50')
      expect(helpers2.formatDate('2024-01-15')).toBe('Jan 15, 2024')
      
      // Test that they return the same results
      expect(helpers1.formatTime('14:30')).toBe(helpers2.formatTime('14:30'))
    })
  })
})