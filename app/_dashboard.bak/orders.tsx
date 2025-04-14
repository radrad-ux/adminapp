import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Mock data for orders
const initialOrders = [
  {
    id: 1001,
    customerName: 'John Smith',
    items: [
      { id: 1, name: 'Crispy Calamari', quantity: 1, price: 12.99 },
      { id: 3, name: 'Grilled Salmon', quantity: 2, price: 24.99 },
    ],
    total: 62.97,
    status: 'Pending',
    date: '2024-05-05T10:30:00',
    address: '123 Main St, City',
    phone: '(123) 456-7890',
  },
  {
    id: 1002,
    customerName: 'Emma Johnson',
    items: [
      { id: 2, name: 'Garlic Bread', quantity: 1, price: 6.99 },
      { id: 4, name: 'Pasta Carbonara', quantity: 1, price: 18.99 },
      { id: 5, name: 'Chocolate Lava Cake', quantity: 2, price: 9.99 },
    ],
    total: 45.96,
    status: 'Preparing',
    date: '2024-05-05T11:15:00',
    address: '456 Oak Ave, Town',
    phone: '(234) 567-8901',
  },
  {
    id: 1003,
    customerName: 'Michael Brown',
    items: [
      { id: 1, name: 'Crispy Calamari', quantity: 2, price: 12.99 },
      { id: 2, name: 'Garlic Bread', quantity: 1, price: 6.99 },
    ],
    total: 32.97,
    status: 'Ready',
    date: '2024-05-05T12:00:00',
    address: '789 Pine St, Village',
    phone: '(345) 678-9012',
  },
  {
    id: 1004,
    customerName: 'Sarah Wilson',
    items: [
      { id: 3, name: 'Grilled Salmon', quantity: 1, price: 24.99 },
      { id: 5, name: 'Chocolate Lava Cake', quantity: 1, price: 9.99 },
    ],
    total: 34.98,
    status: 'Delivered',
    date: '2024-05-05T09:45:00',
    address: '321 Elm St, City',
    phone: '(456) 789-0123',
  },
];

// Status options and their colors
const statusOptions = [
  { label: 'Pending', color: '#F5A623' },
  { label: 'Preparing', color: '#50E3C2' },
  { label: 'Ready', color: '#5AC8FA' },
  { label: 'Delivered', color: '#4CD964' },
  { label: 'Cancelled', color: '#FF3B30' },
];

export default function OrdersScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Get selected order details
  const selectedOrder = selectedOrderId
    ? orders.find((order) => order.id === selectedOrderId)
    : null;

  // Filter orders by search query and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toString().includes(searchQuery) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus ? order.status === filterStatus : true;
    
    return matchesSearch && matchesStatus;
  });

  // Handle status change
  const handleStatusChange = (newStatus: string) => {
    if (selectedOrderId) {
      const updatedOrders = orders.map((order) => {
        if (order.id === selectedOrderId) {
          return { ...order, status: newStatus };
        }
        return order;
      });
      setOrders(updatedOrders);
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find((option) => option.label === status);
    return statusOption?.color || colors.primary;
  };

  const renderOrderItem = ({ item }: { item: typeof orders[0] }) => (
    <TouchableOpacity
      style={[
        styles.orderItem,
        { backgroundColor: colors.card },
        selectedOrderId === item.id && { borderColor: colors.primary, borderWidth: 2 },
      ]}
      onPress={() => setSelectedOrderId(item.id)}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: colors.text }]}>Order #{item.id}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.orderInfo}>
        <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName}</Text>
        <Text style={[styles.orderDate, { color: colors.icon }]}>
          {new Date(item.date).toLocaleString()}
        </Text>
      </View>
      
      <View style={styles.orderSummary}>
        <Text style={[styles.itemCount, { color: colors.icon }]}>
          {item.items.reduce((sum, item) => sum + item.quantity, 0)} items
        </Text>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>
          ${item.total.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <View style={[styles.orderDetails, { backgroundColor: colors.card }]}>
        <View style={styles.orderDetailHeader}>
          <Text style={[styles.orderDetailTitle, { color: colors.text }]}>
            Order #{selectedOrder.id} Details
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedOrderId(null)}>
            <Ionicons name="close" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.customerDetails}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Customer Information</Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>Name:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{selectedOrder.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>Phone:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{selectedOrder.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>Address:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{selectedOrder.address}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.icon }]}>Date:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(selectedOrder.date).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Order Items</Text>
          {selectedOrder.items.map((item) => (
            <View key={item.id} style={styles.orderItemRow}>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemQuantity, { color: colors.icon }]}>x{item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: colors.text }]}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>
              ${selectedOrder.total.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.statusSection}>
          <Text style={[styles.detailSectionTitle, { color: colors.text }]}>Status</Text>
          <View style={styles.statusOptions}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.statusOption,
                  { borderColor: option.color },
                  selectedOrder.status === option.label && {
                    backgroundColor: option.color,
                  },
                ]}
                onPress={() => handleStatusChange(option.label)}>
                <Text
                  style={[
                    styles.statusOptionText,
                    { color: option.color },
                    selectedOrder.status === option.label && { color: '#fff' },
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.actionButtonText}>Print Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}>
            <Text style={styles.actionButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Orders Management</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          View and manage customer orders
        </Text>
      </View>

      <View style={styles.filterSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by order # or customer name"
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statusFilter}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              !filterStatus && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilterStatus(null)}>
            <Text
              style={[
                styles.filterChipText,
                !filterStatus && { color: '#fff' },
                filterStatus && { color: colors.text },
              ]}>
              All
            </Text>
          </TouchableOpacity>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.filterChip,
                filterStatus === option.label && { backgroundColor: option.color },
              ]}
              onPress={() => setFilterStatus(option.label)}>
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === option.label && { color: '#fff' },
                  filterStatus !== option.label && { color: colors.text },
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={[styles.ordersList, selectedOrderId && { flex: 1 }]}>
          <FlatList
            data={filteredOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.ordersListContent}
          />
        </View>

        {selectedOrderId && (
          <View style={styles.orderDetailsContainer}>{renderOrderDetails()}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    height: 40,
  },
  statusFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ordersList: {
    flex: 2,
    marginRight: 8,
  },
  ordersListContent: {
    paddingBottom: 20,
  },
  orderItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 12,
  },
  orderTotal: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  orderDetailsContainer: {
    flex: 3,
    marginLeft: 8,
  },
  orderDetails: {
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: '100%',
  },
  orderDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  customerDetails: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  orderItems: {
    marginBottom: 24,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
  },
  itemQuantity: {
    fontSize: 12,
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusSection: {
    marginBottom: 24,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusOption: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  statusOptionText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 