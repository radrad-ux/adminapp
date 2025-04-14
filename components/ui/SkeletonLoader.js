import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

/**
 * SkeletonLoader component for displaying loading placeholders
 * 
 * @param {Object} props
 * @param {Object} props.style - Additional style for the skeleton container
 * @param {number} props.width - Width of the skeleton (default: 100%)
 * @param {number} props.height - Height of the skeleton
 * @param {boolean} props.circle - Whether to render as a circle
 * @param {number} props.borderRadius - Border radius for the skeleton
 * @param {string} props.type - Predefined types: 'text', 'title', 'avatar', 'thumbnail', 'card'
 * @returns {JSX.Element}
 */
const SkeletonLoader = ({ 
  style, 
  width: customWidth, 
  height: customHeight, 
  circle = false,
  borderRadius = 4,
  type
}) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation value
  const opacity = useRef(new Animated.Value(0.3)).current;
  
  // Define dimensions based on type
  let width = customWidth;
  let height = customHeight;
  
  if (type) {
    switch (type) {
      case 'text':
        width = customWidth || '100%';
        height = customHeight || 16;
        break;
      case 'title':
        width = customWidth || '70%';
        height = customHeight || 24;
        break;
      case 'avatar':
        width = customWidth || 50;
        height = customHeight || 50;
        circle = true;
        break;
      case 'thumbnail':
        width = customWidth || 100;
        height = customHeight || 100;
        borderRadius = 8;
        break;
      case 'card':
        width = customWidth || '95%';
        height = customHeight || 120;
        borderRadius = 8;
        break;
      default:
        width = customWidth || '100%';
        height = customHeight || 20;
    }
  }
  
  // Calculate dimensions for the circle
  const dimensions = circle 
    ? { width: width || height, height: height || width, borderRadius: (width || height) / 2 }
    : { width: width, height: height, borderRadius };

  // Start animation
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    
    return () => {
      animation.stop();
    };
  }, [opacity]);

  return (
    <Animated.View 
      style={[
        styles.skeleton,
        dimensions,
        { 
          opacity,
          backgroundColor: colorScheme === 'dark' 
            ? colors.card 
            : 'rgba(0, 0, 0, 0.1)'
        },
        style
      ]}
    />
  );
};

// Create a row of text skeletons
SkeletonLoader.TextRow = ({ lines = 1, style, lastLineWidth = '100%' }) => {
  return (
    <View style={[styles.textRowContainer, style]}>
      {Array(lines).fill(0).map((_, i) => (
        <SkeletonLoader 
          key={i} 
          type="text" 
          style={styles.textLine}
          width={i === lines - 1 && typeof lastLineWidth === 'string' ? lastLineWidth : '100%'} 
        />
      ))}
    </View>
  );
};

// Create a skeleton for restaurant info
SkeletonLoader.RestaurantInfo = () => {
  return (
    <View style={styles.restaurantContainer}>
      <SkeletonLoader type="card" style={styles.banner} />
      <View style={styles.logoContainer}>
        <SkeletonLoader type="avatar" width={80} height={80} style={styles.logo} />
      </View>
      <View style={styles.infoContainer}>
        <SkeletonLoader type="title" style={styles.title} />
        <SkeletonLoader.TextRow lines={3} style={styles.description} lastLineWidth="60%" />
        <View style={styles.detailsContainer}>
          <SkeletonLoader.TextRow lines={1} width="48%" style={styles.detail} />
          <SkeletonLoader.TextRow lines={1} width="48%" style={styles.detail} />
        </View>
      </View>
    </View>
  );
};

// Create a skeleton for menu items list
SkeletonLoader.MenuItems = () => {
  return (
    <View style={styles.menuItemsContainer}>
      {/* Category filters */}
      <View style={styles.categoriesContainer}>
        <SkeletonLoader type="text" width={80} height={32} borderRadius={16} style={styles.categoryPill} />
        <SkeletonLoader type="text" width={100} height={32} borderRadius={16} style={styles.categoryPill} />
        <SkeletonLoader type="text" width={90} height={32} borderRadius={16} style={styles.categoryPill} />
        <SkeletonLoader type="text" width={110} height={32} borderRadius={16} style={styles.categoryPill} />
      </View>
      
      {/* Search bar */}
      <SkeletonLoader type="text" height={50} borderRadius={8} style={styles.searchBar} />
      
      {/* Menu items */}
      {Array(3).fill(0).map((_, i) => (
        <View key={i} style={styles.menuItemCard}>
          <View style={styles.menuItemHeader}>
            <SkeletonLoader type="title" width="60%" />
            <SkeletonLoader type="text" width={60} />
          </View>
          
          <View style={styles.menuItemContent}>
            <SkeletonLoader type="thumbnail" width={90} height={90} />
            <View style={styles.menuItemDetails}>
              <SkeletonLoader.TextRow lines={2} style={styles.menuItemDescription} lastLineWidth="80%" />
              <View style={styles.menuItemFooter}>
                <SkeletonLoader type="text" width={100} />
                <SkeletonLoader type="text" width={70} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

// Create a skeleton for orders list
SkeletonLoader.Orders = () => {
  return (
    <View style={styles.ordersContainer}>
      {/* Status filter tabs */}
      <View style={styles.filterTabs}>
        <SkeletonLoader type="text" width={70} height={36} borderRadius={4} style={styles.filterTab} />
        <SkeletonLoader type="text" width={90} height={36} borderRadius={4} style={styles.filterTab} />
        <SkeletonLoader type="text" width={100} height={36} borderRadius={4} style={styles.filterTab} />
      </View>
      
      {/* Order cards */}
      {Array(3).fill(0).map((_, i) => (
        <View key={i} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View>
              <SkeletonLoader type="text" width={120} style={styles.orderId} />
              <SkeletonLoader type="text" width={150} style={styles.orderDate} />
            </View>
            <SkeletonLoader type="text" width={80} height={24} borderRadius={12} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.orderItems}>
            <SkeletonLoader.TextRow lines={1} width="100%" style={styles.orderItem} />
            <SkeletonLoader.TextRow lines={1} width="100%" style={styles.orderItem} />
            <SkeletonLoader.TextRow lines={1} width="60%" style={styles.orderItem} />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.orderFooter}>
            <View>
              <SkeletonLoader type="text" width={150} />
              <SkeletonLoader type="text" width={100} />
            </View>
            <SkeletonLoader type="text" width={70} />
          </View>
        </View>
      ))}
    </View>
  );
};

// Create a skeleton for categories list
SkeletonLoader.Categories = () => {
  return (
    <View style={styles.categoriesListContainer}>
      {/* Add category button */}
      <SkeletonLoader type="card" height={60} style={styles.addCategoryButton} />
      
      {/* Category list items */}
      {Array(4).fill(0).map((_, i) => (
        <View key={i} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <SkeletonLoader type="title" width="60%" />
            <SkeletonLoader type="text" width={50} height={24} />
          </View>
          
          <SkeletonLoader.TextRow lines={2} style={styles.categoryDescription} lastLineWidth="70%" />
          
          <View style={styles.categoryFooter}>
            <SkeletonLoader type="text" width={80} />
            <View style={styles.categoryActions}>
              <SkeletonLoader type="text" width={70} height={36} borderRadius={4} style={styles.actionButton} />
              <SkeletonLoader type="text" width={70} height={36} borderRadius={4} style={styles.actionButton} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  textRowContainer: {
    width: '100%',
  },
  textLine: {
    marginVertical: 6,
  },
  
  // Restaurant Info Styles
  restaurantContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 16,
  },
  banner: {
    width: '100%',
    height: 180,
    marginBottom: 16,
  },
  logoContainer: {
    position: 'absolute',
    top: 160,
    alignSelf: 'center',
    zIndex: 1,
  },
  logo: {
    borderWidth: 2,
    borderColor: 'white',
  },
  infoContainer: {
    width: '100%',
    marginTop: 50,
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
  },
  detailsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detail: {
    width: '48%',
  },
  
  // Menu Items Styles
  menuItemsContainer: {
    width: '100%',
    padding: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingBottom: 10,
  },
  categoryPill: {
    marginRight: 10,
  },
  searchBar: {
    marginBottom: 20,
  },
  menuItemCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuItemContent: {
    flexDirection: 'row',
  },
  menuItemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  menuItemDescription: {
    marginBottom: 12,
  },
  menuItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Orders Styles
  ordersContainer: {
    width: '100%',
    padding: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  filterTab: {
    marginRight: 10,
  },
  orderCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    marginBottom: 4,
  },
  orderDate: {
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 12,
  },
  orderItems: {
    marginBottom: 8,
  },
  orderItem: {
    marginVertical: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Categories Styles
  categoriesListContainer: {
    width: '100%',
    padding: 16,
  },
  addCategoryButton: {
    marginBottom: 20,
  },
  categoryCard: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDescription: {
    marginBottom: 16,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
  },
});

export default SkeletonLoader; 