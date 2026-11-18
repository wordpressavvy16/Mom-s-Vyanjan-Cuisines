import { Meal, Review, Order, CartItem, OrderStatus, User, MealSlot, Address } from '../types';
import * as apiService from './apiService';

export const fetchMeals = async (): Promise<Meal[]> => apiService.fetchMeals();

export const fetchMealById = async (id: string): Promise<Meal | null> => apiService.fetchMealById(id);

export const fetchAllOrders = async (): Promise<Order[]> => apiService.fetchAllOrders();

export const fetchOrderById = async (orderId: string): Promise<Order | null> => apiService.fetchOrderById(orderId);

export const fetchReviewsForMeal = async (mealId: string): Promise<Review[]> => apiService.fetchReviewsForMeal(mealId);

export const fetchReviewsByUserId = async (userId: string): Promise<Review[]> => apiService.fetchReviewsByUserId(userId);

export const submitReview = async (
  userId: string,
  userName: string,
  mealId: string,
  orderItemId: string,
  rating: number,
  comment: string
): Promise<Review> => apiService.submitReview(userId, userName, mealId, orderItemId, rating, comment);

export const saveOrder = async (
  currentUser: User,
  cartItems: CartItem[],
  totalAmount: number,
  mealSlot: MealSlot,
  deliveryDate: string,
  deliveryWindowDisplay: string,
  destinationAddress?: Address
): Promise<Order> =>
  apiService.saveOrder(
    currentUser,
    cartItems,
    totalAmount,
    mealSlot,
    deliveryDate,
    deliveryWindowDisplay,
    destinationAddress
  );

export const fetchUserOrders = async (userId: string): Promise<Order[]> => apiService.fetchUserOrders(userId);

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus,
  newLocation?: { lat: number; lng: number }
): Promise<Order | null> => apiService.updateOrderStatus(orderId, newStatus, newLocation);

export const updateOrderLocation = async (
  orderId: string,
  newOrderLocation: { lat: number; lng: number },
  newDeliveryPersonLocation?: { lat: number; lng: number }
): Promise<Order | null> =>
  apiService.updateOrderLocation(orderId, newOrderLocation, newDeliveryPersonLocation);
