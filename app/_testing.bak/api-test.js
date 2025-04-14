import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import apiClient from '../../services/api';

const endpoints = [
  { name: 'Restaurant Info', path: '/restaurant-info', method: 'GET' },
  { name: 'Menu Items', path: '/menu-items', method: 'GET' },
  { name: 'Categories', path: '/categories', method: 'GET' },
  { name: 'Orders', path: '/orders', method: 'GET' },
  { name: 'Settings', path: '/locale-settings', method: 'GET' },
];

export default function ApiTestScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});

  const testEndpoint = async (endpoint) => {
    setLoading(prev => ({ ...prev, [endpoint.name]: true }));
    
    try {
      console.log(`Testing endpoint: ${endpoint.path}`);
      const startTime = Date.now();
      
      const response = await apiClient[endpoint.method.toLowerCase()](endpoint.path);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setTestResults(prev => ({
        ...prev,
        [endpoint.name]: {
          success: true,
          status: response.status,
          data: response.data,
          duration,
        }
      }));
    } catch (error) {
      console.error(`Error testing ${endpoint.path}:`, error);
      
      setTestResults(prev => ({
        ...prev,
        [endpoint.name]: {
          success: false,
          error: error.message,
          status: error.response?.status || 'Unknown',
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [endpoint.name]: false }));
    }
  };

  const testAllEndpoints = async () => {
    for (const endpoint of endpoints) {
      await testEndpoint(endpoint);
    }
  };

  // Get status indicator color
  const getStatusColor = (result) => {
    if (!result) return colors.icon;
    if (result.success) return '#4CAF50';
    return '#F44336';
  };

  // Format result for display
  const formatResult = (result) => {
    if (!result) return 'Not tested';
    if (result.success) {
      return `Success (${result.status}) - ${result.duration}ms`;
    }
    return `Failed (${result.status}) - ${result.error}`;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>API Testing Tool</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Test API endpoints and view responses
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.testAllButton, { backgroundColor: colors.primary }]}
        onPress={testAllEndpoints}
      >
        <Text style={styles.testAllButtonText}>Test All Endpoints</Text>
      </TouchableOpacity>

      {endpoints.map((endpoint, index) => (
        <View 
          key={index}
          style={[styles.endpointCard, { backgroundColor: colors.card }]}
        >
          <View style={styles.endpointHeader}>
            <View>
              <Text style={[styles.endpointName, { color: colors.text }]}>{endpoint.name}</Text>
              <Text style={[styles.endpointPath, { color: colors.icon }]}>
                {endpoint.method} {endpoint.path}
              </Text>
            </View>
            
            <View 
              style={[
                styles.statusIndicator, 
                { backgroundColor: getStatusColor(testResults[endpoint.name]) }
              ]}
            />
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.resultContainer}>
            <Text style={[styles.resultLabel, { color: colors.text }]}>Result:</Text>
            {loading[endpoint.name] ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.resultText, { color: colors.text }]}>
                {formatResult(testResults[endpoint.name])}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={() => testEndpoint(endpoint)}
            disabled={loading[endpoint.name]}
          >
            <Text style={styles.testButtonText}>
              {loading[endpoint.name] ? 'Testing...' : 'Test Endpoint'}
            </Text>
          </TouchableOpacity>
          
          {testResults[endpoint.name]?.success && (
            <TouchableOpacity
              style={styles.viewDataButton}
              onPress={() => {
                Alert.alert(
                  `${endpoint.name} Data`,
                  JSON.stringify(testResults[endpoint.name].data, null, 2).substring(0, 1000) + 
                    (JSON.stringify(testResults[endpoint.name].data, null, 2).length > 1000 ? '...' : '')
                );
              }}
            >
              <Text style={[styles.viewDataText, { color: colors.primary }]}>View Response Data</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  testAllButton: {
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  testAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  endpointCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  endpointHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endpointName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  endpointPath: {
    fontSize: 14,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  resultContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  resultText: {
    flex: 1,
  },
  testButton: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  viewDataButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewDataText: {
    fontWeight: '600',
  },
}); 