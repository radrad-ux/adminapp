import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator } from 'react-native';
import { testApiConnection } from '../services/restaurantService';
import apiClient from '../services/api';
import * as SecureStore from 'expo-secure-store';

const ConnectionTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Define API tests
  const apiTests = [
    { name: 'API Connection', fn: testApiConnection },
    { 
      name: 'Authentication Status', 
      fn: async () => {
        const token = await SecureStore.getItemAsync('auth_token');
        return { success: !!token, message: token ? 'Token found' : 'No token found' };
      } 
    },
    { 
      name: 'Env Check', 
      fn: async () => {
        try {
          const response = await apiClient.get('/env-check');
          return { 
            success: true, 
            message: `Connected to: ${apiClient.defaults.baseURL}`,
            data: response.data
          };
        } catch (error) {
          return { 
            success: false, 
            message: error.message || 'Failed to connect to environment check' 
          };
        }
      } 
    },
    { 
      name: 'Restaurant Info', 
      fn: async () => {
        try {
          const response = await apiClient.get('/restaurant-info');
          return { 
            success: true, 
            message: 'Restaurant data retrieved',
            data: response.data
          };
        } catch (error) {
          return { 
            success: false, 
            message: error.message || 'Failed to fetch restaurant info' 
          };
        }
      } 
    },
    { 
      name: 'Menu Items', 
      fn: async () => {
        try {
          const response = await apiClient.get('/menu-items');
          return { 
            success: true, 
            message: `Retrieved ${response.data.length || 0} menu items`,
            data: response.data
          };
        } catch (error) {
          return { 
            success: false, 
            message: error.message || 'Failed to fetch menu items' 
          };
        }
      } 
    }
  ];

  const runTest = async (test) => {
    setLoading(true);
    try {
      const startTime = Date.now();
      const result = await test.fn();
      const endTime = Date.now();
      
      const testResult = {
        name: test.name,
        success: result === true || result?.success === true,
        message: typeof result === 'object' ? result.message : (result ? 'Success' : 'Failed'),
        data: result?.data,
        time: `${endTime - startTime}ms`
      };
      
      setTestResults(prev => [testResult, ...prev]);
    } catch (error) {
      setTestResults(prev => [{
        name: test.name,
        success: false,
        message: error.message,
        time: 'N/A'
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    setLoading(true);
    
    for (const test of apiTests) {
      await runTest(test);
    }
    
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Connection Test</Text>
      <Text style={styles.subtitle}>Testing connectivity to: {apiClient.defaults.baseURL}</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Run All Tests"
          onPress={runAllTests}
          disabled={loading}
          color="#0066CC"
        />
        <Button
          title="Clear Results"
          onPress={() => setTestResults([])}
          disabled={loading}
          color="#666"
        />
      </View>
      
      <View style={styles.testsContainer}>
        <Text style={styles.sectionTitle}>Available Tests:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testsList}>
          {apiTests.map((test, index) => (
            <Button
              key={index}
              title={test.name}
              onPress={() => runTest(test)}
              disabled={loading}
              color="#0066CC"
            />
          ))}
        </ScrollView>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Running tests...</Text>
        </View>
      )}
      
      <Text style={styles.resultsTitle}>
        Test Results ({testResults.length}):
      </Text>
      
      <ScrollView style={styles.resultsContainer}>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet. Run a test to see results here.</Text>
        ) : (
          testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultItem,
                { 
                  backgroundColor: result.success ? '#E8F5E9' : '#FFEBEE',
                  borderLeftColor: result.success ? '#4CAF50' : '#F44336'
                }
              ]}
            >
              <View style={styles.resultHeader}>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={styles.resultTime}>{result.time}</Text>
              </View>
              <Text style={styles.resultStatus}>
                Status: <Text style={{ color: result.success ? '#4CAF50' : '#F44336' }}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </Text>
              </Text>
              {result.message && (
                <Text style={styles.resultMessage}>{result.message}</Text>
              )}
              {result.data && (
                <Text style={styles.resultData}>
                  Data: {JSON.stringify(result.data).substring(0, 100)}
                  {JSON.stringify(result.data).length > 100 ? '...' : ''}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  testsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  testsList: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  testButton: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultsContainer: {
    flex: 1,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    fontStyle: 'italic',
  },
  resultItem: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  resultTime: {
    color: '#666',
    fontSize: 12,
  },
  resultStatus: {
    marginBottom: 4,
  },
  resultMessage: {
    color: '#333',
    marginBottom: 4,
  },
  resultData: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 4,
    borderRadius: 2,
  },
});

export default ConnectionTest; 