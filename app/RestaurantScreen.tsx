import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { fetchRestaurantInfo, updateRestaurantInfo } from '../services/restaurantService';
import useFetch from '../hooks/useFetch';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import * as ImagePicker from 'expo-image-picker';
import apiClient, { secureLog } from '../services/api';
import { uploadImageToBlob } from '../services/blobStorage';
import { useLanguage } from '../context/LanguageContext';
import TranslatedText from '../components/TranslatedText';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RestaurantScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  
  // State management
  const [editing, setEditing] = useState(false);
  const [isManagingBanners, setIsManagingBanners] = useState(false);
  const [selectedBannersToRemove, setSelectedBannersToRemove] = useState([]);
  const [logoUpload, setLogoUpload] = useState(null);
  const [bannerUpload, setBannerUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoadError, setImageLoadError] = useState({ logo: false, banner: false });
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerFlatListRef = useRef(null);
  
  // Restaurant info initial state
  const initialRestaurantState = {
    name: 'Restaurant Name',
    phoneNumber: '+1 234 567 8900',
    mapsURL: 'https://maps.google.com/',
    logoImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    bannerImages: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'],
  };

  // Fetch restaurant data
  const { 
    data: restaurant,
    isLoading,
    error,
    refetch,
    setData: setRestaurant
  } = useFetch(
    async () => {
      try {
        const data = await fetchRestaurantInfo();
        if (!data) throw new Error('No restaurant data available');
        
        // Format images
        const formattedBanners = data.bannerImages?.map(img => formatImageUrl(img)) || [];
        const logoImage = data.logoImage ? formatImageUrl(data.logoImage) : initialRestaurantState.logoImage;
        
        // Reset image load errors
        setImageLoadError({ logo: false, banner: false });
        
        return {
          name: data.name || initialRestaurantState.name,
          phoneNumber: data.phoneNumber || initialRestaurantState.phoneNumber,
          mapsURL: data.mapsURL || initialRestaurantState.mapsURL,
          logoImage: logoImage,
          bannerImages: formattedBanners.length > 0 ? formattedBanners : initialRestaurantState.bannerImages,
        };
      } catch (err) {
        return initialRestaurantState;
      }
    },
    [isLoggedIn, user],
    {
      initialData: initialRestaurantState,
      enabled: isLoggedIn,
      onError: () => Alert.alert(t('restaurant', 'dataError'), t('restaurant', 'dataErrorDetails'))
    }
  );

  const [formData, setFormData] = useState(restaurant || initialRestaurantState);

  // Update form data when restaurant data changes
  useEffect(() => {
    if (restaurant) {
      setFormData(restaurant);
    }
  }, [restaurant]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) router.replace('/login');
  }, [isLoggedIn, router]);
  
  // Request image permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('restaurant', 'permissionRequired'), t('restaurant', 'permissionDetails'));
        }
      }
    })();
  }, []);

  // Auto scroll carousel
  useEffect(() => {
    if (restaurant?.bannerImages?.length > 1 && !editing) {
      const interval = setInterval(() => {
        const nextIndex = (currentBannerIndex + 1) % restaurant.bannerImages.length;
        setCurrentBannerIndex(nextIndex);
        bannerFlatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [restaurant, currentBannerIndex, editing]);

  // Helper functions
  const formatImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return `https://dmenu-five.vercel.app${url}`;
    return `https://dmenu-five.vercel.app/${url}`;
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  
  const openMapsUrl = () => {
    if (restaurant?.mapsURL) Linking.openURL(restaurant.mapsURL);
  };
  
  const handleImageError = (type) => setImageLoadError(prev => ({ ...prev, [type]: true }));
  
  const handleBannerScroll = (event) => {
    if (!restaurant?.bannerImages || restaurant.bannerImages.length <= 1) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentBannerIndex(index);
  };

  const toggleBannerSelection = (banner) => {
    setSelectedBannersToRemove(prev => 
      prev.includes(banner) ? prev.filter(b => b !== banner) : [...prev, banner]
    );
  };

  const pickLogoImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert(t('restaurant', 'imageUploadError'), t('restaurant', 'imageSizeError'));
    }
  };
  
  const pickBannerImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setBannerUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert(t('restaurant', 'imageUploadError'), t('restaurant', 'imageSizeError'));
    }
  };
  
  const uploadImage = async (imageUri, type) => {
    if (!imageUri) return null;
    try {
      const imageUrl = await uploadImageToBlob(imageUri, type);
      return imageUrl || null;
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload image. Please try again later.');
      throw error;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setIsUploading(true);
    
    try {
      const updatedData = {};
      
      // Text fields
      if (formData.name !== restaurant.name) updatedData.name = formData.name;
      if (formData.phoneNumber !== restaurant.phoneNumber) updatedData.phoneNumber = formData.phoneNumber;
      if (formData.mapsURL !== restaurant.mapsURL) updatedData.mapsURL = formData.mapsURL;
      
      // Logo image
      if (logoUpload) {
        const uploadedLogoUrl = await uploadImage(logoUpload.uri, 'logo');
        if (uploadedLogoUrl) updatedData.logoImage = uploadedLogoUrl;
      } else if (restaurant.logoImage) {
        updatedData.logoImage = restaurant.logoImage;
      }
      
      // Banner image
      if (bannerUpload) {
        const uploadedBannerUrl = await uploadImage(bannerUpload.uri, 'banner');
        if (uploadedBannerUrl) {
          updatedData.bannerImages = restaurant.bannerImages?.length > 0 
            ? [...restaurant.bannerImages, uploadedBannerUrl]
            : [uploadedBannerUrl];
        }
      } else if (restaurant.bannerImages) {
        updatedData.bannerImages = restaurant.bannerImages;
      }
      
      // Check if there's anything to update
      if (Object.keys(updatedData).length === 0) {
        Alert.alert(t('common', 'info'), t('restaurant', 'noChanges'));
        setIsSaving(false);
        setIsUploading(false);
        setEditing(false);
        return;
      }
      
      setIsUploading(false);
      
      // Call API to update restaurant info
      const updatedResult = await updateRestaurantInfo(updatedData);
      
      if (updatedResult) {
        setRestaurant(updatedResult.data || updatedResult);
        Alert.alert(t('restaurant', 'saveSuccess'));
      }
      
      setLogoUpload(null);
      setBannerUpload(null);
      setEditing(false);
    } catch (error) {
      Alert.alert(t('common', 'error'), t('restaurant', 'saveError'));
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleRemoveBanners = async () => {
    if (selectedBannersToRemove.length === 0) {
      Alert.alert(t('common', 'info'), t('restaurant', 'noBannersSelected'));
      return;
    }
    
    if (restaurant.bannerImages.length <= selectedBannersToRemove.length) {
      Alert.alert(t('common', 'error'), t('restaurant', 'keepOneBanner'));
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updatedBanners = restaurant.bannerImages.filter(banner => 
        !selectedBannersToRemove.includes(banner)
      );
      
      const updatedResult = await updateRestaurantInfo({ bannerImages: updatedBanners });
      
      if (updatedResult) {
        setRestaurant(updatedResult.data || updatedResult);
        setSelectedBannersToRemove([]);
        setIsManagingBanners(false);
        Alert.alert(t('restaurant', 'saveSuccess'));
      }
    } catch (error) {
      Alert.alert(t('common', 'error'), t('restaurant', 'saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // View components
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Please login to access restaurant information</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonLoader.RestaurantInfo />
      </View>
    );
  }

  if (error && !restaurant) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text, marginBottom: 20 }}>Failed to load restaurant information</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Banner display component (replacing carousel)
  const renderBannerThumbnails = () => (
    <View style={styles.bannersContainer}>
      <View style={styles.bannersHeader}>
        <Text style={[styles.bannersTitle, { color: colors.text }]}>
          {t('restaurant', 'banners')} ({restaurant.bannerImages.length})
        </Text>
        {editing && (
          <TouchableOpacity
            style={[styles.manageBannersButton, { backgroundColor: isManagingBanners ? colors.error : colors.primary }]}
            onPress={() => {
              if (isManagingBanners) {
                setIsManagingBanners(false);
                setSelectedBannersToRemove([]);
              } else {
                setIsManagingBanners(true);
              }
            }}
          >
            <MaterialIcons 
              name={isManagingBanners ? "close" : "edit"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.manageBannersText}>
              {isManagingBanners ? t('common', 'cancel') : t('restaurant', 'manageBanners')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bannersGrid}>
        {restaurant.bannerImages.map((item, index) => (
          <TouchableOpacity 
            key={`banner-${index}`}
            style={[
              styles.bannerThumbnailContainer,
              selectedBannersToRemove.includes(item) && styles.selectedBanner
            ]}
            onPress={() => isManagingBanners ? toggleBannerSelection(item) : null}
            activeOpacity={isManagingBanners ? 0.7 : 1}
          >
            <Image
              source={{ uri: item }}
              style={styles.bannerThumbnailLarge}
              resizeMode="cover"
              onError={() => handleImageError('banner')}
            />
            
            {/* Selection overlay */}
            {isManagingBanners && (
              <View
                style={[
                  styles.thumbnailOverlay,
                  { 
                    backgroundColor: selectedBannersToRemove.includes(item) 
                      ? 'rgba(255, 59, 48, 0.5)' 
                      : 'rgba(0, 0, 0, 0.3)' 
                  }
                ]}
              >
                <MaterialIcons 
                  name={selectedBannersToRemove.includes(item) ? "delete" : "add"} 
                  size={24} 
                  color="#fff" 
                />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Banner management buttons */}
      {isManagingBanners && selectedBannersToRemove.length > 0 && (
        <TouchableOpacity
          style={[styles.removeBannersButton, { backgroundColor: colors.error }]}
          onPress={handleRemoveBanners}
        >
          <MaterialIcons name="delete" size={18} color="#fff" />
          <Text style={styles.removeBannersText}>
            {t('restaurant', 'removeBanners')} ({selectedBannersToRemove.length})
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // View mode
  const renderViewMode = () => (
    <View style={[styles.contentContainer, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      {/* Restaurant Info Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={{ 
                uri: imageLoadError.logo 
                  ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'
                  : restaurant.logoImage 
              }} 
              style={styles.logoImage} 
              resizeMode="cover"
              onError={() => handleImageError('logo')}
            />
          </View>
          
          <View style={styles.infoContent}>
            <Text style={[styles.restaurantName, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {restaurant.name}
            </Text>
            
            <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.iconWrapper}>
                <FontAwesome5 
                  name="phone-alt" 
                  size={16} 
                  color={colors.primary} 
                />
              </View>
              <Text style={[styles.infoText, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {restaurant.phoneNumber}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={openMapsUrl} 
              style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              <View style={styles.iconWrapper}>
                <FontAwesome5 
                  name="map-marker-alt" 
                  size={16} 
                  color={colors.primary} 
                />
              </View>
              <Text style={[
                styles.infoText, 
                { 
                  color: colors.primary, 
                  textDecorationLine: 'underline', 
                  textAlign: isRTL ? 'right' : 'left' 
                }
              ]}>
                <TranslatedText section="common" textKey="viewLocation" />
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner Images Section */}
        <View style={styles.sectionDivider} />
        
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('restaurant', 'gallerySectionTitle')}
          </Text>
        </View>
        
        {renderBannerThumbnails()}

        {/* Edit Button */}
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.primary }]} 
          onPress={() => setEditing(true)}
        >
          <MaterialIcons 
            name="edit" 
            size={20} 
            color="#fff" 
            style={isRTL ? styles.buttonIconRtl : styles.buttonIcon} 
          />
          <TranslatedText section="restaurant" textKey="editButton" style={styles.buttonText} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Edit mode
  const renderEditMode = () => (
    <View style={[styles.contentContainer, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Restaurant Name Field */}
        <View style={styles.formField}>
          <TranslatedText 
            section="restaurant" 
            textKey="nameLabel" 
            style={[styles.formLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} 
          />
          <TextInput
            style={[
              styles.textInput, 
              { 
                backgroundColor: colorScheme === 'dark' ? colors.cardDark : '#f5f5f5',
                color: colors.text, 
                borderColor: colors.border,
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder={t('restaurant', 'nameLabel')}
            placeholderTextColor={colors.icon}
          />
        </View>

        {/* Phone Number Field */}
        <View style={styles.formField}>
          <TranslatedText 
            section="restaurant" 
            textKey="phoneLabelNumber" 
            style={[styles.formLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} 
          />
          <TextInput
            style={[
              styles.textInput, 
              { 
                backgroundColor: colorScheme === 'dark' ? colors.cardDark : '#f5f5f5',
                color: colors.text, 
                borderColor: colors.border,
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}
            value={formData.phoneNumber}
            onChangeText={(value) => handleChange('phoneNumber', value)}
            placeholder={t('restaurant', 'phoneLabelNumber')}
            placeholderTextColor={colors.icon}
            keyboardType="phone-pad"
          />
        </View>

        {/* Maps URL Field */}
        <View style={styles.formField}>
          <TranslatedText 
            section="restaurant" 
            textKey="mapURLLabel" 
            style={[styles.formLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} 
          />
          <TextInput
            style={[
              styles.textInput, 
              { 
                backgroundColor: colorScheme === 'dark' ? colors.cardDark : '#f5f5f5',
                color: colors.text, 
                borderColor: colors.border,
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}
            value={formData.mapsURL}
            onChangeText={(value) => handleChange('mapsURL', value)}
            placeholder={t('restaurant', 'mapURLLabel')}
            placeholderTextColor={colors.icon}
          />
        </View>

        {/* Logo Image Field */}
        <View style={styles.formField}>
          <TranslatedText 
            section="restaurant" 
            textKey="logoLabel" 
            style={[styles.formLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} 
          />
          <View style={styles.imageUploadContainer}>
            <Image 
              source={{ uri: logoUpload ? logoUpload.uri : formData.logoImage }} 
              style={styles.imagePreview} 
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={[styles.simpleButton, { backgroundColor: colors.primary }]}
              onPress={pickLogoImage}
            >
              <MaterialIcons name="file-upload" size={20} color="#fff" />
              <Text style={styles.simpleButtonText}>
                {t('restaurant', 'uploadLogo')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner Image Field */}
        <View style={styles.formField}>
          <TranslatedText 
            section="restaurant" 
            textKey="bannerLabel" 
            style={[styles.formLabel, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} 
          />
          
          {/* Current banners preview */}
          {formData.bannerImages && formData.bannerImages.length > 0 && (
            <View style={styles.currentBannersContainer}>
              <View style={styles.bannersHeader}>
                <Text style={[styles.currentBannersText, { color: colors.text }]}>
                  {t('restaurant', 'banners')} ({formData.bannerImages.length})
                </Text>
              </View>
              <View style={styles.editBannersGrid}>
                {formData.bannerImages.map((banner, index) => (
                  <View key={`edit-thumbnail-${index}`} style={styles.editThumbnailContainer}>
                    <Image 
                      source={{ uri: banner }}
                      style={styles.editBannerThumbnail}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* New banner preview */}
          {bannerUpload && (
            <View style={styles.newBannerContainer}>
              <Text style={[styles.bannerSectionTitle, { color: colors.text }]}>
                {t('restaurant', 'newBanner')}
              </Text>
              <Image 
                source={{ uri: bannerUpload.uri }} 
                style={styles.bannerPreview} 
                resizeMode="cover"
              />
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.simpleButton, { backgroundColor: colors.primary }]}
            onPress={pickBannerImage}
          >
            <MaterialIcons name="add-photo-alternate" size={20} color="#fff" />
            <Text style={styles.simpleButtonText}>
              {t('restaurant', 'addBanner')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Actions */}
        <View style={[styles.formActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => {
              setFormData({ ...restaurant });
              setLogoUpload(null);
              setBannerUpload(null);
              setEditing(false);
            }}
            disabled={isSaving}
          >
            <TranslatedText 
              section="restaurant" 
              textKey="cancelButton" 
              style={[styles.cancelButtonText, { color: colors.text }]} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.saveButton, 
              { 
                backgroundColor: colors.primary, 
                opacity: (isSaving || isUploading) ? 0.7 : 1 
              }
            ]}
            onPress={handleSave}
            disabled={isSaving || isUploading}
          >
            {isSaving || isUploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.loadingText}>
                  {t('common', 'loading')}
                </Text>
              </View>
            ) : (
              <TranslatedText section="restaurant" textKey="saveButton" style={styles.buttonText} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TranslatedText 
          section="restaurant" 
          textKey="title" 
          style={[styles.title, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]} 
        />
        <TranslatedText 
          section="restaurant" 
          textKey="subtitle" 
          style={[styles.subtitle, { color: colors.icon, textAlign: isRTL ? 'right' : 'left' }]} 
        />
      </View>

      {editing ? renderEditMode() : renderViewMode()}
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
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginRight: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
  },
  infoContent: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoText: {
    fontSize: 17,
    letterSpacing: 0.3,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 20,
  },
  // Banners section
  bannersContainer: {
    marginBottom: 20,
  },
  bannersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bannersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  manageBannersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  manageBannersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bannersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  bannerThumbnailContainer: {
    width: '33.33%',
    padding: 4,
    marginBottom: 8,
  },
  bannerThumbnailLarge: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 16,
  },
  selectedBanner: {
    transform: [{ scale: 1.02 }],
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.6)',
  },
  removeBannersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  removeBannersText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonIconRtl: {
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  formField: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 20,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bannerPreview: {
    height: 180,
    borderRadius: 16,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 32,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  saveButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: '600',
    fontSize: 16,
  },
  currentBannersContainer: {
    marginBottom: 24,
  },
  currentBannersText: {
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  editBannersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  editThumbnailContainer: {
    width: '33.33%',
    padding: 4,
    marginBottom: 8,
  },
  editBannerThumbnail: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newBannerContainer: {
    marginBottom: 24,
  },
  simpleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  simpleButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  bannerSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
}); 