import { useState, useCallback } from 'react';
import { fetchRestaurantInfo, fetchRestaurantMenu } from '../services/restaurantService';
import { useAuth } from '../context/AuthContext';

/**
 * Basic hook to manage restaurant data state.
 * NO AUTOMATIC FETCHING - only manual fetching when explicitly called.
 */
const useRestaurantInfo = () => {
  const [restaurantData, setRestaurantData] = useState(null);
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Function to manually fetch restaurant data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Manually fetching restaurant info and menu...');
      
      // Get restaurant info
      const data = await fetchRestaurantInfo(true);
      
      // Get menu data
      const menu = await fetchRestaurantMenu(true);
      
      // Update state
      setRestaurantData(data);
      setMenuData(menu);
      
      setLoading(false);
      return { restaurant: data, menu };
    } catch (err) {
      console.error('Restaurant data fetch error:', err);
      setError(err);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    restaurantData,
    menuData,
    loading,
    error,
    fetchData
  };
};

export default useRestaurantInfo; 