import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Shield, CircleHelp as HelpCircle, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);
  const [cameraPermissions, setCameraPermissions] = React.useState(true);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={22} color={Colors.gray[700]} />,
          title: 'Profile Information',
          onPress: () => {},
          showArrow: true,
        },
        {
          icon: <Shield size={22} color={Colors.gray[700]} />,
          title: 'Security Settings',
          onPress: () => {},
          showArrow: true,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: <Bell size={22} color={Colors.gray[700]} />,
          title: 'Push Notifications',
          onPress: () => {},
          showToggle: true,
          toggleValue: notificationsEnabled,
          onToggle: () => setNotificationsEnabled(!notificationsEnabled),
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          title: 'Dark Mode',
          onPress: () => {},
          showToggle: true,
          toggleValue: darkModeEnabled,
          onToggle: () => setDarkModeEnabled(!darkModeEnabled),
        },
      ],
    },
    {
      title: 'Permissions',
      items: [
        {
          title: 'Camera Access',
          description: 'Required for device photo capture',
          onPress: () => {},
          showToggle: true,
          toggleValue: cameraPermissions,
          onToggle: () => setCameraPermissions(!cameraPermissions),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={22} color={Colors.gray[700]} />,
          title: 'Help & FAQ',
          onPress: () => {},
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Text style={styles.profileInitials}>
              {user?.displayName?.substring(0, 2).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
        </View>

        {settingsSections.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={`${section.title}-${itemIndex}`}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.lastSettingItem,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.settingItemLeft}>
                    {item.icon && <View style={styles.settingIcon}>{item.icon}</View>}
                    <View>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.settingDescription}>{item.description}</Text>
                      )}
                    </View>
                  </View>
                  
                  {item.showToggle && (
                    <Switch
                      value={item.toggleValue}
                      onValueChange={item.onToggle}
                      trackColor={{ false: Colors.gray[300], true: Colors.primary }}
                      thumbColor={Platform.OS === 'ios' ? '#fff' : item.toggleValue ? Colors.white : Colors.gray[100]}
                      ios_backgroundColor={Colors.gray[300]}
                    />
                  )}
                  
                  {item.showArrow && (
                    <Text style={styles.settingArrow}>›</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInitials: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.white,
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sectionContent: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.gray[900],
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
    marginTop: 2,
  },
  settingArrow: {
    fontFamily: 'Inter-Regular',
    fontSize: 24,
    color: Colors.gray[400],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[500],
  },
});