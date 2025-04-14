import en from './en';
import fr from './fr';
import ar from './ar';

export type TranslationKey = keyof typeof en;
export type TranslationNestedKey<T extends TranslationKey> = keyof typeof en[T];

export const SUPPORTED_LANGUAGES = ['English', 'French', 'Arabic'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const translations = {
  English: en,
  French: fr,
  Arabic: ar,
};

export const getDirectionForLanguage = (language: SupportedLanguage): 'ltr' | 'rtl' => {
  return language === 'Arabic' ? 'rtl' : 'ltr';
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'English';

export default translations; 