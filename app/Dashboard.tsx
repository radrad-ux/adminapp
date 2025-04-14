import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

export default function Dashboard() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isRTL } = useLanguage();

  return (
    <ScrollView 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          direction: isRTL ? 'rtl' : 'ltr' 
        }
      ]}
    >
      <View style={styles.header}>
        <TranslatedText 
          section="dashboard" 
          textKey="title" 
          style={[
            styles.title, 
            { 
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}
        />
        <TranslatedText 
          section="dashboard" 
          textKey="subtitle" 
          style={[
            styles.subtitle, 
            { 
              color: colors.icon,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <TranslatedText 
          section="dashboard" 
          textKey="cardTitle" 
          style={[
            styles.cardTitle, 
            { 
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}
        />
        <TranslatedText 
          section="dashboard" 
          textKey="cardText" 
          style={[
            styles.cardText, 
            { 
              color: colors.icon,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
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
  card: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
  },
}); 