/**
 * Utility functions for the Cookie Sanity application
 */

/**
 * Formats a number as currency (USD)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

/**
 * Calculates the total price for cookies
 * @param quantity - Number of cookie boxes
 * @param pricePerBox - Price per box in dollars
 * @returns Total price
 */
export function calculateTotal(quantity: number, pricePerBox: number): number {
  if (quantity < 0 || pricePerBox < 0) {
    throw new Error('Quantity and price must be non-negative')
  }
  return quantity * pricePerBox
}

/**
 * Validates an email address
 * @param email - Email to validate
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}