import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import TranslatedText from './TranslatedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface TranslatedButtonProps {
  section: string;
  textKey: string;
  onPress: () => void;
  style?: any;
  textStyle?: any;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

/**
 * A component that renders a translated button with different variants
 * 
 * Usage:
 * <TranslatedButton section="common" textKey="save" onPress={handleSave} variant="primary" />
 */
const TranslatedButton: React.FC<TranslatedButtonProps> = ({ 
  section, 
  textKey, 
  onPress,
  style,
  textStyle,
  isLoading = false,
  disabled = false,
  variant = 'primary'
}) => {
  const { isRTL } = useLanguage();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Determine button colors based on variant
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? `${colors.primary}80` : colors.primary,
          borderColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: disabled ? `${colors.secondary}80` : colors.secondary,
          borderColor: colors.secondary,
        };
      case 'danger':
        return {
          backgroundColor: disabled ? `${colors.error}80` : colors.error,
          borderColor: colors.error,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.primary,
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: disabled ? `${colors.primary}80` : colors.primary,
          borderColor: colors.primary,
        };
    }
  };

  // Determine text color
  const getTextColor = () => {
    if (variant === 'outline') {
      return colors.primary;
    }
    return '#FFFFFF';
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyles(),
        style,
        { opacity: disabled ? 0.7 : 1 }
      ]}
      onPress={onPress}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <TranslatedText 
          section={section} 
          textKey={textKey} 
          style={[
            styles.buttonText, 
            { 
              color: getTextColor(),
              textAlign: 'center' 
            },
            textStyle
          ]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 100,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});

export default TranslatedButton; 