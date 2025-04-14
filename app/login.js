import React from 'react';
import { View, StyleSheet } from 'react-native';
import LoginTest from '../components/LoginTest';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams } from 'expo-router';

/**
 * Login Screen
 * Main authentication screen for the app
 */
export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const params = useLocalSearchParams();
  
  // Check for the reset parameter which forces a fresh render when coming from logout
  const refresh = params.reset ? `${params.reset}` : null;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LoginTest forceRefresh={refresh} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 