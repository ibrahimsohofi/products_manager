// ❌ Original function with issues
const formatCurrencyOriginal = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// ✅ Improved version with error handling and flexibility
const formatCurrency = (amount, options = {}) => {
  // Handle null, undefined, or invalid numbers
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0,00 MAD';
  }

  const {
    currency = 'MAD', // Moroccan Dirham (default for Morocco)
    locale = 'fr-MA', // French-Morocco locale
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(Number(amount));
  } catch (error) {
    // Fallback formatting if Intl fails
    console.warn('Currency formatting failed:', error);
    return `${Number(amount).toFixed(2)} ${currency}`;
  }
};

// 🌍 Bilingual version for JAMALBRICO (Arabic/French support)
const formatCurrencyBilingual = (amount, language = 'fr', options = {}) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return language === 'ar' ? '0,00 درهم' : '0,00 MAD';
  }

  const {
    currency = 'MAD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  // Determine locale based on language
  const locale = language === 'ar' ? 'ar-MA' : 'fr-MA';

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(Number(amount));

    // For Arabic, replace currency symbol with Arabic text
    if (language === 'ar') {
      return formatted.replace(/MAD|د\.م\./g, 'درهم');
    }

    return formatted;
  } catch (error) {
    console.warn('Currency formatting failed:', error);
    const symbol = language === 'ar' ? 'درهم' : 'MAD';
    return `${Number(amount).toFixed(2)} ${symbol}`;
  }
};

// 🎯 Usage examples
console.log('=== Original (problematic) ===');
console.log(formatCurrencyOriginal(1234.56)); // $1,234.56 (wrong for Morocco)
// console.log(formatCurrencyOriginal(null)); // Would throw error

console.log('\n=== Improved version ===');
console.log(formatCurrency(1234.56)); // 1 234,56 MAD
console.log(formatCurrency(null)); // 0,00 MAD
console.log(formatCurrency(undefined)); // 0,00 MAD
console.log(formatCurrency('invalid')); // 0,00 MAD
console.log(formatCurrency(1234.56, { currency: 'EUR', locale: 'fr-FR' })); // 1 234,56 €

console.log('\n=== Bilingual version ===');
console.log(formatCurrencyBilingual(1234.56, 'fr')); // 1 234,56 MAD
console.log(formatCurrencyBilingual(1234.56, 'ar')); // 1 234,56 درهم
console.log(formatCurrencyBilingual(null, 'ar')); // 0,00 درهم

// Export for use in React components
export { formatCurrency, formatCurrencyBilingual };
