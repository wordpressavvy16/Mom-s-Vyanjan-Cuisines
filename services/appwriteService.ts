import {
  appwriteAccount,
  appwriteDatabases,
  appwriteRealtime,
  APPWRITE_CONFIG,
  isAppwriteConfigured,
  clearAppwriteJwtCache,
  ID,
  Query,
  Permission,
  Role,
  AppwriteException,
  Channel,
} from './appwriteClient';
export { AppwriteException };
import {
  Meal,
  Review,
  Order,
  CartItem,
  OrderStatus,
  User,
  UserRole,
  MealSlot,
  Address,
  MealSlotConfig,
  PartnerApplication,
  Testimonial,
  SocialFeedItem,
  SiteSettings,
  DailyMenuSchedule,
  DietaryPreference,
  OrderItem,
} from '../types';
import type { Models } from 'appwrite';

const DB_ID = APPWRITE_CONFIG.databaseId;
const COLS = APPWRITE_CONFIG.collections;

const warnedKeys = new Set<string>();

export function isAppwriteMissingResourceError(err: unknown): boolean {
  if (err instanceof AppwriteException) {
    return err.code === 404 || err.code === 0 || err.type === 'general_route_not_found' || err.type === 'database_not_found' || err.type === 'collection_not_found';
  }
  return err instanceof TypeError; // e.g., CORS / network blocked before Web Platform is whitelisted
}

export function logAppwriteFallback(scope: string, err: unknown): void {
  if (warnedKeys.has(scope)) return;
  warnedKeys.add(scope);
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[Appwrite:${scope}] Falling back to local storage (${message}). Ensure Web Platform hostname & database "${DB_ID}" collections are configured.`);
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeStringArray<T = string>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    const parsed = safeJsonParse<T[]>(value, []);
    if (Array.isArray(parsed)) return parsed;
  }
  return fallback;
}

// --- Mappers ---

export function docToUser(doc: Models.Document & Record<string, any>): User {
  return {
    id: doc.$id,
    firstName: doc.firstName || 'User',
    lastName: doc.lastName || '',
    email: doc.email || '',
    role: (doc.role as UserRole) || UserRole.USER,
    profilePictureUrl: doc.profilePictureUrl || undefined,
    dietaryPreferences: safeStringArray<DietaryPreference>(doc.dietaryPreferences, []),
    savedAddresses: safeJsonParse<Address[]>(doc.savedAddresses, []),
    isGuest: Boolean(doc.isGuest),
    serviceZipCodes: safeStringArray<string>(doc.serviceZipCodes, []),
    whatsappNumber: doc.whatsappNumber || undefined,
    isEmailVerified: Boolean(doc.isEmailVerified),
    isWhatsappVerified: Boolean(doc.isWhatsappVerified),
    isApprovedByAdmin: Boolean(doc.isApprovedByAdmin),
    agreementAcknowledged: Boolean(doc.agreementAcknowledged),
    customerLoyaltyStatus: safeJsonParse(doc.customerLoyaltyStatus, {
      points: 0,
      rewardsEarned: [],
      activeCoupons: [],
    }),
    referralCode: doc.referralCode || undefined,
    referredByCode: doc.referredByCode || undefined,
    bio: doc.bio || undefined,
    birthday: doc.birthday || undefined,
  };
}

export function userToDocPayload(user: Omit<User, 'id'> | User): Record<string, any> {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    profilePictureUrl: user.profilePictureUrl || '',
    dietaryPreferences: JSON.stringify(user.dietaryPreferences || []),
    savedAddresses: JSON.stringify(user.savedAddresses || []),
    isGuest: Boolean(user.isGuest),
    serviceZipCodes: JSON.stringify(user.serviceZipCodes || []),
    whatsappNumber: user.whatsappNumber || '',
    isEmailVerified: Boolean(user.isEmailVerified),
    isWhatsappVerified: Boolean(user.isWhatsappVerified),
    isApprovedByAdmin: Boolean(user.isApprovedByAdmin),
    agreementAcknowledged: Boolean(user.agreementAcknowledged),
    customerLoyaltyStatus: JSON.stringify(
      user.customerLoyaltyStatus || { points: 0, rewardsEarned: [], activeCoupons: [] }
    ),
    referralCode: user.referralCode || '',
    referredByCode: user.referredByCode || '',
    bio: user.bio || '',
    birthday: user.birthday || '',
  };
}

export function docToMeal(doc: Models.Document & Record<string, any>): Meal {
  return {
    id: doc.$id,
    name: doc.name || '',
    description: doc.description || '',
    price: Number(doc.price ?? 0),
    imageUrl: doc.imageUrl || '',
    category: doc.category || 'Main Course',
    ingredients: safeStringArray<string>(doc.ingredients, []),
    dietaryTags: safeStringArray<DietaryPreference>(doc.dietaryTags, []),
    calories: doc.calories !== undefined && doc.calories !== null ? Number(doc.calories) : undefined,
    customizationOptions: safeJsonParse(doc.customizationOptions, {
      spiceLevel: ['Mild', 'Medium', 'Hot'],
      portionSize: ['Regular', 'Large'],
    }),
    partnerId: doc.partnerId || undefined,
  };
}

export function mealToDocPayload(meal: Omit<Meal, 'id'> | Meal): Record<string, any> {
  return {
    name: meal.name,
    description: meal.description,
    price: Number(meal.price),
    imageUrl: meal.imageUrl,
    category: meal.category,
    ingredients: JSON.stringify(meal.ingredients || []),
    dietaryTags: JSON.stringify(meal.dietaryTags || []),
    calories: meal.calories !== undefined ? Number(meal.calories) : 0,
    customizationOptions: JSON.stringify(
      meal.customizationOptions || { spiceLevel: ['Mild', 'Medium', 'Hot'], portionSize: ['Regular', 'Large'] }
    ),
    partnerId: meal.partnerId || '',
  };
}

export function docToOrder(doc: Models.Document & Record<string, any>): Order {
  return {
    id: doc.$id,
    userId: doc.userId,
    items: safeJsonParse<OrderItem[]>(doc.items, []),
    totalAmount: Number(doc.totalAmount ?? 0),
    orderDate: new Date(doc.orderDate || doc.$createdAt),
    status: (doc.status as OrderStatus) || OrderStatus.CONFIRMED,
    mealSlot: (doc.mealSlot as MealSlot) || MealSlot.LUNCH,
    deliveryDate: doc.deliveryDate || '',
    deliveryWindowDisplay: doc.deliveryWindowDisplay || '',
    paymentTransactionId: doc.paymentTransactionId || undefined,
    delegatedToPartnerId: doc.delegatedToPartnerId || undefined,
    destinationAddress: safeJsonParse<Address | undefined>(doc.destinationAddress, undefined),
    destinationCoordinates: safeJsonParse<{ lat: number; lng: number } | undefined>(doc.destinationCoordinates, undefined),
    currentLocation: safeJsonParse<{ lat: number; lng: number } | undefined>(doc.currentLocation, undefined),
    deliveryPerson: safeJsonParse(doc.deliveryPerson, undefined),
  };
}

export function orderToDocPayload(order: Omit<Order, 'id'>): Record<string, any> {
  return {
    userId: order.userId,
    items: JSON.stringify(order.items),
    totalAmount: Number(order.totalAmount),
    orderDate: order.orderDate instanceof Date ? order.orderDate.toISOString() : String(order.orderDate),
    status: order.status,
    mealSlot: order.mealSlot,
    deliveryDate: order.deliveryDate,
    deliveryWindowDisplay: order.deliveryWindowDisplay,
    paymentTransactionId: order.paymentTransactionId || '',
    delegatedToPartnerId: order.delegatedToPartnerId || '',
    destinationAddress: order.destinationAddress ? JSON.stringify(order.destinationAddress) : '',
    destinationCoordinates: order.destinationCoordinates ? JSON.stringify(order.destinationCoordinates) : '',
    currentLocation: order.currentLocation ? JSON.stringify(order.currentLocation) : '',
    deliveryPerson: order.deliveryPerson ? JSON.stringify(order.deliveryPerson) : '',
  };
}

export function docToReview(doc: Models.Document & Record<string, any>): Review {
  return {
    id: doc.$id,
    orderItemId: doc.orderItemId || '',
    mealId: doc.mealId || '',
    userId: doc.userId || '',
    userName: doc.userName || 'Customer',
    rating: Number(doc.rating ?? 5),
    comment: doc.comment || '',
    timestamp: new Date(doc.timestamp || doc.$createdAt),
  };
}

// --- Auth Operations ---

function assertConfigured(): void {
  if (!isAppwriteConfigured()) {
    throw new Error('Appwrite client environment variables are not configured.');
  }
}

export async function getCurrentAppwriteSessionUser(): Promise<User | null> {
  if (!isAppwriteConfigured()) return null;
  const account = await appwriteAccount.get();
  try {
    const profileDoc = await appwriteDatabases.getDocument({
      databaseId: DB_ID,
      collectionId: COLS.users,
      documentId: account.$id,
    });
    return docToUser(profileDoc);
  } catch {
    // Account exists in Appwrite Auth even if profile doc is not yet created
    const nameParts = (account.name || '').trim().split(/\s+/);
    const fallbackUser: User = {
      id: account.$id,
      firstName: nameParts[0] || account.email.split('@')[0] || 'User',
      lastName: nameParts.slice(1).join(' ') || '',
      email: account.email,
      role: UserRole.USER,
      dietaryPreferences: [],
      savedAddresses: [],
      isEmailVerified: account.emailVerification,
      isWhatsappVerified: false,
      customerLoyaltyStatus: { points: 0, rewardsEarned: [], activeCoupons: [] },
    };
    return fallbackUser;
  }
}

export async function loginAppwriteUser(email: string, password: string): Promise<User> {
  assertConfigured();
  clearAppwriteJwtCache();
  try {
    await appwriteAccount.deleteSession({ sessionId: 'current' });
  } catch {
    // No active session to clear
  }
  await appwriteAccount.createEmailPasswordSession({ email, password });
  const account = await appwriteAccount.get();

  try {
    const profileDoc = await appwriteDatabases.getDocument({
      databaseId: DB_ID,
      collectionId: COLS.users,
      documentId: account.$id,
    });
    return docToUser(profileDoc);
  } catch {
    const nameParts = (account.name || '').trim().split(/\s+/);
    const newUserProfile: Omit<User, 'id'> = {
      firstName: nameParts[0] || email.split('@')[0] || 'User',
      lastName: nameParts.slice(1).join(' ') || '',
      email: account.email,
      role: UserRole.USER,
      dietaryPreferences: [],
      savedAddresses: [],
      isEmailVerified: account.emailVerification,
      isWhatsappVerified: false,
      customerLoyaltyStatus: { points: 0, rewardsEarned: [], activeCoupons: [] },
      referralCode: `REF-${account.$id.slice(0, 6).toUpperCase()}`,
    };
    try {
      const created = await appwriteDatabases.createDocument({
        databaseId: DB_ID,
        collectionId: COLS.users,
        documentId: account.$id,
        data: userToDocPayload(newUserProfile),
        permissions: [
          Permission.read(Role.user(account.$id)),
          Permission.update(Role.user(account.$id)),
        ],
      });
      return docToUser(created);
    } catch {
      return { id: account.$id, ...newUserProfile };
    }
  }
}

export async function signupAppwriteUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  whatsappNumber?: string,
  referralCodeUsed?: string
): Promise<User> {
  assertConfigured();
  clearAppwriteJwtCache();
  const userId = ID.unique();
  const fullName = `${firstName} ${lastName}`.trim();
  await appwriteAccount.create({
    userId,
    email,
    password,
    name: fullName,
  });

  await appwriteAccount.createEmailPasswordSession({ email, password });

  const newProfile: Omit<User, 'id'> = {
    firstName,
    lastName,
    email,
    role: UserRole.USER,
    whatsappNumber: whatsappNumber || undefined,
    isEmailVerified: false,
    isWhatsappVerified: false,
    isApprovedByAdmin: false,
    agreementAcknowledged: false,
    dietaryPreferences: [],
    savedAddresses: [],
    profilePictureUrl: `https://picsum.photos/seed/${encodeURIComponent(firstName || 'user')}/100/100`,
    customerLoyaltyStatus: { points: 0, rewardsEarned: [], activeCoupons: [] },
    referralCode: `${(firstName || 'USER').slice(0, 4).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`,
    referredByCode: referralCodeUsed || undefined,
  };

  try {
    const doc = await appwriteDatabases.createDocument({
      databaseId: DB_ID,
      collectionId: COLS.users,
      documentId: userId,
      data: userToDocPayload(newProfile),
      permissions: [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
      ],
    });
    return docToUser(doc);
  } catch (err) {
    logAppwriteFallback('users.create', err);
    return { id: userId, ...newProfile };
  }
}

export async function logoutAppwriteUser(): Promise<void> {
  clearAppwriteJwtCache();
  if (!isAppwriteConfigured()) return;
  try {
    await appwriteAccount.deleteSession({ sessionId: 'current' });
  } catch {
    // Ignore if already signed out
  }
}

export async function upsertAppwriteUserProfile(user: User): Promise<User> {
  assertConfigured();
  const payload = userToDocPayload(user);
  const doc = await appwriteDatabases.upsertDocument({
    databaseId: DB_ID,
    collectionId: COLS.users,
    documentId: user.id,
    data: payload,
    permissions: [
      Permission.read(Role.user(user.id)),
      Permission.update(Role.user(user.id)),
    ],
  });
  return docToUser(doc);
}

// --- Users ---

export async function fetchUsersFromAppwrite(): Promise<User[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.users,
    queries: [Query.limit(100)],
  });
  return res.documents.map(docToUser);
}

// --- Meals ---

export async function fetchMealsFromAppwrite(user?: User | null): Promise<Meal[]> {
  const queries = [Query.limit(100)];
  if (user && user.role === UserRole.PARTNER) {
    queries.push(Query.equal('partnerId', user.id));
  }
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.meals,
    queries,
  });
  return res.documents.map(docToMeal);
}

export async function fetchMealByIdFromAppwrite(mealId: string): Promise<Meal | null> {
  try {
    const doc = await appwriteDatabases.getDocument({
      databaseId: DB_ID,
      collectionId: COLS.meals,
      documentId: mealId,
    });
    return docToMeal(doc);
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) {
      return null;
    }
    throw err;
  }
}

export async function createMealInAppwrite(mealData: Omit<Meal, 'id'>, user: User | null): Promise<Meal> {
  const payload = mealToDocPayload({
    ...mealData,
    partnerId: user?.role === UserRole.PARTNER ? user.id : mealData.partnerId,
  });
  const doc = await appwriteDatabases.createDocument({
    databaseId: DB_ID,
    collectionId: COLS.meals,
    documentId: ID.unique(),
    data: payload,
  });
  return docToMeal(doc);
}

export async function updateMealInAppwrite(meal: Meal): Promise<Meal> {
  const doc = await appwriteDatabases.updateDocument({
    databaseId: DB_ID,
    collectionId: COLS.meals,
    documentId: meal.id,
    data: mealToDocPayload(meal),
  });
  return docToMeal(doc);
}

export async function deleteMealInAppwrite(mealId: string): Promise<void> {
  await appwriteDatabases.deleteDocument({
    databaseId: DB_ID,
    collectionId: COLS.meals,
    documentId: mealId,
  });
}

// --- Orders ---

export async function fetchAllOrdersFromAppwrite(): Promise<Order[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.orders,
    queries: [Query.orderDesc('$createdAt'), Query.limit(100)],
  });
  return res.documents.map(docToOrder);
}

export async function fetchUserOrdersFromAppwrite(userId: string): Promise<Order[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.orders,
    queries: [Query.equal('userId', userId), Query.orderDesc('$createdAt'), Query.limit(100)],
  });
  return res.documents.map(docToOrder);
}

export async function fetchOrderByIdFromAppwrite(orderId: string): Promise<Order | null> {
  try {
    const doc = await appwriteDatabases.getDocument({
      databaseId: DB_ID,
      collectionId: COLS.orders,
      documentId: orderId,
    });
    return docToOrder(doc);
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) {
      return null;
    }
    throw err;
  }
}

export async function createOrderInAppwrite(
  currentUser: User,
  cartItems: CartItem[],
  totalAmount: number,
  mealSlot: MealSlot,
  deliveryDate: string,
  deliveryWindowDisplay: string,
  destinationAddress?: Address
): Promise<Order> {
  const orderItems: OrderItem[] = cartItems.map((item, idx) => ({
    ...item,
    orderItemId: `${ID.unique()}-${idx}`,
    priceAtPurchase: item.price,
  }));

  const defaultAddr = destinationAddress || currentUser.savedAddresses.find(a => a.isDefault) || currentUser.savedAddresses[0];
  const partnerItem = cartItems.find(i => i.partnerId);

  const newOrderData: Omit<Order, 'id'> = {
    userId: currentUser.id,
    items: orderItems,
    totalAmount,
    orderDate: new Date(),
    status: OrderStatus.CONFIRMED,
    mealSlot,
    deliveryDate,
    deliveryWindowDisplay,
    paymentTransactionId: `txn-aw-${Date.now()}`,
    delegatedToPartnerId: partnerItem?.partnerId,
    destinationAddress: defaultAddr,
    destinationCoordinates: defaultAddr?.location || { lat: 34.0522, lng: -118.2437 },
    currentLocation: { lat: 34.0407, lng: -118.2468 },
    deliveryPerson: {
      id: 'dp-1',
      name: 'Raju Bhai',
      vehicle: 'Scooter',
      currentLocation: { lat: 34.0407, lng: -118.2468 },
    },
  };

  const orderPermissions = [
    Permission.read(Role.user(currentUser.id)),
  ];
  if (partnerItem?.partnerId) {
    orderPermissions.push(Permission.read(Role.user(partnerItem.partnerId)));
  }

  const doc = await appwriteDatabases.createDocument({
    databaseId: DB_ID,
    collectionId: COLS.orders,
    documentId: ID.unique(),
    data: orderToDocPayload(newOrderData),
    permissions: orderPermissions,
  });
  return docToOrder(doc);
}

export async function updateOrderStatusInAppwrite(
  orderId: string,
  newStatus: OrderStatus,
  newLocation?: { lat: number; lng: number }
): Promise<Order> {
  const data: Record<string, any> = { status: newStatus };
  if (newLocation) {
    data.currentLocation = JSON.stringify(newLocation);
  }
  const doc = await appwriteDatabases.updateDocument({
    databaseId: DB_ID,
    collectionId: COLS.orders,
    documentId: orderId,
    data,
  });
  return docToOrder(doc);
}

export async function updateOrderLocationInAppwrite(
  orderId: string,
  newOrderLocation: { lat: number; lng: number },
  newDeliveryPersonLocation?: { lat: number; lng: number }
): Promise<Order> {
  const existing = await fetchOrderByIdFromAppwrite(orderId);
  const data: Record<string, any> = {
    currentLocation: JSON.stringify(newOrderLocation),
  };
  if (newDeliveryPersonLocation && existing?.deliveryPerson) {
    data.deliveryPerson = JSON.stringify({
      ...existing.deliveryPerson,
      currentLocation: newDeliveryPersonLocation,
    });
  }
  const doc = await appwriteDatabases.updateDocument({
    databaseId: DB_ID,
    collectionId: COLS.orders,
    documentId: orderId,
    data,
  });
  return docToOrder(doc);
}

export function subscribeToOrderUpdates(
  orderId: string,
  onUpdate: (order: Order) => void
): () => void {
  let active = true;
  let subscriptionPromise: Promise<{ unsubscribe: () => Promise<void> }> | null = null;

  try {
    const channel = Channel.database(DB_ID).collection(COLS.orders).document(orderId);
    subscriptionPromise = appwriteRealtime.subscribe<Models.Document & Record<string, any>>(
      channel,
      (event) => {
        if (active && event.payload) {
          onUpdate(docToOrder(event.payload));
        }
      }
    );
  } catch (err) {
    logAppwriteFallback('realtime.orders', err);
  }

  return () => {
    active = false;
    if (subscriptionPromise) {
      subscriptionPromise.then(sub => sub.unsubscribe()).catch(() => {});
    }
  };
}

// --- Reviews ---

export async function fetchReviewsForMealFromAppwrite(mealId: string): Promise<Review[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.reviews,
    queries: [Query.equal('mealId', mealId), Query.orderDesc('$createdAt'), Query.limit(100)],
  });
  return res.documents.map(docToReview);
}

export async function fetchReviewsByUserIdFromAppwrite(userId: string): Promise<Review[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.reviews,
    queries: [Query.equal('userId', userId), Query.orderDesc('$createdAt'), Query.limit(100)],
  });
  return res.documents.map(docToReview);
}

export async function createReviewInAppwrite(
  userId: string,
  userName: string,
  mealId: string,
  orderItemId: string,
  rating: number,
  comment: string
): Promise<Review> {
  const doc = await appwriteDatabases.createDocument({
    databaseId: DB_ID,
    collectionId: COLS.reviews,
    documentId: ID.unique(),
    data: {
      userId,
      userName,
      mealId,
      orderItemId,
      rating: Number(rating),
      comment,
      timestamp: new Date().toISOString(),
    },
    permissions: [
      Permission.read(Role.any()),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ],
  });
  return docToReview(doc);
}

// --- Partner Applications ---

export async function fetchPartnerApplicationsFromAppwrite(): Promise<PartnerApplication[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.partnerApplications,
    queries: [Query.orderDesc('$createdAt'), Query.limit(100)],
  });
  return res.documents.map(doc => ({
    id: doc.$id,
    applicantName: doc.applicantName,
    email: doc.email,
    businessName: doc.businessName,
    serviceAreaNotes: doc.serviceAreaNotes,
    status: doc.status || 'Pending',
    submittedAt: doc.submittedAt || doc.$createdAt,
  }));
}

export async function createPartnerApplicationInAppwrite(
  applicationData: Omit<PartnerApplication, 'id' | 'status' | 'submittedAt'>
): Promise<PartnerApplication> {
  const submittedAt = new Date().toISOString();
  const doc = await appwriteDatabases.createDocument({
    databaseId: DB_ID,
    collectionId: COLS.partnerApplications,
    documentId: ID.unique(),
    data: {
      ...applicationData,
      status: 'Pending',
      submittedAt,
    },
  });
  return {
    id: doc.$id,
    applicantName: doc.applicantName,
    email: doc.email,
    businessName: doc.businessName,
    serviceAreaNotes: doc.serviceAreaNotes,
    status: doc.status,
    submittedAt: doc.submittedAt,
  };
}

export async function updatePartnerApplicationStatusInAppwrite(
  appId: string,
  status: 'Approved' | 'Rejected'
): Promise<void> {
  await appwriteDatabases.updateDocument({
    databaseId: DB_ID,
    collectionId: COLS.partnerApplications,
    documentId: appId,
    data: { status },
  });
}

// --- Content & Settings ---

export async function fetchTestimonialsFromAppwrite(): Promise<Testimonial[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.testimonials,
    queries: [Query.limit(50)],
  });
  return res.documents.map(doc => ({
    id: doc.$id,
    name: doc.name,
    rating: Number(doc.rating ?? 5),
    comment: doc.comment,
    imageUrl: doc.imageUrl || undefined,
  }));
}

export async function fetchSocialFeedItemsFromAppwrite(): Promise<SocialFeedItem[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.socialFeedItems,
    queries: [Query.limit(50)],
  });
  return res.documents.map(doc => ({
    id: doc.$id,
    platform: doc.platform,
    imageUrl: doc.imageUrl || undefined,
    caption: doc.caption,
    postUrl: doc.postUrl,
  }));
}

export async function fetchSiteSettingsFromAppwrite(): Promise<{
  siteSettings?: SiteSettings;
  mainSocialLinks?: { instagram: string; facebook: string };
} | null> {
  try {
    const doc = await appwriteDatabases.getDocument({
      databaseId: DB_ID,
      collectionId: COLS.siteSettings,
      documentId: 'default',
    });
    return {
      siteSettings: safeJsonParse<SiteSettings | undefined>(doc.siteSettingsJson, undefined),
      mainSocialLinks: safeJsonParse<{ instagram: string; facebook: string } | undefined>(
        doc.mainSocialLinksJson,
        undefined
      ),
    };
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) {
      return null;
    }
    throw err;
  }
}

export async function saveSiteSettingsToAppwrite(
  siteSettings: SiteSettings,
  mainSocialLinks?: { instagram: string; facebook: string }
): Promise<void> {
  const data: Record<string, any> = {
    siteSettingsJson: JSON.stringify(siteSettings),
  };
  if (mainSocialLinks) {
    data.mainSocialLinksJson = JSON.stringify(mainSocialLinks);
  }
  await appwriteDatabases.upsertDocument({
    databaseId: DB_ID,
    collectionId: COLS.siteSettings,
    documentId: 'default',
    data,
  });
}

export async function fetchMealSlotsFromAppwrite(): Promise<MealSlotConfig[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.mealSlots,
    queries: [Query.limit(20)],
  });
  return res.documents.map(doc => ({
    id: doc.name as MealSlot,
    name: doc.name as MealSlot,
    deliveryHour: Number(doc.deliveryHour),
    deliveryWindowMinutes: Number(doc.deliveryWindowMinutes),
    cutoffHoursBeforeDelivery: Number(doc.cutoffHoursBeforeDelivery),
    displayWindow: doc.displayWindow,
  }));
}

export async function fetchDailyMenuSchedulesFromAppwrite(): Promise<DailyMenuSchedule[]> {
  const res = await appwriteDatabases.listDocuments({
    databaseId: DB_ID,
    collectionId: COLS.dailyMenus,
    queries: [Query.orderDesc('date'), Query.limit(100)],
  });
  return res.documents.map(doc => ({
    date: doc.date,
    mealSlot: doc.mealSlot as MealSlot,
    mealIds: safeStringArray<string>(doc.mealIds, []),
    isSpecial: Boolean(doc.isSpecial),
  }));
}

export async function saveDailyMenuScheduleToAppwrite(schedule: DailyMenuSchedule): Promise<void> {
  const docId = `${schedule.date}_${schedule.mealSlot}`.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);
  await appwriteDatabases.upsertDocument({
    databaseId: DB_ID,
    collectionId: COLS.dailyMenus,
    documentId: docId,
    data: {
      date: schedule.date,
      mealSlot: schedule.mealSlot,
      mealIds: JSON.stringify(schedule.mealIds),
      isSpecial: Boolean(schedule.isSpecial),
    },
  });
}
