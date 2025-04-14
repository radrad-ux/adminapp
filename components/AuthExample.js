import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import useRestaurantInfo from '../hooks/useRestaurantInfo';

const AuthExample = () => {
  // Default credentials (for demo purposes)
  const [email, setEmail] = useState('demo@restaurant.com');
  const [password, setPassword] = useState('password123');
  
  // Auth context and restaurant data
  const { isLoggedIn, user, loading: authLoading, error: authError, login, logout } = useAuth();
  const { restaurantData, menuData, loading: resLoading, error: resError, refetch } = useRestaurantInfo();

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRefreshData = () => {
    refetch();
  };

  // Render different content based on authentication state
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Restaurant Management System</Text>

      {authLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Processing authentication...</Text>
        </View>
      ) : isLoggedIn ? (
        // Logged In View
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Authentication Status</Text>
            <Text style={styles.text}>Status: <Text style={styles.highlight}>Logged In</Text></Text>
            <Text style={styles.text}>User: {user?.email || 'Unknown'}</Text>
            <Text style={styles.text}>Name: {user?.name || 'Not provided'}</Text>
            <Text style={styles.text}>Role: {user?.role || 'Not specified'}</Text>
            
            <Button 
              title="Logout" 
              onPress={handleLogout} 
              color="#d9534f"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Restaurant Information</Text>
            {resLoading ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : resError ? (
              <View>
                <Text style={styles.errorText}>Error: {resError}</Text>
                <Button 
                  title="Retry" 
                  onPress={handleRefreshData} 
                  color="#5bc0de"
                />
              </View>
            ) : restaurantData ? (
              <View>
                <Text style={styles.text}>Name: {restaurantData.name || 'N/A'}</Text>
                <Text style={styles.text}>Address: {restaurantData.address || 'N/A'}</Text>
                <Text style={styles.text}>Phone: {restaurantData.phone || 'N/A'}</Text>
                <Text style={styles.text}>Cuisine: {restaurantData.cuisine || 'N/A'}</Text>
                <Text style={styles.text}>Rating: {restaurantData.rating || 'N/A'}</Text>
                
                <Button 
                  title="Refresh Data" 
                  onPress={handleRefreshData} 
                  color="#5bc0de"
                />
              </View>
            ) : (
              <Text style={styles.text}>No restaurant data available</Text>
            )}
          </View>

          {/* Menu Items Section */}
          {menuData && menuData.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Menu Items</Text>
              {menuData.map(item => (
                <View key={item.id} style={styles.menuItem}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                  <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        // Login View
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Login</Text>
          {authError && <Text style={styles.errorText}>Error: {authError}</Text>}
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button 
            title="Login" 
            onPress={handleLogin} 
            color="#5cb85c"
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#5cb85c',
  },
  errorText: {
    color: '#d9534f',
    marginBottom: 10,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  menuItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4,
  },
  menuPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#5cb85c',
  },
});

export default AuthExample; 