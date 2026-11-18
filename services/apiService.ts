import {
  Meal,
  Review,
  Order,
  CartItem,
  OrderStatus,
  User,
  MealSlot,
  Address,
  MealSlotConfig,
  PartnerApplication,
  Testimonial,
  SocialFeedItem,
  SiteSettings,
  DailyMenuSchedule,
} from '../types';
import * as configService from './configService';
import * as appwriteService from './appwriteService';
import { getAppwriteJwt } from './appwriteClient';

class ServerNotConfiguredError extends Error {
  constructor() {
    super('SERVER_APPWRITE_NOT_CONFIGURED');
  }
}

async function serverApiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; requireAuth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const jwt = await getAppwriteJwt();
  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  } else if (options.requireAuth) {
    throw new ServerNotConfiguredError();
  }

  const res = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 503) {
    const data = await res.json().catch(() => ({}));
    if (data.error === 'SERVER_APPWRITE_NOT_CONFIGURED') {
      throw new ServerNotConfiguredError();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

async function withServerOrFallback<T>(
  scope: string,
  serverCall: () => Promise<T>,
  appwriteCall: () => Promise<T>,
  fallbackCall: () => T | Promise<T>,
  shouldFallback?: (result: T) => boolean
): Promise<T> {
  try {
    return await serverCall();
  } catch (err: any) {
    // Enforce authorization denials — never bypass 401/403 RBAC errors
    if (err?.status === 401 || err?.status === 403) {
      throw err;
    }
    if (!(err instanceof ServerNotConfiguredError)) {
      appwriteService.logAppwriteFallback(`${scope}:api`, err);
    }
  }

  try {
    const result = await appwriteCall();
    if (shouldFallback && shouldFallback(result)) {
      return await fallbackCall();
    }
    return result;
  } catch (error) {
    appwriteService.logAppwriteFallback(scope, error);
    return await fallbackCall();
  }
}

async function withAppwriteFallback<T>(
  scope: string,
  appwriteCall: () => Promise<T>,
  fallbackCall: () => T | Promise<T>,
  shouldFallback?: (result: T) => boolean
): Promise<T> {
  try {
    const result = await appwriteCall();
    if (shouldFallback && shouldFallback(result)) {
      return await fallbackCall();
    }
    return result;
  } catch (error) {
    appwriteService.logAppwriteFallback(scope, error);
    return await fallbackCall();
  }
}

// --- Meal Endpoints ---
export const fetchMeals = (): Promise<Meal[]> =>
  withAppwriteFallback(
    'meals.list',
    () => appwriteService.fetchMealsFromAppwrite(),
    () => configService.getManagedMeals(),
    (res) => res.length === 0 && configService.getManagedMeals().length > 0
  );

export const fetchMealById = (id: string): Promise<Meal | null> =>
  withAppwriteFallback(
    'meals.get',
    () => appwriteService.fetchMealByIdFromAppwrite(id),
    () => configService.getManagedMeals().find(m => m.id === id) || null,
    (res) => res === null
  );

// --- Order & Review Endpoints ---
export const fetchAllOrders = (): Promise<Order[]> =>
  withServerOrFallback(
    'orders.listAll',
    async () => {
      const orders = await serverApiFetch<any[]>('/api/orders', { requireAuth: true });
      return orders.map(o => ({ ...o, orderDate: new Date(o.orderDate) }));
    },
    () => appwriteService.fetchAllOrdersFromAppwrite(),
    () => configService.getAllOrders(),
    (res) => res.length === 0 && configService.getAllOrders().length > 0
  );

export const fetchOrderById = (orderId: string): Promise<Order | null> =>
  withServerOrFallback(
    'orders.get',
    async () => {
      const o = await serverApiFetch<any>(`/api/orders/${encodeURIComponent(orderId)}`, { requireAuth: true });
      return o ? { ...o, orderDate: new Date(o.orderDate) } : null;
    },
    () => appwriteService.fetchOrderByIdFromAppwrite(orderId),
    () => configService.getOrderById(orderId),
    (res) => res === null
  );

export const fetchUserOrders = (userId: string): Promise<Order[]> =>
  withServerOrFallback(
    'orders.listByUser',
    async () => {
      const orders = await serverApiFetch<any[]>('/api/orders', { requireAuth: true });
      return orders.map(o => ({ ...o, orderDate: new Date(o.orderDate) }));
    },
    () => appwriteService.fetchUserOrdersFromAppwrite(userId),
    () => configService.getUserOrders(userId),
    (res) => res.length === 0 && configService.getUserOrders(userId).length > 0
  );

export const saveOrder = (
  currentUser: User,
  cartItems: CartItem[],
  totalAmount: number,
  mealSlot: MealSlot,
  deliveryDate: string,
  deliveryWindowDisplay: string,
  destinationAddress?: Address
): Promise<Order> =>
  withServerOrFallback(
    'orders.create',
    async () => {
      const o = await serverApiFetch<any>('/api/orders', {
        method: 'POST',
        requireAuth: true,
        body: { cartItems, totalAmount, mealSlot, deliveryDate, deliveryWindowDisplay, destinationAddress },
      });
      return { ...o, orderDate: new Date(o.orderDate) };
    },
    () =>
      appwriteService.createOrderInAppwrite(
        currentUser,
        cartItems,
        totalAmount,
        mealSlot,
        deliveryDate,
        deliveryWindowDisplay,
        destinationAddress
      ),
    () =>
      configService.addOrder(
        currentUser,
        cartItems,
        totalAmount,
        mealSlot,
        deliveryDate,
        deliveryWindowDisplay,
        destinationAddress
      )
  );

export const updateOrderStatus = (
  orderId: string,
  newStatus: OrderStatus,
  newLocation?: { lat: number; lng: number }
): Promise<Order | null> =>
  withServerOrFallback(
    'orders.updateStatus',
    async () => {
      const o = await serverApiFetch<any>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT',
        requireAuth: true,
        body: { status: newStatus, newLocation },
      });
      return o ? { ...o, orderDate: new Date(o.orderDate) } : null;
    },
    () => appwriteService.updateOrderStatusInAppwrite(orderId, newStatus, newLocation),
    () => configService.setOrderStatus(orderId, newStatus, newLocation)
  );

export const updateOrderLocation = (
  orderId: string,
  newOrderLocation: { lat: number; lng: number },
  newDeliveryPersonLocation?: { lat: number; lng: number }
): Promise<Order | null> =>
  withServerOrFallback(
    'orders.updateLocation',
    async () => {
      const o = await serverApiFetch<any>(`/api/orders/${encodeURIComponent(orderId)}/location`, {
        method: 'PUT',
        requireAuth: true,
        body: { newOrderLocation, newDeliveryPersonLocation },
      });
      return o ? { ...o, orderDate: new Date(o.orderDate) } : null;
    },
    () => appwriteService.updateOrderLocationInAppwrite(orderId, newOrderLocation, newDeliveryPersonLocation),
    () => configService.setOrderLocation(orderId, newOrderLocation, newDeliveryPersonLocation)
  );

export const subscribeToOrder = (orderId: string, onUpdate: (order: Order) => void): (() => void) =>
  appwriteService.subscribeToOrderUpdates(orderId, onUpdate);

export const fetchReviewsForMeal = (mealId: string): Promise<Review[]> =>
  withAppwriteFallback(
    'reviews.listForMeal',
    () => appwriteService.fetchReviewsForMealFromAppwrite(mealId),
    () => configService.getReviewsForMeal(mealId),
    (res) => res.length === 0 && configService.getReviewsForMeal(mealId).length > 0
  );

export const fetchReviewsByUserId = (userId: string): Promise<Review[]> =>
  withAppwriteFallback(
    'reviews.listByUser',
    () => appwriteService.fetchReviewsByUserIdFromAppwrite(userId),
    () => configService.getReviewsByUserId(userId),
    (res) => res.length === 0 && configService.getReviewsByUserId(userId).length > 0
  );

export const submitReview = (
  userId: string,
  userName: string,
  mealId: string,
  orderItemId: string,
  rating: number,
  comment: string
): Promise<Review> =>
  withAppwriteFallback(
    'reviews.create',
    () => appwriteService.createReviewInAppwrite(userId, userName, mealId, orderItemId, rating, comment),
    () => configService.addReview(userId, userName, mealId, orderItemId, rating, comment)
  );

// --- User & Auth Endpoints ---
export const fetchManagedUsers = (): Promise<User[]> =>
  withServerOrFallback(
    'users.list',
    () => serverApiFetch<User[]>('/api/users', { requireAuth: true }),
    () => appwriteService.fetchUsersFromAppwrite(),
    () => configService.getManagedUsers(),
    (res) => res.length === 0 && configService.getManagedUsers().length > 0
  );

export const saveManagedUsers = async (users: User[]): Promise<void> => {
  configService.saveManagedUsers(users);
  try {
    for (const user of users) {
      await appwriteService.upsertAppwriteUserProfile(user);
    }
  } catch (error) {
    appwriteService.logAppwriteFallback('users.save', error);
  }
};

export const saveUserProfile = async (user: User): Promise<User> => {
  return withServerOrFallback(
    'users.upsertProfile',
    () =>
      serverApiFetch<User>('/api/users/me', {
        method: 'PUT',
        requireAuth: true,
        body: {
          firstName: user.firstName,
          lastName: user.lastName,
          profilePictureUrl: user.profilePictureUrl,
          dietaryPreferences: user.dietaryPreferences,
          savedAddresses: user.savedAddresses,
          whatsappNumber: user.whatsappNumber,
          bio: user.bio,
          birthday: user.birthday,
          serviceZipCodes: user.serviceZipCodes,
          agreementAcknowledged: user.agreementAcknowledged,
        },
      }),
    () => appwriteService.upsertAppwriteUserProfile(user),
    () => user
  );
};

// --- Partner Endpoints ---
export const fetchPartnerApplications = (): Promise<PartnerApplication[]> =>
  withServerOrFallback(
    'partnerApps.list',
    () => serverApiFetch<PartnerApplication[]>('/api/partner-applications', { requireAuth: true }),
    () => appwriteService.fetchPartnerApplicationsFromAppwrite(),
    () => configService.getPartnerApplications(),
    (res) => res.length === 0 && configService.getPartnerApplications().length > 0
  );

export const submitPartnerApplication = (
  applicationData: Omit<PartnerApplication, 'id' | 'status' | 'submittedAt'>
): Promise<PartnerApplication> =>
  withServerOrFallback(
    'partnerApps.create',
    () =>
      serverApiFetch<PartnerApplication>('/api/partner-applications', {
        method: 'POST',
        body: applicationData,
      }),
    () => appwriteService.createPartnerApplicationInAppwrite(applicationData),
    () => configService.submitPartnerApplication(applicationData)
  );

export const updatePartnerApplicationStatus = async (
  appId: string,
  status: 'Approved' | 'Rejected'
): Promise<void> => {
  configService.updatePartnerApplicationStatus(appId, status);
  await withServerOrFallback(
    'partnerApps.updateStatus',
    () =>
      serverApiFetch('/api/partner-applications/' + encodeURIComponent(appId) + '/status', {
        method: 'PUT',
        requireAuth: true,
        body: { status },
      }),
    () => appwriteService.updatePartnerApplicationStatusInAppwrite(appId, status),
    () => undefined
  );
};

export const acknowledgePartnerAgreement = async (partnerId: string): Promise<void> => {
  configService.acknowledgePartnerAgreement(partnerId);
  const updated = configService.getManagedUsers().find(u => u.id === partnerId);
  if (updated) {
    await saveUserProfile(updated);
  }
};

// --- Site Content Endpoints ---
export const fetchTestimonials = (): Promise<Testimonial[]> =>
  withAppwriteFallback(
    'testimonials.list',
    () => appwriteService.fetchTestimonialsFromAppwrite(),
    () => configService.getTestimonials(),
    (res) => res.length === 0 && configService.getTestimonials().length > 0
  );

export const fetchSocialFeedItems = (): Promise<SocialFeedItem[]> =>
  withAppwriteFallback(
    'socialFeed.list',
    () => appwriteService.fetchSocialFeedItemsFromAppwrite(),
    () => configService.getSocialFeedItems(),
    (res) => res.length === 0 && configService.getSocialFeedItems().length > 0
  );

export const fetchMainSocialLinks = (): Promise<{ instagram: string; facebook: string }> =>
  withAppwriteFallback(
    'socialLinks.get',
    async () => {
      const settingsDoc = await appwriteService.fetchSiteSettingsFromAppwrite();
      return settingsDoc?.mainSocialLinks || configService.getMainSocialLinks();
    },
    () => configService.getMainSocialLinks()
  );

// --- Site Settings Endpoints ---
export const fetchSiteSettings = (): Promise<SiteSettings> =>
  withAppwriteFallback(
    'siteSettings.get',
    async () => {
      const settingsDoc = await appwriteService.fetchSiteSettingsFromAppwrite();
      return settingsDoc?.siteSettings || configService.getSiteSettings();
    },
    () => configService.getSiteSettings()
  );

export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
  configService.saveSiteSettings(settings);
  await withServerOrFallback(
    'siteSettings.save',
    () =>
      serverApiFetch('/api/site-settings', {
        method: 'PUT',
        requireAuth: true,
        body: { siteSettings: settings, mainSocialLinks: configService.getMainSocialLinks() },
      }),
    () => appwriteService.saveSiteSettingsToAppwrite(settings, configService.getMainSocialLinks()),
    () => undefined
  );
};

export const fetchMealSlotsConfig = (): Promise<MealSlotConfig[]> =>
  withAppwriteFallback(
    'mealSlots.list',
    () => appwriteService.fetchMealSlotsFromAppwrite(),
    () => configService.getConfiguredMealSlots(),
    (res) => res.length === 0
  );

// --- Dashboard Specific Endpoints ---
export const fetchDashboardMeals = (user: User): Promise<Meal[]> =>
  withAppwriteFallback(
    'dashboardMeals.list',
    () => appwriteService.fetchMealsFromAppwrite(user),
    () => configService.getManagedMeals(user),
    (res) => res.length === 0 && configService.getManagedMeals(user).length > 0
  );

export const addDashboardMeal = (mealData: Omit<Meal, 'id'>, user: User | null): Promise<Meal> =>
  withServerOrFallback(
    'dashboardMeals.create',
    () =>
      serverApiFetch<Meal>('/api/meals', {
        method: 'POST',
        requireAuth: true,
        body: mealData,
      }),
    () => appwriteService.createMealInAppwrite(mealData, user),
    () => configService.addManagedMeal(mealData, user)
  );

export const updateDashboardMeal = (meal: Meal, user: User | null): Promise<Meal> =>
  withServerOrFallback(
    'dashboardMeals.update',
    () =>
      serverApiFetch<Meal>(`/api/meals/${encodeURIComponent(meal.id)}`, {
        method: 'PUT',
        requireAuth: true,
        body: meal,
      }),
    () => appwriteService.updateMealInAppwrite(meal),
    () => configService.updateManagedMeal(meal, user)
  );

export const deleteDashboardMeal = async (mealId: string, user: User | null): Promise<void> => {
  await withServerOrFallback(
    'dashboardMeals.delete',
    () =>
      serverApiFetch(`/api/meals/${encodeURIComponent(mealId)}`, {
        method: 'DELETE',
        requireAuth: true,
      }),
    () => appwriteService.deleteMealInAppwrite(mealId),
    () => {
      configService.deleteManagedMeal(mealId, user);
    }
  );
};

// --- Other Services ---
export const fetchDailyMenuSchedules = (): Promise<DailyMenuSchedule[]> =>
  withAppwriteFallback(
    'dailyMenus.list',
    () => appwriteService.fetchDailyMenuSchedulesFromAppwrite(),
    () => configService.getDailyMenuSchedules(),
    (res) => res.length === 0 && configService.getDailyMenuSchedules().length > 0
  );

export const addDailyMenuSchedule = async (schedule: DailyMenuSchedule): Promise<void> => {
  configService.addDailyMenuSchedule(schedule);
  await withServerOrFallback(
    'dailyMenus.save',
    () =>
      serverApiFetch('/api/daily-menus', {
        method: 'POST',
        requireAuth: true,
        body: schedule,
      }),
    () => appwriteService.saveDailyMenuScheduleToAppwrite(schedule),
    () => undefined
  );
};