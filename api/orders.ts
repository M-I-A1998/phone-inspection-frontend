// orders.ts — fully updated

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

// ✅ Get all orders
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

// ✅ Delete order (fully working now)
export const deleteOrder = async (orderId: string) => {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete order');
  }

  return await res.json();
};

// ✅ Export Excel report for an order (if needed)
export const exportOrderReport = async (orderId: string) => {
  const res = await fetch(`${BASE_URL}/export/${orderId}`);
  if (!res.ok) {
    throw new Error('Failed to export report');
  }

  return await res.json();
};