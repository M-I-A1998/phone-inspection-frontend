import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Smartphone, Clipboard, Calendar, User, Camera } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { getDeviceById } from '@/api/devices';

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [device, setDevice] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDevice();
  }, [id]);

  const loadDevice = async () => {
    setIsLoading(true);
    try {
      if (id) {
        const deviceData = await getDeviceById(id);
        setDevice(deviceData);
      }
    } catch (error) {
      console.error('Error loading device:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading device details...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Device not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Helper function to format condition names for display
  const formatConditionName = (condition: string) => {
    return condition
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Device Details',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.deviceImageContainer}>
            {device.frontImage ? (
              <Image source={{ uri: device.frontImage }} style={styles.deviceImage} />
            ) : (
              <View style={styles.noImageContainer}>
                <Smartphone size={64} color={Colors.gray[400]} />
                <Text style={styles.noImageText}>No front image</Text>
              </View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.deviceHeader}>
              <Text style={styles.deviceName}>{device.brand} {device.model}</Text>
            </View>
            
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Smartphone size={18} color={Colors.gray[600]} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>IMEI Number</Text>
                </View>
                <Text style={styles.infoValue}>{device.imei}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Clipboard size={18} color={Colors.gray[600]} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Serial Number</Text>
                </View>
                <Text style={styles.infoValue}>{device.serialNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Calendar size={18} color={Colors.gray[600]} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Inspection Date</Text>
                </View>
                <Text style={styles.infoValue}>{device.inspectionDate || 'Not available'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <User size={18} color={Colors.gray[600]} style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Inspector</Text>
                </View>
                <Text style={styles.infoValue}>{device.inspectorName || 'Not recorded'}</Text>
              </View>
            </View>
            
            <View style={styles.sectionDivider} />
            
            <View style={styles.conditionSection}>
              <Text style={styles.sectionTitle}>Device Condition</Text>
              
              {device.conditions && device.conditions.length > 0 ? (
                <View style={styles.conditionList}>
                  {device.conditions.map((condition: string, index: number) => (
                    <View key={condition} style={styles.conditionTag}>
                      <Text style={styles.conditionText}>{formatConditionName(condition)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noConditionText}>No conditions specified</Text>
              )}
            </View>
            
            <View style={styles.sectionDivider} />
            
            <View style={styles.imagesSection}>
              <Text style={styles.sectionTitle}>Device Images</Text>
              
              <View style={styles.imagesGrid}>
                <View style={styles.imageColumn}>
                  <Text style={styles.imageLabel}>Front</Text>
                  {device.frontImage ? (
                    <Image source={{ uri: device.frontImage }} style={styles.imageThumbnail} />
                  ) : (
                    <View style={styles.noThumbnailContainer}>
                      <Camera size={24} color={Colors.gray[400]} />
                      <Text style={styles.noThumbnailText}>No image</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.imageColumn}>
                  <Text style={styles.imageLabel}>Back</Text>
                  {device.backImage ? (
                    <Image source={{ uri: device.backImage }} style={styles.imageThumbnail} />
                  ) : (
                    <View style={styles.noThumbnailContainer}>
                      <Camera size={24} color={Colors.gray[400]} />
                      <Text style={styles.noThumbnailText}>No image</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <View style={styles.sectionDivider} />
            
            <View style={styles.orderSection}>
              <Text style={styles.sectionTitle}>Order Information</Text>
              
              <TouchableOpacity 
                style={styles.orderCard}
                onPress={() => router.push(`/orders/${device.orderId}`)}
              >
                <View>
                  <Text style={styles.orderNumber}>{device.orderNumber || 'Order #' + device.orderId}</Text>
                  <Text style={styles.orderCustomer}>{device.customerName || 'Customer information not available'}</Text>
                </View>
                <ChevronLeft size={20} color={Colors.gray[600]} style={{ transform: [{ rotate: '180deg' }] }} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  scrollView: {
    flex: 1,
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
  deviceImageContainer: {
    height: 240,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[500],
    marginTop: 8,
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  deviceHeader: {
    marginBottom: 16,
  },
  deviceName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.gray[900],
  },
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[600],
  },
  infoValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[900],
    maxWidth: '60%',
    textAlign: 'right',
  },
  sectionDivider: {
    height: 8,
  },
  conditionSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 16,
  },
  conditionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  conditionTag: {
    backgroundColor: Colors.blue[50],
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  conditionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.primary,
  },
  noConditionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    fontStyle: 'italic',
  },
  imagesSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imagesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageColumn: {
    width: '48%',
  },
  imageLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 8,
  },
  imageThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.gray[200],
  },
  noThumbnailContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderStyle: 'dashed',
  },
  noThumbnailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 8,
  },
  orderSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    padding: 12,
  },
  orderNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  orderCustomer: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[600],
  },
});