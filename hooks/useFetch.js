import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * A custom hook for data fetching with loading states, error handling, and retry logic
 * 
 * @param {Function} fetchFunction - The async function to fetch data
 * @param {Array} dependencies - Dependency array for useEffect (like useEffect)
 * @param {Object} options - Additional options
 * @param {boolean} options.enabled - Whether to enable the fetch (default: true)
 * @param {any} options.initialData - Initial data to use before fetch completes
 * @param {boolean} options.loadOnMount - Whether to load data on mount (default: true)
 * @param {Function} options.onSuccess - Callback for successful data fetch
 * @param {Function} options.onError - Callback for failed data fetch
 * @returns {Object} - { data, isLoading, error, refetch, isRefetching }
 */
const useFetch = (fetchFunction, dependencies = [], options = {}) => {
  const {
    enabled = true,
    initialData = null,
    loadOnMount = true,
    onSuccess = () => {},
    onError = () => {},
    silentErrors = false,
  } = options;

  const { isLoggedIn, logout } = useAuth();
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(loadOnMount);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [authErrorDetected, setAuthErrorDetected] = useState(false);
  
  // Function to handle data fetching
  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled) {
      console.log('Data fetching is disabled');
      return;
    }
    
    // Skip fetch if authentication error was detected
    if (authErrorDetected) {
      console.log('Skipping fetch due to authentication error');
      return;
    }
    
    if (isRefetch) {
      console.log('Refetching data...');
      setIsRefetching(true);
    } else {
      console.log('Initial data fetch...');
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      console.log('Executing fetch function...');
      const result = await fetchFunction();
      console.log('Fetch function result:', result !== undefined ? 'Data returned' : 'No data');
      
      if (result === undefined || result === null) {
        console.warn('Fetch function returned no data');
      } else {
        console.log('Setting data from fetch result');
        setData(result);
        onSuccess(result);
      }
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'An unknown error occurred';
      console.error('Fetch error in useFetch hook:', errorMessage, err);
      
      // Check for authentication errors
      const isAuthError = 
        errorMessage.includes('Authentication required') || 
        errorMessage.includes('Unauthorized') || 
        errorMessage.includes('token') || 
        errorMessage.includes('login') ||
        (err.response && err.response.status === 401);
      
      if (isAuthError && isLoggedIn) {
        console.error('Authentication error detected while user is logged in - token may be expired');
        setAuthErrorDetected(true);
        
        // Trigger logout if not already logging out
        const globalObj = typeof window !== 'undefined' ? window : global;
        if (!globalObj._handlingTokenExpiration) {
          globalObj._handlingTokenExpiration = true;
          
          setTimeout(() => {
            try {
              console.log('Auto-logging out due to authentication error in useFetch');
              logout();
            } catch (logoutErr) {
              console.error('Error during auto-logout from useFetch:', logoutErr);
            } finally {
              setTimeout(() => {
                globalObj._handlingTokenExpiration = false;
              }, 3000);
            }
          }, 100);
        }
      }
      
      setError(errorMessage);
      onError(err);
      
      // Use existing data (don't clear it on error)
      console.log('Keeping existing data after fetch error');
      return null;
    } finally {
      if (isRefetch) {
        setIsRefetching(false);
      } else {
        setIsLoading(false);
      }
      console.log('Fetch operation completed');
    }
  }, [enabled, fetchFunction, onSuccess, onError, authErrorDetected, isLoggedIn, logout]);

  // Refetch data function for manual refetching
  const refetch = useCallback(() => {
    // Reset auth error state on explicit refetch request
    setAuthErrorDetected(false);
    console.log('Manual refetch triggered');
    return fetchData(true);
  }, [fetchData]);

  // Initial data fetching
  useEffect(() => {
    let isMounted = true;
    
    // Skip fetch if authentication error was already detected
    if (authErrorDetected) {
      console.log('Skipping useEffect fetch due to authentication error');
      return;
    }
    
    if (loadOnMount && enabled) {
      console.log('Auto-fetching data on mount or dependency change');
      fetchData().then(result => {
        if (!isMounted) {
          console.log('Component unmounted during fetch, ignoring result');
          return;
        }
        
        if (result === null && initialData !== null) {
          console.log('Fetch failed, falling back to initial data');
          setData(initialData);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, enabled, retryCount, authErrorDetected]);

  // Retry fetching data
  const retry = useCallback(() => {
    console.log('Retry triggered');
    setAuthErrorDetected(false); // Reset auth error on retry
    setRetryCount(prev => prev + 1);
  }, []);

  return {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
    retry,
    setData, // Expose setData to allow manual updates
    authErrorDetected, // Expose auth error state
  };
};

export default useFetch; 