import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Modal,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchRestaurantOrders, updateOrderStatus } from '../services/restaurantService';
import useFetch from '../hooks/useFetch';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import ErrorBoundary from '../components/ErrorBoundary';
import { formatPrice } from '../utils/currencyUtils';
import { useNotifications } from '../context/NotificationsContext';
import notificationService from '../services/notificationService';
import TranslatedText from '../components/TranslatedText';

// Status badge component
const StatusBadge = ({ status, onPress, isDropdownOpen }) => {
  const { t, isRTL } = useLanguage();
  
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#4CAF50';
      case 'preparing':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusEmoji = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '✅';
      case 'preparing':
        return '👨‍🍳';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  };
  
  const getStatusText = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return t('orders', 'completedOrders');
      case 'preparing':
        return t('orders', 'preparingOrders');
      case 'pending':
        return t('orders', 'pendingOrders');
      case 'cancelled':
        return t('orders', 'cancelledOrders');
      default:
        return t('orders', 'unknown');
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.statusBadge, 
        { backgroundColor: getStatusColor() }
      ]} 
      onPress={onPress}
    >
      <Text style={[
        styles.statusText,
        { flexDirection: isRTL ? 'row-reverse' : 'row' }
      ]}>
        {getStatusEmoji()} {getStatusText()}
      </Text>
      {onPress && (
        <Entypo 
          name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
          size={12} 
          color="white" 
          style={{ 
            marginLeft: isRTL ? 0 : 4,
            marginRight: isRTL ? 4 : 0 
          }}
        />
      )}
    </TouchableOpacity>
  );
};

// StatusDropdown component for updating order status
const StatusDropdown = ({ currentStatus, onStatusChange, colors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t, isRTL } = useLanguage();
  
  const statusOptions = [
    { id: 'pending', label: `⏳ ${t('orders', 'pendingOrders')}`, color: '#FF9800' },
    { id: 'preparing', label: `👨‍🍳 ${t('orders', 'preparingOrders')}`, color: '#2196F3' },
    { id: 'completed', label: `✅ ${t('orders', 'completedOrders')}`, color: '#4CAF50' },
  ];
  
  const handleSelect = (status) => {
    if (status !== currentStatus) {
      setIsOpen(false);
      onStatusChange(status);
    } else {
      setIsOpen(false);
    }
  };

  const closeDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };
  
  // Find current status option
  const currentOption = statusOptions.find(option => option.id === currentStatus) || statusOptions[0];
  
  return (
    <View style={styles.statusDropdownContainer}>
      <TouchableOpacity 
        style={[
          styles.statusButton, 
          { 
            backgroundColor: currentOption.color,
            flexDirection: isRTL ? 'row-reverse' : 'row' 
          }
        ]} 
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[
          styles.statusButtonText,
          { textAlign: isRTL ? 'right' : 'left' }
        ]}>
          {isLoading ? t('orders', 'updating') : t('orders', 'updateStatus')}
        </Text>
        <Entypo name="chevron-down" size={16} color="white" />
      </TouchableOpacity>
      
      {isOpen && (
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.dropdownBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.statusDropdownMenu, 
                {
                  left: isRTL ? 'auto' : 0,
                  right: isRTL ? 0 : 'auto'
                }
              ]}>
                {statusOptions.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.statusMenuItem,
                      { borderLeftWidth: isRTL ? 0 : 4, 
                        borderRightWidth: isRTL ? 4 : 0,
                        borderLeftColor: isRTL ? 'transparent' : option.color,
                        borderRightColor: isRTL ? option.color : 'transparent',
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                      },
                      currentStatus === option.id && { backgroundColor: `${option.color}20` }
                    ]}
                    onPress={() => handleSelect(option.id)}
                  >
                    <Text style={[
                      styles.statusMenuItemText,
                      { textAlign: isRTL ? 'right' : 'left' }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

// Order item component
const OrderItem = ({ order, onPress, onLongPress, colors, onStatusChange, batchMode, selectedOrders, toggleOrderSelection, statusDropdownId, isStatusDropdownOpen, toggleStatusDropdown }) => {
  const orderDate = new Date(order.createdAt || order.timestamp || order.date || Date.now());
  const formattedDate = orderDate.toLocaleDateString();
  const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const checkboxScale = useRef(new Animated.Value(0)).current;
  const { t, isRTL } = useLanguage();

  // Get the MongoDB ID and extract the last 6 characters like the web dashboard does
  const fullId = order._id?.toString() || order.id?.toString() || order.orderId?.toString() || '';
  // Use the last 6 characters for display, but keep the full ID for API calls
  const displayOrderId = fullId.length > 6 ? fullId.slice(-6) : fullId || t('orders', 'unknown');
  
  // Handle quick status change
  const handleQuickStatusChange = (newStatus) => {
    // Close dropdown and call status change handler
    toggleStatusDropdown(); // This will close the dropdown
    if (onStatusChange) {
      onStatusChange(fullId, newStatus);
    }
  };

  // Is this order selected in batch mode
  const isSelected = selectedOrders.includes(fullId);

  // Status options for dropdown
  const statusOptions = [
    { id: 'pending', label: `⏳ ${t('orders', 'pendingOrders')}`, color: '#FF9800' },
    { id: 'preparing', label: `👨‍🍳 ${t('orders', 'preparingOrders')}`, color: '#2196F3' },
    { id: 'completed', label: `✅ ${t('orders', 'completedOrders')}`, color: '#4CAF50' },
  ];

  // Animate checkbox when batch mode changes
  useEffect(() => {
    Animated.spring(checkboxScale, {
      toValue: batchMode ? 1 : 0,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [batchMode, checkboxScale]);

  return (
    <View style={[
      styles.orderCard, 
      { backgroundColor: colors.card },
      isSelected && { 
        borderLeftWidth: isRTL ? 0 : 4, 
        borderRightWidth: isRTL ? 4 : 0,
        borderLeftColor: isRTL ? 'transparent' : colors.primary,
        borderRightColor: isRTL ? colors.primary : 'transparent'
      }
    ]}>
      {/* Checkbox for batch selection */}
      <Animated.View 
        style={[
          styles.checkbox,
          { 
            transform: [{ scale: checkboxScale }],
            opacity: checkboxScale,
            left: isRTL ? 'auto' : 14,
            right: isRTL ? 14 : 'auto'
          }
        ]}
      >
    <TouchableOpacity
          style={[
            styles.checkboxInner,
            isSelected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border }
          ]}
          onPress={() => toggleOrderSelection(fullId)}
        >
          {isSelected && (
            <Ionicons name="checkmark-sharp" size={14} color="white" />
          )}
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity
        style={styles.orderContent}
        onPress={() => batchMode ? toggleOrderSelection(fullId) : onPress(order)}
        onLongPress={onLongPress}
        delayLongPress={300}
    >
      <View style={[
        styles.orderHeader,
        { flexDirection: isRTL ? 'row-reverse' : 'row' }
      ]}>
        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <Text style={[
            styles.orderId, 
            { 
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left' 
            }
          ]}>
                {`${t('orders', 'orderNumber')}${displayOrderId}`}
          </Text>
          <Text style={[
            styles.orderDate, 
            { 
              color: colors.icon,
              textAlign: isRTL ? 'right' : 'left' 
            }
          ]}>
            {formattedDate} at {formattedTime}
          </Text>
        </View>
          
          <View style={[
            styles.statusContainer,
            { alignItems: isRTL ? 'flex-start' : 'flex-end' }
          ]}>
            <StatusBadge 
              status={order.status || 'pending'} 
              onPress={!batchMode ? toggleStatusDropdown : null}
              isDropdownOpen={isStatusDropdownOpen}
            />
            
            {/* Status dropdown menu */}
            {isStatusDropdownOpen && (
              <TouchableWithoutFeedback onPress={toggleStatusDropdown}>
                <View style={styles.dropdownBackdrop}>
                  <TouchableWithoutFeedback>
                    <View style={[
                      styles.topRightDropdownMenu,
                      {
                        right: isRTL ? 'auto' : 0,
                        left: isRTL ? 0 : 'auto'
                      }
                    ]}>
                      {statusOptions.map(option => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.statusMenuItem,
                            { 
                              borderLeftWidth: isRTL ? 0 : 4, 
                              borderRightWidth: isRTL ? 4 : 0,
                              borderLeftColor: isRTL ? 'transparent' : option.color,
                              borderRightColor: isRTL ? option.color : 'transparent',
                              flexDirection: isRTL ? 'row-reverse' : 'row'
                            },
                            order.status === option.id && { backgroundColor: `${option.color}20` }
                          ]}
                          onPress={() => handleQuickStatusChange(option.id)}
                        >
                          <Text style={[
                            styles.statusMenuItemText,
                            { textAlign: isRTL ? 'right' : 'left' }
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.orderDetails}>
        {order.items && order.items.length > 0 ? (
          <FlatList
            data={order.items.slice(0, 3)} // Show first 3 items only
            keyExtractor={(item, index) => `${item.id || index}`}
            renderItem={({ item }) => (
              <View style={[
                styles.orderItem,
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                <Text style={[
                  styles.itemQuantity, 
                  { 
                    color: colors.primary,
                    marginRight: isRTL ? 0 : 8,
                    marginLeft: isRTL ? 8 : 0,
                    textAlign: isRTL ? 'right' : 'left'
                  }
                ]}>
                  {item.quantity || 1}x
                </Text>
                <Text style={[
                  styles.itemName, 
                  { 
                    color: colors.text,
                    textAlign: isRTL ? 'right' : 'left' 
                  }
                ]}>
                  {item.name || t('orders', 'unknown')}
                </Text>
                <Text style={[
                  styles.itemPrice, 
                  { 
                    color: colors.text,
                    textAlign: isRTL ? 'left' : 'right' 
                  }
                ]}>
                  {formatPrice(item.price || 0)}
                </Text>
              </View>
            )}
            ListFooterComponent={
              order.items.length > 3 ? (
                <Text style={[styles.moreItems, { color: colors.icon }]}>
                  {`+${order.items.length - 3} more items`}
                </Text>
              ) : null
            }
          />
        ) : (
          <Text style={[styles.noItems, { color: colors.icon }]}>{t('orders', 'noItems')}</Text>
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={[
        styles.orderFooter, 
        { flexDirection: isRTL ? 'row-reverse' : 'row' }
      ]}>
        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <Text style={[
            styles.customerName, 
            { 
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left' 
            }
          ]}>
                {order.customerName || order.customerInfo?.name || t('orders', 'guestCustomer')}
          </Text>
              {(order.customerPhone || order.customerInfo?.phone) && (
                <Text style={[
                  styles.customerPhone, 
                  { 
                    color: colors.icon,
                    textAlign: isRTL ? 'right' : 'left' 
                  }
                ]}>
                  {order.customerPhone || order.customerInfo?.phone}
                </Text>
              )}
              {order.tableNumber && (
                <Text style={[
                  styles.tableNumber, 
                  { 
                    color: colors.secondary,
                    textAlign: isRTL ? 'right' : 'left' 
                  }
                ]}>
                  {t('orders', 'table').replace('{number}', order.tableNumber)}
                </Text>
              )}
        </View>
        <Text style={[
          styles.orderTotal, 
          { 
            color: colors.primary,
            textAlign: isRTL ? 'left' : 'right' 
          }
        ]}>
          {formatPrice(order.total || 0)}
        </Text>
      </View>
    </TouchableOpacity>
    </View>
  );
};

// Dropdown component for type and status selectors
const Dropdown = ({ 
  id, 
  label, 
  options, 
  selectedValue, 
  onSelect, 
  primaryColor, 
  counts,
  isOpen,
  toggleDropdown
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { isRTL } = useLanguage();

  // Animate the chevron when dropdown opens/closes
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const animatedStyles = {
    transform: [{ rotate: rotateInterpolate }],
  };

  // Find selected option label
  const selectedOption = options.find(option => option.id === selectedValue);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={[
        styles.dropdownLabel, 
        { textAlign: isRTL ? 'right' : 'left' }
      ]}>
        {label}
      </Text>
      <TouchableOpacity 
        style={[
          styles.dropdownButton, 
          { 
            borderColor: primaryColor,
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }
        ]} 
        onPress={toggleDropdown}
      >
        <Text style={[
          styles.dropdownButtonText, 
          { 
            color: primaryColor,
            textAlign: isRTL ? 'right' : 'left'
          }
        ]}>
          {selectedOption?.label || 'Select'}
        </Text>
        <Animated.View style={animatedStyles}>
          <Entypo name="chevron-down" size={16} color={primaryColor} />
        </Animated.View>
      </TouchableOpacity>
      
      {isOpen && (
        <TouchableWithoutFeedback onPress={toggleDropdown}>
          <View style={styles.dropdownBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.dropdownMenu, 
                { 
                  borderColor: primaryColor, 
                  backgroundColor: 'white',
                  left: isRTL ? 'auto' : 0,
                  right: isRTL ? 0 : 'auto'
                }
              ]}>
                {options.map(option => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.dropdownMenuItem,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      selectedValue === option.id && { backgroundColor: `${primaryColor}20` }
                    ]}
                    onPress={() => {
                      onSelect(option.id);
                      toggleDropdown();
                    }}
                  >
                    <Text style={[
                      styles.dropdownMenuItemText,
                      { textAlign: isRTL ? 'right' : 'left' },
                      selectedValue === option.id && { color: primaryColor, fontWeight: 'bold' }
                    ]}>
                      {option.label}
                    </Text>
                    {counts && counts[option.id] !== undefined && (
                      <View style={[
                        styles.dropdownCountBadge,
                        { backgroundColor: option.id === 'all' ? primaryColor : '#757575' }
                      ]}>
                        <Text style={styles.dropdownCountText}>{counts[option.id]}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

// OrderDetailsModal component to show when an order is clicked
const OrderDetailsModal = ({ 
  visible, 
  order, 
  onClose, 
  onStatusChange, 
  colors,
  modalStatusDropdownId,
  isModalStatusDropdownOpen,
  toggleModalStatusDropdown
}) => {
  const { t, isRTL } = useLanguage();
  
  if (!order) return null;
  
  const orderDate = new Date(order.createdAt || order.timestamp || order.date || Date.now());
  const formattedDate = orderDate.toLocaleDateString();
  const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Get the short order ID for display
  const fullId = order._id?.toString() || order.id?.toString() || order.orderId?.toString() || '';
  const displayOrderId = fullId.length > 6 ? fullId.slice(-6) : fullId || t('orders', 'unknown');
  
  // Calculate order totals
  const subtotal = order.items?.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) || 0;
  const tax = order.tax || 0;
  const total = order.total || subtotal;
  
  // Status options with translated labels
  const statusOptions = [
    { id: 'pending', label: `⏳ ${t('orders', 'pendingOrders')}`, color: '#FF9800' },
    { id: 'preparing', label: `👨‍🍳 ${t('orders', 'preparingOrders')}`, color: '#2196F3' },
    { id: 'completed', label: `✅ ${t('orders', 'completedOrders')}`, color: '#4CAF50' },
  ];
  
  // Find current status option
  const currentOption = statusOptions.find(option => option.id === (order.status || 'pending')) || statusOptions[0];
  
  const handleSelect = (status) => {
    if (status !== order.status) {
      toggleModalStatusDropdown();
      onStatusChange(fullId, status);
      onClose();
    } else {
      toggleModalStatusDropdown();
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Modal header */}
          <View style={[
            styles.modalHeader,
            { flexDirection: isRTL ? 'row-reverse' : 'row' }
          ]}>
            <Text style={[
              styles.modalTitle, 
              { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
            ]}>
              {t('orders', 'orderNumber')} #{displayOrderId}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {/* Order details section */}
          <ScrollView style={styles.modalBody}>
            {/* Order info box */}
            <View style={[styles.detailsSection, { borderColor: colors.border }]}>
              <View style={[
                styles.detailsRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                <Text style={[
                  styles.detailsLabel, 
                  { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                ]}>{t('orders', 'orderStatus')}:</Text>
                <StatusBadge status={order.status || 'Pending'} />
              </View>
              
              <View style={[
                styles.detailsRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                <Text style={[
                  styles.detailsLabel, 
                  { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                ]}>{t('orders', 'orderTime')}:</Text>
                <Text style={[
                  styles.detailsValue, 
                  { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                ]}>
                  {formattedDate} {t('common', 'at')} {formattedTime}
                </Text>
              </View>
              
              <View style={[
                styles.detailsRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                <Text style={[
                  styles.detailsLabel, 
                  { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                ]}>{t('common', 'type')}:</Text>
                <Text style={[
                  styles.detailsValue, 
                  { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                ]}>
                  {order.type === 'on-premise' ? `🍽️ ${t('orders', 'inRestaurantOrders')}` : `🚚 ${t('orders', 'deliveryOrders')}`}
                </Text>
              </View>
              
              {order.tableNumber && (
                <View style={[
                  styles.detailsRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' }
                ]}>
                  <Text style={[
                    styles.detailsLabel, 
                    { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                  ]}>{t('orders', 'table').replace('{number}', '')}:</Text>
                  <Text style={[
                    styles.detailsValue, 
                    { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                  ]}>
                    {order.tableNumber}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Customer info box - only for delivery */}
            {order.type === 'delivery' && order.customerInfo && (
              <View style={[styles.detailsSection, { borderColor: colors.border }]}>
                <Text style={[
                  styles.sectionTitle, 
                  { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                ]}>{t('orders', 'customerInfo')}</Text>
                
                {order.customerInfo.name && (
                  <View style={[
                    styles.detailsRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                  ]}>
                    <Text style={[
                      styles.detailsLabel, 
                      { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                    ]}>{t('common', 'name')}:</Text>
                    <Text style={[
                      styles.detailsValue, 
                      { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                    ]}>
                      {order.customerInfo.name}
                    </Text>
                  </View>
                )}
                
                {order.customerInfo.phone && (
                  <View style={[
                    styles.detailsRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                  ]}>
                    <Text style={[
                      styles.detailsLabel, 
                      { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                    ]}>{t('common', 'phone')}:</Text>
                    <Text style={[
                      styles.detailsValue, 
                      { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                    ]}>
                      {order.customerInfo.phone}
                    </Text>
                  </View>
                )}
                
                {order.customerInfo.address && (
                  <View style={[
                    styles.detailsRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                  ]}>
                    <Text style={[
                      styles.detailsLabel, 
                      { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                    ]}>{t('common', 'address')}:</Text>
                    <Text style={[
                      styles.detailsValue, 
                      { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                    ]}>
                      {order.customerInfo.address}
                    </Text>
                  </View>
                )}
                
                {order.customerInfo.notes && (
                  <View style={[
                    styles.detailsRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                  ]}>
                    <Text style={[
                      styles.detailsLabel, 
                      { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                    ]}>{t('common', 'notes')}:</Text>
                    <Text style={[
                      styles.detailsValue, 
                      { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                    ]}>
                      {order.customerInfo.notes}
                    </Text>
                  </View>
                )}
              </View>
            )}
            
            {/* Order items box */}
            <View style={[styles.detailsSection, { borderColor: colors.border }]}>
              <Text style={[
                styles.sectionTitle, 
                { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
              ]}>{t('orders', 'orderItems')}</Text>
              
              {order.items && order.items.length > 0 ? (
                <>
                  {order.items.map((item, index) => (
                    <View key={index} style={[
                      styles.itemRow,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      index < order.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}>
                      <View style={[
                        styles.itemInfo,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' }
                      ]}>
                        <Text style={[
                          styles.itemQuantity, 
                          { 
                            color: colors.primary,
                            marginRight: isRTL ? 0 : 8,
                            marginLeft: isRTL ? 8 : 0
                          }
                        ]}>
                          {item.quantity || 1}x
                        </Text>
                        <View style={styles.itemDetails}>
                          <Text style={[
                            styles.itemName, 
                            { 
                              color: colors.text,
                              textAlign: isRTL ? 'right' : 'left'
                            }
                          ]}>
                            {item.name || t('orders', 'unknown')}
                          </Text>
                          {item.options && item.options.length > 0 && (
                            <View style={styles.itemOptions}>
                              {item.options.map((option, optIdx) => (
                                <Text key={optIdx} style={[
                                  styles.itemOption, 
                                  { 
                                    color: colors.secondary,
                                    textAlign: isRTL ? 'right' : 'left',
                                    marginLeft: isRTL ? 0 : 16,
                                    marginRight: isRTL ? 16 : 0
                                  }
                                ]}>
                                  + {option.name} ({formatPrice(option.price || 0)})
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={[
                        styles.itemPrice, 
                        { color: colors.text, textAlign: isRTL ? 'left' : 'right' }
                      ]}>
                        {formatPrice((item.price || 0) * (item.quantity || 1))}
                      </Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={[
                  styles.noItems, 
                  { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                ]}>{t('orders', 'noItems')}</Text>
              )}
            </View>
            
            {/* Order totals box */}
            <View style={[styles.detailsSection, { borderColor: colors.border }]}>
              <View style={[
                styles.totalRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                <Text style={[
                  styles.totalLabel, 
                  { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                ]}>{t('orders', 'subtotal')}:</Text>
                <Text style={[
                  styles.totalValue, 
                  { color: colors.text, textAlign: isRTL ? 'left' : 'right' }
                ]}>
                  {formatPrice(subtotal)}
                </Text>
              </View>
              
              {tax > 0 && (
                <View style={[
                  styles.totalRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' }
                ]}>
                  <Text style={[
                    styles.totalLabel, 
                    { color: colors.text, textAlign: isRTL ? 'right' : 'left' }
                  ]}>{t('orders', 'tax')}:</Text>
                  <Text style={[
                    styles.totalValue, 
                    { color: colors.text, textAlign: isRTL ? 'left' : 'right' }
                  ]}>
                    {formatPrice(tax)}
                  </Text>
                </View>
              )}
              
              <View style={[
                styles.totalRow,
                styles.grandTotal,
                { flexDirection: isRTL ? 'row-reverse' : 'row' }
              ]}>
                <Text style={[
                  styles.totalLabel, 
                  { color: colors.text, fontWeight: 'bold', textAlign: isRTL ? 'right' : 'left' }
                ]}>{t('orders', 'total')}:</Text>
                <Text style={[
                  styles.totalValue, 
                  { color: colors.primary, fontWeight: 'bold', textAlign: isRTL ? 'left' : 'right' }
                ]}>
                  {formatPrice(total)}
                </Text>
              </View>
            </View>
          </ScrollView>
          
          {/* Bottom action buttons */}
          <View style={styles.modalFooter}>
            <View style={styles.statusDropdownContainer}>
              <TouchableOpacity 
                style={[
                  styles.statusButton, 
                  { 
                    backgroundColor: currentOption.color,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  }
                ]} 
                onPress={toggleModalStatusDropdown}
              >
                <Text style={[
                  styles.statusButtonText,
                  { textAlign: isRTL ? 'right' : 'left' }
                ]}>
                  {t('orders', 'updateStatus')}
                </Text>
                <Entypo 
                  name="chevron-down" 
                  size={16} 
                  color="white" 
                  style={{ 
                    marginLeft: isRTL ? 0 : 4,
                    marginRight: isRTL ? 4 : 0 
                  }}
                />
              </TouchableOpacity>
              
              {isModalStatusDropdownOpen && (
                <TouchableWithoutFeedback onPress={toggleModalStatusDropdown}>
                  <View style={styles.dropdownBackdrop}>
                    <TouchableWithoutFeedback>
                      <View style={[
                        styles.statusDropdownMenu,
                        {
                          left: isRTL ? 'auto' : 0,
                          right: isRTL ? 0 : 'auto'
                        }
                      ]}>
                        {statusOptions.map(option => (
                          <TouchableOpacity
                            key={option.id}
                            style={[
                              styles.statusMenuItem,
                              { 
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                borderLeftWidth: isRTL ? 0 : 4, 
                                borderRightWidth: isRTL ? 4 : 0,
                                borderLeftColor: isRTL ? 'transparent' : option.color,
                                borderRightColor: isRTL ? option.color : 'transparent',
                              },
                              order.status === option.id && { backgroundColor: `${option.color}20` }
                            ]}
                            onPress={() => handleSelect(option.id)}
                          >
                            <Text style={[
                              styles.statusMenuItemText,
                              { textAlign: isRTL ? 'right' : 'left' }
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Orders screen component
export default function OrdersScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { notificationsEnabled } = useNotifications();
  const { t, isRTL } = useLanguage();
  
  // UI state
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [orderType, setOrderType] = useState('on-premise');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [openDropdowns, setOpenDropdowns] = useState({});
  
  // Add a ref to store previous orders for comparison
  const previousOrdersRef = useRef([]);
  
  // New state to track which dropdown is currently open globally
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Use our custom hook for orders data fetching
  const { 
    data: ordersData, 
    isLoading, 
    error,
    refetch,
    isRefetching
  } = useFetch(
    async () => {
      // Convert UI filter to API status parameter if needed
      const statusFilter = filter !== 'all' ? filter : undefined;
      
      // Call the fetchRestaurantOrders with proper parameters
      const response = await fetchRestaurantOrders(false, {
        page: currentPage,
        pageSize: 50,
        type: orderType,
        status: statusFilter
      });
      
      // Handle different response structures
      let ordersArray = [];
      let paginationInfo = { total: 0, totalPages: 1 };
      let totalItems = 0;
      
      if (response && response.data && response.data.orders) {
        // New API response structure
        ordersArray = response.data.orders;
        totalItems = response.data.totalItems || response.data.count || 0;
        setTotalPages(response.data.totalPages || Math.ceil(totalItems / 10));
      } else if (response && response.orders) {
        // Another API response structure from dmenu server
        ordersArray = response.orders;
        paginationInfo = response.pagination || { totalPages: 1 };
        totalItems = paginationInfo.total || ordersArray.length;
        setTotalPages(paginationInfo.totalPages || 1);
      } else if (Array.isArray(response)) {
        // Fallback to old response format (direct array)
        ordersArray = response;
        totalItems = ordersArray.length;
      }
      
      // Check for new orders by comparing with previous fetch
      if (notificationsEnabled && Array.isArray(ordersArray)) {
        console.log('Checking for new orders, comparing current count:', ordersArray.length, 
                    'with previous count:', previousOrdersRef.current.length);
        
        const newOrders = ordersArray.filter(order => {
          // Only consider pending orders as "new"
          if (order.status !== 'pending') {
            return false;
          }
          
          const orderId = order._id || order.id;
          if (!orderId) {
            console.log('Order has no ID, cannot detect if new:', order);
            return false;
          }
          
          // Check if this order was not in the previous orders list
          const isNew = !previousOrdersRef.current.some(prevOrder => 
            (prevOrder._id && prevOrder._id === orderId) || 
            (prevOrder.id && prevOrder.id === orderId)
          );
          
          if (isNew) {
            console.log('New order detected:', orderId);
          }
          
          return isNew;
        });

        // Send notifications for new orders
        if (newOrders.length > 0) {
          console.log(`Found ${newOrders.length} new orders, sending notifications`);
          Alert.alert('New Orders', `${newOrders.length} new orders received!`);
          
          newOrders.forEach(order => {
            notificationService.handleNewOrderNotification(order);
          });
        } else {
          console.log('No new orders detected');
        }
        
        // Store current orders for next comparison
        previousOrdersRef.current = [...ordersArray];
      }
      
      // Sort orders by date (newest first)
      if (Array.isArray(ordersArray)) {
        return ordersArray.sort((a, b) => {
          return new Date(b.createdAt || b.timestamp || b.date || 0) - 
                 new Date(a.createdAt || a.timestamp || a.date || 0);
        });
      }
      
      return [];
    },
    [isLoggedIn, filter, currentPage, orderType, notificationsEnabled],
    {
      initialData: [],
      enabled: isLoggedIn,
      onError: (error) => {
        console.error('Error fetching orders:', error);
      }
    }
  );

  // Set up polling for new orders (checks every 30 seconds)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Set up interval to check for new orders
    const intervalId = setInterval(() => {
      if (!isRefetching && !isLoading) {
        console.log('Polling for new orders...');
        refetch(); // Use refetch from useFetch
      }
    }, 30000); // Check every 30 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isLoggedIn, refetch, isRefetching, isLoading]);

  // Extract the orders array from the response
  const orders = useMemo(() => ordersData || [], [ordersData]);

  // Function to check if a dropdown is active
  const isDropdownActive = (id) => activeDropdown === id;

  // Function to toggle a dropdown
  const toggleDropdown = (id) => {
    if (activeDropdown === id) {
      // If this dropdown is already open, close it
      setActiveDropdown(null);
    } else {
      // Close any open dropdown and open this one
      setActiveDropdown(id);
    }
  };

  // Filter options - removed cancelled as requested
  const filters = [
    { id: 'all', label: `📋 ${t('orders', 'allOrders')}` },
    { id: 'pending', label: `⏳ ${t('orders', 'pendingOrders')}` },
    { id: 'preparing', label: `👨‍🍳 ${t('orders', 'preparingOrders')}` },
    { id: 'completed', label: `✅ ${t('orders', 'completedOrders')}` },
  ];
  
  // Order type options - removed takeaway as requested
  const orderTypes = [
    { id: 'on-premise', label: `🍽️ ${t('orders', 'inRestaurantOrders')}` },
    { id: 'delivery', label: `🚚 ${t('orders', 'deliveryOrders')}` },
  ];

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  // Handle order type change
  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    setCurrentPage(1); // Reset to first page when changing type
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/login');
    }
  }, [isLoggedIn, router]);

  // Handle order status change
  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    // Extract display order ID for the alert message only
    const displayOrderId = orderId.length > 6 ? orderId.slice(-6) : orderId || t('orders', 'unknown');

    // Get translated status name
    const getTranslatedStatus = (status) => {
      switch (status?.toLowerCase()) {
        case 'completed':
          return t('orders', 'completedOrders');
        case 'preparing':
          return t('orders', 'preparingOrders');
        case 'pending':
          return t('orders', 'pendingOrders');
        case 'cancelled':
          return t('orders', 'cancelledOrders');
        default:
          return t('orders', 'unknown');
      }
    };

    const translatedStatus = getTranslatedStatus(newStatus);

    Alert.alert(
      t('orders', 'updateStatus'),
      t('orders', 'updateConfirmation').replace('{count}', '1').replace('{status}', translatedStatus),
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        {
          text: t('common', 'confirm'),
          style: 'default',
          onPress: async () => {
            try {
              // Show loading indicator
              Alert.alert(
                t('orders', 'processing'),
                t('orders', 'updatingOrders').replace('{count}', '1'),
                [],
                { cancelable: false }
              );
              
              // Call the API to update the order status (uses full ID)
              await updateOrderStatus(orderId, newStatus);
              
              // Ensure we're clearing the state before refresh to prevent duplicates
              setCurrentPage(1); // Reset to first page
              
              // Show success message and dismiss loading dialog
              Alert.alert(t('orders', 'success'), t('orders', 'ordersUpdated').replace('{count}', '1').replace('{status}', translatedStatus));
              
              // Refresh order list with a delay to ensure cache is cleared
              setTimeout(() => {
                refetch();
              }, 500);
            } catch (error) {
              // Show error message
              Alert.alert(t('orders', 'error'), error.message || t('orders', 'failedUpdate'));
            }
          },
        },
      ]
    );
  }, [refetch, t]);

  // Handle order press
  const handleOrderPress = useCallback((order) => {
    if (batchMode) {
      // In batch mode, toggle selection
      const orderId = order._id?.toString() || order.id?.toString() || order.orderId?.toString() || '';
      toggleOrderSelection(orderId);
    } else {
      // Regular mode, show details
      setSelectedOrder(order);
      setDetailsModalVisible(true);
    }
  }, [batchMode]);

  // Handle long press on order
  const handleOrderLongPress = useCallback((order) => {
    const orderId = order._id?.toString() || order.id?.toString() || order.orderId?.toString() || '';
    
    // Enable batch mode if not already enabled
    if (!batchMode) {
      setBatchMode(true);
    }
    
    // Select the order
    if (!selectedOrders.includes(orderId)) {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  }, [batchMode, selectedOrders]);

  // Filter orders based on selected filter
  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    
    if (filter === 'all') return orders;
    
    return orders.filter(order => {
      const orderStatus = (order.status || '').toLowerCase();
      return orderStatus === filter.toLowerCase();
    });
  }, [orders, filter]);

  // Count orders by status
  const orderCounts = useMemo(() => {
    const counts = {
      all: 0,
      pending: 0,
      preparing: 0,
      completed: 0,
    };
    
    if (Array.isArray(orders)) {
      // Set total count
      counts.all = orders.length;
      
      // Count by status
      orders.forEach(order => {
        const status = (order.status || 'pending').toLowerCase();
        if (counts[status] !== undefined) {
          counts[status]++;
        }
      });
    }
    
    return counts;
  }, [orders]);

  // Toggle batch mode
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedOrders([]);
  };

  // Toggle order selection
  const toggleOrderSelection = useCallback((orderId) => {
    if (selectedOrders.includes(orderId)) {
      const newSelectedOrders = selectedOrders.filter(id => id !== orderId);
      setSelectedOrders(newSelectedOrders);
      
      // Only exit batch mode if all orders are deselected
      if (newSelectedOrders.length === 0) {
        setBatchMode(false);
      }
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  }, [selectedOrders]);

  // Batch update status
  const batchUpdateStatus = (newStatus) => {
    if (selectedOrders.length === 0) {
      Alert.alert(t('orders', 'noOrdersSelected'), t('orders', 'selectOrdersPrompt'));
      return;
    }

    // Get translated status name
    const getTranslatedStatus = (status) => {
      switch (status?.toLowerCase()) {
        case 'completed':
          return t('orders', 'completedOrders');
        case 'preparing':
          return t('orders', 'preparingOrders');
        case 'pending':
          return t('orders', 'pendingOrders');
        case 'cancelled':
          return t('orders', 'cancelledOrders');
        default:
          return t('orders', 'unknown');
      }
    };

    const translatedStatus = getTranslatedStatus(newStatus);

    Alert.alert(
      t('orders', 'updateStatus'),
      t('orders', 'updateConfirmation').replace('{count}', selectedOrders.length.toString()).replace('{status}', translatedStatus),
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        {
          text: t('common', 'confirm'),
          style: 'default',
          onPress: async () => {
            try {
              // Show loading indicator
              const selectedCount = selectedOrders.length;
              Alert.alert(
                t('orders', 'processing'),
                t('orders', 'updatingOrders').replace('{count}', selectedCount.toString()),
                [],
                { cancelable: false }
              );
              
              // Process orders sequentially to avoid race conditions
              for (const orderId of selectedOrders) {
                await updateOrderStatus(orderId, newStatus);
              }
              
              // Reset batch mode and selection
              setSelectedOrders([]);
              setBatchMode(false);
              
              // Reset to first page to ensure consistent view
              setCurrentPage(1);
              
              // Show success message
              Alert.alert(t('orders', 'success'), t('orders', 'ordersUpdated').replace('{count}', selectedCount.toString()).replace('{status}', translatedStatus));
              
              // Refresh order list with a delay to ensure cache is cleared
              setTimeout(() => {
                refetch();
              }, 500);
            } catch (error) {
              Alert.alert(t('orders', 'error'), error.message || t('orders', 'failedUpdate'));
            }
          },
        },
      ]
    );
  };

  // Batch delete orders
  const batchDeleteOrders = () => {
    if (selectedOrders.length === 0) {
      Alert.alert(t('orders', 'noOrdersSelected'), t('orders', 'selectOrdersPrompt'));
      return;
    }

    Alert.alert(
      t('common', 'delete'),
      t('orders', 'deleteConfirmation', { count: selectedOrders.length }),
      [
        { text: t('common', 'cancel'), style: 'cancel' },
        {
          text: t('common', 'delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Show loading indicator
              const selectedCount = selectedOrders.length;
              Alert.alert(
                t('orders', 'processing'),
                t('orders', 'deletingOrders', { count: selectedCount }),
                [],
                { cancelable: false }
              );
              
              // In a real implementation, call the API to delete all selected orders
              // await Promise.all(
              //   selectedOrders.map(orderId => deleteOrder(orderId))
              // );
              
              // Simulate API delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Show success message
              Alert.alert(t('orders', 'success'), t('orders', 'ordersDeleted', { count: selectedCount }));
              setSelectedOrders([]);
              setBatchMode(false);
              refetch();
            } catch (error) {
              Alert.alert(t('orders', 'error'), error.message || t('orders', 'failedDelete'));
            }
          },
        },
      ]
    );
  };

  // Function to close all dropdowns
  const closeAllDropdowns = useCallback(() => {
    // Close any open dropdown
    if (activeDropdown) {
      setActiveDropdown(null);
    }
  }, [activeDropdown]);

  // Don't render content if not logged in
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t('login', 'pleaseLogin')}</Text>
      </View>
    );
  }

  // Show loading state
  if (isLoading && !isRefetching) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonLoader.Orders />
      </View>
    );
  }

  // Show error state
  if (error && !orders.length) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
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

  return (
    <TouchableWithoutFeedback onPress={closeAllDropdowns}>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with test notification button */}
      <View style={[
        styles.headerRow, 
        { flexDirection: isRTL ? 'row-reverse' : 'row' }
      ]}>
        <View style={[
          styles.titleContainer, 
          { flexDirection: isRTL ? 'row-reverse' : 'row' }
        ]}>
          <Text style={[
            styles.pageTitle, 
            { color: colors.text, 
              textAlign: isRTL ? 'right' : 'left' 
            }
          ]}>
            {t('orders', 'title')}
          </Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.notificationTestButton, 
            { backgroundColor: colors.card,
              flexDirection: isRTL ? 'row-reverse' : 'row' 
            }
          ]}
          onPress={() => {
            notificationService.sendTestNotification('Test from Orders Screen');
            Alert.alert(
              'Test Notification Sent', 
              'Check your device notifications. If you don\'t see a notification, check your permissions.'
            );
          }}
        >
          <Ionicons name="notifications" size={20} color={colors.primary} />
          <Text style={{
            color: colors.text, 
            marginLeft: isRTL ? 0 : 5, 
            marginRight: isRTL ? 5 : 0, 
            fontSize: 12
          }}>{t('common', 'test')}</Text>
        </TouchableOpacity>
      </View>

      {/* Filter section with status and type dropdowns */}
      <View style={[
        styles.filtersRow,
        { flexDirection: isRTL ? 'row-reverse' : 'row' }
      ]}>
        <Dropdown
          id="filter-status"
          label={t('orders', 'orderStatus')}
          options={filters}
          selectedValue={filter}
          onSelect={setFilter}
          primaryColor={colors.primary}
          counts={orderCounts}
          isOpen={isDropdownActive("filter-status")}
          toggleDropdown={() => toggleDropdown("filter-status")}
        />
        
        <Dropdown
          id="filter-type"
          label={t('common', 'type')}
          options={orderTypes}
          selectedValue={orderType}
          onSelect={handleOrderTypeChange}
          primaryColor={colors.secondary}
          isOpen={isDropdownActive("filter-type")}
          toggleDropdown={() => toggleDropdown("filter-type")}
      />
    </View>

    {/* Orders list */}
    <FlatList
      data={filteredOrders}
        keyExtractor={(item) => item._id || item.id || String(Math.random())}
        renderItem={({ item }) => {
          const orderId = item._id || item.id || String(Math.random());
          const dropdownId = `order-status-${orderId}`;
          
          return (
        <OrderItem
          order={item}
          onPress={handleOrderPress}
              onLongPress={() => handleOrderLongPress(item)}
              onStatusChange={handleStatusChange}
          colors={colors}
              batchMode={batchMode}
              selectedOrders={selectedOrders}
              toggleOrderSelection={toggleOrderSelection}
              statusDropdownId={dropdownId}
              isStatusDropdownOpen={isDropdownActive(dropdownId)}
              toggleStatusDropdown={() => toggleDropdown(dropdownId)}
            />
          );
        }}
      contentContainerStyle={styles.ordersList}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.loadingContainer}>
            <SkeletonLoader type="orders" count={3} colorScheme={colorScheme} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              {error}
            </Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]} 
              onPress={() => refetch()}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="shopping-basket" size={48} color={colors.text} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {t('orders', 'noOrders')}
            </Text>
          </View>
        )
      }
    />

      {/* Floating Batch Operations Panel */}
      {batchMode && selectedOrders.length > 0 && (
        <Animated.View style={styles.floatingBatchPanel}>
          <View style={styles.batchPanelContent}>
            <View style={styles.batchSelectionInfo}>
              <View style={styles.batchCountBadge}>
                <Text style={styles.batchCountText}>{selectedOrders.length}</Text>
              </View>
              <Text style={styles.batchSelectionText}>{t('orders', 'ordersSelected')}</Text>
            </View>
            
            <View style={styles.batchActionButtons}>
              <TouchableOpacity
                style={[styles.batchActionButton, { backgroundColor: '#2196F3' }]}
                onPress={() => batchUpdateStatus('preparing')}
              >
                <Ionicons name="restaurant-outline" size={20} color="white" />
                <Text style={styles.batchActionText}>{t('orders', 'preparingOrders')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.batchActionButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => batchUpdateStatus('completed')}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text style={styles.batchActionText}>{t('orders', 'completedOrders')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.batchActionButton, { backgroundColor: '#F44336' }]}
                onPress={batchDeleteOrders}
              >
                <Ionicons name="trash-outline" size={20} color="white" />
                <Text style={styles.batchActionText}>{t('common', 'delete')}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.cancelBatchButton}
              onPress={toggleBatchMode}
            >
              <Text style={styles.cancelBatchText}>{t('common', 'cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Pagination Controls */}
      {!isLoading && orders.length > 0 && !batchMode && (
        <View style={[
          styles.paginationContainer,
          { flexDirection: isRTL ? 'row-reverse' : 'row' }
        ]}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <View style={[
              styles.paginationButtonContent,
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}>
              <Ionicons 
                name={isRTL ? "chevron-forward" : "chevron-back"} 
                size={18} 
                color={currentPage === 1 ? '#ccc' : colors.text} 
              />
              <Text style={[styles.paginationButtonText, { color: currentPage === 1 ? '#ccc' : colors.text }]}>
                {t('common', 'previous')}
              </Text>
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.paginationText, { color: colors.text }]}>
            {t('orders', 'page').replace('{current}', currentPage.toString()).replace('{total}', totalPages.toString())}
          </Text>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <View style={[
              styles.paginationButtonContent,
              { flexDirection: isRTL ? 'row-reverse' : 'row' }
            ]}>
              <Text style={[styles.paginationButtonText, { color: currentPage === totalPages ? '#ccc' : colors.text }]}>
                {t('common', 'next')}
              </Text>
              <Ionicons 
                name={isRTL ? "chevron-back" : "chevron-forward"} 
                size={18} 
                color={currentPage === totalPages ? '#ccc' : colors.text} 
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      <OrderDetailsModal
        visible={detailsModalVisible}
        order={selectedOrder}
        onClose={() => setDetailsModalVisible(false)}
        onStatusChange={handleStatusChange}
        colors={colors}
        modalStatusDropdownId="modal-status-dropdown"
        isModalStatusDropdownOpen={isDropdownActive("modal-status-dropdown")}
        toggleModalStatusDropdown={() => toggleDropdown("modal-status-dropdown")}
      />
    </View>
  </TouchableWithoutFeedback>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filtersContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 100,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ordersList: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'visible',
    zIndex: 1,
  },
  orderContent: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  orderDetails: {
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemQuantity: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 30,
  },
  itemName: {
    flex: 1,
  },
  itemPrice: {
    fontWeight: '500',
    textAlign: 'right',
    width: 60,
  },
  moreItems: {
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noItems: {
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
  },
  customerPhone: {
    fontSize: 14,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 100,
  },
  dropdownContainer: {
    width: '48%',
    position: 'relative',
    zIndex: 10,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  dropdownMenuItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownMenuItemText: {
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  paginationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#f0f0f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tableNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderActions: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    zIndex: 10,
    position: 'relative',
  },
  statusDropdownContainer: {
    position: 'relative',
    zIndex: 5,
    width: '100%',
  },
  statusButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  statusButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusDropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  statusMenuItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  statusMenuItemText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailsSection: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemOptions: {
    marginTop: 4,
  },
  itemOption: {
    fontSize: 12,
    marginLeft: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  grandTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
  },
  checkbox: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
  },
  
  checkboxInner: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  
  batchToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 16,
    marginBottom: 8,
  },
  
  batchToggleText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  
  floatingBatchPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    paddingVertical: 16,
  },
  
  batchPanelContent: {
    paddingHorizontal: 16,
  },
  
  batchSelectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  batchCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  
  batchCountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  batchSelectionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  batchActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  batchActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  
  batchActionText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 12,
  },
  
  cancelBatchButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  
  cancelBatchText: {
    color: '#757575',
    fontWeight: '500',
  },
  
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  
  dropdownMenuItem: {
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  dropdownCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  dropdownCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  topRightDropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 180,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 999,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationTestButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'flex-end',
    position: 'relative',
    zIndex: 5,
  },
}); 