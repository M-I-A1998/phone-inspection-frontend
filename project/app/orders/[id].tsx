import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Smartphone, Download, CirclePlus as PlusCircle, Camera } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { getOrderById } from '@/api/orders';
import { getDevicesByOrderId } from '@/api/devices';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadOrderAndDevices();
  }, [id]);

  const loadOrderAndDevices = async () => {
    setIsLoading(true);
    try {
      if (id) {
        const [orderData, devicesData] = await Promise.all([
          getOrderById(id),
          getDevicesByOrderId(id)
        ]);
        
        setOrder(orderData);
        setDevices(devicesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDevice = () => {
    router.push(`/inspection/station1/${id}`);
  };

  const handleAddPhotos = () => {
    router.push(`/inspection/station2/${id}`);
  };

  const handleGenerateReport = () => {
    router.push(`/inspection/station2/${id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate inspection progress
  const totalDevices = devices.length;
  const devicesWithPhotos = devices.filter(d => d.frontImage && d.backImage).length;
  const progressPercentage = totalDevices > 0 ? (devicesWithPhotos / totalDevices) * 100 : 0;
  const isComplete = totalDevices > 0 && devicesWithPhotos === totalDevices;

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Order Details',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
        <View style={styles.orderSummary}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isComplete ? Colors.success : Colors.warning }
            ]}>
              <Text style={styles.statusText}>{isComplete ? 'Completed' : 'In Progress'}</Text>
            </View>
          </View>
          
          <Text style={styles.customerName}>{order.customerName}</Text>
          
          <View style={styles.orderMeta}>
            <Text style={styles.orderDate}>Created: {order.createdAt}</Text>
            <Text style={styles.inspectorName}>Inspector: {order.inspectorName}</Text>
          </View>

          {order.labelNumber && (
            <View style={styles.labelContainer}>
              <Text style={styles.labelTitle}>Label Number</Text>
              <Text style={styles.labelNumber}>{order.labelNumber}</Text>
            </View>
          )}
          
          <View style={styles.progressContainer}>
            <View style={styles.progressLabel}>
              <Text style={styles.progressText}>Inspection Progress</Text>
              <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressDetail}>
              {devicesWithPhotos} of {totalDevices} devices fully inspected
            </Text>
          </View>
        </View>
        
        <View style={styles.deviceListHeader}>
          <Text style={styles.deviceListTitle}>Devices ({devices.length})</Text>
          <TouchableOpacity style={styles.addDeviceButton} onPress={handleAddDevice}>
            <PlusCircle size={18} color={Colors.white} />
            <Text style={styles.addDeviceText}>Add Device</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.deviceListContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.deviceCard}
              onPress={() => router.push(`/device/${item.id}`)}
            >
              <View style={styles.deviceContent}>
                <View style={styles.deviceIconContainer}>
                  <Smartphone size={24} color={Colors.primary} />
                </View>
                
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{item.brand} {item.model}</Text>
                  <Text style={styles.deviceDetail}>IMEI: {item.imei}</Text>
                  <Text style={styles.deviceDetail}>S/N: {item.serialNumber}</Text>
                  
                  {/* Photo indicators */}
                  <View style={styles.photoIndicators}>
                    <View style={[
                      styles.photoIndicator,
                      item.frontImage ? styles.photoComplete : styles.photoMissing
                    ]}>
                      <Camera size={12} color={item.frontImage ? Colors.white : Colors.gray[600]} />
                      <Text style={[
                        styles.photoIndicatorText,
                        item.frontImage ? styles.photoIndicatorTextComplete : styles.photoIndicatorTextMissing
                      ]}>
                        Front
                      </Text>
                    </View>
                    
                    <View style={[
                      styles.photoIndicator,
                      item.backImage ? styles.photoComplete : styles.photoMissing
                    ]}>
                      <Camera size={12} color={item.backImage ? Colors.white : Colors.gray[600]} />
                      <Text style={[
                        styles.photoIndicatorText,
                        item.backImage ? styles.photoIndicatorTextComplete : styles.photoIndicatorTextMissing
                      ]}>
                        Back
                      </Text>
                    </View>
                  </View>
                </View>
                
                <ChevronLeft size={20} color={Colors.gray[600]} style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No devices yet</Text>
              <Text style={styles.emptyText}>
                Start by adding devices to this inspection order
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddDevice}>
                <PlusCircle size={20} color={Colors.white} style={styles.emptyButtonIcon} />
                <Text style={styles.emptyButtonText}>Add Device</Text>
              </TouchableOpacity>
            </View>
          }
        />
        
        {devices.length > 0 && (
          <View style={styles.footer}>
            {!isComplete ? (
              <TouchableOpacity 
                style={styles.footerButton}
                onPress={handleAddPhotos}
              >
                <Camera size={20} color={Colors.white} style={styles.footerButtonIcon} />
                <Text style={styles.footerButtonText}>
                  {totalDevices === devicesWithPhotos ? 'Review Photos' : 'Add Photos'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.footerButton, styles.reportButton]}
                onPress={handleGenerateReport}
              >
                <Download size={20} color={Colors.white} style={styles.footerButtonIcon} />
                <Text style={styles.footerButtonText}>Generate Report</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.gray[100],
  },
  errorText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  orderSummary: {
    backgroundColor: Colors.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.white,
  },
  customerName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 8,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  inspectorName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  labelContainer: {
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  labelTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.gray[600],
    marginBottom: 4,
  },
  labelNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.gray[900],
  },
  progressContainer: {
    backgroundColor: Colors.gray[50],
    padding: 12,
    borderRadius: 8,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
  },
  progressPercentage: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray[200],
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
  },
  deviceListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deviceListTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.gray[900],
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addDeviceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.white,
    marginLeft: 4,
  },
  deviceListContainer: {
    padding: 16,
    paddingBottom: 80, // Space for footer
  },
  deviceCard: {
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
  deviceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  deviceDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  photoIndicators: {
    flexDirection: 'row',
    marginTop: 8,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  photoComplete: {
    backgroundColor: Colors.success,
  },
  photoMissing: {
    backgroundColor: Colors.gray[200],
  },
  photoIndicatorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    marginLeft: 4,
  },
  photoIndicatorTextComplete: {
    color: Colors.white,
  },
  photoIndicatorTextMissing: {
    color: Colors.gray[600],
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyButtonIcon: {
    marginRight: 8,
  },
  emptyButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    padding: 16,
  },
  footerButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportButton: {
    backgroundColor: Colors.success,
  },
  footerButtonIcon: {
    marginRight: 8,
  },
  footerButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});