import React from 'react';
import { StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import TranslatedText from './TranslatedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TranslatedFormLabelProps {
  section: string;
  textKey: string;
  required?: boolean;
}

/**
 * A component that renders a translated form label with optional required indicator
 * 
 * Usage:
 * <TranslatedFormLabel section="restaurant" textKey="nameLabel" required />
 */
const TranslatedFormLabel: React.FC<TranslatedFormLabelProps> = ({ 
  section, 
  textKey, 
  required = false 
}) => {
  const { isRTL } = useLanguage();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <TranslatedText 
      section={section} 
      textKey={textKey} 
      style={[
        styles.label, 
        { 
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left'
        }
      ]}
    >
      {required && <TranslatedText style={{ color: colors.error }}> *</TranslatedText>}
    </TranslatedText>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  }
});

export default TranslatedFormLabel; 