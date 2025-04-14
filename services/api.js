import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// API base URL from environment or default to development
const API_BASE_URL = 'https://dmenu-five.vercel.app/api';

// For debugging - log the API URL being used
console.log('API URL being used:', API_BASE_URL);

// Key for secure storage
const AUTH_TOKEN_KEY = 'auth_token';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout for slower connections
  withCredentials: true, // Enable sending cookies with requests
});

// List of endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  '/custom-auth',
  '/env-check',
  '/validate-token',
  '/login',
  '/register'
];

// Global flag to track authentication state
let isAuthenticated = true;

// Expose isAuthenticated flag on apiClient
apiClient.isAuthenticated = isAuthenticated;

// Track ongoing requests to cancel them during logout
const pendingRequests = new Set();

// Mark a request as silent (no console errors)
apiClient.markRequestSilent = (url) => {
  return apiClient;
};

// Function to mark the API client as logged out
// This should be called when user logs out to prevent any lingering requests
apiClient.handleLogout = () => {
  // Immediately mark as not authenticated to block new requests
  isAuthenticated = false;
  apiClient.isAuthenticated = false;
  console.log('API client marked as logged out');
  
  // Cancel any pending requests to prevent callbacks after logout
  if (pendingRequests.size > 0) {
    console.log(`Cancelling ${pendingRequests.size} pending requests during logout`);
    pendingRequests.forEach(source => {
      try {
        source.cancel('Operation canceled due to logout');
      } catch (err) {
        // Ignore cancellation errors
      }
    });
    pendingRequests.clear();
  }
  
  // Clear the Authorization header immediately
  delete apiClient.defaults.headers.common['Authorization'];
  
  // Reset global flags to avoid request blocking after logout is completed
  setTimeout(() => {
    const globalObj = typeof window !== 'undefined' ? window : global;
    globalObj._handlingTokenExpiration = false;
    
    // Don't immediately reset authentication state - it should be explicitly reset on login
    console.log('API client ready for new login (but still marked as logged out)');
  }, 500);
  
  return true;
};

// Method to set auth token in headers
apiClient.setAuthToken = (token) => {
  if (token && token.length > 0) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    secureLog.security('Auth token set in API client headers');
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    secureLog.security('Auth token removed from API client headers');
  }
};

// Method to reset API client authentication state
apiClient.resetAuthState = () => {
  const globalObj = typeof window !== 'undefined' ? window : global;
  
  // Reset all authentication flags
  isAuthenticated = true;
  apiClient.isAuthenticated = true;
  
  // Reset global flags
  globalObj._handlingTokenExpiration = false;
  globalObj._tokenExpirationStartTime = null;
  globalObj._isLoggingOut = false;
  globalObj._logoutStateTimestamp = null;
  globalObj._menuFetchFailed = false;
  globalObj._categoriesFetchFailed = false;
  globalObj._deferDataFetching = false;
  
  secureLog.info('API client authentication state has been reset');
  return true;
};

// Add a secure logging utility
const secureLog = {
  // Only log in development, not production
  isDev: __DEV__,
  
  // Sanitize sensitive data from objects before logging
  sanitize: (data) => {
    if (!data) return data;
    
    // Create a deep copy to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Sanitize common sensitive fields
    const sensitiveFields = [
      'token', 'accessToken', 'refreshToken', 'password', 'authorization',
      'Authorization', 'secret', 'apiKey', 'api_key'
    ];
    
    // Recursive function to sanitize objects
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        // Check if this is a sensitive field
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          if (typeof obj[key] === 'string') {
            obj[key] = obj[key].startsWith('Bearer ') 
              ? 'Bearer [REDACTED]' 
              : '[REDACTED]';
          }
        }
        
        // Handle headers object specially
        if (key === 'headers' && typeof obj[key] === 'object') {
          sensitiveFields.forEach(field => {
            if (obj[key][field]) {
              obj[key][field] = '[REDACTED]';
            }
          });
        }
        
        // Recursively sanitize nested objects
        if (obj[key] && typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  },
  
  // Log methods with sanitization
  info: (message, data) => {
    if (!secureLog.isDev) return;
    if (data) {
      console.log(message, secureLog.sanitize(data));
    } else {
      console.log(message);
    }
  },
  
  error: (message, error) => {
    // Always log errors but sanitize the data
    if (error) {
      const sanitized = secureLog.sanitize(error);
      console.error(message, sanitized);
    } else {
      console.error(message);
    }
  },
  
  warn: (message, data) => {
    if (!secureLog.isDev) return;
    if (data) {
      console.warn(message, secureLog.sanitize(data));
    } else {
      console.warn(message);
    }
  },
  
  // Use this for sensitive operations where we want minimal logging
  security: (message) => {
    // In production, don't log security operations at all
    if (!secureLog.isDev) return;
    console.log(`🔒 ${message}`);
  }
};

// Update getSafeToken function to use secure logging
const getSafeToken = async () => {
  try {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    secureLog.security('Auth token retrieved');
    return token;
  } catch (error) {
    secureLog.error('Error retrieving token:', error);
    return null;
  }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Create a cancellation token for this request
      const CancelToken = axios.CancelToken;
      const source = CancelToken.source();
      config.cancelToken = source.token;
      pendingRequests.add(source);
      
      // Register cleanup function to remove from pending requests when done
      config.onComplete = () => {
        pendingRequests.delete(source);
      };
      
      // Block requests during logout transition
      if (!isAuthenticated && !config._ignoreAuth) {
        secureLog.warn(`Blocking request to ${config.url} during logout transition`);
        return Promise.reject(new Error('App is in logout transition'));
      }

      // Add app info to headers
      config.headers['X-App-Platform'] = Platform.OS;
      config.headers['X-App-Version'] = '1.0.0';
      
      // Skip auth handling if _ignoreAuth is set (used by logout)
      if (config._ignoreAuth) {
        return config;
      }
      
      // Check if the endpoint requires authentication
      const requiresAuth = !PUBLIC_ENDPOINTS.some(endpoint => 
        config.url.endsWith(endpoint) || config.url === endpoint
      );
      
      // Get auth token
      const token = await getSafeToken();
      
      // Block unauthorized requests to protected endpoints
      if (requiresAuth && !token) {
        secureLog.warn(`Blocking unauthorized request to: ${config.url}`);
        return Promise.reject(new Error('Authentication required for this endpoint'));
      }
      
      // Add token to headers if available
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      secureLog.info(`Making API ${config.method.toUpperCase()} request to: ${config.url}`);
      return config;
    } catch (error) {
      secureLog.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    secureLog.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Global auth state management
let _globalAuthRef = null;

// Function to register auth context reference
export const registerAuthManager = (authManager) => {
  _globalAuthRef = authManager;
  secureLog.info('Auth manager registered with API client');
};

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Clean up the pending request
    if (response.config?.onComplete) {
      response.config.onComplete();
    }
    
    // Log minimal response info, not the whole response
    secureLog.info(`API response from ${response.config.url}: ${response.status}`);
    return response;
  },
  (error) => {
    // Handle axios cancellation
    if (axios.isCancel(error)) {
      secureLog.info('Request canceled:', error.message);
      return Promise.reject(new Error('Request canceled during logout'));
    }
    
    // Clean up the pending request even for errors
    if (error.config?.onComplete) {
      error.config.onComplete();
    }
    
    // Handle network errors
    if (!error.response) {
      secureLog.error('Network error - no response received:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Handle specific status codes
    const status = error.response.status;
    
    // Log error info without exposing sensitive data
    secureLog.error(`API Error [${status}] ${error.config?.url}:`, {
      status,
      message: error.response.data?.message || 'Unknown error',
      code: error.response.data?.code
    });
    
    // Handle authentication errors - TOKEN EXPIRATION
    if (status === 401) {
      secureLog.warn('Authentication error - token may be invalid or expired');
      
      // Check if this is a protected endpoint (not login/register)
      const isProtectedEndpoint = !PUBLIC_ENDPOINTS.some(endpoint => 
        error.config.url.endsWith(endpoint) || error.config.url === endpoint
      );
      
      // Only trigger auto-logout for token expiration on protected endpoints
      if (isProtectedEndpoint) {
        // Prevent infinite logout loops with a flag
        const globalObj = typeof window !== 'undefined' ? window : global;
        if (!globalObj._handlingTokenExpiration) {
          globalObj._handlingTokenExpiration = true;
          globalObj._tokenExpirationStartTime = Date.now();
          
          secureLog.warn('Token expired or invalid, initiating automatic logout');
          
          // Use setTimeout to avoid blocking the current request handling
          setTimeout(async () => {
            try {
              // Clear all caches before logout to ensure fresh data on next login
              try {
                const clearCache = require('./restaurantService').clearCache;
                if (typeof clearCache === 'function') {
                  secureLog.info('Clearing all API caches due to token expiration');
                  await clearCache();
                  secureLog.info('Successfully cleared all caches due to token expiration');
                }
              } catch (cacheError) {
                secureLog.error('Error clearing cache during token expiration:', cacheError);
              }
              
              // Use the registered auth manager if available
              if (_globalAuthRef && typeof _globalAuthRef.logout === 'function') {
                secureLog.info('Calling auth manager logout due to token expiration');
                await _globalAuthRef.logout();
                
                // Ensure the handling flag is reset after logout
                secureLog.info('Resetting token expiration handling flag after logout');
                globalObj._handlingTokenExpiration = false;
              } else {
                // Fallback approach - show alert and mark client as logged out
                secureLog.warn('No auth manager available, using fallback logout');
                apiClient.handleLogout();
                
                // Use Alert if available (React Native)
                if (typeof Alert !== 'undefined') {
                  Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [{ text: 'OK' }]
                  );
                }
                
                // Reset flag for fallback approach too
                secureLog.info('Resetting token expiration handling flag after fallback logout');
                globalObj._handlingTokenExpiration = false;
              }
            } catch (error) {
              secureLog.error('Error during automatic logout:', error);
            } finally {
              // Reset the handling flag after a delay to prevent edge cases
              setTimeout(() => {
                secureLog.info('Final reset of _handlingTokenExpiration flag');
                globalObj._handlingTokenExpiration = false;
              }, 1000);
            }
          }, 100);
        } else {
          secureLog.info('Token expiration already being handled, skipping duplicate logout');
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Export the secure logging utility for use in other files
export { secureLog };

export default apiClient; 