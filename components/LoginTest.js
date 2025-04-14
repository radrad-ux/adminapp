import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  Platform, 
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard
} from 'react-native';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

const API_URL = 'https://dmenu-five.vercel.app/api';
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

const LoginTest = ({ forceRefresh }) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { loginWithToken, isLoggedIn, resetAuth } = useAuth();
  
  const [email, setEmail] = useState('demo@restaurant.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false
  });
  
  // Validation state
  const [validation, setValidation] = useState({
    emailValid: true,
    passwordValid: true
  });

  // Reset UI state when forceRefresh changes (after logout)
  useEffect(() => {
    if (forceRefresh) {
      console.log('Login screen forced refresh after logout', forceRefresh);
      // Clear state immediately
      setToken(null);
      setResult(null);
      setLoading(false);
      setError(null);
      
      // Only call resetAuth once, with a slight delay
      const timer = setTimeout(() => {
        resetAuth();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [forceRefresh, resetAuth]);

  // Handle field touch
  const handleFieldTouch = (field) => {
    setTouched({...touched, [field]: true});
    validateField(field);
  };

  // Validate specific field
  const validateField = (field) => {
    if (field === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      setValidation({...validation, emailValid: email.trim() !== '' && emailRegex.test(email)});
    } else if (field === 'password') {
      setValidation({...validation, passwordValid: password.length >= 6});
    }
  };

  // Form validation
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = email.trim() !== '' && emailRegex.test(email);
    const isPasswordValid = password.length >= 6;
    
    setValidation({
      emailValid: isEmailValid,
      passwordValid: isPasswordValid
    });
    
    return isEmailValid && isPasswordValid;
  };
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      // No API resets here - prevent fetching until navigation completes
      console.log('Already logged in, redirecting to dashboard without API reset');
      router.replace('/');
    }
  }, [isLoggedIn, router]);
  
  // Check if we already have a token
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Don't auto-login right after logout (when forceRefresh is set)
        if (forceRefresh) {
          return;
        }
        
        const savedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        if (savedToken) {
          setToken(savedToken);
          const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
          if (userData) {
            setResult(JSON.parse(userData));
            // Trigger auth context login
            if (loginWithToken) {
              await loginWithToken(savedToken, userData);
              // Router replace will happen automatically via isLoggedIn effect
            }
          }
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    };
    
    checkToken();
  }, [router, loginWithToken, forceRefresh]);

  const handleDirectLogin = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Validate form
    if (!validateForm()) {
      setError('Please correct the errors in the form before logging in.');
      setTouched({email: true, password: true});
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      // Create one-time axios instance for this request
      const response = await axios.post(
        `${API_URL}/custom-auth`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-App-Platform': Platform.OS || 'unknown'
          },
          withCredentials: true,
        }
      );
      
      // Extract token from response if available
      const receivedToken = response.data.token;
      
      if (!receivedToken) {
        setError('No authentication token received from server. Please try again.');
        return;
      }
      
      // Store the valid token
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, receivedToken);
      setToken(receivedToken);
      
      // Save user data
      if (response.data.user) {
        await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(response.data.user));
        setResult(response.data.user);
        
        // Trigger auth context login
        if (loginWithToken) {
          try {
            await loginWithToken(receivedToken, response.data.user);
            // Router replace will happen automatically via isLoggedIn effect
          } catch (loginError) {
            console.error('Error in loginWithToken:', loginError);
            // If the loginWithToken fails, try direct navigation
            if (isLoggedIn) {
              router.replace('/');
            }
          }
        }
      } else {
        setError('No user data in response');
      }
    } catch (error) {
      if (error.response) {
        setError(`Authentication failed: ${error.response.data?.message || 'Invalid credentials'}`);
      } else if (error.request) {
        setError('Network error: Unable to connect to server');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Clear stored data
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      
      // Clear state
      setToken(null);
      setResult(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError(`Logout error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Ionicons name="restaurant" size={48} color="white" />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Restaurant Admin</Text>
          <Text style={[styles.subtitle, { color: colors.subtitle }]}>Manage your restaurant efficiently</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.text, marginTop: 10 }}>Processing request...</Text>
          </View>
        ) : token && !isLoggedIn ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.text, marginTop: 10 }}>Redirecting to dashboard...</Text>
          </View>
        ) : !isLoggedIn ? (
          <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="alert-circle" size={24} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: touched.email && !validation.emailValid ? colors.error : colors.border,
                  backgroundColor: colors.backgroundVariant
                }
              ]}>
                <Ionicons name="mail-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.placeholderText}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (touched.email) validateField('email');
                  }}
                  onBlur={() => handleFieldTouch('email')}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                />
                {touched.email && !validation.emailValid && (
                  <Ionicons name="alert-circle" size={20} color={colors.error} style={styles.validationIcon} />
                )}
              </View>
              {touched.email && !validation.emailValid && (
                <Text style={[styles.validationMessage, { color: colors.error }]}>
                  Please enter a valid email address
                </Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
              <View style={[
                styles.inputContainer, 
                { 
                  borderColor: touched.password && !validation.passwordValid ? colors.error : colors.border,
                  backgroundColor: colors.backgroundVariant
                }
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.placeholderText}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (touched.password) validateField('password');
                  }}
                  onBlur={() => handleFieldTouch('password')}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete="password"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.visibilityIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.icon} 
                  />
                </TouchableOpacity>
              </View>
              {touched.password && !validation.passwordValid && (
                <Text style={[styles.validationMessage, { color: colors.error }]}>
                  Password must be at least 6 characters
                </Text>
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.forgotPassword]}
              onPress={() => Alert.alert("Password Reset", "This feature will be available soon.")}
            >
              <Text style={[styles.forgotPasswordText, { color: colors.secondary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleDirectLogin}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
            
            <Text style={[styles.demoText, { color: colors.subtitle }]}>
              Demo credentials are pre-filled for testing
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formContainer: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 12,
  },
  validationIcon: {
    marginRight: 12,
  },
  validationMessage: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoText: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  errorText: {
    marginLeft: 8,
    flex: 1,
  },
});

export default LoginTest; 