// API functions for device operations
const API_BASE = process.env.REACT_APP_API_URL;

// Mocked device data (simulate database)
let mockDevices = [];

// Search devices by IMEI, Serial, Order Number, or Label Number
export const searchDevices = async (query: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE}/devices/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search devices');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock data
    const normalizedQuery = query.toLowerCase().trim();
    return mockDevices.filter(device => 
      device.imei.toLowerCase().includes(normalizedQuery) ||
      device.serialNumber.toLowerCase().includes(normalizedQuery) ||
      device.orderId.toLowerCase().includes(normalizedQuery) ||
      (device.orderNumber && device.orderNumber.toLowerCase().includes(normalizedQuery)) ||
      (device.labelNumber && device.labelNumber.toLowerCase().includes(normalizedQuery))
    );
  }
};

// Get device by ID
export const getDeviceById = async (id: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/devices/${id}`);
    if (!response.ok) {
      throw new Error('Device not found');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock data
    const device = mockDevices.find(d => d.id === id);
    if (!device) {
      throw new Error('Device not found');
    }
    return device;
  }
};

// Get devices by order ID
export const getDevicesByOrderId = async (orderId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE}/devices/order/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch devices');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock data
    return mockDevices.filter(device => device.orderId === orderId);
  }
};

// IMEI lookup

export const lookupImei = async (imei: string) => {
  const res = await fetch(`${API_BASE}/lookup-imei/${imei}`);
  if (!res.ok) throw new Error('Lookup failed');
  const data = await res.json();
  return data; // Includes history_id and message
};

export const fetchImeiResultByHistoryId = async (historyId: number) => {
  const res = await fetch(`${API_BASE}/get-imei-result/${historyId}`);
  if (!res.ok) throw new Error('Result not ready');
  return res.json();
};



// Submit device details (Station 1)
export const submitDeviceDetails = async (deviceData: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/devices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deviceData),
    });
    if (!response.ok) {
      throw new Error('Failed to submit device details');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock creation
    const newDeviceId = `dev${Date.now().toString().substring(9)}`;
    const newDevice = {
      id: newDeviceId,
      ...deviceData,
      inspectionDate: new Date().toISOString().split('T')[0],
    };
    
    // Add to mock devices array
    mockDevices.push(newDevice);
    return newDevice;
  }
};

// Upload device image (Station 2)
export const uploadDeviceImage = async (deviceId: string, photoType: 'front' | 'back', imageUri: string): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('photo', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `${deviceId}_${photoType}.jpg`,
    });

    const response = await fetch(`${API_BASE}/devices/${deviceId}/photos/${photoType}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Update mock device with image
    const deviceIndex = mockDevices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
      mockDevices[deviceIndex] = {
        ...mockDevices[deviceIndex],
        [`${photoType}Image`]: imageUri,
      };
    }
    
    return {
      success: true,
      deviceId,
      photoType,
      imageUrl: imageUri,
    };
  }
};