import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Create the context
const NotificationsContext = createContext({});

// Provide a hook to use the context
export const useNotifications = () => useContext(NotificationsContext);

// Provider component
export const NotificationsProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { authState } = useAuth();
  
  // Initialize notification settings on mount
  useEffect(() => {
    const initSettings = async () => {
      try {
        // Default to true if setting doesn't exist yet
        const enabled = await AsyncStorage.getItem('notificationsEnabled');
        setNotificationsEnabled(enabled === null ? true : enabled === 'true');
        
        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
        
        // Request permissions
        const { status } = await Notifications.getPermissionsAsync();
        console.log('Notification permission status:', status);
        setPermissionStatus(status);
        
        if (status !== 'granted') {
          console.log('Requesting notification permissions...');
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          console.log('New permission status:', newStatus);
          setPermissionStatus(newStatus);
        }
      } catch (error) {
        console.error('Error initializing notification settings:', error);
      }
    };
    
    initSettings();
  }, []);
  
  // Register for push notifications when component mounts
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      console.log('Push token registered:', token);
      setExpoPushToken(token);
      // Save token to AsyncStorage
      if (token) {
        AsyncStorage.setItem('pushToken', token);
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    });

    // Listen for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification response (e.g., navigate to specific screen)
    });

    // Clean up when component unmounts
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Update token when auth state changes (login/logout)
  useEffect(() => {
    if (authState?.authenticated) {
      registerForPushNotificationsAsync().then(token => {
        setExpoPushToken(token);
        if (token) {
          AsyncStorage.setItem('pushToken', token);
        }
      });
    }
  }, [authState?.authenticated]);

  // Toggle notifications preference
  const toggleNotifications = async (enabled) => {
    console.log('Toggling notifications:', enabled);
    setNotificationsEnabled(enabled);
    await AsyncStorage.setItem('notificationsEnabled', enabled.toString());
    
    if (enabled && permissionStatus !== 'granted') {
      console.log('Requesting notification permissions again...');
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
        Alert.alert(
          'Notifications Permission Required',
          'Please enable notifications in your device settings to receive order notifications.',
          [{ text: 'OK' }]
        );
      }
    }
  };
  
  // Schedule a local notification for testing
  const scheduleLocalNotification = async (title, body, data = {}) => {
    if (!notificationsEnabled) return;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: { seconds: 1 },
    });
  };
  
  // Get the last notification response (for deep linking)
  const getLastNotificationResponse = async () => {
    return await Notifications.getLastNotificationResponseAsync();
  };
  
  // Clear all notifications
  const dismissAllNotifications = async () => {
    await Notifications.dismissAllNotificationsAsync();
  };

  // The value to be provided to consumers
  const contextValue = {
    expoPushToken,
    notification,
    notificationsEnabled,
    toggleNotifications,
    scheduleLocalNotification,
    getLastNotificationResponse,
    dismissAllNotifications,
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

// Helper function to register for push notifications
async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    // Android permissions setup
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    
    // Create a second channel for new orders
    await Notifications.setNotificationChannelAsync('new-orders', {
      name: 'New Orders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default', // Can be replaced with a custom sound
      lightColor: '#FF9800', // Orange light for new orders
    });
  }
  
  // Check if device is supported
  if (!Device.isDevice) {
    console.log('Push notifications not available on simulator/emulator');
    return null;
  }
  
  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Permission for notifications not granted');
    return null;
  }
  
  // Get the token - simplified for Expo Go compatibility
  try {
    // For Expo Go development, we'll just use a placeholder token
    // This allows our code to run without errors in Expo Go
    // Note: Push notifications won't actually work in Expo Go
    console.log('Running in development - using local notifications only');
    return 'local-notification-token';
  } catch (error) {
    console.error('Error getting notification token:', error);
  }
  
  return token;
}

export default NotificationsContext; 