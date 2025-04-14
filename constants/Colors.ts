/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Colors for the Restaurant Admin Dashboard App
 * Primary color scheme: Orange with complementary accents
 */

const primaryOrange = '#FF7D00';
const primaryDarkOrange = '#E67300';
const accentBlue = '#2D6BEF';
const successGreen = '#34C759';
const warningYellow = '#FFCC00';
const errorRed = '#FF3B30';

export const Colors = {
  light: {
    text: '#333333',
    background: '#F7F7F7',
    tint: primaryOrange,
    primary: primaryOrange,
    secondary: accentBlue,
    accent: '#FFA500',
    success: successGreen,
    warning: warningYellow,
    error: errorRed,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryOrange,
    card: '#FFFFFF',
    cardShadow: 'rgba(0,0,0,0.05)',
    border: '#E0E0E0',
    notification: errorRed,
    subtitle: '#6E7A8A',
    backgroundVariant: '#F0F0F0',
    inactive: '#9E9E9E',
    placeholderText: '#AAAAAA',
    disabled: '#CCCCCC'
  },
  dark: {
    text: '#ECEDEE',
    background: '#121212',
    tint: primaryOrange,
    primary: primaryOrange,
    secondary: accentBlue,
    accent: '#FFA500',
    success: successGreen,
    warning: warningYellow,
    error: errorRed,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryOrange,
    card: '#1E1E1E',
    cardShadow: 'rgba(0,0,0,0.3)',
    border: '#2C2C2C',
    notification: errorRed,
    subtitle: '#9BA1A6',
    backgroundVariant: '#1A1A1A',
    inactive: '#666666',
    placeholderText: '#666666',
    disabled: '#444444'
  },
};
