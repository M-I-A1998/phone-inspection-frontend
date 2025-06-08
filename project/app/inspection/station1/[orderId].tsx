import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChevronLeft, Smartphone, Loader, Save, Camera, FileText, Check } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Colors from '@/constants/Colors';
import { getOrderById } from '@/api/orders';
import { lookupImei, submitDeviceDetails, uploadDeviceImage } from '@/api/devices';

interface ImeiLookupResult {
  brand: string;
  model: string;
  valid: boolean;
}

interface ConditionOption {
  id: string;
  label: string;
  description?: string;
}

export default function Station1Screen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [imei, setImei] = useState('');
  const [isLookingUpImei, setIsLookingUpImei] = useState(false);
  const [deviceDetails, setDeviceDetails] = useState<{ brand: string; model: string } | null>(null);
  const [isValidImei, setIsValidImei] = useState<boolean | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serialNumber, setSerialNumber] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [showWorkflowSelection, setShowWorkflowSelection] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<'complete' | 'details-only' | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();

  // Add new state for camera functionality
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [photoType, setPhotoType] = useState<'front' | 'back'>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const conditionOptions: ConditionOption[] = [
    { 
      id: 'front_cracked', 
      label: 'Front Cracked Screen', 
      description: 'The front screen has visible cracks or damage' 
    },
    { 
      id: 'back_cracked', 
      label: 'Back Cracked Screen', 
      description: 'The back panel has visible cracks or damage' 
    },
    { 
      id: 'no_power', 
      label: 'No Power', 
      description: 'Device does not power on or hold charge' 
    },
  ];

  const resetForm = useCallback(() => {
    setImei('');
    setDeviceDetails(null);
    setIsValidImei(null);
    setSelectedConditions([]);
    setSerialNumber(generateSerialNumber());
    setManualEntry(false);
  }, []);

  const generateSerialNumber = useCallback(() => {
    const timestamp = new Date().getTime().toString().substring(6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `SN${timestamp}${random}`;
  }, []);

  useEffect(() => {
    setSerialNumber(generateSerialNumber());
  }, [generateSerialNumber]);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        if (orderId) {
          const order = await getOrderById(orderId);
          setOrderDetails(order);
        }
      } catch (error) {
        console.error('Error loading order:', error);
        Alert.alert('Error', 'Failed to load order details');
      } finally {
        setIsLoadingOrder(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleImeiLookup = async () => {
    if (!imei.trim() || imei.length < 8) {
      Alert.alert('Error', 'Please enter a valid IMEI number');
      return;
    }

    setIsLookingUpImei(true);
    try {
      const result = await lookupImei(imei);
      setDeviceDetails({ brand: result.brand, model: result.model });
      setIsValidImei(result.valid);
      
      if (!result.valid) {
        Alert.alert('Invalid IMEI', 'The IMEI appears to be invalid. You can still proceed, but please check the number.');
      }
      
    } catch (error) {
      console.error('IMEI lookup error:', error);
      Alert.alert('Lookup Failed', 'Failed to verify IMEI. Please try again or enter details manually.');
      setIsValidImei(false);
    } finally {
      setIsLookingUpImei(false);
    }
  };

  const handleStartCamera = (type: 'front' | 'back') => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
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
      
      if (photoType === 'front') {
        setFrontImage(photo.uri);
      } else {
        setBackImage(photo.uri);
      }
      
      setIsCameraActive(false);
      
      // If this was the front photo, prompt for back photo
      if (photoType === 'front' && !backImage) {
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
              onPress: () => handleStartCamera('back'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleCondition = (conditionId: string) => {
    setSelectedConditions(prev => 
      prev.includes(conditionId) 
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const handleWorkflowSelect = (workflow: 'complete' | 'details-only') => {
    setSelectedWorkflow(workflow);
    setShowWorkflowSelection(false);
  };

  const handleDone = async () => {
    if (!orderId) return;
    
    Alert.alert(
      'Complete Order',
      selectedWorkflow === 'complete' 
        ? 'This will mark the order as complete. All device details and photos have been saved.'
        : 'This will mark the device details as complete. Photos can be added at Station 2.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Complete',
          onPress: async () => {
            setIsCompleting(true);
            try {
              // Navigate back to orders tab
              router.replace('/(tabs)/orders');
            } catch (error) {
              console.error('Error completing order:', error);
              Alert.alert('Error', 'Failed to complete the order');
            } finally {
              setIsCompleting(false);
            }
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!imei.trim()) {
      Alert.alert('Error', 'Please enter an IMEI number');
      return;
    }

    if (!deviceDetails?.brand || !deviceDetails?.model) {
      Alert.alert('Error', 'Please lookup the IMEI or enter device details manually');
      return;
    }

    if (selectedWorkflow === 'complete' && (!frontImage || !backImage)) {
      Alert.alert('Error', 'Please take both front and back photos');
      return;
    }

    setIsSubmitting(true);
    try {
      const deviceData = {
        orderId,
        imei,
        serialNumber,
        brand: deviceDetails.brand,
        model: deviceDetails.model,
        conditions: selectedConditions,
      };
      
      const savedDevice = await submitDeviceDetails(deviceData);

      // Upload photos if in complete workflow
      if (selectedWorkflow === 'complete') {
        setIsUploading(true);
        if (frontImage) {
          await uploadDeviceImage(savedDevice.id, 'front', frontImage);
        }
        if (backImage) {
          await uploadDeviceImage(savedDevice.id, 'back', backImage);
        }
      }

      // Reset form
      resetForm();
      setFrontImage(null);
      setBackImage(null);

      Alert.alert(
        'Device Added',
        'Would you like to add another device or complete the order?',
        [
          {
            text: 'Done',
            onPress: handleDone,
          },
          {
            text: 'Add Another Device',
            style: 'default',
            onPress: () => {
              // Form is already reset
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting device:', error);
      Alert.alert('Error', 'Failed to save device details. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const toggleManualEntry = () => {
    setManualEntry(!manualEntry);
    if (!manualEntry) {
      setIsValidImei(null);
    }
  };

  const updateDeviceDetailsManually = (field: 'brand' | 'model', value: string) => {
    setDeviceDetails(prev => ({
      ...prev,
      [field]: value,
    } as { brand: string; model: string }));
  };

  if (isLoadingOrder) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (showWorkflowSelection) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Select Process',
            headerTitleAlign: 'center',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()}>
                <ChevronLeft size={24} color={Colors.primary} />
              </TouchableOpacity>
            ),
          }}
        />
        <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
          <View style={styles.workflowContainer}>
            <Text style={styles.workflowTitle}>Choose Inspection Process</Text>
            <Text style={styles.workflowDescription}>
              Select how you would like to process this device
            </Text>

            <TouchableOpacity 
              style={styles.workflowOption}
              onPress={() => handleWorkflowSelect('complete')}
            >
              <View style={styles.workflowIconContainer}>
                <Camera size={32} color={Colors.primary} />
              </View>
              <View style={styles.workflowContent}>
                <Text style={styles.workflowOptionTitle}>
                  Complete Device Details & Photos
                </Text>
                <Text style={styles.workflowOptionDescription}>
                  Enter device information and proceed directly to taking photos
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.workflowOption}
              onPress={() => handleWorkflowSelect('details-only')}
            >
              <View style={styles.workflowIconContainer}>
                <FileText size={32} color={Colors.primary} />
              </View>
              <View style={styles.workflowContent}>
                <Text style={styles.workflowOptionTitle}>
                  Device Details Only
                </Text>
                <Text style={styles.workflowOptionDescription}>
                  Enter device information now and take photos later at Station 2
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (isCameraActive) {
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
                  <ChevronLeft size={24} color={Colors.white} />
                </TouchableOpacity>
                <Text style={styles.cameraTitle}>
                  {photoType === 'front' ? 'Front Photo' : 'Back Photo'}
                </Text>
                <TouchableOpacity style={styles.cameraButton} onPress={handleCameraToggle}>
                  <Camera size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.captureContainer}>
                <TouchableOpacity 
                  style={[styles.captureButton, isCapturing && styles.captureButtonDisabled]}
                  onPress={handleTakePicture}
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <ActivityIndicator size="small\" color={Colors.white} />
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
          title: selectedWorkflow === 'complete' 
            ? 'Station 1: Complete Device Details'
            : 'Station 1: Device Details',
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.orderInfoContainer}>
            <Text style={styles.orderTitle}>Order: {orderDetails?.orderNumber}</Text>
            <Text style={styles.orderCustomer}>Customer: {orderDetails?.customerName}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Smartphone size={20} color={Colors.primary} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Device Identification</Text>
              </View>
              
              <View style={styles.imeiContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>IMEI Number *</Text>
                  <View style={styles.imeiInputContainer}>
                    <TextInput
                      style={styles.imeiInput}
                      placeholder="Enter device IMEI"
                      value={imei}
                      onChangeText={setImei}
                      keyboardType="numeric"
                      editable={!isLookingUpImei}
                    />
                    <TouchableOpacity 
                      style={[
                        styles.lookupButton,
                        isLookingUpImei && styles.lookupButtonDisabled,
                        manualEntry && styles.lookupButtonDisabled
                      ]}
                      onPress={handleImeiLookup}
                      disabled={isLookingUpImei || manualEntry}
                    >
                      {isLookingUpImei ? (
                        <Loader size={18} color={Colors.white} />
                      ) : (
                        <Text style={styles.lookupButtonText}>Lookup</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {isValidImei !== null && (
                    <Text style={[
                      styles.imeiStatus,
                      isValidImei ? styles.validImei : styles.invalidImei
                    ]}>
                      {isValidImei ? '✓ Valid IMEI' : '⚠️ Invalid or unrecognized IMEI'}
                    </Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.manualToggle}
                  onPress={toggleManualEntry}
                >
                  <Text style={styles.manualToggleText}>
                    {manualEntry ? 'Use IMEI Lookup' : 'Enter Device Details Manually'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.deviceDetailsContainer, manualEntry && styles.manualEntryActive]}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Device Brand *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Device brand"
                    value={deviceDetails?.brand || ''}
                    onChangeText={(value) => updateDeviceDetailsManually('brand', value)}
                    editable={manualEntry}
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Device Model *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Device model"
                    value={deviceDetails?.model || ''}
                    onChangeText={(value) => updateDeviceDetailsManually('model', value)}
                    editable={manualEntry}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Serial Number (Auto-generated)</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={serialNumber}
                  editable={false}
                />
                <Text style={styles.helpText}>
                  This unique identifier will be used to track this device
                </Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Device Condition</Text>
              <Text style={styles.sectionDescription}>
                Select all conditions that apply to this device
              </Text>
              
              <View style={styles.conditionsContainer}>
                {conditionOptions.map((condition) => (
                  <TouchableOpacity
                    key={condition.id}
                    style={[
                      styles.conditionItem,
                      selectedConditions.includes(condition.id) && styles.conditionItemSelected
                    ]}
                    onPress={() => toggleCondition(condition.id)}
                  >
                    <View style={styles.conditionHeader}>
                      <Text 
                        style={[
                          styles.conditionLabel,
                          selectedConditions.includes(condition.id) && styles.conditionLabelSelected
                        ]}
                      >
                        {condition.label}
                      </Text>
                      <View 
                        style={[
                          styles.checkmark,
                          selectedConditions.includes(condition.id) && styles.checkmarkSelected
                        ]}
                      >
                        {selectedConditions.includes(condition.id) && (
                          <Text style={styles.checkmarkText}>✓</Text>
                        )}
                      </View>
                    </View>
                    {condition.description && (
                      <Text 
                        style={[
                          styles.conditionDescription,
                          selectedConditions.includes(condition.id) && styles.conditionDescriptionSelected
                        ]}
                      >
                        {condition.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedWorkflow === 'complete' && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Device Photos</Text>
                <Text style={styles.sectionDescription}>
                  Take clear photos of the front and back of the device
                </Text>
                
                <View style={styles.photoContainer}>
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoLabel}>Front</Text>
                    {frontImage ? (
                      <>
                        <Image source={{ uri: frontImage }} style={styles.photoThumbnail} />
                        <TouchableOpacity 
                          style={styles.retakeButton}
                          onPress={() => handleStartCamera('front')}
                        >
                          <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity 
                        style={styles.addPhotoButton}
                        onPress={() => handleStartCamera('front')}
                      >
                        <Camera size={24} color={Colors.gray[600]} />
                        <Text style={styles.addPhotoText}>Take Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.photoSlot}>
                    <Text style={styles.photoLabel}>Back</Text>
                    {backImage ? (
                      <>
                        <Image source={{ uri: backImage }} style={styles.photoThumbnail} />
                        <TouchableOpacity 
                          style={styles.retakeButton}
                          onPress={() => handleStartCamera('back')}
                        >
                          <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity 
                        style={styles.addPhotoButton}
                        onPress={() => handleStartCamera('back')}
                      >
                        <Camera size={24} color={Colors.gray[600]} />
                        <Text style={styles.addPhotoText}>Take Photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <View style={styles.footerButtonsRight}>
            <TouchableOpacity 
              style={[styles.doneButton, isCompleting && styles.buttonDisabled]}
              onPress={handleDone}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator size="small\" color={Colors.white} />
              ) : (
                <>
                  <Check size={20} color={Colors.white} style={styles.buttonIcon} />
                  <Text style={styles.doneButtonText}>Done</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                (isSubmitting || (selectedWorkflow === 'complete' && (!frontImage || !backImage))) && 
                styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || (selectedWorkflow === 'complete' && (!frontImage || !backImage))}
            >
              {isSubmitting || isUploading ? (
                <ActivityIndicator size="small\" color={Colors.white} />
              ) : (
                <>
                  <Save size={20} color={Colors.white} style={styles.buttonIcon} />
                  <Text style={styles.submitButtonText}>Save Device</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  scrollContainer: {
    flex: 1,
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
  },
  formContainer: {
    padding: 16,
  },
  formSection: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[900],
  },
  disabledInput: {
    backgroundColor: Colors.gray[100],
    color: Colors.gray[600],
  },
  helpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.gray[500],
    marginTop: 4,
  },
  imeiContainer: {
    marginBottom: 16,
  },
  imeiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imeiInput: {
    flex: 1,
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[900],
  },
  lookupButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lookupButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  lookupButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
  },
  imeiStatus: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginTop: 8,
  },
  validImei: {
    color: Colors.success,
  },
  invalidImei: {
    color: Colors.error,
  },
  manualToggle: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  manualToggleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  deviceDetailsContainer: {
    opacity: 0.6,
  },
  manualEntryActive: {
    opacity: 1,
  },
  conditionsContainer: {
    flexDirection: 'column',
  },
  conditionItem: {
    width: '100%',
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  conditionItemSelected: {
    backgroundColor: Colors.blue[50],
    borderColor: Colors.primary,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conditionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.gray[900],
    flex: 1,
  },
  conditionLabelSelected: {
    color: Colors.primary,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmarkText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  conditionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    marginTop: 4,
  },
  conditionDescriptionSelected: {
    color: Colors.gray[800],
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
  footerButtonsRight: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: 12,
  },
  doneButton: {
    flexDirection: 'row',
    backgroundColor: Colors.success,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  doneButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
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
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  submitButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  workflowContainer: {
    padding: 24,
  },
  workflowTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: Colors.gray[900],
    marginBottom: 8,
  },
  workflowDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.gray[600],
    marginBottom: 32,
  },
  workflowOption: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  workflowIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.blue[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workflowContent: {
    flex: 1,
    justifyContent: 'center',
  },
  workflowOptionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
    marginBottom: 4,
  },
  workflowOptionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    lineHeight: 20,
  },
  photoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  photoSlot: {
    width: '48%',
  },
  photoLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.gray[700],
    marginBottom: 8,
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
});