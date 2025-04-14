import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import TranslatedText from './TranslatedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TranslatedScreenHeaderProps {
  section: string;
  titleKey: string;
  subtitleKey?: string;
}

/**
 * A component that renders a translated screen header with title and optional subtitle
 * 
 * Usage:
 * <TranslatedScreenHeader section="restaurant" titleKey="title" subtitleKey="subtitle" />
 */
const TranslatedScreenHeader: React.FC<TranslatedScreenHeaderProps> = ({ 
  section, 
  titleKey, 
  subtitleKey 
}) => {
  const { isRTL } = useLanguage();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={styles.header}>
      <TranslatedText 
        section={section} 
        textKey={titleKey} 
        style={[
          styles.title, 
          { 
            color: colors.text,
            textAlign: isRTL ? 'right' : 'left'
          }
        ]}
      />
      {subtitleKey && (
        <TranslatedText 
          section={section} 
          textKey={subtitleKey} 
          style={[
            styles.subtitle, 
            { 
              color: colors.icon,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
});

export default TranslatedScreenHeader; 