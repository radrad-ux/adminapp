import apiClient, { secureLog } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  RESTAURANT_INFO: 'cache_restaurant_info',
  MENU: 'cache_menu',
  ORDERS: 'cache_orders',
  CATEGORIES: 'cache_categories',
  SETTINGS: 'cache_settings'
};

// Cache time validity (5 minutes in milliseconds)
const CACHE_VALIDITY = 5 * 60 * 1000;

// Helper to check if cache is valid
const isCacheValid = async (cacheKey) => {
  try {
    const cacheData = await AsyncStorage.getItem(cacheKey);
    if (!cacheData) return false;
    
    const { timestamp } = JSON.parse(cacheData);
    const now = Date.now();
    return timestamp && (now - timestamp) < CACHE_VALIDITY;
  } catch (error) {
    secureLog.warn(`Error checking cache validity for ${cacheKey}:`, error);
    return false;
  }
};

// Helper to get cached data
const getCachedData = async (cacheKey) => {
  try {
    const cacheData = await AsyncStorage.getItem(cacheKey);
    if (!cacheData) return null;
    
    const { data } = JSON.parse(cacheData);
    return data;
  } catch (error) {
    secureLog.warn(`Error getting cached data for ${cacheKey}:`, error);
    return null;
  }
};

// Helper to set cache
const setCacheData = async (cacheKey, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    secureLog.warn(`Error setting cache for ${cacheKey}:`, error);
    return false;
  }
};

// Helper to clear a specific cache key
export const clearCacheForKey = async (cacheKey) => {
  try {
    await AsyncStorage.removeItem(cacheKey);
    secureLog.info(`Cache cleared for ${cacheKey}`);
    return true;
  } catch (error) {
    secureLog.error(`Error clearing cache for ${cacheKey}:`, error);
    return false;
  }
};

// Helper to clear all cache
export const clearCache = async () => {
  try {
    const cacheKeys = Object.values(CACHE_KEYS);
    await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
    secureLog.info('All API cache cleared successfully');
    return true;
  } catch (error) {
    secureLog.error('Error clearing cache:', error);
    return false;
  }
};

// Helper to check if app is in logout state before making API calls
const isInLogoutState = async () => {
  // Check if api client is marked as not authenticated
  if (apiClient.isAuthenticated === false) {
    console.log('API call skipped - app is marked as not authenticated');
    
    // Check if this is a stale state - if the apiClient has been in this state for too long
    // we might need to reset it to avoid permanent API blocking
    const globalObj = typeof window !== 'undefined' ? window : global;
    if (!globalObj._logoutStateTimestamp) {
      globalObj._logoutStateTimestamp = Date.now();
    } else if (Date.now() - globalObj._logoutStateTimestamp > 10000) {
      // If logout state has persisted for more than 10 seconds, it might be stale
      console.log('Detected potentially stale logout state - force resetting after 10 seconds');
      apiClient.isAuthenticated = true;
      globalObj._logoutStateTimestamp = null;
      globalObj._handlingTokenExpiration = false;
      globalObj._isLoggingOut = false;
      return false;
    }
    
    return true;
  }
  
  // Reset the logout timestamp if we're not in logout state
  const globalObj = typeof window !== 'undefined' ? window : global;
  globalObj._logoutStateTimestamp = null;
  
  // Check if there's a logout flag set in global state
  if (typeof window !== 'undefined' && window._isLoggingOut) {
    console.log('API call skipped - app has global logout flag');
    return true;
  }
  
  // Check if data fetching is temporarily deferred after login
  if (typeof window !== 'undefined' && window._deferDataFetching) {
    console.log('API call deferred - app is in post-login navigation');
    return true;
  }
  
  // Check if token expiration is being handled
  if (typeof window !== 'undefined' && window._handlingTokenExpiration) {
    console.log('API call skipped - app is handling token expiration (flag still set)');
    // Attempt to auto-reset this flag if it's been set for too long (5+ seconds)
    if (window._tokenExpirationStartTime && (Date.now() - window._tokenExpirationStartTime > 5000)) {
      console.log('Detected stale _handlingTokenExpiration flag - auto-resetting');
      window._handlingTokenExpiration = false;
      window._tokenExpirationStartTime = null;
      // Don't return true here to allow the API call to proceed
    } else {
      return true;
    }
  }
  
  // Initialize tokenExpirationStartTime if handling token expiration
  if (typeof window !== 'undefined' && window._handlingTokenExpiration && !window._tokenExpirationStartTime) {
    window._tokenExpirationStartTime = Date.now();
  }
  
  return false;
};

/**
 * Fetch restaurant information for the authenticated user
 * @param {boolean} bypassCache - Force fresh data fetch
 * @returns {Promise<Object>} Restaurant data
 */
export const fetchRestaurantInfo = async (bypassCache = false) => {
  try {
    // Skip API call if app is in logout state
    if (await isInLogoutState()) {
      throw new Error('App is in logout state, API call skipped');
    }
    
    // Check cache if not bypassing
    if (!bypassCache) {
      const isCacheHit = await isCacheValid(CACHE_KEYS.RESTAURANT_INFO);
      if (isCacheHit) {
        secureLog.info('Using cached restaurant info');
        const cachedData = await getCachedData(CACHE_KEYS.RESTAURANT_INFO);
        if (cachedData) {
          return cachedData;
        }
      }
    }
    
    secureLog.info('Fetching restaurant information from API...');
    try {
      // Try the restaurant-info endpoint first
      const response = await apiClient.get('/restaurant-info');
      
      // Log minimal response info, not the full response
      secureLog.info('Restaurant API response received', { 
        status: response.status,
        hasData: !!response.data
      });
      
      if (!response.data) {
        secureLog.error('API returned a response but no data');
        throw new Error('No data returned from API');
      }
      
      // Update cache with fresh data
      await setCacheData(CACHE_KEYS.RESTAURANT_INFO, response.data);
      
      secureLog.info('Restaurant info fetched successfully');
      return response.data;
    } catch (apiError) {
      secureLog.error('API request failed:', apiError);
      
      // Try alternative endpoints if primary fails
      secureLog.info('Trying alternative endpoints...');
      
      // List of endpoints to try in order
      const alternativeEndpoints = [
        '/restaurant',
        '/restaurant/info',
        '/user/restaurant',
        '/profile/restaurant'
      ];
      
      for (const endpoint of alternativeEndpoints) {
        try {
          secureLog.info(`Trying alternative endpoint ${endpoint}...`);
          const altResponse = await apiClient.get(endpoint);
          
          if (altResponse.data) {
            secureLog.info(`Restaurant info fetched from ${endpoint}`);
            await setCacheData(CACHE_KEYS.RESTAURANT_INFO, altResponse.data);
            return altResponse.data;
          }
        } catch (altError) {
          secureLog.error(`Alternative endpoint ${endpoint} failed:`, altError);
        }
      }
      
      // If all endpoints fail, throw the original error
      throw apiError;
    }
  } catch (error) {
    secureLog.error('Error fetching restaurant info:', error);
    
    // If API call failed, try to use stale cache as fallback
    if (!bypassCache) {
      const cachedData = await getCachedData(CACHE_KEYS.RESTAURANT_INFO);
      if (cachedData) {
        secureLog.info('Using stale cache as fallback for restaurant info');
        return cachedData;
      }
    }
    
    // Provide mock data in the expected format from the API response
    secureLog.info('No cache available, returning mock data');
    return {
      name: "Sample Restaurant",
      logoImage: "/uploads/logo/sample-logo.jpg",
      bannerImages: [
        "/uploads/banner/sample-banner.jpg"
      ],
      phoneNumber: "+1 234 567 8900",
      mapsURL: "https://maps.google.com/?q=123+Main+Street",
      description: "A premium dining experience with the best cuisine from around the world.",
      address: "123 Main Street, City, Country",
      email: "contact@samplerestaurant.com",
      openingHours: "Mon-Fri: 10:00 AM - 10:00 PM\nSat-Sun: 11:00 AM - 11:00 PM",
      website: "https://dmenu-five.vercel.app",
      cuisine: "International",
      established: 2022
    };
  }
};

/**
 * Fetch restaurant menu items
 * @param {boolean} bypassCache - Force fresh data fetch
 * @returns {Promise<Array>} Menu items
 */
export const fetchRestaurantMenu = async (bypassCache = false) => {
  try {
    // Skip API call if app is in logout state
    if (await isInLogoutState()) {
      throw new Error('App is in logout state, API call skipped');
    }
    
    // Reset global flags that might block fetching
    const globalObj = typeof window !== 'undefined' ? window : global;
    if (globalObj._menuFetchFailed) {
      console.log('Previous menu fetch failed, clearing cache before retrying');
      await clearCacheForKey(CACHE_KEYS.MENU);
      globalObj._menuFetchFailed = false;
      bypassCache = true;
    }
    
    // Check cache if not bypassing
    if (!bypassCache) {
      const isCacheHit = await isCacheValid(CACHE_KEYS.MENU);
      if (isCacheHit) {
        console.log('Using cached menu items');
        const cachedData = await getCachedData(CACHE_KEYS.MENU);
        if (cachedData) {
          return cachedData;
        }
      }
    }
    
    console.log('Fetching restaurant menu from API...');
    
    // Try first with menu-items endpoint
    try {
      const response = await apiClient.get('/menu-items');
      console.log('Menu fetched successfully from /menu-items');
      
      // Filter out any null or invalid menu items
      let menuData = response.data;
      if (Array.isArray(menuData)) {
        menuData = menuData.filter(item => item !== null && item !== undefined && item._id);
        console.log(`Filtered ${response.data.length - menuData.length} invalid menu items`);
      }
      
      // Update cache with fresh data
      await setCacheData(CACHE_KEYS.MENU, menuData);
      
      return menuData;
    } catch (menuError) {
      console.warn('Error fetching from /menu-items, trying /menu:', menuError.message);
      
      // Fallback to /menu endpoint if the first one fails
      const fallbackResponse = await apiClient.get('/menu');
      console.log('Menu fetched successfully from fallback /menu endpoint');
      
      // Filter out any null or invalid menu items
      let menuData = fallbackResponse.data;
      if (Array.isArray(menuData)) {
        menuData = menuData.filter(item => item !== null && item !== undefined && item._id);
        console.log(`Filtered ${fallbackResponse.data.length - menuData.length} invalid menu items`);
      }
      
      // Update cache with fresh data
      await setCacheData(CACHE_KEYS.MENU, menuData);
      
      return menuData;
    }
  } catch (error) {
    console.error('Error fetching menu:', error);
    
    // Mark that the fetch failed for next attempt
    const globalObj = typeof window !== 'undefined' ? window : global;
    globalObj._menuFetchFailed = true;
    
    // If API call failed, try to use stale cache as fallback
    if (!bypassCache) {
      const cachedData = await getCachedData(CACHE_KEYS.MENU);
      if (cachedData) {
        console.log('Using stale cache as fallback for menu items');
        return cachedData;
      }
    }
    
    throw new Error(error.message || 'Failed to fetch menu items');
  }
};

/**
 * Fetch restaurant orders
 * @param {boolean} bypassCache - Force fresh data fetch
 * @param {Object} options - Pagination and filter options
 * @returns {Promise<Array>} Order items
 */
export const fetchRestaurantOrders = async (bypassCache = false, options = {}) => {
  try {
    // Skip API call if app is in logout state
    if (await isInLogoutState()) {
      throw new Error('App is in logout state, API call skipped');
    }
    
    // Extract pagination and filter options with defaults
    const { page = 1, pageSize = 100, type = 'on-premise', status } = options;
    
    // Create a cache key that includes the filter parameters
    const dynamicCacheKey = `${CACHE_KEYS.ORDERS}_${type}_${page}_${status || 'all'}`;
    
    // Check cache if not bypassing
    if (!bypassCache) {
      const isCacheHit = await isCacheValid(dynamicCacheKey);
      if (isCacheHit) {
        console.log('Using cached orders');
        const cachedData = await getCachedData(dynamicCacheKey);
        if (cachedData) {
          return cachedData;
        }
      }
    }
    
    console.log('Fetching restaurant orders from API...');
    
    // Build query parameters
    let queryParams = `?page=${page}&pageSize=${pageSize}&type=${type}`;
    if (status) {
      queryParams += `&status=${status}`;
    }
    
    const response = await apiClient.get(`/orders${queryParams}`);
    
    if (response.status === 200 && response.data) {
      console.log('Orders fetched successfully from API');
      
      // Update cache with fresh data using the dynamic cache key
      await setCacheData(dynamicCacheKey, response.data);
      
      return response.data;
    } else {
      throw new Error('Invalid response when fetching orders');
    }
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    
    // Create a dynamic cache key for fallback that matches the one used above
    const { type = 'on-premise', page = 1, status } = options;
    const dynamicCacheKey = `${CACHE_KEYS.ORDERS}_${type}_${page}_${status || 'all'}`;
    
    // If API call failed, try to use stale cache as fallback
    if (!bypassCache) {
      const cachedData = await getCachedData(dynamicCacheKey);
      if (cachedData) {
        console.log('Using stale cache as fallback for orders');
        return cachedData;
      }
    }
    
    throw new Error(error.message || 'Failed to fetch order items');
  }
};

/**
 * Update restaurant information
 * @param {Object} data - Updated restaurant data (contains only changed fields)
 * @returns {Promise<Object>} Updated restaurant data
 */
export const updateRestaurantInfo = async (data) => {
  try {
    secureLog.info('Updating restaurant information', { 
      fields: Object.keys(data) 
    });
    
    // Only send the fields that were provided (changed fields)
    const apiData = { ...data };
    
    // If image paths are included, ensure they're relative (remove domain if present)
    if (apiData.logoImage) {
      apiData.logoImage = formatImagePathForAPI(apiData.logoImage);
    }
    
    // Format each banner image path if bannerImages exists
    if (apiData.bannerImages) {
      apiData.bannerImages = apiData.bannerImages.map(img => formatImagePathForAPI(img));
    }
    
    secureLog.info('Formatted data for API', {
      fields: Object.keys(apiData)
    });
    
    // Use PUT method to /restaurant-info endpoint as defined in the server
    try {
      const response = await apiClient.put('/restaurant-info', apiData);
      
      // Update cache with fresh data if successful
      if (response.data) {
        const updatedData = response.data.data || response.data;
        await setCacheData(CACHE_KEYS.RESTAURANT_INFO, updatedData);
        secureLog.info('Restaurant info updated successfully');
        return response.data;
      }
    } catch (error) {
      secureLog.error('Error with primary endpoint, trying alternative:', error);
      
      // Try alternative endpoint as fallback
      const altResponse = await apiClient.put('/update-restaurant-info', apiData);
      
      if (altResponse.data) {
        // Refresh the restaurant info cache
        await clearCacheForKey(CACHE_KEYS.RESTAURANT_INFO);
        const freshData = await fetchRestaurantInfo(true);
        secureLog.info('Restaurant info updated successfully with alternative endpoint');
        return { data: freshData };
      }
    }
  } catch (error) {
    secureLog.error('Error updating restaurant info:', error);
    throw new Error(error.message || 'Failed to update restaurant information');
  }
};

/**
 * Helper function to format image paths for API
 * Ensures paths are relative by removing the domain if present
 */
const formatImagePathForAPI = (imagePath) => {
  if (!imagePath) return '';
  
  // If it's already a relative path, return as is
  if (imagePath.startsWith('/uploads/')) {
    return imagePath;
  }
  
  // If it contains the domain, extract just the path
  const domain = 'https://dmenu-five.vercel.app';
  if (imagePath.includes(domain)) {
    return imagePath.split(domain)[1];
  }
  
  // Return the original if we can't process it
  return imagePath;
};

/**
 * Update menu item status (available/unavailable)
 * @param {string} itemId - Menu item ID
 * @param {boolean} available - Availability status
 * @returns {Promise<Object>} Updated item data
 */
export const updateItemAvailability = async (itemId, available) => {
  try {
    console.log(`Updating item ${itemId} availability to ${available}...`);
    const response = await apiClient.post(`/menu-items/${itemId}/availability`, { available });
    
    // Update cached menu if available
    const cachedMenu = await getCachedData(CACHE_KEYS.MENU);
    if (cachedMenu && Array.isArray(cachedMenu)) {
      // Filter out any null or undefined items first
      const validItems = cachedMenu.filter(item => item !== null && item !== undefined);
      
      const updatedMenu = validItems.map(item => {
        // Safely check ID properties
        const itemIdMatch = (item?.id === itemId) || (item?._id === itemId);
        if (itemIdMatch) {
          return { ...item, available };
        }
        return item;
      });
      await setCacheData(CACHE_KEYS.MENU, updatedMenu);
    }
    
    console.log('Item availability updated successfully');
    return response.data;
  } catch (error) {
    console.error('Error updating item availability:', error);
    throw new Error(error.message || 'Failed to update item availability');
  }
};

/**
 * Test API connection
 * @returns {Promise<boolean>} Whether the API is reachable
 */
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await apiClient.get('/env-check');
    
    console.log('API connection test succeeded');
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

/**
 * Fetch restaurant categories
 * @param {boolean} bypassCache - Force fresh data fetch
 * @returns {Promise<Array>} Categories data
 */
export const fetchCategories = async (bypassCache = false) => {
  try {
    // Skip API call if app is in logout state
    if (await isInLogoutState()) {
      throw new Error('App is in logout state, API call skipped');
    }
    
    // Reset global flags that might block fetching
    const globalObj = typeof window !== 'undefined' ? window : global;
    if (globalObj._categoriesFetchFailed) {
      console.log('Previous categories fetch failed, clearing cache before retrying');
      await clearCacheForKey(CACHE_KEYS.CATEGORIES);
      globalObj._categoriesFetchFailed = false;
      bypassCache = true;
    }
    
    // Check cache if not bypassing
    if (!bypassCache) {
      const isCacheHit = await isCacheValid(CACHE_KEYS.CATEGORIES);
      if (isCacheHit) {
        console.log('Using cached categories');
        const cachedData = await getCachedData(CACHE_KEYS.CATEGORIES);
        if (cachedData) {
          return cachedData;
        }
      }
    }
    
    console.log('Fetching categories from API...');
    const response = await apiClient.get('/categories');
    
    if (response.status === 200 && response.data) {
      console.log('Categories fetched successfully from API');
      
      // Update cache with fresh data
      await setCacheData(CACHE_KEYS.CATEGORIES, response.data);
      
      return response.data;
    } else {
      throw new Error('Invalid response when fetching categories');
    }
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    
    // Mark that the fetch failed for next attempt
    const globalObj = typeof window !== 'undefined' ? window : global;
    globalObj._categoriesFetchFailed = true;
    
    // If API call failed, try to use stale cache as fallback
    if (!bypassCache) {
      const cachedData = await getCachedData(CACHE_KEYS.CATEGORIES);
      if (cachedData) {
        console.log('Using stale cache as fallback for categories');
        return cachedData;
      }
    }
    
    throw new Error(error.message || 'Failed to fetch categories');
  }
};

/**
 * Fetch restaurant settings
 * @param {boolean} bypassCache - Force fresh data fetch
 * @returns {Promise<Object>} Settings data
 */
export const fetchSettings = async (bypassCache = false) => {
  try {
    // Skip API call if app is in logout state
    if (await isInLogoutState()) {
      throw new Error('App is in logout state, API call skipped');
    }
    
    // Always bypass cache if server explicitly requests it with headers
    const shouldBypassCache = bypassCache || (await getCachedData(CACHE_KEYS.SETTINGS))?.bypassCache;
    
    // Check cache if not bypassing
    if (!shouldBypassCache) {
      const isCacheHit = await isCacheValid(CACHE_KEYS.SETTINGS);
      if (isCacheHit) {
        console.log('Using cached settings');
        const cachedData = await getCachedData(CACHE_KEYS.SETTINGS);
        if (cachedData) {
          // Always ensure currency is DZD
          if (cachedData.defaultCurrency !== 'DZD') {
            cachedData.defaultCurrency = 'DZD';
          }
          console.log('Returning cached settings:', cachedData);
          return cachedData;
        }
      }
    }
    
    console.log('Fetching restaurant settings from API...');
    try {
    const response = await apiClient.get('/locale-settings');
      console.log('Settings API response status:', response.status);
    
      if (response.status === 200) {
      console.log('Settings fetched successfully from API');
      
        // Extract data from response (handle both formats)
        let settingsData = response.data?.data || response.data;
        console.log('Raw settings data from API:', settingsData);
        
        // Check if the data has the expected structure
        if (!settingsData || typeof settingsData !== 'object') {
          console.error('Invalid settings data format:', settingsData);
          throw new Error('Invalid settings data format');
        }
        
        // Ensure we have the three required fields with defaults if missing
        const normalizedSettings = {
          defaultLanguage: settingsData.defaultLanguage || 'en',
          defaultCurrency: 'DZD', // Always DZD regardless of server
          orderingEnabled: settingsData.orderingEnabled !== undefined ? settingsData.orderingEnabled : true
        };
        
        // Check for cache control headers and respect them
        const cacheControl = response.headers?.['cache-control'] || '';
        const shouldCache = !cacheControl.includes('no-store') && !cacheControl.includes('no-cache');
        
        if (shouldCache) {
      // Update cache with fresh data
          await setCacheData(CACHE_KEYS.SETTINGS, normalizedSettings);
          console.log('Settings cached successfully');
        } else {
          console.log('Server requested no caching for settings');
          // Mark the cache to be bypassed next time
          await setCacheData(CACHE_KEYS.SETTINGS, { ...normalizedSettings, bypassCache: true });
        }
      
        return normalizedSettings;
    } else {
        console.error('Invalid API response:', response);
      throw new Error('Invalid response when fetching settings');
      }
    } catch (apiError) {
      console.error('API request failed:', apiError);
      
      // Add more detailed logging
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response data:', apiError.response.data);
      } else if (apiError.request) {
        console.error('No response received:', apiError.request);
      } else {
        console.error('Error setting up request:', apiError.message);
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching settings:', error.message);
    
    // If API call failed, try to use stale cache as fallback
    if (!bypassCache) {
      const cachedData = await getCachedData(CACHE_KEYS.SETTINGS);
      if (cachedData) {
        console.log('Using stale cache as fallback for settings');
        // Ensure currency is DZD even in fallback data
        return {
          defaultLanguage: cachedData.defaultLanguage || 'en',
          defaultCurrency: 'DZD',
          orderingEnabled: cachedData.orderingEnabled !== undefined ? cachedData.orderingEnabled : true
        };
      }
    }
    
    // If we reach here, we cannot get settings - provide default values
    console.log('No cache available, returning default settings');
    return {
      defaultLanguage: 'en',
      defaultCurrency: 'DZD',
      orderingEnabled: true
    };
  }
};

/**
 * Update restaurant category
 * @param {Object} categoryData - Updated category data
 * @returns {Promise<Object>} Updated category data
 */
export const updateCategory = async (categoryData) => {
  try {
    console.log('Updating category:', categoryData.id);
    console.log('Category update data:', JSON.stringify(categoryData));
    
    // Add detailed logging
    console.log(`Sending PUT request to /categories/${categoryData.id}`);
    
    let response;
    try {
      // Try PUT first (correct RESTful method)
      response = await apiClient.put(`/categories/${categoryData.id}`, categoryData);
    } catch (putError) {
      console.warn('PUT request failed (405 Method Not Allowed). Trying POST method as fallback.');
      // If PUT fails with 405, try POST as fallback (for compatibility with server)
      response = await apiClient.post(`/categories/${categoryData.id}`, categoryData);
    }
    
    console.log('Category update response status:', response.status);
    
    // Update cached categories if available
    const cachedCategories = await getCachedData(CACHE_KEYS.CATEGORIES);
    if (cachedCategories && Array.isArray(cachedCategories)) {
      const updatedCategories = cachedCategories.map(cat => {
        if (cat.id === categoryData.id) {
          return { ...cat, ...categoryData };
        }
        return cat;
      });
      await setCacheData(CACHE_KEYS.CATEGORIES, updatedCategories);
    }
    
    console.log('Category updated successfully');
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    console.error('Error details:', error.response?.status, error.response?.data);
    throw new Error(error.message || 'Failed to update category');
  }
};

/**
 * Create a new restaurant category
 * @param {Object} categoryData - New category data
 * @returns {Promise<Object>} Created category data
 */
export const createCategory = async (categoryData) => {
  try {
    console.log('Creating new category:', categoryData.name);
    const response = await apiClient.post('/categories', categoryData);
    
    // Update cached categories if available
    const cachedCategories = await getCachedData(CACHE_KEYS.CATEGORIES);
    if (cachedCategories && Array.isArray(cachedCategories)) {
      const updatedCategories = [...cachedCategories, response.data];
      await setCacheData(CACHE_KEYS.CATEGORIES, updatedCategories);
    } else {
      // If no cache exists, create one with just this category
      await setCacheData(CACHE_KEYS.CATEGORIES, [response.data]);
    }
    
    console.log('Category created successfully');
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw new Error(error.message || 'Failed to create category');
  }
};

/**
 * Delete a restaurant category
 * @param {string} categoryId - ID of the category to delete 
 * @returns {Promise<Object>} Result of the deletion operation
 */
export const deleteCategory = async (categoryId) => {
  try {
    console.log('Deleting category:', categoryId);
    const response = await apiClient.delete(`/categories/${categoryId}`);
    
    // Update cached categories if available
    const cachedCategories = await getCachedData(CACHE_KEYS.CATEGORIES);
    if (cachedCategories && Array.isArray(cachedCategories)) {
      const updatedCategories = cachedCategories.filter(cat => 
        cat.id !== categoryId && cat._id !== categoryId
      );
      await setCacheData(CACHE_KEYS.CATEGORIES, updatedCategories);
    }
    
    console.log('Category deleted successfully');
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw new Error(error.message || 'Failed to delete category');
  }
};

/**
 * Update restaurant settings
 * @param {Object} settingsData - Updated settings data
 * @returns {Promise<Object>} Updated settings data
 */
export const updateSettings = async (settingsData) => {
  try {
    console.log('Updating restaurant settings...', settingsData);
    
    // Validate required fields
    if (!settingsData.defaultLanguage) {
      console.warn('defaultLanguage is required, using en as fallback');
      settingsData.defaultLanguage = 'en';
    }
    
    // Ensure valid language code
    if (!['en', 'fr', 'ar'].includes(settingsData.defaultLanguage)) {
      console.warn(`Invalid language code: ${settingsData.defaultLanguage}, using en as fallback`);
      settingsData.defaultLanguage = 'en';
    }
    
    // Try the PUT endpoint first to match server implementation
    try {
      const response = await apiClient.put('/locale-settings', settingsData);
      console.log('Settings updated successfully with PUT');
      
      // Process response data
      if (response.data) {
        // Server may return data in the data field or directly
        const updatedData = response.data.data || response.data;
        
        // Normalize the response to our expected format
        const normalizedSettings = {
          defaultLanguage: updatedData.defaultLanguage || 'en',
          defaultCurrency: 'DZD', // Always DZD
          orderingEnabled: updatedData.orderingEnabled !== undefined ? updatedData.orderingEnabled : true
        };
        
        // Update cache with fresh data
        await setCacheData(CACHE_KEYS.SETTINGS, normalizedSettings);
        console.log('Updated settings cached successfully');
        
        return normalizedSettings;
      }
    } catch (putError) {
      console.warn('PUT request failed, falling back to POST:', putError.message);
      
      // Fall back to POST if PUT fails
    const response = await apiClient.post('/locale-settings', settingsData);
    
    if (response.data) {
        // Server may return data in the data field or directly
      const updatedData = response.data.data || response.data;
        
        // Normalize the response to our expected format
        const normalizedSettings = {
          defaultLanguage: updatedData.defaultLanguage || 'en',
          defaultCurrency: 'DZD', // Always DZD
          orderingEnabled: updatedData.orderingEnabled !== undefined ? updatedData.orderingEnabled : true
        };
        
        // Update cache with fresh data
        await setCacheData(CACHE_KEYS.SETTINGS, normalizedSettings);
        console.log('Updated settings cached successfully');
        
        return normalizedSettings;
    }
    
      console.log('Settings updated successfully with POST fallback');
    return response.data;
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    
    throw new Error(error.message || 'Failed to update settings');
  }
};

/**
 * Test which API endpoints are available
 * @returns {Promise<Object>} Results of endpoint testing
 */
export const testApiEndpoints = async () => {
  const endpoints = [
    '/env-check',
    '/restaurant-info',
    '/menu-items',
    '/menu',
    '/categories',
    '/locale-settings',
    '/orders'
  ];
  
  const results = {};
  
  console.log('Testing API endpoints...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const response = await apiClient.get(endpoint);
      results[endpoint] = {
        success: true,
        status: response.status,
        hasData: !!response.data
      };
      console.log(`✅ Endpoint ${endpoint} is available - Status: ${response.status}`);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      results[endpoint] = {
        success: false,
        status,
        error: message
      };
      console.log(`❌ Endpoint ${endpoint} failed - ${status ? `Status: ${status}` : 'No response'} - ${message}`);
    }
  }
  
  console.log('API endpoint testing complete');
  return results;
};

/**
 * Update order status
 * @param {string} orderId - The ID of the order to update
 * @param {string} status - The new status for the order
 * @returns {Promise<Object>} Updated order data
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    console.log(`Updating order ${orderId} status to ${status}...`);
    
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    if (!status) {
      throw new Error('Status is required');
    }
    
    // Validate status
    const validStatuses = ['pending', 'preparing', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Based on logs, the direct PUT to /orders/{id} works correctly on the dmenu server
    // So we'll use that as our primary endpoint
    try {
      // Call the server API to update the order status
      const response = await apiClient.put(`/orders/${orderId}`, { status });
      
      // Clear ALL order caches with different filter combinations
      // This ensures no stale data remains in any cached filter view
      await AsyncStorage.getAllKeys().then(keys => {
        const orderCacheKeys = keys.filter(key => key.startsWith(CACHE_KEYS.ORDERS));
        return AsyncStorage.multiRemove(orderCacheKeys);
      });
      
      console.log('Order status updated successfully');
      
      // Force a small delay to ensure the UI has time to process the change
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return response.data;
    } catch (primaryError) {
      console.warn('Primary update endpoint failed, trying alternatives...', primaryError.message);
      
      // If direct PUT fails, try alternative endpoints
      try {
        // Try the status-specific endpoint
        const response = await apiClient.put(`/orders/${orderId}/status`, { status });
        await AsyncStorage.getAllKeys().then(keys => {
          const orderCacheKeys = keys.filter(key => key.startsWith(CACHE_KEYS.ORDERS));
          return AsyncStorage.multiRemove(orderCacheKeys);
        });
        console.log('Order status updated successfully via status endpoint');
        
        // Force a small delay to ensure the UI has time to process the change
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return response.data;
      } catch (secondaryError) {
        // Try using PATCH method instead
        try {
          const response = await apiClient.patch(`/orders/${orderId}`, { status });
          await AsyncStorage.getAllKeys().then(keys => {
            const orderCacheKeys = keys.filter(key => key.startsWith(CACHE_KEYS.ORDERS));
            return AsyncStorage.multiRemove(orderCacheKeys);
          });
          console.log('Order status updated successfully via PATCH method');
          
          // Force a small delay to ensure the UI has time to process the change
          await new Promise(resolve => setTimeout(resolve, 300));
          
          return response.data;
        } catch (tertiaryError) {
          // As a last resort, try posting to a status endpoint
          try {
            const response = await apiClient.post(`/orders/${orderId}/status`, { status });
            await AsyncStorage.getAllKeys().then(keys => {
              const orderCacheKeys = keys.filter(key => key.startsWith(CACHE_KEYS.ORDERS));
              return AsyncStorage.multiRemove(orderCacheKeys);
            });
            console.log('Order status updated successfully via POST method');
            
            // Force a small delay to ensure the UI has time to process the change
            await new Promise(resolve => setTimeout(resolve, 300));
            
            return response.data;
          } catch (finalError) {
            // If all API attempts fail, throw a comprehensive error
            throw new Error(`Failed to update order status. All API endpoints attempted.`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error(error.message || 'Failed to update order status');
  }
};

/**
 * Create a new menu item
 * @param {Object} menuItemData - Menu item data
 * @returns {Promise<Object>} Created menu item data
 */
export const createMenuItem = async (menuItemData) => {
  try {
    console.log('Creating new menu item:', menuItemData);
    const response = await apiClient.post('/menu-items', menuItemData);
    
    // Clear menu items cache to ensure fresh data on next fetch
    await clearCacheForKey(CACHE_KEYS.MENU);
    
    console.log('Menu item created successfully');
    return response.data;
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw new Error(error.message || 'Failed to create menu item');
  }
};

/**
 * Update an existing menu item
 * @param {string} itemId - Menu item ID
 * @param {Object} menuItemData - Updated menu item data
 * @returns {Promise<Object>} Updated menu item data
 */
export const updateMenuItem = async (itemId, menuItemData) => {
  try {
    console.log(`Updating menu item ${itemId}:`, menuItemData);
    const response = await apiClient.put(`/menu-items/${itemId}`, menuItemData);
    
    // Update cached menu if available
    const cachedMenu = await getCachedData(CACHE_KEYS.MENU);
    if (cachedMenu && Array.isArray(cachedMenu)) {
      // Filter out any null or undefined items first
      const validItems = cachedMenu.filter(item => item !== null && item !== undefined);
      
      const updatedMenu = validItems.map(item => {
        // Safely check ID properties
        const itemIdMatch = (item?.id === itemId) || (item?._id === itemId);
        if (itemIdMatch) {
          return { ...item, ...menuItemData };
        }
        return item;
      });
      await setCacheData(CACHE_KEYS.MENU, updatedMenu);
    }
    
    console.log('Menu item updated successfully');
    return response.data;
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw new Error(error.message || 'Failed to update menu item');
  }
};

/**
 * Delete a menu item
 * @param {string} itemId - Menu item ID
 * @returns {Promise<boolean>} Success indicator
 */
export const deleteMenuItem = async (itemId) => {
  try {
    console.log(`Deleting menu item ${itemId}`);
    const response = await apiClient.delete(`/menu-items/${itemId}`);
    
    // Update cached menu if available by removing the deleted item
    const cachedMenu = await getCachedData(CACHE_KEYS.MENU);
    if (cachedMenu && Array.isArray(cachedMenu)) {
      // Filter out null/undefined items and the item being deleted
      const updatedMenu = cachedMenu.filter(item => {
        if (item === null || item === undefined) return false;
        return item?.id !== itemId && item?._id !== itemId;
      });
      await setCacheData(CACHE_KEYS.MENU, updatedMenu);
    }
    
    console.log('Menu item deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw new Error(error.message || 'Failed to delete menu item');
  }
};

/**
 * Delete multiple menu items
 * @param {string[]} itemIds - Array of menu item IDs
 * @returns {Promise<boolean>} Success indicator
 */
export const deleteMultipleMenuItems = async (itemIds) => {
  try {
    // Filter out any invalid IDs
    const validItemIds = itemIds.filter(id => id !== null && id !== undefined && id !== '');
    console.log(`Deleting ${validItemIds.length} menu items (filtered from ${itemIds.length} IDs)`);
    
    if (validItemIds.length === 0) {
      console.log('No valid item IDs to delete');
      return true;
    }
    
    // Process individual deletes directly since the bulk endpoint doesn't exist
    const deletePromises = validItemIds.map(id => deleteMenuItem(id));
    await Promise.all(deletePromises);
    
    console.log('All menu items deleted successfully via individual requests');
    return true;
  } catch (error) {
    console.error('Error deleting multiple menu items:', error);
    throw new Error(error.message || 'Failed to delete menu items');
  }
}; 