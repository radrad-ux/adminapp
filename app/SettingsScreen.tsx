import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../translations';

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isLoggedIn, isLoggingOut, logout } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const router = useRouter();
  
  // Settings state
  const [ordersEnabled, setOrdersEnabled] = React.useState(true);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  // Don't render content if not logged in
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Please login to access settings</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: colorScheme === 'dark' ? '#121212' : '#f5f5f5' }
      ]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings', 'title')}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          {t('settings', 'subtitle')}
        </Text>
      </View>

      {/* Settings container */}
      <View style={[styles.settingsContainer, { direction: isRTL ? 'rtl' : 'ltr' }]}>
        {/* Language selection card */}
        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="language" size={24} color={colors.primary} />
            <Text style={[styles.settingTitle, { color: colors.text }]}>{t('settings', 'language')}</Text>
          </View>
          
          <View style={styles.languageOptions}>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang}
                style={[
                  styles.languageButton, 
                  { 
                    borderColor: colorScheme === 'dark' ? '#333' : '#e0e0e0',
                    backgroundColor: language === lang 
                      ? colors.primary 
                      : colorScheme === 'dark' ? '#2c2c2c' : '#f5f5f5' 
                  }
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[
                  styles.languageButtonText, 
                  { color: language === lang ? '#fff' : colors.text }
                ]}>
                  {lang === 'English' ? 'English' : 
                   lang === 'French' ? 'Français' : 
                   lang === 'Arabic' ? 'العربية' : lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Enable/Disable Orders card */}
        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="shopping-bag" size={24} color={colors.primary} />
            <Text style={[styles.settingTitle, { color: colors.text }]}>{t('settings', 'orderManagement')}</Text>
          </View>
          
          <View style={styles.toggleContainer}>
            <View>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>{t('settings', 'enableOrders')}</Text>
              <Text style={[styles.settingDescription, { color: colors.icon }]}>
                {ordersEnabled ? t('settings', 'ordersEnabled') : t('settings', 'ordersDisabled')}
              </Text>
            </View>
            <Switch
              value={ordersEnabled}
              onValueChange={setOrdersEnabled}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
          
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: ordersEnabled ? '#4CAF50' : '#F44336' }
            ]} />
            <Text style={[
              styles.statusText, 
              { color: ordersEnabled ? '#4CAF50' : '#F44336' }
            ]}>
              {ordersEnabled ? t('settings', 'active') : t('settings', 'inactive')}
            </Text>
          </View>
        </View>

        {/* Logout card */}
        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1e1e1e' : '#fff' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.settingTitle, { color: colors.text }]}>{t('settings', 'account')}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.error }]} 
            onPress={logout}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logoutButtonText}>
              {isLoggingOut ? t('settings', 'loggingOut') : t('settings', 'logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.7,
  },
  settingsContainer: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    marginBottom: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 