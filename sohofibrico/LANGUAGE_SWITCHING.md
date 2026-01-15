# Language Switching Feature - SOHOFIBRICO

## Overview
The SOHOFIBRICO project includes full multi-language support with French and Arabic translations.

**Note**: English support has been removed. The application now supports only French and Arabic.

## Features Implemented

### 1. Language Switcher Component
- **Location**: `src/components/LanguageSwitcher.jsx`
- **Design**: Dropdown menu with country flags
- **Functionality**:
  - Click to open language selection
  - Shows current language with flag
  - Visual checkmark for active language
  - Automatic RTL support for Arabic
  - Click-outside to close

### 2. i18n Configuration
- **Location**: `src/i18n/index.js`
- **Features**:
  - Automatic language detection
  - Fallback to French
  - Browser language detection
  - Persistent language preference (localStorage)

### 3. Translation Files
- **French**: `src/i18n/locales/fr.json`
- **Arabic**: `src/i18n/locales/ar.json`
- **English**: ~~Removed~~

#### Currency Support:
Both languages display currency in **MAD (Moroccan Dirham)**:
- French: `1 234,56 MAD`
- Arabic: `1 234,56 درهم` or `1 234,56 د.م.`

Currency formatter supports bilingual formatting with proper Moroccan locale.

#### Covered Sections:
- App title and subtitle
- Navigation menu
- Dashboard statistics
- Sales management
- Inventory management
- Customer management
- Supplier management
- Reports
- Common UI elements

### 4. RTL Support
The application automatically switches to RTL (Right-to-Left) layout when Arabic is selected:
- Document direction changes
- Text alignment adjusts
- Layout mirrors appropriately

## How to Use

### For Users
1. Click on the language switcher in the header (top right)
2. Select your preferred language from the dropdown
3. The entire interface will switch immediately
4. Your preference is saved in browser storage

### For Developers

#### Current Configuration
The application is configured to support only French and Arabic:

**i18n Configuration** (`src/i18n/index.js`):
```javascript
import frTranslations from './locales/fr.json';
import arTranslations from './locales/ar.json';

const resources = {
  fr: { translation: frTranslations },
  ar: { translation: arTranslations }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',            // Default language: French
  fallbackLng: 'fr',    // Fallback language: French
  // ...
});
```

**Language Switcher** (`src/components/LanguageSwitcher.jsx`):
```javascript
const languages = [
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'ar', name: 'العربية', flag: 'MA' }
];
```

#### Using Translations in Components
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <h1>{t('dashboard.totalSales')}</h1>
  );
}
```

#### Translation Key Structure
```json
{
  "section": {
    "subsection": "Translation text"
  }
}
```

Example:
```javascript
t('dashboard.totalSales')  // → "Total des Ventes" (FR) or "إجمالي المبيعات" (AR)
```

## Components Updated

### All Components Fully Translated:
1. ✅ **App.jsx** - App title and subtitle
2. ✅ **Navigation.jsx** - All menu items
3. ✅ **Dashboard.jsx** - All statistics and labels
4. ✅ **SalesForm.jsx** - Sales creation and editing
5. ✅ **SalesList.jsx** - Sales history
6. ✅ **Inventory.jsx** - Product management
7. ✅ **Customers.jsx** - Customer management
8. ✅ **Suppliers.jsx** - Supplier management
9. ✅ **Reports.jsx** - Reporting features
10. ✅ **LanguageSwitcher.jsx** - Language selection

All user-facing text in the application uses the translation system.

## Testing

1. **Language Switch**: Click the language switcher and verify UI changes
2. **RTL Layout**: Switch to Arabic and verify layout mirrors correctly
3. **Persistence**: Refresh the page and verify language preference is maintained
4. **Missing Keys**: Check console for any missing translation warnings

## Browser Support

The language switching feature works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Performance

- Translation files are bundled with the app
- Language switching is instant (no network requests)
- No performance impact on application
- Minimal bundle size increase (~10KB per language)

## Troubleshooting

### Language doesn't change
- Check browser console for errors
- Verify translation files are properly imported
- Clear browser cache and localStorage

### RTL layout issues
- Ensure Tailwind CSS RTL plugin is configured
- Check that `document.dir` is being set correctly
- Verify CSS doesn't have hardcoded LTR values

### Missing translations
- Add missing keys to translation files
- Use fallback language (French) as reference
- Console will warn about missing translation keys

## Credits

- **i18next**: Internationalization framework
- **react-i18next**: React bindings for i18next
- **react-country-flag**: Country flag components
