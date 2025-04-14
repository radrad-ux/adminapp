import React from 'react';
import { Text, TextProps } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface TranslatedTextProps extends TextProps {
  section: string;
  textKey: string;
  values?: Record<string, string | number>;
}

/**
 * A text component that automatically translates based on the current language
 * 
 * Usage:
 * <TranslatedText section="common" textKey="welcome" />
 * 
 * With variable replacement:
 * <TranslatedText section="profile" textKey="greeting" values={{ name: 'John' }} />
 * Where the translation might be "Hello, {name}!"
 */
const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  section, 
  textKey, 
  values = {}, 
  style, 
  ...props 
}) => {
  const { t, isRTL } = useLanguage();
  
  // Get the translation
  let translatedText = t(section as any, textKey as any);
  
  // Replace any variables in the text (format: {variableName})
  if (values && Object.keys(values).length > 0) {
    Object.entries(values).forEach(([key, value]) => {
      translatedText = translatedText.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
  }
  
  return (
    <Text
      style={[
        { textAlign: isRTL ? 'right' : 'left' },
        style
      ]}
      {...props}
    >
      {translatedText}
    </Text>
  );
};

export default TranslatedText; 