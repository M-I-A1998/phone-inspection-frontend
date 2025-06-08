import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, FlatList, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Camera, RefreshCw, Check, Download, X } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Colors from '@/constants/Colors';
import { getDevicesByOrderId, uploadDeviceImage } from '@/api/devices';
import { getOrderById, exportOrderReport } from '@/api/orders';

type DeviceWithImages = {
  id: string;
  imei: string;
  serialNumber: string;
  brand: string;
  model: string;
  frontImage?: string;
  backImage?: string;
};

export default function Station2Screen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [devices, setDevices] = useState<DeviceWithImages[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithImages | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [photoType, setPhotoType] = useState<'front' | 'back'>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    loadOrderAndDevices();
  }, [orderId]);

  const loadOrderAndDevices = async () => {
    setIsLoading(true);
    try {
      if (orderId) {
        const [order, devicesList] = await Promise.all([
          getOrderById(orderId),
          getDevicesByOrderId(orderId),
        ]);
        setOrderDetails(order);
        setDevices(devicesList);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load order or devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDevice = (device: DeviceWithImages) => {
    setSelectedDevice(device);
  };

  const handleStartCamera = (device: DeviceWithImages, type: 'front' | 'back') => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    
    setSelectedDevice(device);
    setPhotoType(type);
    setIsCameraActive(true);
  };

  const handleCameraToggle = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleCameraCancel = () => {
    setIsCameraActive(false);
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      
      if (selectedDevice) {
        setIsUploading(true);
        try {
          await uploadDeviceImage(selectedDevice.id, photoType, photo.uri);
          
          // Update local state with the new image
          setDevices(prev => prev.map(device => 
            device.id === selectedDevice.id 
              ? { 
                  ...device, 
                  [photoType === 'front' ? 'frontImage' : 'backImage']: photo.uri 
                }
              : device
          ));
          
          // Close camera after successful upload
          setIsCameraActive(false);
          setIsUploading(false);
          
          // If this was the front photo, automatically prompt for back photo
          if (photoType === 'front') {
            Alert.alert(
              'Front Photo Captured',
              'Would you like to take the back photo now?',
              [
                {
                  text: 'Later',
                  style: 'cancel',
                },
                {
                  text: 'Take Back Photo',
                  onPress: () => handleStartCamera(selectedDevice, 'back'),
                },
              ]
            );
          } else {
            // Both photos taken, show completion message
            Alert.alert('Success', 'All photos for this device have been captured.');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          Alert.alert('Upload Failed', 'Failed to upload the image. Please try again.');
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportReport = async () => {
    if (!orderId) return;
    
    setIsExporting(true);
    try {
      const reportUrl = await exportOrderReport(orderId);
      
      Alert.alert(
        'Report Generated',
        'The inspection report has been generated successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              // In a real app, you might open the URL or handle download
              console.log('Report URL:', reportUrl);
              
              // Navigate back to dashboard
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Failed to generate the report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Check if all devices have both photos
  const allPhotosComplete = devices.every(device => device.frontImage && device.backImage);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    );
  }

  if (isCameraActive) {
    if (!permission?.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>We need camera permission to take photos</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={cameraType}
          enableZoomGesture
        >
          {isUploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color={Colors.white} />
              <Text style={styles.uploadingText}>Uploading photo...</Text>
            </View>
          ) : (
            <View style={styles.cameraControls}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity style={styles.cameraButton} onPress={handleCameraCancel}>
                  <X size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>
                  {photoType === 'front' ? 'Front Photo' : 'Back Photo'}
                </Text>
                <TouchableOpacity style={styles.cameraButton} onPress={handleCameraToggle}>
                  <RefreshCw size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.captureContainer}>
                <TouchableOpacity 
                  style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                  onPress={handleTakePicture}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <View style={styles.captureButtonInner} />
                  )}
                </TouchableOpacity>
              </View>
              
              <View style={styles.cameraGuide}>
                <Text style={styles.cameraGuideText}>
                  Position the {photoType === 'front' ? 'front' : 'back'} of the device in frame
                </Text>
              </View>
            </View>
          )}
        </CameraView>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Station 2: Photography',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
        <View style={styles.orderInfoContainer}>
          <Text style={styles.orderTitle}>Order: {orderDetails?.orderNumber}</Text>
          <Text style={styles.orderCustomer}>Customer: {orderDetails?.customerName}</Text>
          <View style={styles.orderStats}>
            <Text style={styles.orderDeviceCount}>{devices.length} devices</Text>
            <Text style={styles.orderPhotoProgress}>
              {devices.reduce((count, device) => {
                let photoCount = 0;
                if (device.frontImage) photoCount++;
                if (device.backImage) photoCount++;
                return count + photoCount;
              }, 0)} / {devices.length * 2} photos taken
            </Text>
          </View>
        </View>

        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.deviceListContainer}
          renderItem={({ item }) => (
            <View style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.brand} {item.model}</Text>
                <Text style={styles.deviceDetail}>IMEI: {item.imei}</Text>
                <Text style={styles.deviceDetail}>S/N: {item.serialNumber}</Text>
              </View>
              
              <View style={styles.photoContainer}>
                <View style={styles.photoSlot}>
                  {item.frontImage ? (
                    <Image source={{ uri: item.frontImage }} style={styles.photoThumbnail} />
                  ) : (
                    <TouchableOpacity 
                      style={styles.addPhotoButton}
                      onPress={() => handleStartCamera(item, 'front')}
                    >
                      <Camera size={24} color={Colors.gray[600]} />
                      <Text style={styles.addPhotoText}>Front</Text>
                    </TouchableOpacity>
                  )}
                  {item.frontImage && (
                    <TouchableOpacity 
                      style={styles.retakeButton}
                      onPress={() => handleStartCamera(item, 'front')}
                    >
                      <Text style={styles.retakeText}>Retake</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.photoSlot}>
                  {item.backImage ? (
                    <Image source={{ uri: item.backImage }} style={styles.photoThumbnail} />
                  ) : (
                    <TouchableOpacity 
                      style={styles.addPhotoButton}
                      onPress={() => handleStartCamera(item, 'back')}
                    >
                      <Camera size={24} color={Colors.gray[600]} />
                      <Text style={styles.addPhotoText}>Back</Text>
                    </TouchableOpacity>
                  )}
                  {item.backImage && (
                    <TouchableOpacity 
                      style={styles.retakeButton}
                      onPress={() => handleStartCamera(item, 'back')}
                    >
                      <Text style={styles.retakeText}>Retake</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No devices found</Text>
              <Text style={styles.emptyText}>
                There are no devices associated with this order yet. Please add devices at Station 1 first.
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => router.push(`/inspection/station1/${orderId}`)}
              >
                <Text style={styles.emptyButtonText}>Go to Station 1</Text>
              </TouchableOpacity>
            </View>
          }
        />
        
        {devices.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.exportButton,
                (!allPhotosComplete || isExporting) && styles.exportButtonDisabled
              ]}
              onPress={handleExportReport}
              disabled={!allPhotosComplete || isExporting}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Download size={20} color={Colors.white} style={styles.exportButtonIcon} />
                  <Text style={styles.exportButtonText}>Generate Report</Text>
                </>
              )}
            </TouchableOpacity>
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
  orderInfoContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  orderTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.primary,
    marginBottom: 4,
  },
  orderCustomer: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 8,
  },
  orderStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDeviceCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.gray[700],
  },
  orderPhotoProgress: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.warning,
  },
  deviceListContainer: {
    padding: 16,
    paddingBottom: 100, // Space for footer
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
  deviceInfo: {
    marginBottom: 12,
  },
  deviceName: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  deviceDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  photoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoSlot: {
    width: '48%',
  },
  photoThumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: Colors.gray[200],
  },
  addPhotoButton: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderStyle: 'dashed',
    backgroundColor: Colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 8,
  },
  retakeButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  retakeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 18,
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.gray[700],
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 12,
  },
  exportButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  exportButtonIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  cameraTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.white,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
  },
  cameraGuide: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
  },
  cameraGuideText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.white,
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[700],
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});