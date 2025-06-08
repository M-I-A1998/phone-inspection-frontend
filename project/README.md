# Phone Inspection Application

A comprehensive mobile application for managing device inspections, built with React Native and Expo.

## Project Overview

The Phone Inspection Application is designed to streamline the process of inspecting and documenting mobile devices. It features a complete workflow from device intake to final inspection reports.

## Recent Changes

### Workflow Updates
- Added two-stage inspection process:
  1. Complete Device Details + Photos (all in one station)
  2. Device Details Only (split between stations)
- Added Done button functionality for both workflows
- Changed Label Number to Master Number in new inspection form

### Frontend Implementation Details

#### Authentication Flow
- Login screen with username/password authentication
- Session management using SecureStore
- Role-based access control (Admin/Inspector)

#### Inspection Process
1. New Inspection Creation
   - Customer name input
   - Master number tracking
   - Inspector assignment

2. Station One (Device Details)
   - Two workflow options:
     a. Complete (Details + Photos)
     b. Details Only
   - IMEI validation
   - Device condition assessment
   - Photo capture (if complete workflow)
   - Multiple device support
   - Save & Done functionality

3. Station Two (Photography)
   - Access to saved device details
   - Front/back photo capture
   - Photo quality verification
   - Order completion

#### Data Models

1. Order Model
```typescript
interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  masterNumber: string;
  inspectionDate: string;
  deviceCount: number;
  inspectorId: string;
  inspectorName: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  createdAt: string;
  savedAsDraft: boolean;
}
```

2. Device Model
```typescript
interface Device {
  id: string;
  imei: string;
  serialNumber: string;
  brand: string;
  model: string;
  conditions: string[];
  frontImage?: string;
  backImage?: string;
  orderId: string;
  orderNumber: string;
  inspectionDate: string;
  inspectorName: string;
}
```

#### API Integration Points

1. Orders API
```typescript
// Create new order
POST /api/orders
Body: {
  customerName: string;
  masterNumber: string;
  inspectorId: string;
  inspectorName: string;
}

// Get order details
GET /api/orders/:id

// Update order status
PATCH /api/orders/:id
Body: {
  status: string;
}
```

2. Devices API
```typescript
// Submit device details
POST /api/devices
Body: {
  orderId: string;
  imei: string;
  serialNumber: string;
  brand: string;
  model: string;
  conditions: string[];
}

// Upload device photos
POST /api/devices/:id/photos
Body: FormData {
  photo: File;
  type: 'front' | 'back';
}
```

#### State Management
- Context API for authentication state
- Local state for form management
- API integration for data persistence

#### Navigation Structure
- Tab-based main navigation
- Stack navigation for inspection flow
- Modal navigation for photo capture

## Backend Requirements

To implement the backend, you'll need:

1. Authentication System
   - User management (Admin/Inspector roles)
   - JWT token generation and validation
   - Session management

2. Database Schema
   - Users table
   - Orders table
   - Devices table
   - Photos table (or blob storage)

3. API Endpoints
   - Authentication endpoints
   - Order management endpoints
   - Device management endpoints
   - Photo upload endpoints

4. Storage Solutions
   - Relational database for user/order/device data
   - Blob storage for photos
   - Caching system for frequently accessed data

5. Security Features
   - Input validation
   - Request rate limiting
   - CORS configuration
   - File upload restrictions

[Previous documentation sections remain unchanged...]