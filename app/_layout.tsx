import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import 'react-native-reanimated';
import { ThemeProvider, useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { TouchableOpacity, Text, View, Image, Alert } from 'react-native';
import { useAuth, AuthProvider } from '../context/AuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import CustomDrawer from '../components/CustomDrawer';
import ErrorBoundary, { ErrorBoundaryWithAuth } from '../components/ErrorBoundary';
import * as Notifications from 'expo-notifications';
import { NotificationsProvider } from '../context/NotificationsContext';
import notificationService from '../services/notificationService';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Configure Expo Router
export const unstable_settings = {
  initialRouteName: 'login',
};

// Custom drawer theme with orange accent
const customDrawerTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const customDarkDrawerTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

// Configure notifications
notificationService.configureNotifications();

// Root layout with ThemeProvider
export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? customDarkDrawerTheme : customDrawerTheme;
  const [ready, setReady] = useState(false);
  
  // Load our fonts and other assets
  const [fontsLoaded] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    // Prepare app and hide splash screen
    async function prepare() {
      try {
        // Wait for fonts to load
        await SplashScreen.preventAutoHideAsync();
        // Allow a small delay to ensure drawer setup completes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.warn('Error in app preparation:', e);
      } finally {
        // Only set ready after fonts are loaded
        if (fontsLoaded) {
          // Hide splash screen
          await SplashScreen.hideAsync();
          setReady(true);
        }
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!ready || !fontsLoaded) {
    // Return a minimal Slot to ensure the layout is mounted
    return (
      <ThemeProvider>
        <NavigationThemeProvider value={theme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}></View>
        </NavigationThemeProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <NavigationThemeProvider value={theme}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <ErrorBoundary colorScheme={colorScheme}>
          <LanguageProvider>
            <AuthProvider>
              <NotificationsProvider>
                {/* 
                  Use the regular ErrorBoundary outside the AuthProvider
                  and the AuthAware version inside for proper
                  token expiration handling
                */}
                <ErrorBoundaryWithAuth colorScheme={colorScheme}>
                  <RootLayoutNavigation />
                </ErrorBoundaryWithAuth>
              </NotificationsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </NavigationThemeProvider>
    </ThemeProvider>
  );
}

// Separate component for navigation to access auth context
function RootLayoutNavigation() {
  const { colorScheme } = useColorScheme();
  const { isRTL, t } = useLanguage();
  // Add notification response handler
  const responseListener = useRef();
  
  // Set up notification response listener
  useEffect(() => {
    // Handle notification responses when user taps a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      notificationService.handleNotificationResponse(response);
    });
    
    // Check for initial notification that might have opened the app
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        notificationService.handleNotificationResponse(response);
      }
    });
    
    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <Drawer 
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: Colors[colorScheme ?? 'light'].primary,
        drawerInactiveTintColor: Colors[colorScheme ?? 'light'].icon,
        drawerLabelStyle: {
          marginLeft: isRTL ? 0 : 15,
          marginRight: isRTL ? 15 : 0,
          fontSize: 16,
        },
        drawerItemStyle: {
          marginVertical: 5,
          borderRadius: 10,
          paddingVertical: 5,
        },
        headerTitleAlign: 'center',
        drawerPosition: isRTL ? 'right' : 'left',
      }}
      drawerContent={(props) => <CustomDrawer {...props} />}
    >
      {/* Hidden screens */}
      <Drawer.Screen
        name="login"
        options={{
          drawerLabel: () => null,
          title: t('login', 'title'),
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      
      {/* Hidden Dashboard screen */}
      <Drawer.Screen
        name="Dashboard"
        options={{
          drawerLabel: () => null,
          title: t('dashboard', 'title'),
          drawerItemStyle: { display: 'none' },
        }}
      />
      
      {/* Visible Navigation Items - Specific Order */}
      <Drawer.Screen
        name="RestaurantScreen"
        options={{
          drawerLabel: t('drawer', 'restaurant'),
          title: t('drawer', 'restaurant'),
          drawerIcon: ({ color }) => <Ionicons name="restaurant-outline" size={24} color={color} />,
        }}
      />

      <Drawer.Screen
        name="OrdersScreen"
        options={{
          drawerLabel: t('drawer', 'orders'),
          title: t('drawer', 'orders'),
          drawerIcon: ({ color }) => <FontAwesome5 name="shopping-bag" size={22} color={color} />,
        }}
      />

      <Drawer.Screen
        name="MenuItemsScreen"
        options={{
          drawerLabel: t('drawer', 'menuItems'),
          title: t('drawer', 'menuItems'),
          drawerIcon: ({ color }) => <MaterialIcons name="restaurant-menu" size={24} color={color} />,
        }}
      />
      
      <Drawer.Screen
        name="CategoriesScreen"
        options={{
          drawerLabel: t('drawer', 'categories'),
          title: t('drawer', 'categories'),
          drawerIcon: ({ color }) => <MaterialIcons name="category" size={24} color={color} />,
        }}
      />

      <Drawer.Screen
        name="SettingsScreen"
        options={{
          drawerLabel: t('drawer', 'settings'),
          title: t('drawer', 'settings'),
          drawerIcon: ({ color }) => <Ionicons name="settings-outline" size={24} color={color} />,
        }}
      />

      <Drawer.Screen
        name="QRCodeScreen"
        options={{
          drawerLabel: t('drawer', 'qrCode'),
          title: t('drawer', 'qrCode'),
          drawerIcon: ({ color }) => <MaterialIcons name="qr-code" size={24} color={color} />,
        }}
      />
      
      {/* Hide unwanted screens using options */}
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: () => null,
          title: null,
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      
      <Drawer.Screen
        name="+not-found"
        options={{
          drawerLabel: () => null,
          title: t('common', 'pageNotFound'),
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
