// devices.ts — fully updated

const BASE_URL = 'https://api.astorainspect.com';

// ✅ Submit Device Details
export const submitDeviceDetails = async (deviceData: any) => {
  const backendPayload = {
    imei: deviceData.imei,
    serial_number: deviceData.serialNumber,
    brand: deviceData.brand,
    model: deviceData.model,
    conditions: deviceData.conditions,
    order_id: deviceData.orderId,
    inspector_name: deviceData.inspectorName,
    inspection_date: deviceData.inspectionDate,
  };

  const res = await fetch(`${BASE_URL}/devices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backendPayload),
  });

  if (!res.ok) {
    throw new Error('Failed to submit device details');
  }

  return await res.json();
};

// ✅ Upload device photo (correct upload route)
export const uploadDeviceImage = async (
  deviceId: string,
  type: 'front' | 'back',
  imageUri: string
) => {
  const formData = new FormData();
  formData.append('image', {
    uri: imageUri,
    name: `${type}.jpg`,
    type: 'image/jpeg',
  } as any);

  const res = await fetch(`${BASE_URL}/upload/${deviceId}/${type}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload device photo');
  }

  return await res.json();
};

// ✅ Get Devices By Order ID (used for Station 2)
export const getDevicesByOrderId = async (orderId: string) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/devices`);
  if (!res.ok) {
    throw new Error('Failed to fetch devices');
  }
  return await res.json();
};

// ✅ Device Search (new backend search route)
export const searchDevices = async (query: string) => {
  const res = await fetch(`${BASE_URL}/devices/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error('Failed to search devices');
  }
  return await res.json();
};
