import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchRestaurantMenu, fetchCategories, createMenuItem, updateMenuItem, deleteMenuItem, deleteMultipleMenuItems } from '../services/restaurantService';
import useFetch from '../hooks/useFetch';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { formatPrice } from '../utils/currencyUtils';
import EditMenuItemModal from '../components/EditMenuItemModal';
import apiClient, { secureLog } from '../services/api';

// Type definitions
type Category = {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  active?: boolean;
  displayOrder?: number;
  image?: string;
  images?: string[];
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
  options?: Array<{
    name: string;
    additionalPrice: number;
  }>;
};

// Menu item component
const MenuItem = ({ item, colors, onEditItem, isSelectionMode, isSelected, onToggleSelection, onDeleteItem }) => {
  // Get translation function
  const { t } = useLanguage();
  const { isRTL } = useLanguage(); // Get RTL status from language context
  
  // Get category name from either the category object or direct categoryName property
  const categoryName = useMemo(() => {
    if (typeof item.category === 'object' && item.category) {
      return item.category.name;
    } else if (item.categoryName) {
      return item.categoryName;
    } else if (typeof item.category === 'string') {
      return item.category; // Sometimes category might be just the name
    }
    return '';
  }, [item]);
  
  // Get main image from either single image or first in images array
  const imageUrl = useMemo(() => {
    if (item.image) return item.image;
    if (item.images && item.images.length > 0) return item.images[0];
    return null;
  }, [item]);

  // Check if item has options
  const hasOptions = item.options && Array.isArray(item.options) && item.options.length > 0;

  return (
    <TouchableOpacity 
      style={[
        styles.menuItem, 
        { 
          backgroundColor: colors.card,
          borderLeftWidth: isRTL ? 0 : 4,
          borderRightWidth: isRTL ? 4 : 0,
          borderLeftColor: item.available ? colors.success : colors.error,
          borderRightColor: item.available ? colors.success : colors.error,
        },
        isSelected && isSelectionMode && { borderColor: colors.primary, borderWidth: 2 }
      ]}
      onPress={() => {
        if (isSelectionMode) {
          onToggleSelection(item.id || item._id);
        } else {
          onEditItem(item); // If not in selection mode, edit the item on tap
        }
      }}
      onLongPress={() => {
        if (!isSelectionMode) {
          onToggleSelection(item.id || item._id); // Toggle selection on long press
        }
      }}
      delayLongPress={300} // 300ms is a good balance for long press detection
      activeOpacity={0.7}
    >
      {isSelectionMode && (
        <View style={[
          styles.selectionCheckboxContainer,
          isRTL ? { right: 12, left: 'auto' } : { left: 12, right: 'auto' }
        ]}>
          <TouchableOpacity 
            style={[styles.selectionCheckbox, { 
              backgroundColor: isSelected ? colors.primary : 'transparent',
              borderColor: colors.primary
            }]}
            onPress={() => onToggleSelection(item.id || item._id)}
          >
            {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.statusIndicator}>
        <View style={[
          styles.statusDot, 
          { backgroundColor: item.available ? colors.success : colors.error }
        ]} />
      </View>
      
      <View style={styles.menuItemContent}>
        {/* Header Section with Category */}
        {categoryName && (
          <View style={[
            styles.categoryTag, 
            { backgroundColor: colors.secondary + '20' },
            isRTL && { alignSelf: 'flex-end' }
          ]}>
            <Text style={[styles.categoryText, { color: colors.secondary }]}>{categoryName}</Text>
          </View>
        )}
        
        {/* Main Content Area */}
        <View style={[
          styles.mainContentArea,
          isRTL && { flexDirection: 'row-reverse' }
        ]}>
          {/* Image */}
          {imageUrl ? (
            <Image 
              source={{ uri: imageUrl }} 
              style={[
                styles.menuItemImage,
                isRTL ? { marginLeft: 16, marginRight: 0 } : { marginRight: 16, marginLeft: 0 }
              ]}
              resizeMode="cover"
              onError={() => console.log(`Failed to load image: ${imageUrl}`)}
            />
          ) : (
            <View style={[
              styles.imagePlaceholder, 
              { backgroundColor: colors.border + '40' },
              isRTL ? { marginLeft: 16, marginRight: 0 } : { marginRight: 16, marginLeft: 0 }
            ]}>
              <Ionicons name="restaurant-outline" size={28} color={colors.text + '70'} />
            </View>
          )}

          {/* Details */}
          <View style={[
            styles.detailsContainer,
            isRTL && { alignItems: 'flex-end' }
          ]}>
            <View style={[
              styles.titlePriceContainer,
              isRTL && { alignItems: 'flex-end' }
            ]}>
              <Text 
                numberOfLines={1} 
                style={[
                  styles.menuItemName, 
                  { color: colors.text },
                  isRTL && { textAlign: 'right' }
                ]}
              >
                {item.name || t('menuItems', 'unnamedItem', 'Unnamed Item')}
              </Text>
              
              <Text style={[styles.menuItemPrice, { color: colors.primary }]}>
                {formatPrice(item.price || 0)}
              </Text>
            </View>
            
            {item.description && (
              <Text 
                style={[
                  styles.menuItemDescription, 
                  { color: colors.text + '99' },
                  isRTL && { textAlign: 'right' }
                ]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            )}
            
            {/* Badges Container */}
            <View style={[
              styles.badgesContainer,
              isRTL && { alignItems: 'flex-end' }
            ]}>
              {/* Options Badge */}
              {hasOptions && (
                <View style={[
                  styles.optionsBadge, 
                  { backgroundColor: colors.secondary + '15' }
                ]}>
                  <Ionicons 
                    name="options" 
                    size={14} 
                    color={colors.secondary} 
                    style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }} 
                  />
                  <Text style={[styles.optionsBadgeText, { color: colors.secondary }]}>
                    {item.options.length} {item.options.length === 1 ? 
                      t('menuItems', 'singleOption', 'Option') : 
                      t('menuItems', 'multipleOptions', 'Options')}
                  </Text>
                </View>
              )}
              
              {/* Availability Tag */}
              <View style={[
                styles.availabilityBadge, 
                { 
                  backgroundColor: item.available ? colors.success + '15' : colors.error + '15'
                }
              ]}>
                <View style={[
                  styles.availabilityDot, 
                  { backgroundColor: item.available ? colors.success : colors.error }
                ]} />
                <Text style={[
                  styles.availabilityLabel, 
                  { color: item.available ? colors.success : colors.error }
                ]}>
                  {item.available ? 
                    t('menuItems', 'availabilityAvailable', 'Available') : 
                    t('menuItems', 'availabilityUnavailable', 'Unavailable')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Horizontal scrollable category filters
const ScrollableCategoryFilters = ({ categories, selectedCategory, onSelectCategory, colors }) => {
  const { t, isRTL } = useLanguage();
  
  // Add 'All' category
  const allCategories = [{ id: 'all', name: t('menuItems', 'allCategory', 'All') }].concat(
    categories.filter(cat => cat && cat.name).map(cat => ({ 
      id: cat._id || cat.id || cat.name,
      name: cat.name
    }))
  );
  
  return (
    <FlatList
      horizontal
      data={allCategories}
      keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === item.id && { backgroundColor: colors.primary },
            isRTL && { marginRight: 0, marginLeft: 8 }
          ]}
          onPress={() => onSelectCategory(item.id)}
        >
          <Text
            style={[
              styles.categoryButtonText,
              { color: selectedCategory === item.id ? '#FFFFFF' : colors.text },
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
      contentContainerStyle={[
        styles.categoriesList,
        isRTL && { flexDirection: 'row-reverse' }
      ]}
    />
  );
};

// Menu items screen component
export default function MenuItemsScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Use our custom hook for menu items data fetching
  const { 
    data: menuItems, 
    isLoading: isLoadingMenu, 
    error: menuError,
    refetch: refetchMenu,
    isRefetching: isRefetchingMenu
  } = useFetch(
    async () => {
      console.log('Fetching menu items from API...');
      try {
        const data = await fetchRestaurantMenu(true); // Force fresh data
        console.log(`Fetched ${data?.length || 0} menu items`);
        
        // Process and transform the API response
        if (Array.isArray(data)) {
          // Filter out null or invalid items first
          const validItems = data.filter(item => item !== null && typeof item === 'object');
          console.log(`Filtered out ${data.length - validItems.length} invalid items before processing`);
          
          return validItems.map(item => ({
            id: item._id || item.id,
            _id: item._id || item.id,
            name: item.name || 'Unnamed Item',
            description: item.description || '',
            price: parseFloat(item.price) || 0,
            available: item.available !== false, // default to true if not specified
            category: item.category || null,
            categoryId: typeof item.category === 'object' && item.category ? 
              (item.category._id || item.category.id) : 
              (typeof item.category === 'string' ? item.category : null),
            categoryName: typeof item.category === 'object' && item.category ? item.category.name : undefined,
            image: item.image || (item.images && item.images.length > 0 ? item.images[0] : ''),
            images: item.images || (item.image ? [item.image] : []),
            options: Array.isArray(item.options) ? item.options : []
          }));
        }
        return [];
      } catch (err) {
        console.error('Error in menu items fetch function:', err);
        throw err;
      }
    },
    [isLoggedIn],
    {
      initialData: [],
      enabled: isLoggedIn,
      onError: (error) => {
        console.error('Error fetching menu items:', error);
      }
    }
  );

  // Use our custom hook for categories data fetching
  const { 
    data: categories, 
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories
  } = useFetch(
    async () => {
      console.log('Fetching categories from API...');
      try {
        const data = await fetchCategories(true); // Force fresh data
        console.log(`Fetched ${data?.length || 0} categories`);
        
        // Process and transform the API response
        if (Array.isArray(data)) {
          return data.map(cat => ({
            id: cat._id || cat.id,
            _id: cat._id || cat.id,
            name: cat.name,
            description: cat.description || '',
            isActive: cat.isActive !== undefined ? cat.isActive : (cat.active !== undefined ? cat.active : true),
            active: cat.isActive !== undefined ? cat.isActive : (cat.active !== undefined ? cat.active : true),
            displayOrder: cat.displayOrder || 0,
            image: cat.image || (cat.images && cat.images.length > 0 ? cat.images[0] : ''),
            images: cat.images || (cat.image ? [cat.image] : [])
          }));
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

  // Filtered menu items based on selected category and search query
  const filteredMenuItems = useMemo(() => {
    let filtered = [...menuItems];
    
    // Apply category filter if not 'all'
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        // Check if category is an object with id/name or a string
        if (typeof item.category === 'object' && item.category) {
          return item.category._id === selectedCategory || 
                 item.category.id === selectedCategory || 
                 item.category.name === selectedCategory;
        } else if (item.categoryId) {
          return item.categoryId === selectedCategory;
        } else if (typeof item.category === 'string') {
          return item.category === selectedCategory;
        }
        return false;
      });
    }
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [menuItems, selectedCategory, searchQuery]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetchMenu();
    refetchCategories();
  }, [refetchMenu, refetchCategories]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  // Handle edit item
  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setIsEditModalVisible(true);
  }, []);

  // Handle save menu item
  const handleSaveMenuItem = async (updatedItem) => {
    try {
      console.log('Saving menu item:', JSON.stringify(updatedItem));
      
      // Check for options and ensure they are valid
      if (!Array.isArray(updatedItem.options)) {
        console.log('Options is not an array, initializing empty array');
        updatedItem.options = [];
      }
      
      // Ensure all option prices are properly converted to numbers
      const validatedOptions = updatedItem.options.map(option => {
        const originalType = typeof option.additionalPrice;
        const originalValue = option.additionalPrice;
        const newValue = typeof option.additionalPrice === 'number' 
          ? option.additionalPrice 
          : parseFloat(option.additionalPrice) || 0;
        
        console.log(`Option "${option.name}" price conversion: ${originalValue} (${originalType}) -> ${newValue} (number)`);
        
        return {
          name: option.name.trim(),
          additionalPrice: newValue,
          price: newValue // Include price for backward compatibility
        };
      });
      
      // Log options for debugging
      console.log('Options to save:', JSON.stringify(validatedOptions));
      
      // Ensure we have a valid category
      if (!updatedItem.categoryId && categories.length > 0) {
        console.warn('No category ID provided, defaulting to first category');
        updatedItem.categoryId = categories[0]._id || categories[0].id;
      }
      
      // Extract relevant fields for the API
      const itemData = {
        name: updatedItem.name,
        description: updatedItem.description,
        price: typeof updatedItem.price === 'string' ? parseFloat(updatedItem.price) : updatedItem.price,
        available: updatedItem.available,
        category: updatedItem.categoryId,
        images: updatedItem.images,
        options: validatedOptions
      };
      
      console.log('Prepared API payload:', JSON.stringify(itemData));
      
      let response;
      const isNewItem = !(updatedItem.id || updatedItem._id);
      
      // Check if this is an update or a new item
      if (!isNewItem) {
        // This is an update - use update service
        const itemId = updatedItem.id || updatedItem._id;
        console.log(`Updating existing menu item with ID: ${itemId}`);
        response = await updateMenuItem(itemId, itemData);
        Alert.alert(t('common', 'success', 'Success'), t('menuItems', 'itemUpdated', '{name} updated successfully', { name: updatedItem.name }));
      } else {
        // This is a new item - use create service
        console.log('Creating new menu item');
        response = await createMenuItem(itemData);
        Alert.alert(t('common', 'success', 'Success'), t('menuItems', 'itemAdded', '{name} added to your menu', { name: updatedItem.name }));
      }
      
      // Refetch menu items to ensure data consistency
      refetchMenu();
      
      // Set category filter to show the newly added/updated item category
      if (isNewItem && updatedItem.categoryId) {
        setSelectedCategory(updatedItem.categoryId);
      }
      
      return response;
    } catch (error) {
      console.error('Error saving menu item:', error);
      Alert.alert(t('common', 'error', 'Error'), t('menuItems', 'saveError', 'Failed to save menu item. Please try again.'));
      throw error;
    }
  };

  // Handle adding a new item
  const handleAddNewItem = useCallback(() => {
    if (categories.length === 0) {
      // No categories available - inform the user
      Alert.alert(
        t('menuItems', 'noCategoriesTitle', 'No Categories Available'),
        t('menuItems', 'noCategoriesMessage', 'Please create at least one category before adding menu items.'),
        [
          { text: t('common', 'ok', 'OK'), style: 'cancel' }
        ]
      );
      return;
    }
    
    // If categories exist, proceed to open the modal
    setEditingItem(null);
    setIsEditModalVisible(true);
  }, [categories, t]);

  // Handle delete single menu item
  const handleDeleteMenuItem = useCallback((itemId) => {
    Alert.alert(
      t('menuItems', 'deleteItemTitle', 'Delete Menu Item'),
      t('menuItems', 'deleteItemConfirm', 'Are you sure you want to delete this menu item? This action cannot be undone.'),
      [
        { text: t('common', 'cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('common', 'delete', 'Delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItem(itemId);
              Alert.alert(t('common', 'success', 'Success'), t('menuItems', 'itemDeleted', 'Menu item deleted successfully'));
              refetchMenu();
            } catch (error) {
              console.error('Error deleting menu item:', error);
              Alert.alert(t('common', 'error', 'Error'), t('menuItems', 'deleteError', 'Failed to delete menu item. Please try again.'));
            }
          }
        }
      ]
    );
  }, [refetchMenu, t]);

  // Toggle selection mode and initialize with an item if provided
  const toggleSelectionMode = useCallback((initialItemId = null) => {
    setIsSelectionMode(prev => {
      // If turning on selection mode and an initial item ID is provided, select it
      if (!prev && initialItemId) {
        setSelectedItems([initialItemId]);
      } else {
        // If turning off selection mode, clear selections
        setSelectedItems([]);
      }
      return !prev;
    });
  }, []);

  // Toggle item selection
  const toggleItemSelection = useCallback((itemId) => {
    // If not in selection mode, enter selection mode with this item selected
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedItems([itemId]);
      return;
    }
    
    // Otherwise toggle the item selection
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        const newSelection = prev.filter(id => id !== itemId);
        // If no items left selected, exit selection mode
        if (newSelection.length === 0) {
          setIsSelectionMode(false);
        }
        return newSelection;
      } else {
        return [...prev, itemId];
      }
    });
  }, [isSelectionMode]);

  // Handle batch delete of selected menu items
  const handleBatchDelete = useCallback(() => {
    if (selectedItems.length === 0) {
      Alert.alert(
        t('menuItems', 'noItemsSelectedTitle', 'No Items Selected'), 
        t('menuItems', 'noItemsSelectedMessage', 'Please select at least one item to delete.')
      );
      return;
    }

    Alert.alert(
      t('menuItems', 'deleteMultipleItemsTitle', 'Delete Multiple Items'),
      t('menuItems', 'deleteMultipleItemsConfirm', 'Are you sure you want to delete {count} menu item(s)? This action cannot be undone.', { count: selectedItems.length }),
      [
        { text: t('common', 'cancel', 'Cancel'), style: 'cancel' },
        { 
          text: t('menuItems', 'deleteAll', 'Delete All'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMultipleMenuItems(selectedItems);
              Alert.alert(
                t('common', 'success', 'Success'), 
                t('menuItems', 'itemsDeleted', '{count} item(s) deleted successfully', { count: selectedItems.length })
              );
              setSelectedItems([]);
              setIsSelectionMode(false);
              refetchMenu();
            } catch (error) {
              console.error('Error deleting multiple menu items:', error);
              Alert.alert(
                t('common', 'error', 'Error'), 
                t('menuItems', 'deleteMultipleError', 'Failed to delete menu items. Please try again.')
              );
            }
          }
        }
      ]
    );
  }, [selectedItems, refetchMenu, t]);

  // Select all items
  const selectAllItems = useCallback(() => {
    const allItemIds = filteredMenuItems.map(item => item.id || item._id);
    setSelectedItems(allItemIds);
  }, [filteredMenuItems]);

  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Don't render content if not logged in
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t('menuItems', 'pleaseLogin', 'Please login to access menu items')}</Text>
      </View>
    );
  }
  
  // Show loading indicator
  if ((isLoadingMenu || isLoadingCategories) && !isRefetchingMenu) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonLoader.MenuItems />
      </View>
    );
  }

  // Show error state if both menu items and categories failed to load
  if (menuError && categoriesError && !menuItems.length && !categories.length) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          {menuError || categoriesError || t('menuItems', 'loadDataError', 'Failed to load menu data')}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>{t('common', 'retry', 'Try Again')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content with search, categories filter, and menu items
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Selection mode header */}
      {isSelectionMode && (
        <View style={[
          styles.selectionHeader, 
          { backgroundColor: colors.card },
          isRTL && styles.selectionHeaderRTL
        ]}>
          <View style={styles.selectionInfo}>
            <Text style={[
              styles.selectionText, 
              { color: colors.text },
              isRTL && { textAlign: 'right' }
            ]}>
              {selectedItems.length} {t('menuItems', selectedItems.length !== 1 ? 'itemsSelected' : 'itemSelected', selectedItems.length !== 1 ? 'items selected' : 'item selected')}
            </Text>
          </View>
          <View style={[
            styles.selectionActions,
            isRTL && styles.selectionActionsRTL
          ]}>
            {selectedItems.length > 0 ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.selectionButton, 
                    { borderColor: colors.primary },
                    isRTL && styles.selectionButtonRTL
                  ]}
                  onPress={() => {
                    if (selectedItems.length === 1) {
                      // Find the selected item
                      const selectedItem = menuItems.find(item => 
                        (item.id || item._id) === selectedItems[0]
                      );
                      if (selectedItem) {
                        handleEditItem(selectedItem);
                        setIsSelectionMode(false);
                      }
                    }
                  }}
                  disabled={selectedItems.length !== 1}
                >
                  <Ionicons name="pencil" size={18} color={selectedItems.length === 1 ? colors.primary : colors.icon} />
                  <Text style={[
                    styles.selectionButtonText, 
                    { color: selectedItems.length === 1 ? colors.primary : colors.icon },
                    isRTL && styles.selectionButtonTextRTL
                  ]}>{t('common', 'edit', 'Edit')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.selectionButton, 
                    { borderColor: colors.error },
                    isRTL && styles.selectionButtonRTL
                  ]}
                  onPress={handleBatchDelete}
                >
                  <Ionicons name="trash" size={18} color={colors.error} />
                  <Text style={[
                    styles.selectionButtonText, 
                    { color: colors.error },
                    isRTL && styles.selectionButtonTextRTL
                  ]}>{t('common', 'delete', 'Delete')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.selectionButton, 
                    { borderColor: colors.error },
                    isRTL && styles.selectionButtonRTL
                  ]}
                  onPress={clearSelections}
                >
                  <Text style={[
                    styles.selectionButtonText, 
                    { color: colors.error },
                    isRTL && styles.selectionButtonTextRTL
                  ]}>{t('menuItems', 'clearSelection', 'Clear')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.selectionButton, 
                  { borderColor: colors.primary },
                  isRTL && styles.selectionButtonRTL
                ]}
                onPress={selectAllItems}
              >
                <Text style={[
                  styles.selectionButtonText, 
                  { color: colors.primary },
                  isRTL && styles.selectionButtonTextRTL
                ]}>{t('menuItems', 'selectAll', 'Select All')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.selectionButton, 
                { borderColor: colors.text },
                isRTL && styles.selectionButtonRTL
              ]}
              onPress={() => toggleSelectionMode()}
            >
              <Text style={[
                styles.selectionButtonText, 
                { color: colors.text },
                isRTL && styles.selectionButtonTextRTL
              ]}>{t('common', 'cancel', 'Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search bar - no selection mode toggle button anymore */}
      <View style={[
        styles.searchContainer, 
        { backgroundColor: colors.card },
        isRTL && { flexDirection: 'row-reverse' }
      ]}>
        <Ionicons name="search" size={24} color={colors.icon} />
        <TextInput
          style={[
            styles.searchInput, 
            { color: colors.text },
            isRTL && { marginLeft: 0, marginRight: 8, textAlign: 'right' }
          ]}
          placeholder={t('menuItems', 'searchPlaceholder', 'Search menu items...')}
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.icon} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories filter */}
      <View style={styles.categoriesContainer}>
        <ScrollableCategoryFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
          colors={colors}
        />
      </View>

      {/* Menu items list */}
      <FlatList
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.menuList}
        data={filteredMenuItems}
        keyExtractor={(item) => item.id?.toString() || item._id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <MenuItem
            item={item}
            colors={colors}
            onEditItem={handleEditItem}
            isSelectionMode={isSelectionMode}
            isSelected={selectedItems.includes(item.id || item._id)}
            onToggleSelection={toggleItemSelection}
            onDeleteItem={handleDeleteMenuItem}
          />
        )}
        ListEmptyComponent={
          menuError ? (
            <View style={styles.centered}>
              <Text style={[styles.errorText, { color: colors.text }]}>
                {menuError || t('menuItems', 'loadItemsError', 'Failed to load menu items')}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={refetchMenu}
              >
                <Text style={styles.retryButtonText}>{t('common', 'retry', 'Try Again')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.noItemsText, { color: colors.text }]}>
              {searchQuery || selectedCategory !== 'all'
                ? t('menuItems', 'noMatchingItems', 'No items match your search or filter')
                : t('menuItems', 'noItems', 'No menu items available. Add some items to get started.')}
            </Text>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingMenu}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      {/* Add new item button */}
      <TouchableOpacity
        style={[
          styles.addButton, 
          { backgroundColor: colors.primary },
          isSelectionMode && styles.addButtonSelectionMode,
          isRTL && styles.addButtonRTL
        ]}
        onPress={handleAddNewItem}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Edit menu item modal */}
      <EditMenuItemModal
        visible={isEditModalVisible}
        menuItem={editingItem}
        categories={categories}
        onClose={() => {
          setIsEditModalVisible(false);
          setEditingItem(null);
        }}
        onSave={handleSaveMenuItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: 40,
  },
  categoriesContainer: {
    marginTop: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  categoryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  menuList: {
    padding: 16,
    paddingBottom: 80, // Extra space for the FAB
  },
  menuItem: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  menuItemContent: {
    padding: 16,
  },
  mainContentArea: {
    flexDirection: 'row',
    marginTop: 8,
  },
  menuItemImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 16,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titlePriceContainer: {
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuItemDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  optionsBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectionCheckboxContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  selectionHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionActionsRTL: {
    flexDirection: 'row-reverse',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 16,
    marginLeft: 8,
  },
  selectionButtonRTL: {
    flexDirection: 'row-reverse',
    marginLeft: 0,
    marginRight: 8,
  },
  selectionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  selectionButtonTextRTL: {
    marginLeft: 0,
    marginRight: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonRTL: {
    right: 'auto',
    left: 20,
  },
  addButtonSelectionMode: {
    bottom: 100, // Adjust this value based on your design
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  noItemsText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  searchButton: {
    padding: 8,
    borderRadius: 10,
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Extra space for the FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    padding: 16,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 