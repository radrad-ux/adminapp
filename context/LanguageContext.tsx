import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Localization from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { I18nManager } from 'react-native';
import translations, { 
  SupportedLanguage, 
  DEFAULT_LANGUAGE, 
  getDirectionForLanguage 
} from '../translations';

const LANGUAGE_STORAGE_KEY = 'app_language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  t: <T extends keyof typeof translations[SupportedLanguage], 
      K extends keyof typeof translations[SupportedLanguage][T]>
    (section: T, key: K) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);
  const [isRTL, setIsRTL] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize language from storage or device locale
  useEffect(() => {
    async function loadLanguage() {
      try {
        // Try to get the stored language preference
        const storedLanguage = await SecureStore.getItemAsync(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
        
        if (storedLanguage && Object.keys(translations).includes(storedLanguage)) {
          await setAppLanguage(storedLanguage);
        } else {
          // Fall back to device locale if no stored preference
          const deviceLocale = Localization.locale.split('-')[0];
          
          // Map device locale to our supported languages
          let detectedLanguage: SupportedLanguage = DEFAULT_LANGUAGE;
          if (deviceLocale === 'fr') detectedLanguage = 'French';
          if (deviceLocale === 'ar') detectedLanguage = 'Arabic';
          
          await setAppLanguage(detectedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
        await setAppLanguage(DEFAULT_LANGUAGE);
      } finally {
        setIsLoaded(true);
      }
    }

    loadLanguage();
  }, []);

  // Set app language and handle RTL
  const setAppLanguage = async (newLanguage: SupportedLanguage) => {
    try {
      const direction = getDirectionForLanguage(newLanguage);
      const shouldBeRTL = direction === 'rtl';
      
      // Only force RTL reload if direction is changing
      if (isRTL !== shouldBeRTL) {
        // This might force app to reload on some platforms
        I18nManager.forceRTL(shouldBeRTL);
        setIsRTL(shouldBeRTL);
      }
      
      setLanguageState(newLanguage);
      await SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, newLanguage);
      return true;
    } catch (error) {
      console.error('Error setting language:', error);
      return false;
    }
  };

  // Translation function
  const t = <T extends keyof typeof translations[SupportedLanguage], 
             K extends keyof typeof translations[SupportedLanguage][T]>
            (section: T, key: K): string => {
    try {
      return translations[language][section][key] as string;
    } catch (error) {
      console.warn(`Translation missing: ${language}.${String(section)}.${String(key)}`);
      // Fallback to English
      try {
        return translations[DEFAULT_LANGUAGE][section][key] as string;
      } catch {
        return `${String(section)}.${String(key)}`;
      }
    }
  };

  if (!isLoaded) {
    // You could return a loading component here
    return null;
  }

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: setAppLanguage,
      t,
      isRTL
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

export default LanguageContext; 