import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

// Data validation schemas
const validationSchemas = {
  menuItem: {
    name: 'Menu Item',
    sampleData: {
      name: 'Burger Deluxe',
      price: 12.99,
      description: 'Delicious burger with all the toppings',
      categoryId: 1,
      available: true,
      image: 'https://example.com/burger.jpg',
      options: [
        { name: 'Size', choices: ['Regular', 'Large'] },
        { name: 'Extras', choices: ['Cheese', 'Bacon', 'Avocado'] }
      ]
    },
    validations: [
      { field: 'name', rule: 'required', message: 'Name is required' },
      { field: 'price', rule: 'number', message: 'Price must be a number' },
      { field: 'price', rule: 'min:0', message: 'Price must be positive' },
      { field: 'categoryId', rule: 'required', message: 'Category is required' },
      { field: 'image', rule: 'url', message: 'Image must be a valid URL' }
    ]
  },
  order: {
    name: 'Order',
    sampleData: {
      id: 12345,
      customer: {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com'
      },
      items: [
        { 
          id: 1, 
          name: 'Burger Deluxe', 
          price: 12.99, 
          quantity: 2,
          options: ['Large', 'Extra Cheese'] 
        },
        { 
          id: 2, 
          name: 'Fries', 
          price: 3.99,
          quantity: 1,
          options: [] 
        }
      ],
      totalPrice: 29.97,
      status: 'pending',
      createdAt: '2023-05-15T14:30:00Z'
    },
    validations: [
      { field: 'customer.name', rule: 'required', message: 'Customer name is required' },
      { field: 'customer.phone', rule: 'regex:/^\\+?[0-9]{10,15}$/', message: 'Phone number should be valid' },
      { field: 'customer.email', rule: 'email', message: 'Email should be valid' },
      { field: 'items', rule: 'array:min:1', message: 'Order must have at least one item' },
      { field: 'totalPrice', rule: 'number', message: 'Total price must be a number' },
      { field: 'status', rule: 'in:pending,processing,completed,cancelled', message: 'Status must be valid' }
    ]
  },
  restaurant: {
    name: 'Restaurant',
    sampleData: {
      name: 'Burger Palace',
      address: '123 Main St, Anytown, USA',
      phone: '+1234567890',
      openingHours: {
        monday: { open: '09:00', close: '22:00' },
        tuesday: { open: '09:00', close: '22:00' },
        wednesday: { open: '09:00', close: '22:00' },
        thursday: { open: '09:00', close: '22:00' },
        friday: { open: '09:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '10:00', close: '22:00' }
      },
      features: ['Takeaway', 'Delivery', 'Dine-in'],
      minOrderValue: 10.0,
      deliveryFee: 2.5
    },
    validations: [
      { field: 'name', rule: 'required', message: 'Name is required' },
      { field: 'address', rule: 'required', message: 'Address is required' },
      { field: 'phone', rule: 'regex:/^\\+?[0-9]{10,15}$/', message: 'Phone number should be valid' },
      { field: 'openingHours', rule: 'required', message: 'Opening hours are required' },
      { field: 'minOrderValue', rule: 'number', message: 'Minimum order value must be a number' },
      { field: 'deliveryFee', rule: 'number', message: 'Delivery fee must be a number' }
    ]
  }
};

// Function to validate data based on schema
const validateData = (schema, data) => {
  const results = [];
  
  // Helper function to get nested property value
  const getNestedValue = (obj, path) => {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    
    return current;
  };
  
  // Validate each field
  for (const validation of schema.validations) {
    const fieldValue = getNestedValue(data, validation.field);
    const rule = validation.rule.split(':');
    const ruleName = rule[0];
    const ruleParams = rule.slice(1);
    
    let isValid = true;
    let message = validation.message;
    
    switch (ruleName) {
      case 'required':
        isValid = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
        break;
        
      case 'number':
        isValid = !isNaN(parseFloat(fieldValue)) && isFinite(fieldValue);
        break;
        
      case 'min':
        isValid = parseFloat(fieldValue) >= parseFloat(ruleParams[0]);
        break;
        
      case 'max':
        isValid = parseFloat(fieldValue) <= parseFloat(ruleParams[0]);
        break;
        
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue);
        break;
        
      case 'url':
        isValid = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(fieldValue);
        break;
        
      case 'in':
        isValid = ruleParams[0].split(',').includes(fieldValue);
        break;
        
      case 'regex':
        try {
          const regexParts = /\/(.*)\/(.*)/.exec(ruleParams.join(':'));
          if (regexParts) {
            const regex = new RegExp(regexParts[1], regexParts[2]);
            isValid = regex.test(fieldValue);
          } else {
            isValid = false;
          }
        } catch (e) {
          isValid = false;
        }
        break;
        
      case 'array':
        if (!Array.isArray(fieldValue)) {
          isValid = false;
          break;
        }
        
        if (ruleParams[0] === 'min' && ruleParams.length > 1) {
          isValid = fieldValue.length >= parseInt(ruleParams[1]);
        }
        break;
    }
    
    results.push({
      field: validation.field,
      rule: validation.rule,
      valid: isValid,
      message: isValid ? `${validation.field} is valid` : message
    });
  }
  
  return results;
};

function DataTestScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [validationResults, setValidationResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSample, setShowSample] = useState(false);

  const handleSchemaSelect = (schema) => {
    setSelectedSchema(schema);
    setJsonInput('');
    setValidationResults([]);
    setShowSample(false);
  };

  const handleLoadSample = () => {
    if (selectedSchema) {
      setJsonInput(JSON.stringify(validationSchemas[selectedSchema].sampleData, null, 2));
      setShowSample(true);
    }
  };

  const handleValidate = () => {
    if (!selectedSchema || !jsonInput) return;
    
    setLoading(true);
    
    try {
      const data = JSON.parse(jsonInput);
      const results = validateData(validationSchemas[selectedSchema], data);
      setValidationResults(results);
    } catch (error) {
      Alert.alert('Error', 'Invalid JSON format');
      setValidationResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getValidCount = () => {
    return validationResults.filter(result => result.valid).length;
  };
  
  const getInvalidCount = () => {
    return validationResults.filter(result => !result.valid).length;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Data Validation Test</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Test data validation rules against JSON input
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Data Schema</Text>
        <View style={styles.schemaButtons}>
          {Object.keys(validationSchemas).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.schemaButton,
                { 
                  backgroundColor: selectedSchema === key ? colors.primary : 'transparent',
                  borderColor: selectedSchema === key ? colors.primary : colors.border
                }
              ]}
              onPress={() => handleSchemaSelect(key)}
            >
              <Text
                style={[
                  styles.schemaButtonText,
                  { color: selectedSchema === key ? 'white' : colors.text }
                ]}
              >
                {validationSchemas[key].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedSchema && (
        <>
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Input JSON</Text>
            <TouchableOpacity
              style={[styles.sampleButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleLoadSample}
            >
              <Text style={[styles.sampleButtonText, { color: colors.primary }]}>
                Load Sample Data
              </Text>
            </TouchableOpacity>
            <TextInput
              style={[
                styles.jsonInput,
                { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }
              ]}
              multiline
              placeholder="Enter JSON data to validate..."
              placeholderTextColor={colors.icon}
              value={jsonInput}
              onChangeText={setJsonInput}
            />
            <TouchableOpacity
              style={[
                styles.validateButton,
                { 
                  backgroundColor: jsonInput ? colors.primary : colors.primary + '50',
                  opacity: jsonInput ? 1 : 0.7
                }
              ]}
              onPress={handleValidate}
              disabled={!jsonInput || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.validateButtonText}>Validate</Text>
              )}
            </TouchableOpacity>
          </View>

          {validationResults.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Validation Results</Text>
              
              <View style={styles.resultSummary}>
                <View style={styles.resultCountContainer}>
                  <View 
                    style={[
                      styles.resultCountBadge, 
                      { backgroundColor: '#4CAF50' }
                    ]}
                  >
                    <Text style={styles.resultCountText}>{getValidCount()}</Text>
                  </View>
                  <Text style={[styles.resultCountLabel, { color: colors.text }]}>Valid</Text>
                </View>
                
                <View style={styles.resultCountContainer}>
                  <View 
                    style={[
                      styles.resultCountBadge, 
                      { backgroundColor: getInvalidCount() > 0 ? '#F44336' : '#A9A9A9' }
                    ]}
                  >
                    <Text style={styles.resultCountText}>{getInvalidCount()}</Text>
                  </View>
                  <Text style={[styles.resultCountLabel, { color: colors.text }]}>Invalid</Text>
                </View>
              </View>
              
              <View style={styles.resultList}>
                {validationResults.map((result, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.resultItem,
                      { 
                        backgroundColor: result.valid ? '#4CAF5020' : '#F4433620',
                        borderLeftColor: result.valid ? '#4CAF50' : '#F44336',
                      }
                    ]}
                  >
                    <View style={styles.resultHeader}>
                      <Text style={[styles.resultField, { color: colors.text }]}>
                        {result.field}
                      </Text>
                      {result.valid ? (
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      ) : (
                        <Ionicons name="close-circle" size={20} color="#F44336" />
                      )}
                    </View>
                    <Text style={[styles.resultRule, { color: colors.icon }]}>
                      Rule: {result.rule}
                    </Text>
                    <Text 
                      style={[
                        styles.resultMessage,
                        { color: result.valid ? '#4CAF50' : '#F44336' }
                      ]}
                    >
                      {result.message}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Schema Details</Text>
            <Text style={[styles.schemaDescription, { color: colors.text }]}>
              {validationSchemas[selectedSchema].name} Validation Rules:
            </Text>
            
            <View style={styles.rulesList}>
              {validationSchemas[selectedSchema].validations.map((validation, index) => (
                <View key={index} style={styles.ruleItem}>
                  <Text style={[styles.ruleField, { color: colors.text }]}>
                    {validation.field}
                  </Text>
                  <Text style={[styles.ruleType, { color: colors.primary }]}>
                    {validation.rule}
                  </Text>
                  <Text style={[styles.ruleMessage, { color: colors.icon }]}>
                    {validation.message}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

export default DataTestScreen;

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
  section: {
    margin: 20,
    marginTop: 0,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  schemaButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  schemaButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  schemaButtonText: {
    fontWeight: '600',
  },
  sampleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  sampleButtonText: {
    fontWeight: '600',
  },
  jsonInput: {
    height: 150,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  validateButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  validateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  resultCountContainer: {
    alignItems: 'center',
  },
  resultCountBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultCountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  resultCountLabel: {
    fontWeight: '600',
  },
  resultList: {
    marginTop: 8,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultField: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultRule: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
  },
  schemaDescription: {
    marginBottom: 16,
  },
  rulesList: {
    gap: 10,
  },
  ruleItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  ruleField: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ruleType: {
    fontWeight: '600',
    marginBottom: 4,
  },
  ruleMessage: {
    fontSize: 14,
  },
}); 