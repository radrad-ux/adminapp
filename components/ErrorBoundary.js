import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Authentication error detector
const isAuthError = (error) => {
  if (!error) return false;
  
  const errorMsg = error.toString().toLowerCase();
  return (
    errorMsg.includes('authentication') ||
    errorMsg.includes('unauthorized') ||
    errorMsg.includes('token') ||
    errorMsg.includes('login required') ||
    errorMsg.includes('401') ||
    errorMsg.includes('unauthenticated') ||
    errorMsg.includes('session expired')
  );
};

// Functional wrapper to access the auth context
export const ErrorBoundaryWithAuth = (props) => {
  const auth = useAuth();
  return <ErrorBoundary {...props} auth={auth} />;
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isAuthError: false
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is an authentication error
    const authError = isAuthError(error);
    
    return { 
      hasError: true, 
      error, 
      isAuthError: authError
    };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ 
      errorInfo,
      errorCount: this.state.errorCount + 1
    });
    
    // If this is an auth error and we have auth context, trigger logout
    if (isAuthError(error) && this.props.auth?.logout) {
      console.log('Authentication error detected in ErrorBoundary, triggering logout');
      
      // Use setTimeout to avoid blocking the error boundary rendering
      setTimeout(() => {
        try {
          this.props.auth.logout();
        } catch (logoutError) {
          console.error('Error during logout from error boundary:', logoutError);
        }
      }, 1500); // Brief delay to show the error message first
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null,
      isAuthError: false
    });
    
    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  }

  // If auth error, handle it specially
  renderAuthError() {
    const colorScheme = this.props.colorScheme || 'light';
    const colors = Colors[colorScheme];
    
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed" size={64} color={colors.primary} style={styles.icon} />
        <Text style={[styles.title, { color: colors.text }]}>Session Expired</Text>
        <Text style={[styles.message, { color: colors.icon }]}>
          Your login session has expired. Please log in again to continue.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (this.props.auth?.logout) {
              this.props.auth.logout();
            }
          }}
        >
          <Text style={styles.buttonText}>Log In Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  render() {
    const { children, fallback, colorScheme = 'light' } = this.props;
    const colors = Colors[colorScheme];
    
    // If there's an error, show the fallback UI
    if (this.state.hasError) {
      // Handle auth errors with special UI
      if (this.state.isAuthError) {
        return this.renderAuthError();
      }
      
      // If too many errors, show critical error
      if (this.state.errorCount > 3) {
        return (
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Ionicons name="alert-circle" size={60} color={colors.error || 'red'} />
            <Text style={[styles.title, { color: colors.text }]}>
              Something went wrong
            </Text>
            <Text style={[styles.message, { color: colors.text }]}>
              The app has encountered multiple errors. Please restart the app.
            </Text>
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={this.resetError}
            >
              <Text style={styles.buttonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        );
      }
      
      // Use custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.resetError)
          : fallback;
      }

      // Default error UI
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={50} color={colors.error || 'red'} />
          <Text style={[styles.title, { color: colors.text }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.message, { color: colors.text }]}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={this.resetError}
          >
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
          
          {__DEV__ && this.state.errorInfo && (
            <View style={styles.devInfo}>
              <Text style={[styles.devInfoText, { color: colors.text }]}>
                {this.state.errorInfo.componentStack}
              </Text>
            </View>
          )}
        </View>
      );
    }

    // If no error, render children normally
    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  devInfo: {
    marginTop: 30,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    width: '100%',
  },
  devInfoText: {
    fontSize: 12,
  },
});

export default ErrorBoundary; 