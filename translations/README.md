# Internationalization (i18n) Guide

This guide explains how to use the translation system in the app to support multiple languages.

## Table of Contents
- [Supported Languages](#supported-languages)
- [How It Works](#how-it-works)
- [Adding New Translations](#adding-new-translations)
- [Using Translations in Components](#using-translations-in-components)
- [RTL Support](#rtl-support)
- [Best Practices](#best-practices)

## Supported Languages

The app currently supports the following languages:
- English
- French
- Arabic (with RTL support)

## How It Works

The i18n system is built on these components:

1. **Translation Files**: JSON objects for each language (`en.ts`, `fr.ts`, `ar.ts`)
2. **Language Context**: React Context for managing the current language and translations
3. **TranslatedText Component**: Reusable component for easily displaying translated text
4. **RTL Support**: Proper support for right-to-left languages like Arabic

The system uses `expo-localization` to automatically detect the device's language and `expo-secure-store` to persist the user's language preference.

## Adding New Translations

### 1. Adding a New Language

To add a new language:

1. Create a new translation file in the `translations` folder (e.g., `es.ts` for Spanish)
2. Add the language to `SUPPORTED_LANGUAGES` in `translations/index.ts`
3. Import and add the translations to the `translations` object in `translations/index.ts`
4. Update the `getDirectionForLanguage` function if the language requires RTL support

### 2. Adding New Translation Keys

To add new translation keys:

1. First add the key to the English translations file (`en.ts`)
2. Then add the corresponding translations to all other language files
3. Group related translations under logical sections (e.g., 'settings', 'login', etc.)

## Using Translations in Components

### Method 1: Using the useLanguage hook

```jsx
import { useLanguage } from '../context/LanguageContext';

function MyComponent() {
  const { t } = useLanguage();
  
  return (
    <Text>{t('section', 'key')}</Text>
  );
}
```

### Method 2: Using the TranslatedText component

```jsx
import TranslatedText from '../components/TranslatedText';

function MyComponent() {
  return (
    <TranslatedText 
      section="section" 
      textKey="key" 
      style={styles.text} 
    />
  );
}
```

### Using Variables in Translations

You can use variables in your translations:

```jsx
// In your translation file:
// "greeting": "Hello, {name}!"

// In your component:
<TranslatedText 
  section="common" 
  textKey="greeting" 
  values={{ name: 'John' }} 
/>
```

## RTL Support

For Arabic and other RTL languages, the system automatically:

1. Sets the `isRTL` flag in the language context
2. Handles text alignment for the `TranslatedText` component
3. Provides an `isRTL` value you can use in your components

In your components, handle RTL correctly:

```jsx
// Style direction based on language
<View style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
  {/* ... */}
</View>

// Text alignment
<Text style={{ textAlign: isRTL ? 'right' : 'left' }}>
  {/* ... */}
</Text>

// FlexDirection for layout
<View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
  {/* ... */}
</View>
```

## Best Practices

1. **Always** use the translation system instead of hardcoding text
2. Organize translations in logical sections by feature or screen
3. Use descriptive keys that indicate the purpose of the text
4. Test your UI in all supported languages and ensure it looks good
5. Pay special attention to text that might be longer in other languages
6. For RTL languages, ensure your layout works correctly in both directions
7. Use the `TranslatedText` component for consistent styling and RTL handling 