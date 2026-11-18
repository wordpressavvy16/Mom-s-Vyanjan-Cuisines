

import { DietaryPreference, Review, Order, UserRole, OrderStatus, MealSlot } from './types';


export const DIETARY_OPTIONS: DietaryPreference[] = [
  DietaryPreference.VEGETARIAN,
  DietaryPreference.VEGAN,
  DietaryPreference.GLUTEN_FREE,
  DietaryPreference.LOW_CARB,
  DietaryPreference.HIGH_PROTEIN,
];

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash';
const GEMINI_IMAGE_MODEL_NAME = 'imagen-3.0-generate-002'; // Removed export


// These will be managed by mockDataService.ts, initialized from localStorage
// Adding more sample reviews
const MOCK_REVIEWS_DB: Review[] = [ // Removed export
    { id: 'r1', orderItemId: 'o1i1-meal1', mealId: '1', userId: 'u1', userName: 'Alice', rating: 5, comment: 'Absolutely delicious! Best Paneer Butter Masala I\'ve had.', timestamp: new Date('2023-10-26') },
    { id: 'r2', orderItemId: 'o1i2-meal1', mealId: '1', userId: 'u2', userName: 'Bob', rating: 4, comment: 'Very creamy and flavorful. A bit too mild for my taste though.', timestamp: new Date('2023-10-25') },
    { id: 'r3', orderItemId: 'o2i1-meal2', mealId: '2', userId: 'u3', userName: 'Carol', rating: 5, comment: 'So hearty and satisfying! Perfect vegan comfort food.', timestamp: new Date('2023-10-24') },
    { id: 'r4', orderItemId: 'o3i1-meal3', mealId: '3', userId: 'u1', userName: 'Alice', rating: 4, comment: 'Great chana masala, good spice level.', timestamp: new Date('2023-11-01') },
    { id: 'r5', orderItemId: 'o3i2-meal3', mealId: '3', userId: 'u4', userName: 'David', rating: 5, comment: 'Authentic taste, loved it!', timestamp: new Date('2023-10-30') },
    { id: 'r6', orderItemId: 'o4i1-meal-partner', mealId: 'default-partner-meal-1', userId: 'u1', userName: 'Alice', rating: 5, comment: 'Partner meal was excellent!', timestamp: new Date('2023-11-05') },
];

// Adding sample orders
const MOCK_ORDERS_DB: Order[] = [ // Removed export
  {
    id: 'sample-order-1',
    userId: 'mockUserId', // Test User
    items: [
      { 
        id: '1', name: 'Paneer Butter Masala Delight', description: 'Creamy paneer curry', price: 12.99, imageUrl: 'https://picsum.photos/seed/paneer/400/300', category: 'Main Course', ingredients: ['Paneer'], dietaryTags: [DietaryPreference.VEGETARIAN], partnerId: undefined,
        orderItemId: 'o1i1-meal1', quantity: 1, priceAtPurchase: 12.99, selectedPortionSize: 'Regular', selectedSpiceLevel: 'Mild'
      },
    ],
    totalAmount: 12.99,
    orderDate: new Date('2023-11-01T10:00:00Z'),
    status: OrderStatus.DELIVERED,
    mealSlot: MealSlot.LUNCH,
    deliveryDate: '2023-11-01',
    deliveryWindowDisplay: 'Today - Lunch (1:00 PM - 3:00 PM)',
    paymentTransactionId: 'txn-sample-1',
    destinationAddress: { id: 'addr1', street: '123 Main St', city: 'UserCity', zipCode: '90001', isDefault: true},
    destinationCoordinates: { lat: 34.0522, lng: -118.2437 }
  },
  {
    id: 'sample-order-2',
    userId: 'adminUserId', // Admin User
    items: [
      { 
        id: '2', name: 'Vegan Lentil Shepherd\'s Pie', description: 'Hearty lentils and vegetables', price: 14.50, imageUrl: 'https://picsum.photos/seed/veganpie/400/300', category: 'Main Course', ingredients: ['Lentils'], dietaryTags: [DietaryPreference.VEGAN], partnerId: undefined,
        orderItemId: 'o2i1-meal2', quantity: 2, priceAtPurchase: 14.50 
      },
    ],
    totalAmount: 29.00,
    orderDate: new Date('2023-11-02T14:30:00Z'),
    status: OrderStatus.CONFIRMED,
    mealSlot: MealSlot.DINNER,
    deliveryDate: '2023-11-02',
    deliveryWindowDisplay: 'Today - Dinner (8:00 PM - 10:00 PM)',
    paymentTransactionId: 'txn-sample-2',
    destinationAddress: { id: 'addr2', street: '456 Admin Ave', city: 'AdminCity', zipCode: '90002', isDefault: true},
    destinationCoordinates: { lat: 34.0550, lng: -118.2500 }
  },
   {
    id: 'sample-order-3-partner',
    userId: 'mockUserId', // Test User
    items: [
      { 
        id: 'default-partner-meal-1', name: 'Partner Special: Chicken Biryani', description: 'Partner meal', price: 15.99, imageUrl: 'https://picsum.photos/seed/biryani/400/300', category: 'Main Course', ingredients: ['Chicken', 'Rice'], dietaryTags: [], partnerId: 'partnerUserIdExample',
        orderItemId: 'o4i1-meal-partner', quantity: 1, priceAtPurchase: 15.99, selectedPortionSize: 'Large'
      },
    ],
    totalAmount: 15.99,
    orderDate: new Date('2023-11-05T12:00:00Z'),
    status: OrderStatus.OUT_FOR_DELIVERY,
    mealSlot: MealSlot.LUNCH,
    deliveryDate: '2023-11-05',
    deliveryWindowDisplay: 'Today - Lunch (1:00 PM - 3:00 PM)',
    paymentTransactionId: 'txn-sample-3',
    destinationAddress: { id: 'addr3', street: '789 Partner Way', city: 'UserCity', zipCode: '90003', isDefault: false},
    destinationCoordinates: { lat: 34.0500, lng: -118.2400 },
    currentLocation: { lat: 34.0300, lng: -118.2000 }, // Example current location for out for delivery
    deliveryPerson: { id: 'dp-sample-1', name: 'Raju Bhai', vehicle: 'Scooter', currentLocation: { lat: 34.0300, lng: -118.2000 } }
  }
];



// MEAL_SLOTS_CONFIG and MOCK_MEALS are removed.
// They will be loaded from configService.ts which handles localStorage.

// Re-export MOCK_REVIEWS_DB and MOCK_ORDERS_DB for mockDataService.ts if it needs them directly
// If mockDataService only uses them as defaults and doesn't need to re-export, these can stay unexported.
// For this change, we assume mockDataService.ts will import them correctly as constants.
export { MOCK_REVIEWS_DB as DEFAULT_MOCK_REVIEWS_DB_CONST, MOCK_ORDERS_DB as DEFAULT_MOCK_ORDERS_DB_CONST };