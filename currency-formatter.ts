// 🎯 TypeScript version for JAMALBRICO project
// File: src/utils/formatCurrency.ts

export interface CurrencyOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export type Language = 'fr' | 'ar';

/**
 * Formats currency with proper error handling and Moroccan context
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  options: CurrencyOptions = {}
): string => {
  // Handle invalid inputs
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0,00 MAD';
  }

  const {
    currency = 'MAD',
    locale = 'fr-MA',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(Number(amount));
  } catch (error) {
    console.warn('Currency formatting failed:', error);
    return `${Number(amount).toFixed(2)} ${currency}`;
  }
};

/**
 * Bilingual currency formatter for JAMALBRICO (Arabic/French)
 * @param amount - The amount to format
 * @param language - Language code ('fr' or 'ar')
 * @param options - Formatting options
 * @returns Formatted currency string in specified language
 */
export const formatCurrencyBilingual = (
  amount: number | string | null | undefined,
  language: Language = 'fr',
  options: CurrencyOptions = {}
): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return language === 'ar' ? '0,00 درهم' : '0,00 MAD';
  }

  const {
    currency = 'MAD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  const locale = language === 'ar' ? 'ar-MA' : 'fr-MA';

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    }).format(Number(amount));

    // Replace currency symbol with Arabic text for Arabic locale
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

/**
 * React hook for currency formatting with i18n support
 * @param language - Current language from i18n context
 * @returns Currency formatting function
 */
export const useCurrencyFormatter = (language: Language) => {
  return (amount: number | string | null | undefined, options?: CurrencyOptions) =>
    formatCurrencyBilingual(amount, language, options);
};

// Default export for convenience
export default formatCurrency;
