import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Share,
  Platform,
  I18nManager,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchRestaurantInfo } from '../services/restaurantService';

// QR Code screen component
export default function QRCodeScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [customTableNumber, setCustomTableNumber] = useState('');
  const [qrCodeType, setQrCodeType] = useState('restaurant'); // restaurant or table
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // QR Code generation options
  const qrOptions = [
    { id: 'restaurant', label: t('qrCode', 'restaurantOption'), icon: 'restaurant-outline' },
    { id: 'table', label: t('qrCode', 'tableOption'), icon: 'grid-outline' },
  ];

  // Load restaurant info
  useEffect(() => {
    const loadRestaurantInfo = async () => {
      if (!isLoggedIn || !isMounted) return;
      
      setLoading(true);
      try {
        const restaurantData = await fetchRestaurantInfo();
        if (restaurantData && isMounted) {
          setRestaurant(restaurantData);
          
          // Generate QR code URL using restaurant ID or slug
          const restaurantId = restaurantData.id || restaurantData._id;
          if (restaurantId) {
            // For demo purposes, we'll use a placeholder QR code image
            // In a real app, you would generate a real QR code using the restaurant's URL
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://dmenu.app/restaurant/${restaurantId}`);
          }
        }
      } catch (error) {
        console.error('Error loading restaurant info:', error);
        if (isMounted) {
          Alert.alert(t('common', 'error'), t('qrCode', 'errorLoadingRestaurant'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadRestaurantInfo();
  }, [isLoggedIn, isMounted, t]);

  // Generate QR code URL
  const generateQrCodeUrl = () => {
    if (!restaurant) return '';
    
    const restaurantId = restaurant.id || restaurant._id;
    let url = '';
    
    if (qrCodeType === 'restaurant') {
      url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://dmenu.app/restaurant/${restaurantId}`;
    } else if (qrCodeType === 'table') {
      url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://dmenu.app/restaurant/${restaurantId}/table/${customTableNumber || 1}`;
    }
    
    return url;
  };

  // Handle QR code type change
  useEffect(() => {
    if (restaurant && isMounted) {
      setQrCodeUrl(generateQrCodeUrl());
    }
  }, [qrCodeType, customTableNumber, restaurant, isMounted]);

  // Handle login redirection safely
  const handleLoginRedirect = useCallback(() => {
    if (isMounted && !isLoggedIn) {
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    }
  }, [isMounted, isLoggedIn, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isMounted) {
      handleLoginRedirect();
    }
  }, [isMounted, handleLoginRedirect]);

  // Handle share QR code
  const handleShareQrCode = async () => {
    try {
      const result = await Share.share({
        message: t('qrCode', 'shareMessage'),
        url: qrCodeUrl, // iOS only
        title: `${restaurant?.name || 'Restaurant'} QR Code`,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log(`Shared with activity type: ${result.activityType}`);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert(t('common', 'error'), t('qrCode', 'errorSharingQR'));
    }
  };

  // Handle download QR code
  const handleDownloadQrCode = () => {
    // In a real app, this would download the QR code image
    Alert.alert(t('qrCode', 'featureAvailableSoon'), t('qrCode', 'downloadImplementedLater'));
  };

  // If user is not logged in
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 20 }}>{t('qrCode', 'authenticating')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[
          styles.headerTitle, 
          { 
            color: colors.text,
            textAlign: isRTL ? 'right' : 'left'
          }
        ]}>{t('qrCode', 'title')}</Text>
        <Text style={[
          styles.headerSubtitle, 
          { 
            color: colors.icon,
            textAlign: isRTL ? 'right' : 'left'
          }
        ]}>
          {t('qrCode', 'subtitle')}
        </Text>
      </View>

      {/* QR Code Type Selector */}
      <View style={[
        styles.selectorContainer,
        isRTL && { flexDirection: 'row-reverse' }
      ]}>
        {qrOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              qrCodeType === option.id && { 
                borderColor: colors.primary,
                backgroundColor: `${colorScheme === 'dark' ? 'rgba(255,140,0,0.15)' : 'rgba(255,140,0,0.1)'}`,
              },
              { borderColor: colors.border }
            ]}
            onPress={() => setQrCodeType(option.id)}
          >
            <Ionicons 
              name={option.icon} 
              size={24} 
              color={qrCodeType === option.id ? colors.primary : colors.icon}
            />
            <Text 
              style={[
                styles.optionLabel, 
                { 
                  color: qrCodeType === option.id ? colors.primary : colors.text,
                  marginLeft: isRTL ? 0 : 10,
                  marginRight: isRTL ? 10 : 0
                }
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Table Number Input (for table QR) */}
      {qrCodeType === 'table' && (
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[
            styles.inputLabel, 
            { 
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}>{t('qrCode', 'tableNumberLabel')}</Text>
          <TextInput 
            style={[
              styles.input, 
              { 
                color: colors.text, 
                borderColor: colors.border,
                textAlign: isRTL ? 'right' : 'left',
                paddingRight: isRTL ? 16 : undefined,
                paddingLeft: isRTL ? undefined : 16,
              }
            ]}
            placeholder={t('qrCode', 'tableNumberPlaceholder')}
            placeholderTextColor={colors.icon}
            value={customTableNumber}
            onChangeText={setCustomTableNumber}
            keyboardType="number-pad"
          />
        </View>
      )}

      {/* QR Code Display */}
      <View style={[styles.qrContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>{t('qrCode', 'generating')}</Text>
          </View>
        ) : qrCodeUrl ? (
          <View style={styles.qrContent}>
            <View style={[styles.qrImageContainer, { backgroundColor: '#FFFFFF' }]}>
              <Image 
                source={{ uri: qrCodeUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.qrTitle, { color: colors.text }]}>
              {qrCodeType === 'restaurant' 
                ? t('qrCode', 'restaurantQRTitle', { name: restaurant?.name || 'Restaurant' })
                : t('qrCode', 'tableQRTitle', { number: customTableNumber || '1' })
              }
            </Text>
            <Text style={[styles.qrDescription, { color: colors.icon }]}>
              {qrCodeType === 'restaurant'
                ? t('qrCode', 'restaurantQRDescription')
                : t('qrCode', 'tableQRDescription', { number: customTableNumber || '1' })
              }
            </Text>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.notification} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              {t('qrCode', 'qrGenerationError')}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={[
        styles.actionsContainer,
        isRTL && { flexDirection: 'row-reverse' }
      ]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleShareQrCode}
          disabled={loading || !qrCodeUrl}
        >
          <Ionicons name="share-outline" size={20} color="#FFFFFF" />
          <Text style={[
            styles.actionButtonText,
            { 
              marginLeft: isRTL ? 0 : 8,
              marginRight: isRTL ? 8 : 0
            }
          ]}>{t('qrCode', 'shareButton')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={handleDownloadQrCode}
          disabled={loading || !qrCodeUrl}
        >
          <Ionicons name="download-outline" size={20} color="#FFFFFF" />
          <Text style={[
            styles.actionButtonText,
            { 
              marginLeft: isRTL ? 0 : 8,
              marginRight: isRTL ? 8 : 0
            }
          ]}>{t('qrCode', 'downloadButton')}</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={[styles.instructionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[
          styles.instructionsTitle, 
          { 
            color: colors.text,
            textAlign: isRTL ? 'right' : 'left' 
          }
        ]}>{t('qrCode', 'howToUseTitle')}</Text>
        
        <View style={[
          styles.instructionItem,
          isRTL && { flexDirection: 'row-reverse' }
        ]}>
          <View style={[
            styles.instructionIcon, 
            { 
              backgroundColor: colors.primary,
              marginRight: isRTL ? 0 : 16,
              marginLeft: isRTL ? 16 : 0
            }
          ]}>
            <MaterialIcons name="qr-code-scanner" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.instructionText}>
            <Text style={[
              styles.instructionTitle, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>{t('qrCode', 'printAndPlaceTitle')}</Text>
            <Text style={[
              styles.instructionDescription, 
              { 
                color: colors.icon,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>
              {t('qrCode', 'printAndPlaceDesc')}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.instructionItem,
          isRTL && { flexDirection: 'row-reverse' }
        ]}>
          <View style={[
            styles.instructionIcon, 
            { 
              backgroundColor: colors.primary,
              marginRight: isRTL ? 0 : 16,
              marginLeft: isRTL ? 16 : 0
            }
          ]}>
            <Ionicons name="phone-portrait-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.instructionText}>
            <Text style={[
              styles.instructionTitle, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>{t('qrCode', 'scanToViewTitle')}</Text>
            <Text style={[
              styles.instructionDescription, 
              { 
                color: colors.icon,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>
              {t('qrCode', 'scanToViewDesc')}
            </Text>
          </View>
        </View>
        
        <View style={[
          styles.instructionItem,
          isRTL && { flexDirection: 'row-reverse' }
        ]}>
          <View style={[
            styles.instructionIcon, 
            { 
              backgroundColor: colors.primary,
              marginRight: isRTL ? 0 : 16,
              marginLeft: isRTL ? 16 : 0
            }
          ]}>
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.instructionText}>
            <Text style={[
              styles.instructionTitle, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>{t('qrCode', 'placeOrdersTitle')}</Text>
            <Text style={[
              styles.instructionDescription, 
              { 
                color: colors.icon,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>
              {t('qrCode', 'placeOrdersDesc')}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  selectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  qrContainer: {
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  qrContent: {
    padding: 20,
    alignItems: 'center',
  },
  qrImageContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 6,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  instructionsContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 40,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  instructionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 