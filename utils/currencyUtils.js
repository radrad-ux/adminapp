// Currency utility functions for consistent formatting
// Matches the implementation in the dmenu web app

// Export the same currency object as in the web app
export const CURRENCY = {
  code: 'DZD',
  symbol: 'د.ج',
  name: 'Algerian Dinar'
};

/**
 * Format price using DZD currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted price with currency symbol
 */
export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '';
  
  try {
    // For native environments without Intl support
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return '';
    
    // Check if Intl is available (usually available in newer versions of RN)
    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
      return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: CURRENCY.code
      }).format(numericAmount);
    } else {
      // Fallback formatting for older RN versions
      return `${CURRENCY.symbol} ${numericAmount.toFixed(2)}`;
    }
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${CURRENCY.symbol} ${parseFloat(amount).toFixed(2)}`;
  }
} 