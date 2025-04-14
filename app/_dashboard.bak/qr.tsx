import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Mock QR code image URL
const qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://menu.example.com/restaurant123';

export default function QRScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [restaurantId, setRestaurantId] = useState('restaurant123');
  const [customUrl, setCustomUrl] = useState('');
  const [qrType, setQrType] = useState('menu');

  // Function to handle QR code generation
  const generateQRCode = () => {
    // In a real app, this would generate a new QR code
    console.log('Generating QR code for:', qrType, restaurantId, customUrl);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>QR Code Generator</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          Create QR codes for your restaurant
        </Text>
      </View>

      <View style={styles.qrContainer}>
        <View style={[styles.qrCard, { backgroundColor: colors.card }]}>
          <View style={styles.qrImageContainer}>
            <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
          </View>
          <Text style={[styles.qrUrl, { color: colors.text }]}>
            https://menu.example.com/{restaurantId}
          </Text>
        </View>

        <View style={styles.qrActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="share-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="download-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Download</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}>
            <Ionicons name="print-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Print</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.settingsTitle, { color: colors.text }]}>QR Code Settings</Text>
        
        <View style={styles.settingSection}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>QR Code Type</Text>
          <View style={styles.toggleOptions}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                qrType === 'menu' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setQrType('menu')}>
              <Text
                style={[
                  styles.toggleText,
                  qrType === 'menu' && { color: '#fff' },
                  qrType !== 'menu' && { color: colors.text },
                ]}>
                Menu
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleOption,
                qrType === 'ordering' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setQrType('ordering')}>
              <Text
                style={[
                  styles.toggleText,
                  qrType === 'ordering' && { color: '#fff' },
                  qrType !== 'ordering' && { color: colors.text },
                ]}>
                Ordering
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleOption,
                qrType === 'feedback' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setQrType('feedback')}>
              <Text
                style={[
                  styles.toggleText,
                  qrType === 'feedback' && { color: '#fff' },
                  qrType !== 'feedback' && { color: colors.text },
                ]}>
                Feedback
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.settingSection}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Restaurant ID</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={restaurantId}
            onChangeText={setRestaurantId}
            placeholder="Enter your restaurant ID"
            placeholderTextColor={colors.icon}
          />
        </View>
        
        <View style={styles.settingSection}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Custom URL (Optional)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            value={customUrl}
            onChangeText={setCustomUrl}
            placeholder="https://your-custom-url.com"
            placeholderTextColor={colors.icon}
          />
          <Text style={[styles.helperText, { color: colors.icon }]}>
            Leave blank to use default URL with your restaurant ID
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          onPress={generateQRCode}>
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.instructionsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.instructionsTitle, { color: colors.text }]}>How to Use Your QR Code</Text>
        
        <View style={styles.instructionStep}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Generate Your QR Code</Text>
            <Text style={[styles.stepDescription, { color: colors.icon }]}>
              Choose your QR code type and generate it using your restaurant ID
            </Text>
          </View>
        </View>
        
        <View style={styles.instructionStep}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Download or Print</Text>
            <Text style={[styles.stepDescription, { color: colors.icon }]}>
              Save your QR code image or print it directly from the app
            </Text>
          </View>
        </View>
        
        <View style={styles.instructionStep}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Place QR Codes in Your Restaurant</Text>
            <Text style={[styles.stepDescription, { color: colors.icon }]}>
              Put them on tables, menus, or at the entrance for easy customer access
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrImageContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  qrUrl: {
    fontSize: 14,
  },
  qrActions: {
    flexDirection: 'row',
    marginTop: 16,
    width: '90%',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  settingsCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingSection: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  toggleOptions: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  toggleText: {
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  generateButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  instructionsCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
  },
}); 