import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CirclePlus as PlusCircle, ChartBar as BarChart, Search, CircleCheck as CheckCircle, Zap as ZapIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function Dashboard() {
  const router = useRouter();

  const handleNewInspection = () => {
    router.push('/inspection/new');
  };

  const handleSearchDevice = () => {
    router.push('/(tabs)/search');
  };

  // Reset stats to zero
  const stats = {
    inspectedToday: 0,
    pendingInspections: 0,
    completedToday: 0,
    totalDevices: 0
  };

  // Empty recent orders
  const recentOrders = [];

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome to Phone Inspection</Text>
          <Text style={styles.welcomeSubtext}>What would you like to do today?</Text>
        </View>

        <View style={styles.actionCards}>
          <TouchableOpacity style={styles.actionCard} onPress={handleNewInspection}>
            <View style={[styles.actionIconContainer, { backgroundColor: Colors.primary }]}>
              <PlusCircle size={24} color={Colors.white} />
            </View>
            <Text style={styles.actionTitle}>New Inspection</Text>
            <Text style={styles.actionDescription}>Create a new device inspection order</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={handleSearchDevice}>
            <View style={[styles.actionIconContainer, { backgroundColor: Colors.secondary }]}>
              <Search size={24} color={Colors.white} />
            </View>
            <Text style={styles.actionTitle}>Search Device</Text>
            <Text style={styles.actionDescription}>Look up previously inspected devices</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <CheckCircle size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.inspectedToday}</Text>
              <Text style={styles.statLabel}>Inspected Today</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <ZapIcon size={20} color={Colors.warning} />
              </View>
              <Text style={styles.statValue}>{stats.pendingInspections}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <BarChart size={20} color={Colors.success} />
              </View>
              <Text style={styles.statValue}>{stats.totalDevices}</Text>
              <Text style={styles.statLabel}>Total Devices</Text>
            </View>
          </View>
        </View>

        <View style={styles.recentOrdersContainer}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={() => router.push(`/orders/${order.id}`)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>{order.id}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: order.status === 'Completed' ? Colors.success : Colors.warning }
                  ]}>
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>
                
                <Text style={styles.orderCustomer}>{order.customer}</Text>
                
                <View style={styles.orderFooter}>
                  <Text style={styles.orderDate}>{order.date}</Text>
                  <Text style={styles.orderDevices}>{order.devices} devices</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyOrdersContainer}>
              <Text style={styles.emptyOrdersText}>No recent orders</Text>
              <TouchableOpacity 
                style={styles.createOrderButton} 
                onPress={handleNewInspection}
              >
                <Text style={styles.createOrderButtonText}>Create New Order</Text>
              </TouchableOpacity>
            </View>
          )}
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.gray[900],
  },
  welcomeSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    marginTop: 4,
  },
  actionCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  actionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.gray[900],
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
    textAlign: 'center',
  },
  recentOrdersContainer: {
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.white,
  },
  orderCustomer: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[900],
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
  },
  orderDevices: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
  },
  emptyOrdersContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyOrdersText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    marginBottom: 16,
  },
  createOrderButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createOrderButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
  },
});