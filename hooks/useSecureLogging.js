import { useCallback } from 'react';
import { secureLog } from '../services/api';

/**
 * Custom hook for secure logging throughout the application
 * 
 * This hook provides a convenient way to access the secure logging
 * utility from any component, with consistent behavior and formatting.
 * 
 * Example usage:
 * ```
 * const logger = useSecureLogging('ComponentName');
 * logger.info('User performed an action', { actionId: 123 });
 * ```
 */
export default function useSecureLogging(componentName = '') {
  const prefix = componentName ? `[${componentName}] ` : '';
  
  // Create memoized logging functions
  const info = useCallback((message, data) => {
    secureLog.info(`${prefix}${message}`, data);
  }, [prefix]);
  
  const error = useCallback((message, error) => {
    secureLog.error(`${prefix}${message}`, error);
  }, [prefix]);
  
  const warn = useCallback((message, data) => {
    secureLog.warn(`${prefix}${message}`, data);
  }, [prefix]);
  
  const security = useCallback((message) => {
    secureLog.security(`${prefix}${message}`);
  }, [prefix]);
  
  // Return the logging functions with component context
  return {
    info,
    error,
    warn,
    security
  };
} 