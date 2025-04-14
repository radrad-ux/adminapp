import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { uploadImageToBlob } from '../services/blobStorage';
import apiClient from '../services/api';
import { Picker } from '@react-native-picker/picker';
import { formatPrice } from '../utils/currencyUtils';
import { useLanguage } from '../context/LanguageContext';

// Define types
type Category = {
  id: string;
  _id?: string;
  name: string;
};

type MenuItemOption = {
  name: string;
  additionalPrice: number;
};

type MenuItem = {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  price: number;
  available?: boolean;
  category?: string | Category;
  categoryId?: string;
  categoryName?: string;
  image?: string;
  images?: string[];
  options?: MenuItemOption[];
};

type EditMenuItemModalProps = {
  visible: boolean;
  menuItem: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: (updatedItem: MenuItem) => Promise<void>;
};

const EditMenuItemModal = ({
  visible,
  menuItem,
  categories,
  onClose,
  onSave,
}: EditMenuItemModalProps) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { t, isRTL } = useLanguage();
  const [formData, setFormData] = useState<MenuItem>({
    id: '',
    name: '',
    description: '',
    price: 0,
    available: true,
    categoryId: '',
    images: [],
    options: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageToRemove, setImageToRemove] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddOption, setShowAddOption] = useState(false);
  const [currentOption, setCurrentOption] = useState<MenuItemOption | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);

  // Initialize form data when menu item changes
  useEffect(() => {
    console.log('EditMenuItemModal: Menu item or categories changed', { menuItem, categoriesCount: categories?.length });
    
    if (menuItem) {
      // Extract category ID from the menu item
      let categoryId = '';
      if (typeof menuItem.category === 'object' && menuItem.category) {
        categoryId = menuItem.category._id || menuItem.category.id;
      } else if (menuItem.categoryId) {
        categoryId = menuItem.categoryId;
      } else if (typeof menuItem.category === 'string') {
        categoryId = menuItem.category;
      }

      // Ensure options is always an array, even if it's undefined or null in the menuItem
      const options = Array.isArray(menuItem.options) ? [...menuItem.options] : [];
      
      // Log options for debugging
      console.log('Setting options in form data:', JSON.stringify(options));

      setFormData({
        id: menuItem.id || menuItem._id || '',
        _id: menuItem._id || menuItem.id || '',
        name: menuItem.name || '',
        description: menuItem.description || '',
        price: menuItem.price || 0,
        available: menuItem.available !== false,
        categoryId: categoryId,
        images: menuItem.images || [],
        options: options,
      });
    } else {
      // Reset form for a new menu item
      let defaultCategoryId = '';
      
      // Find the first valid category ID
      if (categories && categories.length > 0) {
        const firstCategory = categories[0];
        defaultCategoryId = firstCategory._id || firstCategory.id || '';
      }
      
      console.log('Initializing new menu item with default category ID:', defaultCategoryId);
      
      setFormData({
        id: '',
        _id: '',
        name: '',
        description: '',
        price: 0,
        available: true,
        categoryId: defaultCategoryId,
        images: [],
        options: [],
      });
    }
  }, [menuItem, categories]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t('common', 'permissionRequired', 'Permission Required'), 
            t('menuItems', 'cameraPermission', 'Sorry, we need camera roll permissions to upload images!')
          );
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        
        // Upload image to blob storage
        setUploadingImage(true);
        try {
          const imageUrl = await uploadImageToBlob(selectedImage.uri, 'menuItem');
          if (imageUrl) {
            // Add the new image to images array
            setFormData(prev => ({
              ...prev,
              images: [...(prev.images || []), imageUrl],
            }));
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert(
            t('common', 'uploadFailed', 'Upload Failed'), 
            t('menuItems', 'uploadImageError', 'Failed to upload image. Please try again.')
          );
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        t('common', 'error', 'Error'), 
        t('menuItems', 'imageSelectionError', 'An error occurred while selecting an image')
      );
      setUploadingImage(false);
    }
  };

  const confirmRemoveImage = (imageUrl: string) => {
    setImageToRemove(imageUrl);
    Alert.alert(
      t('menuItems', 'removeImageTitle'),
      t('menuItems', 'removeImageConfirm'),
      [
        { text: t('common', 'cancel'), style: 'cancel', onPress: () => setImageToRemove(null) },
        { 
          text: t('common', 'delete'), 
          style: 'destructive', 
          onPress: () => {
            // Filter out the image to remove
            setFormData(prev => ({
              ...prev,
              images: prev.images?.filter(img => img !== imageUrl) || []
            }));
            setImageToRemove(null);
          }
        },
      ]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = t('menuItems', 'nameLabel') + ' ' + t('common', 'isRequired');
    }
    
    if (formData.price <= 0) {
      newErrors.price = t('menuItems', 'priceLabel') + ' ' + t('menuItems', 'mustBeGreaterThanZero');
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = t('menuItems', 'selectCategoryError');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Form is invalid, show error message
      Alert.alert(t('common', 'error'), t('menuItems', 'correctFormErrors'));
      return;
    }

    setLoading(true);
    try {
      // Create a copy of the form data for submission
      const submissionData = { ...formData };
      
      // Make sure categoryId is properly set
      if (!submissionData.categoryId && categories.length > 0) {
        // If somehow categoryId is empty, use the first category as fallback
        submissionData.categoryId = categories[0]._id || categories[0].id;
        console.log('Using fallback category ID:', submissionData.categoryId);
      }
      
      // Ensure all number fields are proper numbers, not strings
      submissionData.price = typeof submissionData.price === 'string' 
        ? parseFloat(submissionData.price) 
        : submissionData.price;
      
      console.log('Submitting menu item data:', submissionData);
      await onSave(submissionData);
      onClose();
    } catch (error) {
      console.error('Error saving menu item:', error);
      Alert.alert(t('common', 'error'), t('menuItems', 'saveError'));
    } finally {
      setLoading(false);
    }
  };

  // Option management functions
  const addNewOption = () => {
    console.log('Adding new option');
    setCurrentOption({
      name: '',
      additionalPrice: 0
    });
    setEditingOptionIndex(null);
    setShowAddOption(true);
  };

  const editOption = (index: number) => {
    console.log('Editing option at index:', index);
    if (!formData.options || !formData.options[index]) {
      console.error('No option found at index:', index);
      return;
    }
    
    const option = formData.options[index];
    setCurrentOption({
      ...option,
      additionalPrice: typeof option.additionalPrice === 'number' ? option.additionalPrice : parseFloat(option.additionalPrice) || 0
    });
    setEditingOptionIndex(index);
    setShowAddOption(true);
    
    // Scroll to the option editor section
    setTimeout(() => {
      if (Platform.OS === 'web') {
        // For web
        const optionEditorElement = document.getElementById('option-editor');
        if (optionEditorElement) {
          optionEditorElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  };

  const removeOption = (index: number) => {
    Alert.alert(
      t('menuItems', 'removeOptionTitle'),
      t('menuItems', 'removeOptionConfirm'),
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        { 
          text: t('common', 'delete'), 
          style: 'destructive', 
          onPress: () => {
            const updatedOptions = [...formData.options];
            updatedOptions.splice(index, 1);
            setFormData(prev => ({
              ...prev,
              options: updatedOptions
            }));
          }
        },
      ]
    );
  };

  const saveOption = () => {
    if (!currentOption?.name?.trim()) {
      Alert.alert(t('common', 'error'), t('menuItems', 'optionNameRequired'));
      return;
    }

    // Ensure additionalPrice is stored as a number to match web app expectations
    const numericPrice = typeof currentOption.additionalPrice === 'number' 
      ? currentOption.additionalPrice 
      : parseFloat(currentOption.additionalPrice) || 0;
      
    // Format to 2 decimal places to ensure consistent pricing
    const formattedPrice = parseFloat(numericPrice.toFixed(2));
    
    const optionToSave = {
      ...currentOption,
      name: currentOption.name.trim(),
      additionalPrice: formattedPrice,
      price: formattedPrice // Add price field for compatibility with web app
    };

    console.log('Saving option:', optionToSave);

    // Ensure formData.options is always an array
    const updatedOptions = [...(formData.options || [])];
    if (editingOptionIndex !== null) {
      // Update existing option
      updatedOptions[editingOptionIndex] = optionToSave;
    } else {
      // Add new option
      updatedOptions.push(optionToSave);
    }

    console.log('Updated options array:', updatedOptions);

    setFormData(prev => ({
      ...prev,
      options: updatedOptions
    }));
    
    // Clear the option editor and hide it
    setShowAddOption(false);
    setCurrentOption(null);
    setEditingOptionIndex(null);
    
    // Show success message
    if (Platform.OS !== 'web') {
      // Only show on mobile platforms to avoid disrupting web experience
      Alert.alert(
        t('common', 'success'),
        editingOptionIndex !== null 
          ? t('menuItems', 'optionUpdated', 'Option updated successfully') 
          : t('menuItems', 'optionAdded', 'Option added successfully'),
        [{ text: t('common', 'ok') }]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={[
            styles.modalHeader, 
            isRTL && styles.modalHeaderRTL
          ]}>
            <Text style={[
              styles.modalTitle, 
              { color: colors.text },
              isRTL && { textAlign: 'right' }
            ]}>
              {menuItem ? t('menuItems', 'editMenuItem') : t('menuItems', 'addNewMenuItem')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Main form content with integrated option editor */}
          <ScrollView style={styles.form}>
            {/* Name input */}
            <Text style={[
              styles.label, 
              { color: colors.text },
              isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
            ]}>
              {t('menuItems', 'nameLabel')} *
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  color: colors.text,
                  backgroundColor: colors.backgroundVariant,
                  borderColor: errors.name ? colors.error : colors.border,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              placeholder={t('menuItems', 'namePlaceholder', 'Item name')}
              placeholderTextColor={colors.placeholderText}
            />
            {errors.name && (
              <Text style={[
                styles.errorText, 
                { color: colors.error },
                isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
              ]}>
                {errors.name}
              </Text>
            )}

            {/* Description input */}
            <Text style={[
              styles.label, 
              { color: colors.text },
              isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
            ]}>
              {t('menuItems', 'descriptionLabel')}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { 
                  color: colors.text,
                  backgroundColor: colors.backgroundVariant,
                  borderColor: colors.border,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}
              value={formData.description}
              onChangeText={(text) => handleChange('description', text)}
              placeholder={t('menuItems', 'descriptionPlaceholder', 'Item description')}
              placeholderTextColor={colors.placeholderText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Price input */}
            <Text style={[
              styles.label, 
              { color: colors.text },
              isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
            ]}>
              {t('menuItems', 'priceLabel')} *
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  color: colors.text,
                  backgroundColor: colors.backgroundVariant,
                  borderColor: errors.price ? colors.error : colors.border,
                  textAlign: isRTL ? 'right' : 'left'
                }
              ]}
              value={formData.price?.toString()}
              onChangeText={(text) => {
                const price = parseFloat(text) || 0;
                handleChange('price', price);
              }}
              placeholder={t('menuItems', 'pricePlaceholder', 'Price')}
              placeholderTextColor={colors.placeholderText}
              keyboardType="numeric"
            />
            {errors.price && (
              <Text style={[
                styles.errorText, 
                { color: colors.error },
                isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
              ]}>
                {errors.price}
              </Text>
            )}

            {/* Category dropdown */}
            <Text style={[
              styles.label, 
              { color: colors.text },
              isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
            ]}>
              {t('menuItems', 'categoryLabel')} *
            </Text>
            <View style={[
              styles.pickerContainer,
              { 
                backgroundColor: colors.backgroundVariant,
                borderColor: errors.categoryId ? colors.error : colors.border
              }
            ]}>
              <Picker
                selectedValue={formData.categoryId}
                onValueChange={(itemValue) => handleChange('categoryId', itemValue)}
                style={[
                  styles.picker, 
                  { color: colors.text },
                  isRTL && { textAlign: 'right', direction: 'rtl' }
                ]}
                dropdownIconColor={colors.icon}
                enabled={categories.length > 0}
              >
                {categories.length > 0 ? (
                  <>
                    {formData.categoryId === '' && (
                      <Picker.Item label={t('menuItems', 'selectCategory')} value="" />
                    )}
                    {categories.map((category) => (
                      <Picker.Item 
                        key={category.id || category._id} 
                        label={category.name} 
                        value={category.id || category._id} 
                      />
                    ))}
                  </>
                ) : (
                  <Picker.Item label={t('menuItems', 'noCategories', 'No categories available')} value="" />
                )}
              </Picker>
            </View>
            {errors.categoryId && (
              <Text style={[
                styles.errorText, 
                { color: colors.error },
                isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
              ]}>
                {errors.categoryId}
              </Text>
            )}

            {/* Availability toggle */}
            <View style={[
              styles.availabilityContainer,
              isRTL && styles.availabilityContainerRTL
            ]}>
              <Text style={[
                styles.label, 
                { color: colors.text },
                isRTL && { textAlign: 'right' }
              ]}>
                {t('menuItems', 'availabilityLabel')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: formData.available
                      ? `${colors.primary}50`
                      : 'transparent',
                    borderColor: formData.available 
                      ? colors.primary 
                      : colors.border,
                  }
                ]}
                onPress={() => handleChange('available', !formData.available)}
              >
                <Text style={[
                  styles.toggleText,
                  { color: formData.available ? colors.primary : colors.text }
                ]}>
                  {formData.available ? t('menuItems', 'availabilityAvailable') : t('menuItems', 'availabilityUnavailable')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Options Section - Making it more clearly visible */}
            <View style={[
              styles.sectionHeader,
              isRTL && styles.sectionHeaderRTL,
              { marginTop: 25, marginBottom: 15, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 }
            ]}>
              <Text style={[
                styles.sectionTitle, 
                { color: colors.text },
                isRTL && { textAlign: 'right' }
              ]}>
                {t('menuItems', 'optionsSection', 'Options')}
              </Text>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={addNewOption}
              >
                <Text style={styles.addButtonText}>{t('menuItems', 'addOption', 'Add Option')}</Text>
              </TouchableOpacity>
            </View>

            {/* Option Editor - Shown when adding/editing an option */}
            {showAddOption && (
              <View 
                style={[
                  styles.optionEditorContainer,
                  { 
                    backgroundColor: colors.cardBackground || colors.backgroundVariant,
                    borderColor: colors.border,
                    marginBottom: 20,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.primary
                  }
                ]}
                id="option-editor"
              >
                <View style={{ 
                  flexDirection: isRTL ? 'row-reverse' : 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 15,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(0,0,0,0.05)',
                  paddingBottom: 10
                }}>
                  <Text style={[
                    styles.subSectionTitle, 
                    { color: colors.text },
                    isRTL && { textAlign: 'right' }
                  ]}>
                    {editingOptionIndex !== null ? t('menuItems', 'updateOption') : t('menuItems', 'addOption')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddOption(false);
                      setCurrentOption(null);
                      setEditingOptionIndex(null);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close-circle" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <Text style={[
                  styles.label, 
                  { color: colors.text },
                  isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
                ]}>
                  {t('menuItems', 'optionNameLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      color: colors.text,
                      backgroundColor: 'transparent',
                      borderColor: colors.border,
                      textAlign: isRTL ? 'right' : 'left',
                      borderRadius: 4
                    }
                  ]}
                  value={currentOption?.name || ''}
                  onChangeText={(text) => setCurrentOption(prev => ({...prev, name: text}))}
                  placeholder={t('menuItems', 'optionNamePlaceholder')}
                  placeholderTextColor={colors.placeholderText}
                  autoFocus={Platform.OS === 'web'}
                />

                <Text style={[
                  styles.label, 
                  { color: colors.text },
                  isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
                ]}>
                  {t('menuItems', 'additionalPriceLabel')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      color: colors.text,
                      backgroundColor: 'transparent',
                      borderColor: colors.border,
                      textAlign: isRTL ? 'right' : 'left',
                      borderRadius: 4
                    }
                  ]}
                  value={currentOption?.additionalPrice?.toString() || '0'}
                  onChangeText={(text) => {
                    // Strip any non-numeric characters except decimal point
                    const sanitizedText = text.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = sanitizedText.split('.');
                    const cleanText = parts.length > 1 
                      ? `${parts[0]}.${parts.slice(1).join('')}` 
                      : sanitizedText;
                      
                    const price = parseFloat(cleanText) || 0;
                    setCurrentOption(prev => ({
                      ...prev, 
                      additionalPrice: price
                    }));
                  }}
                  placeholder={t('menuItems', 'additionalPricePlaceholder')}
                  placeholderTextColor={colors.placeholderText}
                  keyboardType="numeric"
                />

                {/* Option Editor Actions */}
                <View style={[
                  styles.buttonContainer,
                  isRTL && styles.buttonContainerRTL,
                  { marginTop: 10, marginBottom: 0 }
                ]}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                    onPress={() => {
                      setShowAddOption(false);
                      setCurrentOption(null);
                      setEditingOptionIndex(null);
                    }}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>{t('common', 'cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      { backgroundColor: colors.primary }
                    ]}
                    onPress={saveOption}
                  >
                    <Text style={[styles.buttonText, styles.saveButtonText]}>
                      {editingOptionIndex !== null ? t('menuItems', 'updateOption') : t('menuItems', 'addOption')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Options List */}
            <View style={{ marginBottom: 20 }}>
              {formData.options && formData.options.length > 0 ? (
                formData.options.map((option, index) => (
                  <View key={index} style={[styles.optionCard, { backgroundColor: colors.backgroundVariant }]}>
                    <View style={[
                      styles.optionCardHeader,
                      isRTL && styles.optionCardHeaderRTL
                    ]}>
                      <Text style={[
                        styles.optionCardTitle, 
                        { color: colors.text },
                        isRTL && { textAlign: 'right' }
                      ]}>
                        {option.name}
                      </Text>
                      <Text style={[styles.optionPrice, { color: colors.primary }]}>
                        {option.additionalPrice > 0 ? `+${formatPrice(option.additionalPrice)}` : ''}
                      </Text>
                    </View>
                    <View style={[
                      styles.optionCardActions,
                      isRTL && styles.optionCardActionsRTL
                    ]}>
                      <TouchableOpacity
                        style={[
                          styles.optionButton, 
                          { borderColor: colors.primary },
                          isRTL && styles.optionButtonRTL
                        ]}
                        onPress={() => editOption(index)}
                      >
                        <Ionicons name="pencil" size={16} color={colors.primary} />
                        <Text style={[
                          styles.optionButtonText, 
                          { color: colors.primary },
                          isRTL && styles.optionButtonTextRTL
                        ]}>
                          {t('common', 'edit', 'Edit')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.optionButton, 
                          { borderColor: colors.error },
                          isRTL && styles.optionButtonRTL
                        ]}
                        onPress={() => removeOption(index)}
                      >
                        <Ionicons name="trash" size={16} color={colors.error} />
                        <Text style={[
                          styles.optionButtonText, 
                          { color: colors.error },
                          isRTL && styles.optionButtonTextRTL
                        ]}>
                          {t('menuItems', 'removeOption', 'Remove')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[
                  styles.noItemsText, 
                  { color: colors.placeholderText, marginBottom: 15, textAlign: 'center' },
                  isRTL && { textAlign: 'right' }
                ]}>
                  {t('menuItems', 'noOptionsText', 'No options added yet. Add options for this menu item.')}
                </Text>
              )}
            </View>

            {/* Image gallery */}
            <Text style={[
              styles.label, 
              { color: colors.text, marginTop: 15 },
              isRTL && { textAlign: 'right', alignSelf: 'flex-end' }
            ]}>
              {t('menuItems', 'imageLabel')}
            </Text>
            <View style={styles.imagesContainer}>
              {formData.images && formData.images.length > 0 ? (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={isRTL && { flexDirection: 'row-reverse' }}
                >
                  {formData.images.map((imageUrl, index) => (
                    <View key={index} style={[
                      styles.imageContainer,
                      isRTL && { marginLeft: 10, marginRight: 0 }
                    ]}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={[
                          styles.removeImageButton, 
                          { backgroundColor: colors.error },
                          isRTL && { left: 5, right: 'auto' }
                        ]}
                        onPress={() => confirmRemoveImage(imageUrl)}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={[
                  styles.noImagesText, 
                  { color: colors.placeholderText },
                  isRTL && { textAlign: 'right' }
                ]}>
                  {t('menuItems', 'noImagesText')}
                </Text>
              )}

              <TouchableOpacity
                style={[
                  styles.addImageButton,
                  { 
                    backgroundColor: colors.backgroundVariant,
                    borderColor: colors.border
                  },
                  isRTL && { flexDirection: 'row-reverse' }
                ]}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="add" size={24} color={colors.primary} />
                    <Text style={[
                      styles.addImageText, 
                      { color: colors.primary },
                      isRTL && { marginRight: 5, marginLeft: 0 }
                    ]}>
                      {t('menuItems', 'addImageButton')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Save and Cancel buttons */}
            <View style={[
              styles.buttonContainer,
              isRTL && styles.buttonContainerRTL
            ]}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>{t('common', 'cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.buttonText, styles.saveButtonText]}>{t('common', 'save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  form: {
    padding: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  availabilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  availabilityContainerRTL: {
    flexDirection: 'row-reverse',
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleText: {
    fontWeight: '600',
  },
  imagesContainer: {
    marginBottom: 15,
  },
  imageContainer: {
    marginRight: 10,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesText: {
    marginBottom: 10,
    fontStyle: 'italic',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 10,
  },
  addImageText: {
    marginLeft: 5,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
  },
  buttonContainerRTL: {
    flexDirection: 'row-reverse',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
    borderWidth: 1,
  },
  saveButton: {
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  errorText: {
    marginTop: 5,
    marginBottom: 10,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  noItemsText: {
    marginBottom: 15,
    fontStyle: 'italic',
  },
  optionCard: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  optionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionCardHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  optionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  optionCardActionsRTL: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
  },
  optionButtonRTL: {
    flexDirection: 'row-reverse',
    marginLeft: 0,
    marginRight: 10,
  },
  optionButtonText: {
    fontSize: 12,
    marginLeft: 5,
  },
  optionButtonTextRTL: {
    marginLeft: 0,
    marginRight: 5,
  },
  optionSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionSettingRTL: {
    flexDirection: 'row-reverse',
  },
  optionItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  optionItemContent: {
    flex: 1,
  },
  optionItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionItemPrice: {
    fontSize: 12,
  },
  optionItemActions: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionEditorContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default EditMenuItemModal; 