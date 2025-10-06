// 🛡️ Safe Financial Calculation Utilities
// Prevents NaN issues in financial calculations

/**
 * Safely parse a number, returning 0 if invalid
 * @param {any} value - Value to parse
 * @param {number} fallback - Fallback value if parsing fails
 * @returns {number} Parsed number or fallback
 */
export const safeParseFloat = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safely parse an integer, returning 0 if invalid
 * @param {any} value - Value to parse
 * @param {number} fallback - Fallback value if parsing fails
 * @returns {number} Parsed integer or fallback
 */
export const safeParseInt = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const parsed = parseInt(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safely calculate total price with discount and tax
 * @param {any} price - Unit price
 * @param {any} quantity - Quantity
 * @param {any} discount - Discount amount
 * @param {any} taxAmount - Tax amount
 * @returns {number} Total price
 */
export const calculateTotalPrice = (price, quantity, discount = 0, taxAmount = 0) => {
  const safePrice = safeParseFloat(price);
  const safeQuantity = safeParseInt(quantity);
  const safeDiscount = safeParseFloat(discount);
  const safeTax = safeParseFloat(taxAmount);

  if (safePrice <= 0 || safeQuantity <= 0) {
    throw new Error('Price and quantity must be greater than 0');
  }

  return (safePrice * safeQuantity) - safeDiscount + safeTax;
};

/**
 * Safely accumulate revenue (fixes the dailySales issue)
 * @param {any} currentRevenue - Current revenue value
 * @param {any} additionalAmount - Amount to add
 * @returns {number} New revenue total
 */
export const accumulateRevenue = (currentRevenue, additionalAmount) => {
  const current = safeParseFloat(currentRevenue);
  const additional = safeParseFloat(additionalAmount);
  return current + additional;
};

// Example usage for the specific issue mentioned:
// ❌ Before: dailySales[date].revenue += sale.totalPrice || 0;
// ✅ After: dailySales[date].revenue = accumulateRevenue(dailySales[date].revenue, sale.totalPrice);

export default {
  safeParseFloat,
  safeParseInt,
  calculateTotalPrice,
  accumulateRevenue
};
