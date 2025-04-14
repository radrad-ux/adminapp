import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
  RefreshControl,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { 
  fetchCategories, 
  updateCategory, 
  createCategory, 
  deleteCategory 
} from '../services/restaurantService';
import useFetch from '../hooks/useFetch';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToBlob } from '../services/blobStorage';

type Category = {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  active: boolean;
  _id?: string; // Add for MongoDB ID support
  isActive?: boolean; // Support both active and isActive properties
  images?: string[]; // Support for images array
  image?: string; // Support for single image
};

export default function CategoriesScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryModalVisible, setNewCategoryModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
    displayOrder: 0,
    active: true,
    images: [],
    image: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  // Use our custom hook for categories data fetching
  const { 
    data: categories, 
    isLoading, 
    error,
    refetch,
    isRefetching,
    setData: setCategories
  } = useFetch(
    async () => {
      console.log('Fetching categories from API...');
      try {
        const data = await fetchCategories(true); // Force fresh data
        console.log(`Fetched ${data?.length || 0} categories`);
        
        // Map the API response to our Category type
        if (Array.isArray(data)) {
          return data.map(cat => ({
            id: cat._id || cat.id,
            _id: cat._id || cat.id,
            name: cat.name,
            description: cat.description || '',
            displayOrder: cat.displayOrder || 0,
            active: cat.isActive !== undefined ? cat.isActive : (cat.active !== undefined ? cat.active : true),
            isActive: cat.isActive !== undefined ? cat.isActive : (cat.active !== undefined ? cat.active : true),
            images: cat.images || (cat.image ? [cat.image] : []),
            image: cat.image || (cat.images && cat.images.length > 0 ? cat.images[0] : '')
          })).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        }
        return [];
      } catch (err) {
        console.error('Error in categories fetch function:', err);
        throw err;
      }
    },
    [isLoggedIn],
    {
      initialData: [],
      enabled: isLoggedIn,
      onError: (error) => {
        console.error('Error fetching categories:', error);
      }
    }
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  // Handle edit category
  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory({ ...category });
  }, []);

  // Handle save category
  const handleSaveCategory = useCallback(async () => {
    if (!editingCategory) return;
    
    try {
      const categoryId = editingCategory._id || editingCategory.id;
      console.log('Saving category with ID:', categoryId);
      
      // Now actually call the API to update the category
      const updatedData = {
        id: categoryId,
        name: editingCategory.name,
        description: editingCategory.description,
        displayOrder: editingCategory.displayOrder,
        isActive: editingCategory.active,
        image: editingCategory.image,
        images: editingCategory.images
      };
      
      await updateCategory(updatedData);
      
      // Update local state with the changes
      const updatedCategories = categories.map(cat => 
        (cat.id === categoryId || cat._id === categoryId) 
          ? editingCategory 
          : cat
      );
      
      setCategories(updatedCategories);
      setEditingCategory(null);
      Alert.alert(t('common', 'success'), t('categories', 'categorySaved'));
    } catch (error) {
      Alert.alert(t('common', 'error'), t('menuItems', 'saveError'));
      console.error('Error updating category:', error);
    }
  }, [editingCategory, categories, setCategories, t]);

  // Handle toggle active status
  const handleToggleActive = useCallback(async (category: Category) => {
    try {
      const categoryId = category._id || category.id;
      console.log('Toggling active status for category ID:', categoryId);
      
      // Prepare update data
      const updateData = {
        id: categoryId,
        isActive: !category.active
      };
      
      // Send to server first
      await updateCategory(updateData);
      
      // Only update local state after server confirms success
      const updatedCategory = { 
        ...category, 
        active: !category.active,
        isActive: !category.active 
      };
      
      const updatedCategories = categories.map(cat => 
        (cat.id === categoryId || cat._id === categoryId) ? updatedCategory : cat
      );
      
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error updating category active status:', error);
      Alert.alert(t('common', 'error'), t('menuItems', 'saveError'));
    }
  }, [categories, setCategories, t]);

  // Handle image selection for new or existing category
  const handleImageSelect = useCallback(async (isNewCategory = false) => {
    try {
      console.log('Image selection started for', isNewCategory ? 'new category' : 'existing category');
      
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(t('restaurant', 'permissionRequired'), t('restaurant', 'permissionDetails'));
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('Image selection cancelled or no assets returned');
        return; // User canceled
      }
      
      // Get the selected image URI
      const uri = result.assets[0].uri;
      console.log('Image selected:', uri);
      
      // Upload to Blob storage
      setUploadingImage(true);
      try {
        console.log('Starting image upload to blob storage...');
        const imageUrl = await uploadImageToBlob(uri, 'category');
        
        if (!imageUrl) {
          console.error('No image URL returned from upload');
          throw new Error('Failed to get image URL from upload');
        }
        
        console.log('Image uploaded successfully, URL received');
        
        // Update the local state based on whether we're editing or creating
        if (isNewCategory) {
          console.log('Updating new category with image URL');
          setNewCategory(prev => {
            const updatedCategory = {
            ...prev,
            image: imageUrl,
            images: [...(prev.images || []), imageUrl],
            };
            console.log('New category state updated with image');
            return updatedCategory;
          });
        } else if (editingCategory) {
          console.log('Updating existing category with image URL');
          setEditingCategory(prev => {
            const updatedCategory = {
              ...prev,
            image: imageUrl, 
              images: [...(prev.images || []), imageUrl],
            };
            console.log('Existing category state updated with image');
            return updatedCategory;
          });
        }
        
        Alert.alert('Success', 'Image uploaded successfully');
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      } finally {
        setUploadingImage(false);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'An error occurred while selecting the image');
      setUploadingImage(false);
    }
  }, [editingCategory]);

  // Handle creating a new category - Updated to match server API expectations
  const handleCreateCategory = useCallback(async () => {
    try {
      // Validate required fields
      if (!newCategory.name?.trim()) {
        Alert.alert('Error', 'Category name is required');
        return;
      }
      
      // Show loading indicator
      setUploadingImage(true);
      
      // Prepare data according to server expectations
      const categoryData = {
        name: newCategory.name.trim(),
        description: newCategory.description?.trim() || '',
        isActive: newCategory.active === undefined ? true : newCategory.active,
        image: newCategory.image || '',
        // Always include images array if image exists
        images: newCategory.images?.length 
          ? newCategory.images 
          : (newCategory.image ? [newCategory.image] : []),
        displayOrder: newCategory.displayOrder || 0
      };
      
      console.log('Creating category:', JSON.stringify(categoryData));
      
      // Call API to create category
      const createdCategory = await createCategory(categoryData);
      
      if (!createdCategory || !createdCategory._id) {
        throw new Error('Failed to create category - invalid server response');
      }
      
      console.log('Category created successfully:', createdCategory);
      
      // Format for local state - ensure all required properties exist
      const newCategoryWithId = {
        id: createdCategory._id,
        _id: createdCategory._id,
        name: createdCategory.name || categoryData.name,
        description: createdCategory.description || categoryData.description || '',
        active: createdCategory.isActive !== undefined ? createdCategory.isActive : categoryData.isActive,
        isActive: createdCategory.isActive !== undefined ? createdCategory.isActive : categoryData.isActive,
        displayOrder: createdCategory.displayOrder || categoryData.displayOrder || 0,
        image: createdCategory.image || categoryData.image || '',
        images: createdCategory.images || categoryData.images || []
      };
      
      // Update local state with new category
      setCategories(prev => [...prev, newCategoryWithId]);
      
      // Reset form
      setNewCategory({
        name: '',
        description: '',
        displayOrder: 0,
        active: true,
        images: [],
        image: ''
      });
      
      // Close modal
      setNewCategoryModalVisible(false);
      
      // Show success message
      Alert.alert('Success', 'Category created successfully');
    } catch (error) {
      console.error('Error creating category:', error);
      Alert.alert(
        'Error', 
        `Failed to create category: ${error.message || 'Unknown error'}`
      );
    } finally {
      setUploadingImage(false);
    }
  }, [newCategory, setCategories, createCategory]);

  // Open confirmation dialog for category deletion
  const handleDeleteCategoryRequest = useCallback((categoryId: string) => {
    setDeletingCategory(categoryId);
    setConfirmDeleteVisible(true);
  }, []);

  // Handle category deletion
  const handleDeleteCategory = useCallback(async () => {
    if (!deletingCategory) return;
    
    try {
      await deleteCategory(deletingCategory);
      
      // Update local state by removing the deleted category
      setCategories(prev => prev.filter(cat => 
        cat.id !== deletingCategory && cat._id !== deletingCategory
      ));
      
      Alert.alert('Success', 'Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      Alert.alert('Error', 'Failed to delete category');
    } finally {
      setDeletingCategory(null);
      setConfirmDeleteVisible(false);
    }
  }, [deletingCategory, setCategories]);

  // Don't render content if not logged in
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Please login to access categories</Text>
      </View>
    );
  }

  // Show loading indicator
  if (isLoading && !isRefetching) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonLoader.Categories />
      </View>
    );
  }

  // Show error state
  if (error && !categories.length) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[
          styles.errorText, 
          { 
            color: colors.text,
            textAlign: 'center'
          }
        ]}>
          {error || t('common', 'error')}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={() => refetch()}
        >
          <Text style={styles.retryButtonText}>{t('common', 'retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render category item
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isEditing = editingCategory?.id === item.id;
    const hasImage = item.image || (item.images && item.images.length > 0);
    const imageToShow = item.image || (item.images && item.images.length > 0 ? item.images[0] : null);
    
    if (isEditing) {
      return (
        <View style={[styles.categoryCard, { backgroundColor: colors.card }]}>
          {/* Image preview and upload button */}
          <View style={styles.imageSection}>
            {editingCategory.image ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: editingCategory.image }} 
                  style={styles.imagePreview} 
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.noImageContainer, { borderColor: colors.border }]}>
                <Ionicons name="image-outline" size={32} color={colors.icon} />
                <Text style={[styles.noImageText, { color: colors.icon }]}>
                  {t('menuItems', 'noImagesText')}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.imageUploadButton, { backgroundColor: colors.primary }]}
              onPress={() => handleImageSelect()}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.imageUploadText}>
                    {t('menuItems', 'changeImage')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.formField}>
            <Text style={[
              styles.formLabel, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}>
              {t('categories', 'nameLabel')}
            </Text>
            <TextInput
              style={[
                styles.textInput, 
                { 
                  borderColor: colors.border, 
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}
              value={editingCategory.name}
              onChangeText={(value) => setEditingCategory({...editingCategory, name: value})}
              placeholder={t('menuItems', 'namePlaceholder')}
              placeholderTextColor={colors.icon}
            />
          </View>
          
          <View style={styles.formField}>
            <Text style={[
              styles.formLabel, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}>
              {t('categories', 'descriptionLabel')}
            </Text>
            <TextInput
              style={[
                styles.textArea, 
                { 
                  borderColor: colors.border, 
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}
              value={editingCategory.description}
              onChangeText={(value) => setEditingCategory({...editingCategory, description: value})}
              placeholder={t('menuItems', 'descriptionPlaceholder')}
              placeholderTextColor={colors.icon}
              multiline
              numberOfLines={2}
            />
          </View>
          
          <View style={styles.formField}>
            <Text style={[
              styles.formLabel, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}>
              {t('categories', 'orderLabel')}
            </Text>
            <TextInput
              style={[
                styles.textInput, 
                { 
                  borderColor: colors.border, 
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr'
                }
              ]}
              value={editingCategory.displayOrder.toString()}
              onChangeText={(value) => {
                const number = parseInt(value) || 0;
                setEditingCategory({...editingCategory, displayOrder: number});
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.icon}
            />
          </View>
          
          <View style={[styles.formActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[
                styles.cancelButton, 
                { 
                  borderColor: colors.border,
                  marginRight: isRTL ? 0 : 12,
                  marginLeft: isRTL ? 12 : 0
                }
              ]}
              onPress={() => setEditingCategory(null)}>
              <Text style={[
                styles.cancelButtonText, 
                { 
                  color: colors.text,
                  textAlign: isRTL ? 'right' : 'left' 
                }
              ]}>
                {t('common', 'cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveCategory}>
              <Text style={[
                styles.saveButtonText,
                { textAlign: isRTL ? 'right' : 'left' }
              ]}>
                {t('common', 'save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return (
      <View style={[
        styles.categoryCard, 
        { backgroundColor: colors.card, opacity: item.active ? 1 : 0.6 }
      ]}>
        {/* Category image */}
        {hasImage && (
          <View style={styles.categoryImageContainer}>
            <Image 
              source={{ uri: imageToShow }} 
              style={styles.categoryImage} 
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={[styles.categoryHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[
            styles.categoryName, 
            { 
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left' 
            }
          ]}>
            {item.name}
          </Text>
          <View style={[styles.activeToggle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[
              styles.activeLabel, 
              { 
                color: colors.text,
                marginRight: isRTL ? 0 : 8,
                marginLeft: isRTL ? 8 : 0
              }
            ]}>
              {item.active ? t('settings', 'active') : t('settings', 'inactive')}
            </Text>
            <Switch
              value={item.active}
              onValueChange={() => handleToggleActive(item)}
              trackColor={{ false: '#767577', true: `${colors.primary}80` }}
              thumbColor={item.active ? colors.primary : '#f4f3f4'}
              ios_backgroundColor="#767577"
            />
          </View>
        </View>
        
        {item.description && (
          <Text style={[
            styles.categoryDescription, 
            { 
              color: colors.icon,
              textAlign: isRTL ? 'right' : 'left' 
            }
          ]}>
            {item.description}
          </Text>
        )}
        
        <View style={[styles.categoryFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.footerLeft}>
            <Text style={[
              styles.orderText, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left'
              }
            ]}>
              {t('categories', 'orderLabel')}: {item.displayOrder || 0}
            </Text>
          </View>
          
          <View style={[styles.footerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[
                styles.editButton, 
                { 
                  backgroundColor: colors.primary,
                  marginRight: isRTL ? 8 : 0,
                  marginLeft: isRTL ? 0 : 0
                }
              ]}
              onPress={() => handleEditCategory(item)}>
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
              <Text style={[
                styles.editButtonText,
                {
                  marginLeft: isRTL ? 0 : 4,
                  marginRight: isRTL ? 4 : 0
                }
              ]}>
                {t('common', 'edit')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.deleteButton, 
                { 
                  backgroundColor: colors.error || '#FF3B30',
                  marginLeft: isRTL ? 0 : 8,
                  marginRight: isRTL ? 0 : 0
                }
              ]}
              onPress={() => handleDeleteCategoryRequest(item.id || item._id)}>
              <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
              <Text style={[
                styles.deleteButtonText,
                {
                  marginLeft: isRTL ? 0 : 4,
                  marginRight: isRTL ? 4 : 0
                }
              ]}>
                {t('common', 'delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <FlatList
        style={[
          styles.container, 
          { 
            backgroundColor: colors.background,
            direction: isRTL ? 'rtl' : 'ltr' 
          }
        ]}
        contentContainerStyle={styles.contentContainer}
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategoryItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[
              styles.title, 
              { 
                color: colors.text,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>
              {t('categories', 'title')}
            </Text>
            <Text style={[
              styles.subtitle, 
              { 
                color: colors.icon,
                textAlign: isRTL ? 'right' : 'left' 
              }
            ]}>
              {t('drawer', 'categories')}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.addCategoryButton, 
                { backgroundColor: colors.primary }
              ]}
              onPress={() => {
                console.log('Add New Category button pressed');
                setNewCategoryModalVisible(true);
                console.log('New Category Modal visibility set to:', true);
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.addCategoryButtonText}>
                {t('categories', 'addCategory')}
              </Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="category"
              size={64}
              color={colors.icon}
            />
            <Text style={[
              styles.emptyTitle, 
              { 
                color: colors.text,
                textAlign: 'center'
              }
            ]}>
              {t('categories', 'noCategories')}
            </Text>
            <Text style={[
              styles.emptyText, 
              { 
                color: colors.icon,
                textAlign: 'center'
              }
            ]}>
              {t('menuItems', 'noCategoriesMessage')}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      
      {/* New Category Modal - Completely Rebuilt */}
        <Modal
        visible={newCategoryModalVisible}
          transparent={true}
          animationType="slide"
        onRequestClose={() => setNewCategoryModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[
              styles.modalHeader, 
              { 
                borderBottomColor: colors.border,
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }
            ]}>
                <Text style={[
                  styles.modalTitle, 
                  { 
                    color: colors.text,
                    textAlign: isRTL ? 'right' : 'left'
                  }
                ]}>
                  {t('categories', 'addCategory')}
                </Text>
                <TouchableOpacity 
                  onPress={() => setNewCategoryModalVisible(false)}
                  hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {/* Category Image */}
              <View style={styles.formSection}>
                <Text style={[
                  styles.formSectionTitle, 
                  { 
                    color: colors.text,
                    textAlign: isRTL ? 'right' : 'left'
                  }
                ]}>
                  {t('categories', 'imageLabel')}
                </Text>
                <View style={styles.imageUploadContainer}>
                  {newCategory.image ? (
                    <View style={[styles.selectedImageContainer, { borderColor: colors.border }]}>
                      <Image 
                        source={{ uri: newCategory.image }} 
                        style={styles.selectedImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View style={[styles.uploadPlaceholder, { borderColor: colors.border }]}>
                      <Ionicons name="image-outline" size={36} color={colors.icon} />
                      <Text style={[styles.uploadPlaceholderText, { color: colors.icon }]}>
                        {t('menuItems', 'noImagesText')}
                      </Text>
                    </View>
                  )}
                </View>
                  
                  <TouchableOpacity
                  style={[styles.selectImageButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleImageSelect(true)}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.selectImageButtonText}>
                          {newCategory.image ? t('menuItems', 'changeImage') : t('categories', 'uploadImage')}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                
              {/* Basic Information */}
              <View style={styles.formSection}>
                <Text style={[
                  styles.formSectionTitle, 
                  { 
                    color: colors.text,
                    textAlign: isRTL ? 'right' : 'left'
                  }
                ]}>
                  {t('common', 'info')}
                </Text>
                
                {/* Name Field */}
                <View style={styles.inputContainer}>
                  <Text style={[
                    styles.inputLabel, 
                    { 
                      color: colors.text,
                      textAlign: isRTL ? 'right' : 'left'
                    }
                  ]}>
                    {t('categories', 'nameLabel')} <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput, 
                      { 
                        borderColor: colors.border, 
                        color: colors.text,
                        backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF',
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr'
                      }
                    ]}
                    value={newCategory.name}
                    onChangeText={(value) => setNewCategory({...newCategory, name: value})}
                    placeholder={t('menuItems', 'namePlaceholder')}
                    placeholderTextColor={colors.icon}
                  />
                </View>
                
                {/* Description Field */}
                <View style={styles.inputContainer}>
                  <Text style={[
                    styles.inputLabel, 
                    { 
                      color: colors.text,
                      textAlign: isRTL ? 'right' : 'left'
                    }
                  ]}>
                    {t('categories', 'descriptionLabel')}
                  </Text>
                  <TextInput
                    style={[
                      styles.formTextArea, 
                      { 
                        borderColor: colors.border, 
                        color: colors.text,
                        backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF',
                        textAlign: isRTL ? 'right' : 'left',
                        writingDirection: isRTL ? 'rtl' : 'ltr'
                      }
                    ]}
                    value={newCategory.description}
                    onChangeText={(value) => setNewCategory({...newCategory, description: value})}
                    placeholder={t('menuItems', 'descriptionPlaceholder')}
                    placeholderTextColor={colors.icon}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
                
                {/* Display Order */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {t('categories', 'orderLabel')}
                  </Text>
                  <TextInput
                    style={[styles.formInput, { 
                      borderColor: colors.border, 
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? colors.background : '#FFFFFF' 
                    }]}
                    value={newCategory.displayOrder?.toString() || '0'}
                    onChangeText={(value) => {
                      const number = parseInt(value) || 0;
                      setNewCategory({...newCategory, displayOrder: number});
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.icon}
                  />
                  <Text style={[styles.helpText, { color: colors.icon }]}>
                    {t('menuItems', 'displayOrderHelp') || 'Lower numbers will appear first in the menu'}
                  </Text>
                </View>
                
                {/* Active Status */}
                <View style={[
                  styles.toggleContainer, 
                  { flexDirection: isRTL ? 'row-reverse' : 'row' }
                ]}>
                  <View>
                    <Text style={[
                      styles.inputLabel, 
                      { 
                        color: colors.text,
                        textAlign: isRTL ? 'right' : 'left'
                      }
                    ]}>
                      {t('categories', 'availabilityLabel')}
                    </Text>
                    <Text style={[
                      styles.helpText, 
                      { 
                        color: colors.icon,
                        textAlign: isRTL ? 'right' : 'left'
                      }
                    ]}>
                      {t('settings', 'ordersDisabled') || 'Inactive categories won\'t appear in the menu'}
                    </Text>
                  </View>
                  <View style={[
                    styles.switchContainer, 
                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                  ]}>
                    <Text style={[
                      styles.switchLabel, 
                      { 
                        color: colors.text,
                        marginRight: isRTL ? 0 : 8,
                        marginLeft: isRTL ? 8 : 0
                      }
                    ]}>
                      {newCategory.active ? t('settings', 'active') : t('settings', 'inactive')}
                    </Text>
                    <Switch
                      value={newCategory.active}
                      onValueChange={(value) => setNewCategory({...newCategory, active: value})}
                      trackColor={{ false: '#767577', true: `${colors.primary}80` }}
                      thumbColor={newCategory.active ? colors.primary : '#f4f3f4'}
                      ios_backgroundColor="#767577"
                    />
                  </View>
                </View>
                </View>
              </ScrollView>
              
            <View style={[
              styles.modalFooter, 
              { 
                borderTopColor: colors.border,
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }
            ]}>
                <TouchableOpacity
                  style={[
                    styles.modalCancelButton, 
                    { 
                      borderColor: colors.border,
                      marginRight: isRTL ? 0 : 12,
                      marginLeft: isRTL ? 12 : 0
                    }
                  ]}
                  onPress={() => setNewCategoryModalVisible(false)}
                >
                  <Text style={[
                    styles.modalCancelButtonText, 
                    { 
                      color: colors.text,
                      textAlign: isRTL ? 'right' : 'left'
                    }
                  ]}>
                    {t('common', 'cancel')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalSubmitButton, { backgroundColor: colors.primary }]}
                  onPress={handleCreateCategory}
                >
                  <Text style={[
                    styles.modalSubmitButtonText,
                    { textAlign: isRTL ? 'right' : 'left' }
                  ]}>
                    {t('categories', 'addCategory')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={confirmDeleteVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmDeleteVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.confirmModal, { backgroundColor: colors.card }]}>
            <View style={styles.confirmModalHeader}>
              <Ionicons name="warning" size={48} color="#FF9500" />
              <Text style={[styles.confirmModalTitle, { color: colors.text }]}>
                {t('categories', 'deleteCategory')}
              </Text>
            </View>
            
            <Text style={[styles.confirmModalText, { color: colors.text }]}>
              {t('categories', 'confirmDelete')}
            </Text>
            
            <View style={[
              styles.confirmModalFooter,
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}>
              <TouchableOpacity
                style={[
                  styles.confirmCancelButton,
                  { 
                    borderColor: colors.border,
                    marginRight: isRTL ? 0 : 12,
                    marginLeft: isRTL ? 12 : 0
                  }
                ]}
                onPress={() => {
                  setDeletingCategory(null);
                  setConfirmDeleteVisible(false);
                }}
              >
                <Text style={[
                  styles.confirmCancelButtonText,
                  { color: colors.text }
                ]}>
                  {t('common', 'cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmDeleteButton, { backgroundColor: colors.error || '#FF3B30' }]}
                onPress={handleDeleteCategory}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {t('common', 'delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addCategoryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  categoryCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  activeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  categoryDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderText: {
    fontSize: 14,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  noImageText: {
    marginTop: 8,
    fontSize: 12,
  },
  imageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  imageUploadText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
  categoryImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    zIndex: 9999,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScrollView: {
    maxHeight: '75%',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  uploadPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
  },
  selectImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
  },
  selectImageButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 48,
  },
  formTextArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 14,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginRight: 8,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  modalCancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  modalCancelButtonText: {
    fontWeight: '500',
    fontSize: 16,
  },
  modalSubmitButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
  confirmModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 24,
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  confirmModalText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  confirmCancelButtonText: {
    fontWeight: '500',
    fontSize: 16,
  },
  confirmDeleteButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmDeleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
}); 