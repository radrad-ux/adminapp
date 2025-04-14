/* This file is disabled to prevent multiple drawer navigators
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import CustomDrawer from '@/components/CustomDrawer';
import { Stack } from 'expo-router';

// Import screens directly
import Dashboard from './index';
import RestaurantScreen from './restaurant';
import MenuScreen from './menu';
import OrdersScreen from './orders';
import QRScreen from './qr';
import SettingsScreen from './settings';

// Create drawer navigator
const Drawer = createDrawerNavigator();

export default function DashboardLayout() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          drawerActiveBackgroundColor: `${colors.primary}20`,
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.text,
          drawerLabelStyle: {
            marginLeft: -20,
            fontSize: 15,
          },
          // Add hamburger menu icon
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 16 }}
              onPress={() => navigation.openDrawer()}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}>
        <Drawer.Screen
          name="home"
          component={Dashboard}
          options={{
            title: 'Dashboard',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="restaurant-info"
          component={RestaurantScreen}
          options={{
            title: 'Restaurant',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="restaurant" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="menu-management"
          component={MenuScreen}
          options={{
            title: 'Menu',
            drawerIcon: ({ color, size }) => (
              <MaterialIcons name="menu-book" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="orders-management"
          component={OrdersScreen}
          options={{
            title: 'Orders',
            drawerIcon: ({ color, size }) => (
              <FontAwesome5 name="shopping-cart" size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="qr-generator"
          component={QRScreen}
          options={{
            title: 'QR Code',
            drawerIcon: ({ color, size }) => (
              <MaterialIcons name="qr-code" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="app-settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </>
  );
} 
*/

import { Stack } from 'expo-router';

export default function DisabledLayout() {
  return <Stack />;
} 