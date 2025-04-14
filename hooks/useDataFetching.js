import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Minimal hook that ONLY provides manual fetching capability.
 * NO automatic fetching under any circumstances.
 */
export const useDataFetching = (fetchFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isLoggingOut, isLoggedIn } = useAuth();
  const isMounted = useRef(true);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to manually fetch data - the ONLY way to trigger data fetching
  const fetchData = async () => {
    if (!fetchFunction || typeof fetchFunction !== 'function') {
      console.error('No valid fetch function provided to useDataFetching');
      return null;
    }
    
    if (!isLoggedIn || isLoggingOut) {
      console.log('Cannot fetch: not logged in or logging out');
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Executing manual fetch');
      const result = await fetchFunction();
      
      if (isMounted.current && !isLoggingOut) {
        setData(result);
        console.log('Manual fetch completed successfully');
      }
      
      return result;
    } catch (err) {
      if (isMounted.current && !isLoggingOut) {
        setError(err);
        console.error('Manual fetch error:', err.message || err);
      }
      return null;
    } finally {
      if (isMounted.current && !isLoggingOut) {
        setLoading(false);
      }
    }
  };

  return { data, loading, error, refetch: fetchData };
}; 