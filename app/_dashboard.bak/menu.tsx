import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Mock data for categories
const initialCategories = [
  { id: 1, name: 'Appetizers', itemCount: 8 },
  { id: 2, name: 'Main Course', itemCount: 12 },
  { id: 3, name: 'Desserts', itemCount: 6 },
  { id: 4, name: 'Beverages', itemCount: 10 },
  { id: 5, name: 'Sides', itemCount: 5 },
];

// Mock data for menu items
const initialMenuItems = [
  {
    id: 1,
    name: 'Crispy Calamari',
    price: 12.99,
    description: 'Tender calamari rings, lightly fried, served with marinara sauce',
    image: 'https://via.placeholder.com/100',
    categoryId: 1,
  },
  {
    id: 2,
    name: 'Garlic Bread',
    price: 6.99,
    description: 'Toasted bread with garlic butter and herbs',
    image: 'https://via.placeholder.com/100',
    categoryId: 1,
  },
  {
    id: 3,
    name: 'Grilled Salmon',
    price: 24.99,
    description: 'Fresh salmon fillet, grilled to perfection, served with seasonal vegetables',
    image: 'https://via.placeholder.com/100',
    categoryId: 2,
  },
  {
    id: 4,
    name: 'Pasta Carbonara',
    price: 18.99,
    description: 'Classic pasta dish with egg, cheese, pancetta, and black pepper',
    image: 'https://via.placeholder.com/100',
    categoryId: 2,
  },
  {
    id: 5,
    name: 'Chocolate Lava Cake',
    price: 9.99,
    description: 'Warm chocolate cake with a molten chocolate center, served with vanilla ice cream',
    image: 'https://via.placeholder.com/100',
    categoryId: 3,
  },
];

export default function MenuScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [categories, setCategories] = useState(initialCategories);
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);

  const filteredItems = menuItems.filter(item => item.categoryId === selectedCategoryId);

  const handleCategoryPress = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
  };

  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategoryId === item.id && { backgroundColor: colors.primary },
      ]}
      onPress={() => handleCategoryPress(item.id)}>
      <Text
        style={[
          styles.categoryName,
          selectedCategoryId === item.id && { color: '#fff' },
        ]}>
        {item.name}
      </Text>
      <Text
        style={[
          styles.categoryCount,
          selectedCategoryId === item.id && { color: '#fff' },
        ]}>
        {item.itemCount} items
      </Text>
    </TouchableOpacity>
  );

  const renderMenuItem = ({ item }: { item: typeof menuItems[0] }) => (
    <View style={[styles.menuItem, { backgroundColor: colors.card }]}>
      <Image source={{ uri: item.image }} style={styles.menuItemImage} />
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemHeader}>
          <Text style={[styles.menuItemName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.menuItemPrice, { color: colors.primary }]}>${item.price.toFixed(2)}</Text>
        </View>
        <Text style={[styles.menuItemDescription, { color: colors.icon }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.menuItemActions}>
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]}>
            <MaterialIcons name="edit" size={16} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { borderColor: colors.border }]}>
            <MaterialIcons name="delete" size={16} color="#FF3B30" />
            <Text style={{ color: '#FF3B30', fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Menu Management</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          Manage your categories and menu items
        </Text>
      </View>

      <View style={styles.categoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Category</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <View style={styles.menuItemsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Menu Items</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.menuItemsList}
        />
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
  categoriesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  categoriesList: {
    paddingBottom: 16,
  },
  categoryItem: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  menuItemsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuItemsList: {
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemImage: {
    width: 100,
    height: 100,
  },
  menuItemContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  menuItemPrice: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuItemDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  menuItemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
  },
}); 