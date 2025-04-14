import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { isAuthenticated, login, logout, getCurrentUser, resetAuthState } from '../services/authService';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import apiClient, { registerAuthManager } from '../services/api';

// Keys for secure storage
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

// Create the auth context
export const AuthContext = createContext({
  isLoggedIn: false,
  isLoggingOut: false,
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  loginWithToken: async (token, userData) => {},
  logout: async () => {},
  clearAuthError: () => {},
  resetAuth: () => {},
  emergencyReset: async () => {},
});

/**
 * Auth provider component to wrap the app
 */
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add a preventLoginAfterLogout flag to prevent auto-login after logout
  const preventLoginAfterLogout = useRef(false);

  // Clear auth error
  const clearAuthError = () => setError(null);

  // Reset auth - used when returning to login screen
  const resetAuth = () => {
    if (isLoggingOut) {
      setIsLoggingOut(false);
      console.log('Auth state manually reset');
    }
    
    // Also ensure there are no lingering flags or state
    const globalObj = typeof window !== 'undefined' ? window : global;
    if (globalObj._tokenLoginDebounce) {
      globalObj._tokenLoginDebounce = false;
      console.log('Cleared token login debounce during manual reset');
    }
    
    if (globalObj._isLoggingIn) {
      globalObj._isLoggingIn = false;
      console.log('Cleared login in-progress flag during manual reset');
    }
    
    if (globalObj._isLoggingOut) {
      globalObj._isLoggingOut = false;
      console.log('Cleared logout in-progress flag during manual reset');
    }
    
    setLoading(false);
  };

  // Force logout - cleans up local storage without API calls
  const forceLogout = async () => {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      setIsLoggedIn(false);
      setUser(null);
      console.log('User force logged out, credentials removed');
    } catch (err) {
      console.error('Force logout error:', err);
    }
  };

  // Check initial auth state on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Reset the prevent login flag when component mounts
        // This ensures we don't permanently block login after a page refresh
        if (preventLoginAfterLogout.current) {
          // Only keep prevent login active for 3 seconds after logout
          // to prevent immediate auto-login but allow manual login later
          setTimeout(() => {
            preventLoginAfterLogout.current = false;
            console.log('Reset preventLoginAfterLogout flag after timeout');
          }, 3000);
        }
        
        // Don't check auth status if we just logged out
        if (preventLoginAfterLogout.current) {
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);
        
        const isUserAuthenticated = await isAuthenticated();
        
        if (isUserAuthenticated) {
          // Clear any lingering token expiration flags
          const globalObj = typeof window !== 'undefined' ? window : global;
          globalObj._handlingTokenExpiration = false;
          
          const userData = await getCurrentUser();
          if (!userData) {
            console.warn('No user data found while authenticated, cleaning up...');
            await forceLogout();
            return;
          }
          
          setUser(userData);
          setIsLoggedIn(true);
        } else {
          await forceLogout();
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setError('Failed to verify authentication status');
        await forceLogout();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * Handle user login
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const handleLogin = async (email, password) => {
    try {
      // Reset the prevent login flag when explicitly logging in
      preventLoginAfterLogout.current = false;
      
      setLoading(true);
      setError(null);
      
      console.log('Login attempt started for:', email);
      const userData = await login(email, password);
      
      if (!userData) {
        throw new Error('No user data returned from login service');
      }
      
      console.log('Login successful, updating state');
      setUser(userData);
      setIsLoggedIn(true);
      
      return userData;
    } catch (err) {
      console.error('Login handler error:', err);
      setError(err.message || 'Authentication failed');
      setIsLoggedIn(false);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Handle login with existing token and user data
   * @param {string} token - Authentication token
   * @param {object} userData - User data object
   */
  const handleLoginWithToken = async (token, userData) => {
    try {
      // Force reset the prevent login flag for direct token login attempts
      // This ensures we can log in with token even if it was previously blocked
      preventLoginAfterLogout.current = false;
      
      // Reset any token expiration flags
      const globalObj = typeof window !== 'undefined' ? window : global;
      globalObj._handlingTokenExpiration = false;
      
      // Prevent excessive token login calls - using global _tokenLoginDebounce
      // Safe check for platforms where window is not defined
      if (globalObj._tokenLoginDebounce) {
        console.log('Token login debounced - skipping duplicate call');
        return null;
      }
      
      // Set debounce flag
      globalObj._tokenLoginDebounce = true;
      
      // Clear debounce after 2 seconds
      setTimeout(() => {
        globalObj._tokenLoginDebounce = false;
      }, 2000);
      
      setLoading(true);
      setError(null);
      
      console.log('Token login started');
      
      // Store token if provided
      if (token) {
        await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      }
      
      // Store user data if provided
      if (userData) {
        if (typeof userData === 'string') {
          // Handle case where userData is a string (JSON)
          await SecureStore.setItemAsync(USER_DATA_KEY, userData);
          userData = JSON.parse(userData);
        } else {
          await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userData));
        }
        
        setUser(userData);
      }
      
      // Explicitly reset API client authentication state
      if (apiClient) {
        apiClient.isAuthenticated = true;
        console.log('API client marked as authenticated after token login');
      }
      
      console.log('Token login completed successfully');
      setIsLoggedIn(true);
      return userData;
    } catch (err) {
      console.error('Token login error:', err);
      setError('Failed to log in with token');
      setIsLoggedIn(false);
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
      
      // Ensure debounce is cleared in case of error
      const globalObj = typeof window !== 'undefined' ? window : global;
      setTimeout(() => {
        globalObj._tokenLoginDebounce = false;
      }, 2000);
    }
  };

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    try {
      // Set logging out state to prevent any new data fetching
      setIsLoggingOut(true);
      
      console.log('Starting logout process');
      
      // Set the preventLoginAfterLogout flag to true
      preventLoginAfterLogout.current = true;
      
      // Mark API client as logged out to block new requests
      if (typeof apiClient.handleLogout === 'function') {
        apiClient.handleLogout();
      }
      
      // Reset state first to prevent any component from making API calls
      setIsLoggedIn(false);
      setUser(null);
      
      // Clear storage
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      
      // Call the logout service function
      await logout();
      
      // Use navigate with a fresh param to ensure a complete reset
      console.log('Navigating to login after logout with force refresh param...');
      
      // First ensure we've cleared all login state
      setIsLoggingOut(false);
      
      // Make sure all state is cleaned up before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force a clean navigation state with timestamp param to ensure fresh render
      if (router && typeof router.replace === 'function') {
        router.replace({
          pathname: '/login',
          params: { reset: Date.now() },
        });
      } else {
        // Fallback to replace
        router.replace('/login');
      }
    } catch (err) {
      console.error('Logout handler error:', err);
      
      // Set the preventLoginAfterLogout flag to true in case of error too
      preventLoginAfterLogout.current = true;
      
      // Final fallback - force logout regardless of errors
      try {
        await forceLogout();
        setIsLoggingOut(false); // Ensure this flag is reset
        
        // Force navigation with timestamp to ensure fresh render
        if (router && typeof router.replace === 'function') {
          router.replace({
            pathname: '/login',
            params: { reset: Date.now() },
          });
        } else {
          router.replace('/login');
        }
      } catch (finalError) {
        console.error('Final force logout also failed:', finalError);
        setIsLoggingOut(false);
        router.replace('/login');
      }
    } finally {
      // Reset logging out state immediately to prevent UI getting stuck
      setIsLoggingOut(false);
      console.log('Logout state reset completed');
    }
  };

  /**
   * Emergency reset of all auth state
   * This is a last resort function for when normal logout fails
   */
  const handleEmergencyReset = async () => {
    console.log('🚨 EMERGENCY RESET triggered from AuthContext');
    
    try {
      // Set the preventLoginAfterLogout flag to true
      preventLoginAfterLogout.current = true;
      
      // Reset all auth flags
      setIsLoggedIn(false);
      setIsLoggingOut(false);
      setUser(null);
      setError(null);
      
      // Call the authService reset function
      await resetAuthState();
      
      // Force navigation to login
      if (router && router.replace) {
        router.replace('/login');
      }
      
      return true;
    } catch (err) {
      console.error('Emergency reset error:', err);
      return false;
    }
  };

  // Value object passed to context consumers
  const value = {
    isLoggedIn,
    isLoggingOut,
    user,
    loading,
    error,
    login: handleLogin,
    loginWithToken: handleLoginWithToken,
    logout: handleLogout,
    clearAuthError,
    resetAuth,
    emergencyReset: handleEmergencyReset,
  };

  // Register the auth manager with the API client for auto-logout
  useEffect(() => {
    // Register this auth context with the API client
    // This allows the API client to trigger logout when tokens expire
    registerAuthManager(value);

    // No cleanup needed as the API client will keep the reference
  }, [value]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 