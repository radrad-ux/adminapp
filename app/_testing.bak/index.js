import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const testRoutes = [
  {
    name: 'API Tests',
    description: 'Test API endpoints and view responses',
    icon: 'server-outline',
    route: '/api-test',
  },
  {
    name: 'UI Components',
    description: 'View and test UI components in isolation',
    icon: 'grid-outline',
    route: '/ui-test',
  },
  {
    name: 'Data Validation',
    description: 'Test data validation and transformations',
    icon: 'checkmark-done-outline',
    route: '/data-test',
  },
];

export default function TestingDashboard() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const navigateToTest = (route) => {
    router.push(route);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Testing Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Select a testing tool to begin
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        {testRoutes.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => navigateToTest(item.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name={item.icon} size={30} color="white" />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.cardDescription, { color: colors.icon }]}>
                {item.description}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={colors.icon} 
              style={styles.arrowIcon} 
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>Testing Area</Text>
        <Text style={[styles.infoText, { color: colors.icon }]}>
          This section contains utilities for testing various aspects of the application.
          Use these tools during development to identify and fix issues.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  cardsContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
  },
  arrowIcon: {
    marginLeft: 8,
  },
  infoSection: {
    padding: 20,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
}); 