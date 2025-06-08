import React from 'react';
import { Tabs } from 'expo-router';
import { Chrome as Home, Search, ClipboardList, Settings } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Don't render or redirect while loading
  if (isLoading) {
    return null; // or a splash/loading screen
  }

  if (!isAuthenticated) {
    router.replace('/login');
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray[600],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search Devices',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
          headerRight: () => <HeaderRight />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          headerRight: () => <HeaderRight />,
        }}
      />
    </Tabs>
  );
}

function HeaderRight() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <View style={styles.headerRightContainer}>
      <Text style={styles.userText}>{user?.displayName || 'User'}</Text>
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  header: {
    backgroundColor: Colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.primary,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  userText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[600],
    marginRight: 8,
  },
  logoutButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  logoutText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.white,
  },
});