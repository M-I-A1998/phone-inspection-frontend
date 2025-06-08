// API functions for order operations
const API_BASE = process.env.REACT_APP_API_URL;

// Reset mock orders to empty array
let mockOrders = [];

// Get next order number
const getNextOrderNumber = (): string => {
  const numbers = mockOrders.map(order => {
    const match = order.orderNumber.match(/ORD-(\d+)/);
    return match ? parseInt(match[1]) : 0;
  });
  
  const maxNumber = Math.max(...numbers, 0);
  const nextNumber = (maxNumber + 1).toString().padStart(4, '0');
  return `ORD-${nextNumber}`;
};

// Get all orders
export const fetchOrders = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE}/orders`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock data
    return mockOrders;
  }
};

// Get order by ID or order number
export const getOrderById = async (idOrNumber: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/orders/${idOrNumber}`);
    if (!response.ok) {
      throw new Error(`Order not found: ${idOrNumber}`);
    }
    
    // Check if the response is JSON before attempting to parse it
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid response format: Expected JSON');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock data
    const order = mockOrders.find(o => 
      o.id === idOrNumber || o.orderNumber === idOrNumber
    );
    
    if (!order) {
      throw new Error(`Order not found: ${idOrNumber}`);
    }
    
    return order;
  }
};

// Delete order by ID
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete order');
    }
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock deletion
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }
    mockOrders = mockOrders.filter(o => o.id !== orderId);
  }
};

// Check if label number exists
export const checkLabelNumberExists = async (labelNumber: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/orders/check-label/${labelNumber}`);
    if (!response.ok) {
      throw new Error('Failed to check label number');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock check
    return mockOrders.some(order => order.labelNumber === labelNumber);
  }
};

// Create a new order
export const createOrder = async (orderData: any): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      throw new Error('Failed to create order');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock creation
    if (orderData.labelNumber) {
      const labelNumberExists = await checkLabelNumberExists(orderData.labelNumber);
      if (labelNumberExists) {
        throw new Error('Label number already exists');
      }
    }
    
    const newOrderId = `ord${Date.now().toString().substring(9)}`;
    const orderNumber = getNextOrderNumber();
    
    const newOrder = {
      id: newOrderId,
      orderNumber,
      customerName: orderData.customerName,
      inspectionDate: new Date().toISOString().split('T')[0],
      deviceCount: 0,
      labelNumber: orderData.labelNumber,
      inspectorId: orderData.inspectorId,
      inspectorName: orderData.inspectorName,
      status: orderData.savedAsDraft ? 'Draft' : 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
      savedAsDraft: orderData.savedAsDraft || false
    };
    
    mockOrders.push(newOrder);
    return newOrder;
  }
};

// Save order as draft
export const saveOrderAsDraft = async (orderId: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}/draft`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ savedAsDraft: true }),
    });
    if (!response.ok) {
      throw new Error('Failed to save order as draft');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock draft save
    const orderIndex = mockOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error('Order not found');
    }
    
    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      status: 'Draft',
      savedAsDraft: true
    };
    
    return mockOrders[orderIndex];
  }
};

// Export order report
export const exportOrderReport = async (orderId: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}/export`);
    if (!response.ok) {
      throw new Error('Failed to export report');
    }
    const data = await response.json();
    return data.reportUrl;
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to mock report URL
    return 'https://example.com/reports/order-' + orderId + '.pdf';
  }
};