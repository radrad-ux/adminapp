import { useState, useEffect, createContext, useContext } from 'react';
import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';

// Create a context for theme
type ThemeContextType = {
  colorScheme: ColorSchemeName;
  toggleTheme: () => void;
  setTheme: (theme: ColorSchemeName) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

// Theme provider component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Get device theme
  const deviceTheme = _useColorScheme();
  // Theme state, initialized with light theme instead of device theme
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>('light');

  // Toggle between light and dark
  const toggleTheme = () => {
    setColorScheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Set specific theme
  const setTheme = (theme: ColorSchemeName) => {
    setColorScheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useColorScheme() {
  return useContext(ThemeContext);
}

// For backward compatibility
export default useColorScheme;
