import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoLogout, setAutoLogout] = useState(false);
  const [language, setLanguage] = useState('English');

  // Mock user account data
  const userAccount = {
    name: 'Restaurant Admin',
    email: 'admin@restaurant.com',
    plan: 'Premium',
    memberSince: 'May 2024',
  };

  const renderSettingItem = (
    title: string,
    icon: React.ReactNode,
    value: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        {icon}
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.settingRight}>{value}</View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          Manage your account and app preferences
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.accountHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{userAccount.name.charAt(0)}</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountName, { color: colors.text }]}>{userAccount.name}</Text>
            <Text style={[styles.accountEmail, { color: colors.icon }]}>{userAccount.email}</Text>
            <View style={styles.accountBadge}>
              <Text style={styles.accountBadgeText}>{userAccount.plan}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={[styles.editProfileButton, { borderColor: colors.border }]}>
          <Text style={[styles.editProfileText, { color: colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {renderSettingItem(
          'Push Notifications',
          <Ionicons name="notifications-outline" size={22} color={colors.primary} style={styles.settingIcon} />,
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            thumbColor={pushNotifications ? colors.primary : '#f4f3f4'}
            trackColor={{ false: '#E0E0E0', true: `${colors.primary}80` }}
          />
        )}

        {renderSettingItem(
          'Email Notifications',
          <MaterialIcons name="email-outline" size={22} color={colors.primary} style={styles.settingIcon} />,
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            thumbColor={emailNotifications ? colors.primary : '#f4f3f4'}
            trackColor={{ false: '#E0E0E0', true: `${colors.primary}80` }}
          />
        )}

        {renderSettingItem(
          'Language',
          <Ionicons name="language-outline" size={22} color={colors.primary} style={styles.settingIcon} />,
          <View style={styles.valueLabelContainer}>
            <Text style={[styles.valueLabel, { color: colors.text }]}>{language}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.icon} />
          </View>,
          () => console.log('Language settings pressed')
        )}

        {renderSettingItem(
          'Auto Logout',
          <MaterialIcons name="logout" size={22} color={colors.primary} style={styles.settingIcon} />,
          <Switch
            value={autoLogout}
            onValueChange={setAutoLogout}
            thumbColor={autoLogout ? colors.primary : '#f4f3f4'}
            trackColor={{ false: '#E0E0E0', true: `${colors.primary}80` }}
          />
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {renderSettingItem(
          'Subscription Plan',
          <Ionicons name="card-outline" size={22} color={colors.primary} style={styles.settingIcon} />,
          <View style={styles.valueLabelContainer}>
            <Text style={[styles.valueLabel, { color: colors.text }]}>{userAccount.plan}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.icon} />
          </View>,
          () => console.log('Subscription pressed')
        )}

        {renderSettingItem(
          'Billing Information',
          <Ionicons name="wallet-outline" size={22} color={colors.primary} style={styles.settingIcon} />,
          <Ionicons name="chevron-forward" size={16} color={colors.icon} />,
          () => console.log('Billing pressed')
        )}

        {renderSettingItem(
          'Support',
          <Ionicons name="help-circle-outline" size={22} color={colors.primary} style={styles.settingIcon} />,
          <Ionicons name="chevron-forward" size={16} color={colors.icon} />,
          () => console.log('Support pressed')
        )}

        {renderSettingItem(
          'Privacy Policy',
          <Ionicons name="document-text-outline" size={22} color={colors.primary} style={styles.settingIcon} />,
          <Ionicons name="chevron-forward" size={16} color={colors.icon} />,
          () => console.log('Privacy pressed')
        )}
      </View>

      <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.primary }]}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.footerText}>
        <Text style={[styles.versionText, { color: colors.icon }]}>Version 1.0.0</Text>
        <Text style={[styles.memberSinceText, { color: colors.icon }]}>Member since: {userAccount.memberSince}</Text>
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
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  accountHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  accountBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  accountBadgeText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  editProfileButton: {
    borderTopWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  editProfileText: {
    fontWeight: 'bold',
  },
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerText: {
    alignItems: 'center',
    marginBottom: 32,
  },
  versionText: {
    fontSize: 12,
    marginBottom: 4,
  },
  memberSinceText: {
    fontSize: 12,
  },
}); 