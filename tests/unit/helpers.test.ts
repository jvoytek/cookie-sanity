import { describe, it, expect } from 'vitest'
import { formatCurrency, calculateTotal, validateEmail } from '../../utils/helpers'

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

  describe('calculateTotal', () => {
    it('calculates correct total for positive values', () => {
      expect(calculateTotal(5, 4.00)).toBe(20.00)
      expect(calculateTotal(10, 3.50)).toBe(35.00)
      expect(calculateTotal(0, 5.00)).toBe(0)
    })

    it('handles zero quantity', () => {
      expect(calculateTotal(0, 10)).toBe(0)
    })

    it('handles zero price', () => {
      expect(calculateTotal(5, 0)).toBe(0)
    })

    it('throws error for negative quantity', () => {
      expect(() => calculateTotal(-1, 5)).toThrow('Quantity and price must be non-negative')
    })

    it('throws error for negative price', () => {
      expect(() => calculateTotal(5, -1)).toThrow('Quantity and price must be non-negative')
    })
  })

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.org')).toBe(true)
      expect(validateEmail('firstname+lastname@company.co.uk')).toBe(true)
    })

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
      expect(validateEmail('test@domain')).toBe(false)
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('test.domain.com')).toBe(false)
      expect(validateEmail('test @domain.com')).toBe(false)
    })
  })
})