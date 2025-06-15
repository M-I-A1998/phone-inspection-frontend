// orders.ts — Final Fully Updated Version

const BASE_URL = 'https://api.astorainspect.com';

// ✅ Create a new Order
export const createOrder = async (orderData: any) => {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: orderData.customerName,
      masterNumber: orderData.masterNumber,
      inspectorId: orderData.inspectorId,
      inspectorName: orderData.inspectorName,
      savedAsDraft: orderData.savedAsDraft || false,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to create order');
  }

  return await res.json();
};

// ✅ Fetch all orders (now includes device_count!)
export const fetchOrders = async () => {
  const res = await fetch(`${BASE_URL}/orders`);
  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }
  return await res.json();
};

// ✅ Get order by ID
export const getOrderById = async (orderId: string) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`);
  if (!res.ok) {
    throw new Error('Failed to fetch order');
  }
  return await res.json();
};

// ✅ Delete order
export const deleteOrder = async (orderId: string) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete order');
  }

  return await res.json();
};

// ✅ Export Excel report for an order
export const exportOrderReport = async (orderId: string) => {
  const res = await fetch(`${BASE_URL}/export/${orderId}`);
  if (!res.ok) {
    throw new Error('Failed to export report');
  }

  return await res.json();
};

// ✅ Update Order Status (used by your "Done" button)
export const updateOrderStatus = async (orderId: string, status: string) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error('Failed to update order status');
  }

  return await res.json();
};
