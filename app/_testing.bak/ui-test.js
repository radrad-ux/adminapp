import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Switch,
  Platform
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Sample component definitions for testing
const components = [
  {
    name: 'Buttons',
    render: (colors) => (
      <View style={styles.componentContainer}>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryButtonText}>Primary Button</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.secondaryButton, { borderColor: colors.primary }]}>
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Secondary Button</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.textButton}>
          <Text style={[styles.textButtonText, { color: colors.primary }]}>Text Button</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
    )
  },
  {
    name: 'Text Inputs',
    render: (colors) => (
      <View style={styles.componentContainer}>
        <TextInput 
          style={[styles.input, { 
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.card 
          }]}
          placeholder="Standard Input"
          placeholderTextColor={colors.icon}
        />
        
        <View style={[styles.searchInputContainer, { 
          backgroundColor: colors.card, 
          borderColor: colors.border 
        }]}>
          <Ionicons name="search" size={20} color={colors.icon} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search input..."
            placeholderTextColor={colors.icon}
          />
        </View>
        
        <View style={styles.labeledInputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Labeled Input</Text>
          <TextInput 
            style={[styles.input, { 
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.card 
            }]}
            placeholder="Enter text here"
            placeholderTextColor={colors.icon}
          />
        </View>
      </View>
    )
  },
  {
    name: 'Cards',
    render: (colors) => (
      <View style={styles.componentContainer}>
        <View style={[styles.basicCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Basic Card</Text>
          <Text style={[styles.cardText, { color: colors.icon }]}>
            This is a simple card component with some text content.
          </Text>
        </View>
        
        <View style={[styles.mediaCard, { backgroundColor: colors.card }]}>
          <View style={[styles.cardMedia, { backgroundColor: colors.primary + '33' }]}>
            <Ionicons name="image-outline" size={40} color={colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Media Card</Text>
            <Text style={[styles.cardText, { color: colors.icon }]}>
              A card with media content area and text.
            </Text>
          </View>
        </View>
        
        <View style={[styles.actionCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Card with Actions</Text>
          <Text style={[styles.cardText, { color: colors.icon }]}>
            This card has action buttons at the bottom.
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity>
              <Text style={[styles.cardAction, { color: colors.primary }]}>ACTION 1</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={[styles.cardAction, { color: colors.primary }]}>ACTION 2</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  },
  {
    name: 'Form Controls',
    render: (colors) => {
      const [switchValue, setSwitchValue] = useState(false);
      
      return (
        <View style={styles.componentContainer}>
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Toggle switch</Text>
            <Switch
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={switchValue ? colors.primary : '#f4f3f4'}
              onValueChange={() => setSwitchValue(previousState => !previousState)}
              value={switchValue}
            />
          </View>
          
          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={[
                styles.checkbox, 
                { 
                  borderColor: colors.primary,
                  backgroundColor: switchValue ? colors.primary : 'transparent' 
                }
              ]}
              onPress={() => setSwitchValue(prev => !prev)}
            >
              {switchValue && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>Checkbox option</Text>
          </View>
          
          <View style={styles.radioContainer}>
            <TouchableOpacity 
              style={[styles.radioOuter, { borderColor: colors.primary }]}
              onPress={() => setSwitchValue(true)}
            >
              {switchValue && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
            <Text style={[styles.radioLabel, { color: colors.text }]}>Option One</Text>
          </View>
          
          <View style={styles.radioContainer}>
            <TouchableOpacity 
              style={[styles.radioOuter, { borderColor: colors.primary }]}
              onPress={() => setSwitchValue(false)}
            >
              {!switchValue && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
            <Text style={[styles.radioLabel, { color: colors.text }]}>Option Two</Text>
          </View>
        </View>
      );
    }
  },
];

export default function UITestScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedComponent, setSelectedComponent] = useState(null);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>UI Component Test</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          View and test UI components in isolation
        </Text>
      </View>

      <View style={styles.componentNav}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {components.map((component, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.componentTab,
                selectedComponent === index && { backgroundColor: colors.primary + '20' },
                { borderColor: selectedComponent === index ? colors.primary : colors.border }
              ]}
              onPress={() => setSelectedComponent(index)}
            >
              <Text
                style={[
                  styles.componentTabText,
                  { color: selectedComponent === index ? colors.primary : colors.text }
                ]}
              >
                {component.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.componentDisplay, { backgroundColor: colors.background }]}>
        {selectedComponent !== null ? (
          components[selectedComponent].render(colors)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={60} color={colors.icon} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              Select a component type above to preview
            </Text>
          </View>
        )}
      </View>
      
      {selectedComponent !== null && (
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Usage Guidelines</Text>
          <Text style={[styles.infoText, { color: colors.icon }]}>
            These components follow the app's design system and should be used consistently
            throughout the application. Refer to the style guide for detailed usage instructions.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  componentNav: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#eaeaea',
  },
  componentTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 6,
    borderWidth: 1,
  },
  componentTabText: {
    fontWeight: '600',
  },
  componentDisplay: {
    padding: 20,
    minHeight: 300,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  componentContainer: {
    gap: 16,
  },
  // Button styles
  primaryButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  textButton: {
    padding: 14,
    alignItems: 'center',
  },
  textButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  // Input styles
  input: {
    padding: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  labeledInputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Card styles
  basicCard: {
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mediaCard: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  cardMedia: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  actionCard: {
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 16,
  },
  cardAction: {
    fontWeight: '600',
    fontSize: 14,
  },
  // Form control styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    marginLeft: 12,
    fontSize: 16,
  },
  // Info card
  infoCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 