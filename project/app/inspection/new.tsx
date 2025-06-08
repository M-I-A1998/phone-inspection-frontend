import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, CirclePlus as PlusCircle } from 'lucide-react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { createOrder } from '@/api/orders';
import { useAuth } from '@/context/AuthContext';

export default function NewInspectionScreen() {
  const [customerName, setCustomerName] = useState('');
  const [masterNumber, setMasterNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const validateFields = () => {
    let isValid = true;

    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter a customer name');
      isValid = false;
    }

    if (!masterNumber.trim()) {
      Alert.alert('Error', 'Please enter a master number');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (savedAsDraft: boolean = false) => {
    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        customerName: customerName.trim(),
        masterNumber: masterNumber.trim(),
        inspectorId: user?.id,
        inspectorName: user?.displayName || 'Unknown',
        savedAsDraft
      };
      
      const createdOrder = await createOrder(orderData);

      if (savedAsDraft) {
        Alert.alert('Success', 'Order saved as draft');
        router.push('/(tabs)');
      } else {
        router.push(`/inspection/station1/${createdOrder.id}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create inspection order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'New Inspection',
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
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Order Information</Text>
            <Text style={styles.sectionDescription}>
              Enter the basic information about this inspection order
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter customer name"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Master Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter master number"
                value={masterNumber}
                onChangeText={setMasterNumber}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Inspector</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={user?.displayName || 'Current User'}
                editable={false}
              />
              <Text style={styles.helpText}>
                Using logged-in user as inspector
              </Text>
            </View>
          </View>

          <View style={styles.processContainer}>
            <Text style={styles.processTitle}>Inspection Process</Text>
            
            <View style={styles.processStep}>
              <View style={[styles.stepIcon, styles.activeStepIcon]}>
                <Text style={styles.stepIconText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Create Order</Text>
                <Text style={styles.stepDescription}>Enter order details and create an inspection</Text>
              </View>
            </View>
            
            <View style={[styles.stepConnector, styles.inactiveConnector]} />
            
            <View style={styles.processStep}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Device Details</Text>
                <Text style={styles.stepDescription}>Enter device information and condition</Text>
              </View>
            </View>
            
            <View style={[styles.stepConnector, styles.inactiveConnector]} />
            
            <View style={styles.processStep}>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Device Photos</Text>
                <Text style={styles.stepDescription}>Capture photos of each device</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small\" color={Colors.white} />
            ) : (
              <>
                <PlusCircle size={20} color={Colors.white} style={styles.submitButtonIcon} />
                <Text style={styles.submitButtonText}>Continue</Text>
              </>
            )}
          </TouchableOpacity>
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
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
    marginBottom: 8,
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
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
  processContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 100,
  },
  processTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.gray[900],
    marginBottom: 16,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeStepIcon: {
    backgroundColor: Colors.primary,
  },
  stepIconText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.white,
  },
  stepContent: {
    flex: 1,
    paddingVertical: 4,
  },
  stepTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.gray[900],
    marginBottom: 2,
  },
  stepDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.gray[600],
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: Colors.primary,
    marginLeft: 15,
    marginVertical: 4,
  },
  inactiveConnector: {
    backgroundColor: Colors.gray[300],
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
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.gray[700],
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 12,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray[400],
  },
  submitButtonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
});