import { Meal, Review, Order, OrderItem, CartItem, OrderStatus, User, MealSlot, Address } from '../types';
import { 
    getManagedMeals, 
    getAllOrders,
    getOrderById,
    getReviewsForMeal,
    getReviewsByUserId,
    addReview,
    addOrder,
    getUserOrders,
    setOrderStatus,
    setOrderLocation
} from './configService'; 

// Simulate API delay
const simulateDelay = <T,>(data: T, delay: number = 300): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(data), delay));
};


export const fetchMeals = async (): Promise<Meal[]> => {
  const meals = getManagedMeals(); 
  return simulateDelay([...meals]); 
};

export const fetchMealById = async (id: string): Promise<Meal | null> => {
  const meals = getManagedMeals(); 
  const meal = meals.find(m => m.id === id) || null;
  return simulateDelay(meal ? { ...meal } : null);
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const orders = getAllOrders();
  return simulateDelay(orders);
};

export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  const order = getOrderById(orderId);
  return simulateDelay(order);
}

export const fetchReviewsForMeal = async (mealId: string): Promise<Review[]> => {
  const reviews = getReviewsForMeal(mealId);
  return simulateDelay(reviews);
};

export const fetchReviewsByUserId = async (userId: string): Promise<Review[]> => {
  const reviews = getReviewsByUserId(userId);
  return simulateDelay(reviews);
};


export const submitReview = async (
  userId: string,
  userName: string, 
  mealId: string, 
  orderItemId: string, 
  rating: number,
  comment: string
): Promise<Review> => {
  const newReview = addReview(userId, userName, mealId, orderItemId, rating, comment);
  return simulateDelay(newReview);
};


export const saveOrder = async (
  currentUser: User,
  cartItems: CartItem[],
  totalAmount: number,
  mealSlot: MealSlot,
  deliveryDate: string, // ISO string
  deliveryWindowDisplay: string,
  destinationAddress?: Address 
): Promise<Order> => {
  const newOrder = addOrder(currentUser, cartItems, totalAmount, mealSlot, deliveryDate, deliveryWindowDisplay, destinationAddress);
  return simulateDelay(newOrder);
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const userOrders = getUserOrders(userId);
  return simulateDelay(userOrders);
};

export const updateOrderStatus = async (
  orderId: string, 
  newStatus: OrderStatus, 
  newLocation?: { lat: number; lng: number } // Optional: for setting initial out-for-delivery location
): Promise<Order | null> => {
  const updatedOrder = setOrderStatus(orderId, newStatus, newLocation);
  return simulateDelay(updatedOrder);
};

// This function is for the map simulation to update locations frequently
// It might not persist to localStorage every tick to avoid churn, 
// but will update the in-memory data.
export const updateOrderLocation = async (
  orderId: string,
  newOrderLocation: { lat: number; lng: number },
  newDeliveryPersonLocation?: { lat: number; lng: number }
): Promise<Order | null> => {
  const updatedOrder = setOrderLocation(orderId, newOrderLocation, newDeliveryPersonLocation);
  return simulateDelay(updatedOrder); // Return the updated order for UI
};
