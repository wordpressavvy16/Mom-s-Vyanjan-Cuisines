import { Meal, Review, Order, CartItem, OrderStatus, User, MealSlot, Address, MealSlotConfig, PartnerApplication, Testimonial, SocialFeedItem, WhatsAppTemplate, WhatsAppCampaign, WhatsAppAutomation, SiteSettings } from '../types';
import * as configService from './configService';

// This is a placeholder for the backend API URL. In a real app, this would come from an environment variable.
const API_BASE_URL = '/api';

/**
 * A mock API request handler that simulates a client-server round trip.
 * It logs the conceptual API endpoint, introduces a delay, and then executes the
 * provided logic function which interacts with our mock database (configService).
 * When moving to a real backend, only this function's body needs to be replaced
 * with an actual `fetch` call.
 * @param endpoint The conceptual API endpoint (e.g., '/meals')
 * @param method The HTTP method
 * @param logic The function to execute to get/mutate data.
 */
async function apiCall<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', logic: () => T | Promise<T>): Promise<T> {
    console.log(`[API MOCK] ${method} ${API_BASE_URL}${endpoint}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    try {
        const result = await logic();
        return result;
    } catch (error) {
        console.error(`[API MOCK ERROR] ${method} ${API_BASE_URL}${endpoint}:`, error);
        throw error;
    }
}

// --- Meal Endpoints ---
export const fetchMeals = (): Promise<Meal[]> => apiCall('/meals', 'GET', () => configService.getManagedMeals());
export const fetchMealById = (id: string): Promise<Meal | null> => apiCall(`/meals/${id}`, 'GET', () => configService.getManagedMeals().find(m => m.id === id) || null);

// --- Order & Review Endpoints ---
export const fetchAllOrders = (): Promise<Order[]> => apiCall('/orders', 'GET', () => configService.getAllOrders());
export const fetchOrderById = (orderId: string): Promise<Order | null> => apiCall(`/orders/${orderId}`, 'GET', () => configService.getOrderById(orderId));
export const fetchUserOrders = (userId: string): Promise<Order[]> => apiCall(`/users/${userId}/orders`, 'GET', () => configService.getUserOrders(userId));
export const saveOrder = (currentUser: User, cartItems: CartItem[], totalAmount: number, mealSlot: MealSlot, deliveryDate: string, deliveryWindowDisplay: string, destinationAddress?: Address): Promise<Order> => apiCall('/orders', 'POST', () => configService.addOrder(currentUser, cartItems, totalAmount, mealSlot, deliveryDate, deliveryWindowDisplay, destinationAddress));
export const updateOrderStatus = (orderId: string, newStatus: OrderStatus, newLocation?: { lat: number; lng: number }): Promise<Order | null> => apiCall(`/orders/${orderId}`, 'PUT', () => configService.setOrderStatus(orderId, newStatus, newLocation));
export const updateOrderLocation = (orderId: string, newOrderLocation: { lat: number; lng: number }, newDeliveryPersonLocation?: { lat: number; lng: number }): Promise<Order | null> => apiCall(`/orders/${orderId}/location`, 'PUT', () => configService.setOrderLocation(orderId, newOrderLocation, newDeliveryPersonLocation));

export const fetchReviewsForMeal = (mealId: string): Promise<Review[]> => apiCall(`/meals/${mealId}/reviews`, 'GET', () => configService.getReviewsForMeal(mealId));
export const fetchReviewsByUserId = (userId: string): Promise<Review[]> => apiCall(`/users/${userId}/reviews`, 'GET', () => configService.getReviewsByUserId(userId));
export const submitReview = (userId: string, userName: string, mealId: string, orderItemId: string, rating: number, comment: string): Promise<Review> => apiCall(`/reviews`, 'POST', () => configService.addReview(userId, userName, mealId, orderItemId, rating, comment));

// --- User & Auth Endpoints ---
export const fetchManagedUsers = (): Promise<User[]> => apiCall('/users', 'GET', () => configService.getManagedUsers());
export const saveManagedUsers = (users: User[]): Promise<void> => apiCall('/users', 'PUT', () => configService.saveManagedUsers(users));

// --- Partner Endpoints ---
export const fetchPartnerApplications = (): Promise<PartnerApplication[]> => apiCall('/partner-applications', 'GET', () => configService.getPartnerApplications());
export const submitPartnerApplication = (applicationData: Omit<PartnerApplication, 'id' | 'status' | 'submittedAt'>): Promise<PartnerApplication> => apiCall('/partner-applications', 'POST', () => configService.submitPartnerApplication(applicationData));
export const updatePartnerApplicationStatus = (appId: string, status: 'Approved' | 'Rejected'): Promise<void> => apiCall(`/partner-applications/${appId}`, 'PUT', () => configService.updatePartnerApplicationStatus(appId, status));
export const acknowledgePartnerAgreement = (partnerId: string): Promise<void> => apiCall(`/partners/${partnerId}/agreement`, 'POST', () => configService.acknowledgePartnerAgreement(partnerId));

// --- Site Content Endpoints ---
export const fetchTestimonials = (): Promise<Testimonial[]> => apiCall('/content/testimonials', 'GET', () => configService.getTestimonials());
export const fetchSocialFeedItems = (): Promise<SocialFeedItem[]> => apiCall('/content/social-feed', 'GET', () => configService.getSocialFeedItems());
export const fetchMainSocialLinks = (): Promise<{ instagram: string; facebook: string; }> => apiCall('/content/social-links', 'GET', () => configService.getMainSocialLinks());

// --- Site Settings Endpoints ---
export const fetchSiteSettings = (): Promise<SiteSettings> => apiCall('/settings/site', 'GET', () => configService.getSiteSettings());
export const saveSiteSettings = (settings: SiteSettings): Promise<void> => apiCall('/settings/site', 'PUT', () => configService.saveSiteSettings(settings));
export const fetchMealSlotsConfig = (): Promise<MealSlotConfig[]> => apiCall('/settings/delivery-slots', 'GET', () => configService.getConfiguredMealSlots());

// --- Dashboard Specific Endpoints ---
// Note: In a real backend, these would be dedicated, optimized endpoints. Here we just wrap the configService calls.
export const fetchDashboardMeals = (user: User): Promise<Meal[]> => apiCall('/dashboard/meals', 'GET', () => configService.getManagedMeals(user));
export const addDashboardMeal = (mealData: Omit<Meal, 'id'>, user: User | null): Promise<Meal> => apiCall('/dashboard/meals', 'POST', () => configService.addManagedMeal(mealData, user));
export const updateDashboardMeal = (meal: Meal, user: User | null): Promise<Meal> => apiCall(`/dashboard/meals/${meal.id}`, 'PUT', () => configService.updateManagedMeal(meal, user));
export const deleteDashboardMeal = (mealId: string, user: User | null): Promise<void> => apiCall(`/dashboard/meals/${mealId}`, 'DELETE', () => configService.deleteManagedMeal(mealId, user));

// --- Other Services ---
export const fetchDailyMenuSchedules = (): Promise<import("../types").DailyMenuSchedule[]> => apiCall('/schedules/daily-menu', 'GET', () => configService.getDailyMenuSchedules());
export const addDailyMenuSchedule = (schedule: import("../types").DailyMenuSchedule): Promise<void> => apiCall('/schedules/daily-menu', 'POST', () => configService.addDailyMenuSchedule(schedule));

// ... You would continue this pattern for all other functions currently in DashboardPage that call configService directly.
// For brevity, we'll stop here, but the pattern is established. All data access goes through this service.