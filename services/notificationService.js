import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// Cache keys
const NOTIFICATION_KEYS = {
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  ORDER_NOTIFICATIONS_ENABLED: 'order_notifications_enabled',
  LAST_NOTIFICATION_TIME: 'last_notification_time',
};

/**
 * Handles a new order notification - triggers local notification
 * @param {Object} order The order data object
 */
export const handleNewOrderNotification = async (order) => {
  try {
    console.log('handleNewOrderNotification called for order:', order?.id || order?._id);
    
    // Check if notifications are enabled
    const notificationsEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.NOTIFICATIONS_ENABLED);
    const orderNotificationsEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.ORDER_NOTIFICATIONS_ENABLED);
    
    console.log('Notification settings:', { notificationsEnabled, orderNotificationsEnabled });
    
    // If settings are null (not set yet), default to true
    // Only if explicitly set to 'false' should we disable notifications
    if (notificationsEnabled === 'false' || orderNotificationsEnabled === 'false') {
      console.log('Notifications disabled, skipping new order notification');
      return;
    }
    
    // Extract order details
    const orderId = order._id || order.id || 'Unknown';
    const displayId = orderId.length > 6 ? orderId.slice(-6) : orderId;
    const customerName = order.customer?.name || order.customerName || 'Customer';
    const total = order.total || 0;
    const items = order.items || [];
    const itemCount = items.length;
    
    // Construct the notification content
    const title = `New Order #${displayId}!`;
    const body = `${customerName} placed an order with ${itemCount} item${itemCount !== 1 ? 's' : ''}`;
    
    console.log('Scheduling notification with content:', { title, body });
    
    // Schedule the notification - using a simple trigger to ensure it shows
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { orderId, type: 'new_order', url: '/OrdersScreen' },
      },
      trigger: { seconds: 1 }, // Small delay to ensure it processes correctly
    });
    
    // Update the last notification time
    await AsyncStorage.setItem(NOTIFICATION_KEYS.LAST_NOTIFICATION_TIME, Date.now().toString());
    
    console.log(`✅ Notification scheduled for order #${displayId}`);
  } catch (error) {
    console.error('Error sending new order notification:', error);
  }
};

/**
 * Register notification categories
 * (iOS only, provides actions for notifications)
 */
export const registerNotificationCategories = async () => {
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('new_order', [
      {
        identifier: 'view_order',
        buttonTitle: 'View Order',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'prepare_order',
        buttonTitle: 'Start Preparing',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
    ]);
  }
};

/**
 * Handle notification response
 * Called when a user taps on a notification
 */
export const handleNotificationResponse = (response) => {
  const data = response?.notification?.request?.content?.data;
  
  if (!data) return;
  
  // Handle deep linking based on notification type
  if (data.type === 'new_order' && data.orderId) {
    // Navigate to the orders screen
    router.navigate('/OrdersScreen');
  } else if (data.url) {
    // General purpose deep linking via URL
    router.navigate(data.url);
  }
  
  // Handle notification action if any
  const actionId = response?.actionIdentifier;
  if (actionId === 'view_order' && data.orderId) {
    router.navigate('/OrdersScreen');
  } else if (actionId === 'prepare_order' && data.orderId) {
    // Could trigger API call to change status
    // For now, just navigate
    router.navigate('/OrdersScreen');
  }
};

/**
 * Configure the notification handler for the app
 */
export const configureNotifications = () => {
  // Set up the notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Register the notification categories
  registerNotificationCategories();
};

/**
 * Toggle notifications on/off
 */
export const toggleNotifications = async (enabled) => {
  await AsyncStorage.setItem(NOTIFICATION_KEYS.NOTIFICATIONS_ENABLED, enabled.toString());
};

/**
 * Toggle order notifications specifically
 */
export const toggleOrderNotifications = async (enabled) => {
  await AsyncStorage.setItem(NOTIFICATION_KEYS.ORDER_NOTIFICATIONS_ENABLED, enabled.toString());
};

/**
 * Get the current notification settings
 */
export const getNotificationSettings = async () => {
  const notificationsEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.NOTIFICATIONS_ENABLED);
  const orderNotificationsEnabled = await AsyncStorage.getItem(NOTIFICATION_KEYS.ORDER_NOTIFICATIONS_ENABLED);
  
  return {
    notificationsEnabled: notificationsEnabled === null ? true : notificationsEnabled === 'true',
    orderNotificationsEnabled: orderNotificationsEnabled === null ? true : orderNotificationsEnabled === 'true',
  };
};

// Export a test function to send a test notification
export const sendTestNotification = async (message = 'Test Notification') => {
  try {
    console.log('Sending test notification...');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: message,
        body: 'This confirms notifications are working',
        data: { url: '/OrdersScreen', test: true },
      },
      trigger: null, // Show immediately
    });
    
    console.log('Test notification sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return false;
  }
};

export default {
  handleNewOrderNotification,
  configureNotifications,
  handleNotificationResponse,
  toggleNotifications,
  toggleOrderNotifications,
  getNotificationSettings,
  sendTestNotification,
}; 