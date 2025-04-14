import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import TranslatedText from '@/components/TranslatedText';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isRTL } = useLanguage();
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Define custom colors for a more vibrant UI
  const gradientStart = colorScheme === 'dark' ? '#1A1A2E' : '#4361EE';
  const gradientEnd = colorScheme === 'dark' ? '#16213E' : '#7209B7';
  const cardGradientStart = colorScheme === 'dark' ? '#2A2A3C' : '#ffffff';
  const cardGradientEnd = colorScheme === 'dark' ? '#1F1F30' : '#f8f9fa';
  
  return (
    <ScrollView 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          direction: isRTL ? 'rtl' : 'ltr' 
        }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View 
          style={[
            styles.header,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: isRTL ? 'flex-end' : 'flex-start'
            }
          ]}
        >
          <TranslatedText 
            section="dashboard" 
            textKey="title" 
            style={[
              styles.title, 
              { 
                color: '#ffffff',
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
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}
          />
        </Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={[cardGradientStart, cardGradientEnd]}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.cardIconContainer}>
              <Feather 
                name="activity" 
                size={24} 
                color={colorScheme === 'dark' ? '#7B68EE' : '#4361EE'} 
              />
            </View>
            <View style={[styles.cardContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
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
          </LinearGradient>
        </Animated.View>

        {/* Additional card example */}
        <Animated.View 
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <LinearGradient
            colors={[cardGradientStart, cardGradientEnd]}
            style={styles.card}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={styles.cardIconContainer}>
              <Feather 
                name="bar-chart-2" 
                size={24} 
                color={colorScheme === 'dark' ? '#7B68EE' : '#4361EE'} 
              />
            </View>
            <View style={[styles.cardContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
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
          </LinearGradient>
        </Animated.View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.9,
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 16,
    padding: 0,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardIconContainer: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContent: {
    flex: 1,
    padding: 20,
    paddingLeft: 0,
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