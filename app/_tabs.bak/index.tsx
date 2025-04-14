import { Image, StyleSheet, Platform, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Restaurant Dashboard</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Restaurant Management</ThemedText>
        <ThemedText>
          Welcome to the restaurant management mobile dashboard. You can manage your restaurant data, menu items, and orders from here.
        </ThemedText>
        
        <View style={styles.cardContainer}>
          <Link href="/login-test" asChild>
            <TouchableOpacity style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Login</ThemedText>
              <ThemedText>Test authentication connection</ThemedText>
            </TouchableOpacity>
          </Link>
          
          <Link href="/connection-test" asChild>
            <TouchableOpacity style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>API Connection</ThemedText>
              <ThemedText>Test API endpoints connectivity</ThemedText>
            </TouchableOpacity>
          </Link>
          
          <Link href="/auth-test" asChild>
            <TouchableOpacity style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.cardTitle}>Auth Test</ThemedText>
              <ThemedText>Test authentication with restaurant data</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Getting Started</ThemedText>
        <ThemedText>
          First, log in using your restaurant credentials. After logging in, you'll be able to access your restaurant data, menu, and orders.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  cardContainer: {
    marginTop: 16,
    gap: 8,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  cardTitle: {
    marginBottom: 4,
  },
});
