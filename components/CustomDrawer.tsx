import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import TranslatedText from './TranslatedText';

// Translations for drawer menu items
const drawerTranslations = {
  RestaurantScreen: 'restaurant',
  OrdersScreen: 'orders',
  MenuItemsScreen: 'menuItems',
  CategoriesScreen: 'categories',
  SettingsScreen: 'settings',
  QRCodeScreen: 'qrCode'
};

// Define allowed screens for drawer menu
const ALLOWED_SCREENS = [
  'RestaurantScreen',
  'OrdersScreen',
  'MenuItemsScreen',
  'CategoriesScreen',
  'SettingsScreen',
  'QRCodeScreen'
];

export default function CustomDrawer(props: any) {
  const { colorScheme, toggleTheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { user, logout } = useAuth();
  const { t, isRTL } = useLanguage();

  // Add translations for drawer items
  const getDrawerLabel = (routeName: string): string => {
    switch (routeName) {
      case 'RestaurantScreen':
        return t('drawer', 'restaurant');
      case 'OrdersScreen':
        return t('drawer', 'orders');
      case 'MenuItemsScreen':
        return t('drawer', 'menuItems');
      case 'CategoriesScreen':
        return t('drawer', 'categories');
      case 'SettingsScreen':
        return t('drawer', 'settings');
      case 'QRCodeScreen':
        return t('drawer', 'qrCode');
      default:
        return routeName;
    }
  };

  const handleLogout = async () => {
    try {
      if (props.navigation?.closeDrawer) {
        props.navigation.closeDrawer();
      }
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Filter out unwanted screens from the drawer
  const allowedRoutes = React.useMemo(() => {
    if (!props.state?.routes) return [];
    
    return props.state.routes.filter(route => 
      ALLOWED_SCREENS.includes(route.name)
    );
  }, [props.state?.routes]);

  // Get the currently active route name
  const activeRouteName = props.state?.routes[props.state.index]?.name;

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        direction: isRTL ? 'rtl' : 'ltr' 
      }
    ]}>
      {/* Header with user profile */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={[
          styles.userInfo,
          { flexDirection: isRTL ? 'row-reverse' : 'row' }
        ]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'R'}
            </Text>
          </View>
          <View style={[
            styles.userDetails,
            { alignItems: isRTL ? 'flex-end' : 'flex-start' }
          ]}>
            <Text style={styles.userName}>{user?.name || t('drawer', 'adminTitle')}</Text>
            <Text style={styles.userEmail}>{user?.email || 'admin@restaurant.com'}</Text>
          </View>
        </View>
      </View>

      {/* Drawer items */}
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.drawerContent}
      >
        <View style={styles.menuContainer}>
          {/* Render only allowed drawer items */}
          {allowedRoutes.map((route) => {
            const focused = route.name === activeRouteName;
            const { title, drawerLabel, drawerIcon } = props.descriptors[route.key].options;
            
            // Get translated label
            const translatedLabel = getDrawerLabel(route.name);
            
            return (
              <DrawerItem
                key={route.key}
                label={({ focused, color }) => (
                  <Text style={{ 
                    color: focused ? colors.primary : colors.icon,
                    textAlign: isRTL ? 'right' : 'left',
                    width: '100%'
                  }}>
                    {translatedLabel}
                  </Text>
                )}
                icon={
                  drawerIcon
                    ? ({ color, size }) => drawerIcon({ 
                        focused, 
                        color: focused ? colors.primary : colors.icon, 
                        size 
                      })
                    : null
                }
                focused={focused}
                activeTintColor={colors.primary}
                inactiveTintColor={colors.icon}
                activeBackgroundColor={`${colors.primary}15`}
                onPress={() => props.navigation.navigate(route.name)}
                style={[
                  props.descriptors[route.key].options.drawerItemStyle,
                  isRTL && { paddingRight: 0, paddingLeft: 16 }
                ]}
              />
            );
          })}
        </View>

        <View style={[styles.separator, { backgroundColor: colors.border }]} />

        {/* Theme toggle */}
        <View style={styles.themeContainer}>
          <View style={[
            styles.themeOption,
            { flexDirection: isRTL ? 'row-reverse' : 'row' }
          ]}>
            <Ionicons 
              name={isDark ? "moon" : "sunny"} 
              size={22} 
              color={colors.primary} 
              style={[
                styles.themeIcon,
                isRTL ? { marginLeft: 10 } : { marginRight: 10 }
              ]} 
            />
            <Text style={[
              styles.themeText, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>
              {isDark ? t('drawer', 'darkMode') : t('drawer', 'lightMode')}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? colors.primary : '#f4f3f4'}
            trackColor={{ false: '#E0E0E0', true: `${colors.primary}80` }}
          />
        </View>
      </DrawerContentScrollView>

      {/* Footer with logout */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.logoutButton,
            { flexDirection: isRTL ? 'row-reverse' : 'row' }
          ]} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="log-out-outline" 
            size={24} 
            color={colors.primary}
            style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
          />
          <TranslatedText 
            section="drawer" 
            textKey="logout" 
            style={[styles.logoutText, { color: colors.text }]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    marginLeft: 10,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  drawerContent: {
    paddingTop: 10,
  },
  menuContainer: {
    paddingHorizontal: 10,
  },
  separator: {
    height: 1,
    marginVertical: 15,
    marginHorizontal: 20,
  },
  themeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIcon: {
    marginRight: 10,
  },
  themeText: {
    fontSize: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 8,
  },
}); 