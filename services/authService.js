import * as SecureStore from 'expo-secure-store';
import apiClient from './api';

// Keys for secure storage
const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Default token expiry time (24 hours)
const TOKEN_EXPIRY_TIME = 24 * 60 * 60 * 1000;

// Helper to safely access SecureStore
const safeSecureStore = {
  getItem: async (key) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`Error getting ${key} from secure store:`, error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in secure store:`, error);
      return false;
    }
  },
  deleteItem: async (key) => {
    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.error(`Error deleting ${key} from secure store:`, error);
      return false;
    }
  }
};

/**
 * Login with email/password and store tokens
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @param {string} deviceName - Device name for token tracking
 * @returns {Promise<Object>} Login result with user data
 */
export const login = async (credentials, deviceName = 'Mobile App') => {
  try {
    // Reset any token expiration handling flags to ensure clean login state
    const globalObj = typeof window !== 'undefined' ? window : global;
    globalObj._handlingTokenExpiration = false;
    globalObj._isLoggingOut = false;
    globalObj._logoutStateTimestamp = null;
    globalObj._menuFetchFailed = false;
    globalObj._categoriesFetchFailed = false;
    
    const { email, password } = credentials;
    console.log(`Attempting login for: ${email}`);
    const response = await apiClient.post('/login', {
      email,
      password,
      device_name: deviceName
    });
    
    // Store tokens in secure storage
    const { access_token, user } = response.data;
    await safeSecureStore.setItem(AUTH_TOKEN_KEY, access_token);
    await safeSecureStore.setItem(USER_DATA_KEY, JSON.stringify(user));
    
    // Set token expiry time
    const expiryTime = Date.now() + TOKEN_EXPIRY_TIME;
    await safeSecureStore.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    
    console.log('Login successful - tokens stored');
    
    // Update global state
    _isLoggedIn = true;
    _authStatusLastChecked = Date.now();
    
    // Set token for API requests
    if (apiClient) {
      apiClient.isAuthenticated = true;
      apiClient.setAuthToken(access_token);
      console.log('API client marked as authenticated after login');
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error ||
                         'Network error occurred during login';
    
    throw new Error(errorMessage);
  }
};

/**
 * Check if user is currently authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    console.log('Checking authentication status...');
    const token = await safeSecureStore.getItem(AUTH_TOKEN_KEY);
    const userData = await safeSecureStore.getItem(USER_DATA_KEY);
    
    if (!token || !userData) {
      console.log('No token or user data found, not authenticated');
      return false;
    }
    
    // Check if token has expired locally
    const expiryTime = await safeSecureStore.getItem(TOKEN_EXPIRY_KEY);
    if (expiryTime) {
      const expiryTimestamp = parseInt(expiryTime, 10);
      if (Date.now() > expiryTimestamp) {
        console.log('Token has expired locally');
        await clearAuthData();
        return false;
      }
    }
    
    // Basic format validation
    if (typeof token !== 'string' || token.length < 10) {
      console.warn('Token format validation failed, clearing auth data');
      await clearAuthData();
      return false;
    }

    console.log('User is authenticated with valid token');
    return true;
  } catch (error) {
    console.error('Error in isAuthenticated:', error);
    return false;
  }
};

/**
 * Clear all auth data from secure storage
 */
const clearAuthData = async () => {
  await safeSecureStore.deleteItem(AUTH_TOKEN_KEY);
  await safeSecureStore.deleteItem(USER_DATA_KEY);
  await safeSecureStore.deleteItem(TOKEN_EXPIRY_KEY);
};

/**
 * Get the current user data
 * @returns {Promise<Object|null>}
 */
export const getCurrentUser = async () => {
  try {
    const userData = await safeSecureStore.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Logout the current user
 */
export const logout = async () => {
  try {
    console.log('Logging out user...');
    
    // Detect redundant logout calls and return early
    const token = await safeSecureStore.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      console.log('No token found, user already logged out');
      
      // Reset any stuck flags even on redundant logout
      const globalObj = typeof window !== 'undefined' ? window : global;
      globalObj._handlingTokenExpiration = false;
      globalObj._isLoggingOut = false;
      globalObj._tokenExpirationStartTime = null;
      
      return true;
    }
    
    // Set logout flag to prevent API calls during logout
    const globalObj = typeof window !== 'undefined' ? window : global;
    globalObj._isLoggingOut = true;
    
    // Reset token expiration handling flag
    globalObj._handlingTokenExpiration = false;
    globalObj._tokenExpirationStartTime = null;
    
    // Clear all local auth data
    await clearAuthData();
    
    // Reset API client state
    if (apiClient) {
      apiClient.isAuthenticated = false;
      apiClient.setAuthToken('');
    }
    
    console.log('User logged out, all credentials removed');
    
    // Delay resetting the logout flag to allow navigation to complete
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window._isLoggingOut = false;
      }
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if there's an error, try to ensure the token is removed
    try {
      await clearAuthData();
      // Reset token expiration handling flag even in error case
      const globalObj = typeof window !== 'undefined' ? window : global;
      globalObj._handlingTokenExpiration = false;
      globalObj._tokenExpirationStartTime = null;
      
      // Reset logout flag after a delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window._isLoggingOut = false;
        }
      }, 1000);
    } catch (e) {
      // Ignore any errors from this final attempt
    }
    return true;
  }
};

/**
 * Get the current authentication token
 * @returns {Promise<string|null>} The authentication token or null if not available
 */
export const getAccessToken = async () => {
  try {
    const token = await safeSecureStore.getItem(AUTH_TOKEN_KEY);
    
    if (!token) {
      console.log('No authentication token found');
      return null;
    }
    
    // Check if token has expired locally
    const expiryTime = await safeSecureStore.getItem(TOKEN_EXPIRY_KEY);
    if (expiryTime) {
      const expiryTimestamp = parseInt(expiryTime, 10);
      if (Date.now() > expiryTimestamp) {
        console.log('Token has expired, returning null');
        return null;
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Reset any global state related to authentication
 * This is useful for clearing debounce flags and other state
 * @returns {Promise<boolean>} Success status
 */
export const resetAuthState = async () => {
  console.log('🔄 EMERGENCY: Explicitly resetting auth global state');
  
  try {
    // Reset any global debounce flags
    if (typeof window !== 'undefined') {
      window._tokenLoginDebounce = false;
      window._isLoggingIn = false;
      window._isLoggingOut = false;
      window._handlingTokenExpiration = false;
      console.log('✅ Reset window global state flags');
    } else if (typeof global !== 'undefined') {
      global._tokenLoginDebounce = false;
      global._isLoggingIn = false;
      global._isLoggingOut = false;
      global._handlingTokenExpiration = false;
      console.log('✅ Reset global state flags');
    }
    
    // Clear all auth data for a fresh start
    await clearAuthData();
    console.log('✅ Cleared all secure storage auth data');
    
    // Reset API client state if needed
    if (apiClient && apiClient.defaults) {
      apiClient.defaults.headers.common['Authorization'] = '';
      console.log('✅ Reset API client auth headers');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error during auth state reset:', error);
    return false;
  }
}; 
