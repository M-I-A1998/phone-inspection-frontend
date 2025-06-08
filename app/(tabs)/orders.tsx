import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, ArrowRight, FileText, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { fetchOrders, deleteOrder } from '@/api/orders';

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  inspectionDate: string;
  deviceCount: number;
  status: 'Pending' | 'In Progress' | 'Completed';
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete order ${order.orderNumber}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingOrderId(order.id);
            try {
              await deleteOrder(order.id);
              setOrders(prevOrders => prevOrders.filter(o => o.id !== order.id));
              Alert.alert('Success', 'Order deleted successfully');
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('Error', 'Failed to delete order');
            } finally {
              setDeletingOrderId(null);
            }
          },
        },
      ]
    );
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'Pending' || order.status === 'In Progress';
    if (activeTab === 'completed') return order.status === 'Completed';
    return true;
  });

  const handleOrderPress = (order: Order) => {
    router.push(`/orders/${order.id}`);
  };

  const handleNewOrder = () => {
    router.push('/inspection/new');
  };

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <View style={styles.header}>
        <Text style={styles.title}>Inspection Orders</Text>
        <TouchableOpacity style={styles.newOrderButton} onPress={handleNewOrder}>
          <Text style={styles.newOrderButtonText}>New Order</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>In Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <TouchableOpacity 
                style={styles.orderContent}
                onPress={() => handleOrderPress(item)}
              >
                <View style={styles.orderIconContainer}>
                  <Package size={24} color={Colors.primary} />
                </View>
                <View style={styles.orderDetails}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                    <View style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: 
                          item.status === 'Completed' ? Colors.success : 
                          item.status === 'In Progress' ? Colors.warning :
                          Colors.gray[400]
                      }
                    ]}>
                      <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <View style={styles.orderFooter}>
                    <Text style={styles.orderDate}>{item.inspectionDate}</Text>
                    <View style={styles.deviceCount}>
                      <FileText size={14} color={Colors.gray[600]} style={styles.deviceIcon} />
                      <Text style={styles.deviceCountText}>{item.deviceCount} devices</Text>
                    </View>
                  </View>
                </View>
                <ArrowRight size={20} color={Colors.gray[400]} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  deletingOrderId === item.id && styles.deleteButtonDisabled
                ]}
                onPress={() => handleDeleteOrder(item)}
                disabled={deletingOrderId === item.id}
              >
                {deletingOrderId === item.id ? (
                  <ActivityIndicator size="small\" color={Colors.error} />
                ) : (
                  <Trash2 size={20} color={Colors.error} />
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>
            {activeTab === 'all' 
              ? 'Start by creating a new inspection order' 
              : `No ${activeTab} orders found`}
          </Text>
          {activeTab === 'all' && (
            <TouchableOpacity style={styles.createOrderButton} onPress={handleNewOrder}>
              <Text style={styles.createOrderButtonText}>Create Order</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
  },
  newOrderButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  newOrderButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  tab: {
    paddingVertical: 12,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[600],
  },
  activeTabText: {
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  orderDetails: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderNumber: {
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
  customerName: {
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
  deviceCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIcon: {
    marginRight: 4,
  },
  deviceCountText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
  },
  deleteButton: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  createOrderButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createOrderButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});