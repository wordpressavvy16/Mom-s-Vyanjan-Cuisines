import { Client, Account, Databases, Storage, Realtime, ID, Query, Permission, Role, AppwriteException, Channel } from 'appwrite';

const endpoint = (import.meta.env.VITE_APPWRITE_ENDPOINT || '').trim();
const projectId = (import.meta.env.VITE_APPWRITE_PROJECT_ID || '').trim();
const databaseId = (import.meta.env.VITE_APPWRITE_DATABASE_ID || '').trim();

export const APPWRITE_CONFIG = {
  endpoint,
  projectId,
  databaseId,
  collections: {
    users: import.meta.env.VITE_APPWRITE_COLLECTION_USERS || 'users',
    meals: import.meta.env.VITE_APPWRITE_COLLECTION_MEALS || 'meals',
    orders: import.meta.env.VITE_APPWRITE_COLLECTION_ORDERS || 'orders',
    reviews: import.meta.env.VITE_APPWRITE_COLLECTION_REVIEWS || 'reviews',
    mealSlots: import.meta.env.VITE_APPWRITE_COLLECTION_MEAL_SLOTS || 'meal_slot_configs',
    dailyMenus: import.meta.env.VITE_APPWRITE_COLLECTION_DAILY_MENUS || 'daily_menu_schedules',
    partnerApplications: import.meta.env.VITE_APPWRITE_COLLECTION_PARTNER_APPLICATIONS || 'partner_applications',
    testimonials: import.meta.env.VITE_APPWRITE_COLLECTION_TESTIMONIALS || 'testimonials',
    socialFeedItems: import.meta.env.VITE_APPWRITE_COLLECTION_SOCIAL_FEED || 'social_feed_items',
    siteSettings: import.meta.env.VITE_APPWRITE_COLLECTION_SITE_SETTINGS || 'site_settings',
    inventory: import.meta.env.VITE_APPWRITE_COLLECTION_INVENTORY || 'inventory_items',
    purchaseOrders: import.meta.env.VITE_APPWRITE_COLLECTION_PURCHASE_ORDERS || 'purchase_orders',
    todos: import.meta.env.VITE_APPWRITE_COLLECTION_TODOS || 'todos',
  },
} as const;

export function isAppwriteConfigured(): boolean {
  return Boolean(APPWRITE_CONFIG.endpoint && APPWRITE_CONFIG.projectId && APPWRITE_CONFIG.databaseId);
}

export const appwriteClient = new Client();
if (APPWRITE_CONFIG.endpoint && APPWRITE_CONFIG.projectId) {
  appwriteClient
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);
}

export const appwriteAccount = new Account(appwriteClient);
export const appwriteDatabases = new Databases(appwriteClient);
export const appwriteStorage = new Storage(appwriteClient);
export const appwriteRealtime = new Realtime(appwriteClient);

export { ID, Query, Permission, Role, AppwriteException, Channel };

// Short-lived in-memory Appwrite JWT cache (never stored in localStorage)
let cachedJwt: { token: string; expiresAt: number } | null = null;

export function clearAppwriteJwtCache(): void {
  cachedJwt = null;
}

export async function getAppwriteJwt(forceRefresh = false): Promise<string | null> {
  if (!isAppwriteConfigured()) return null;
  const now = Date.now();
  if (!forceRefresh && cachedJwt && cachedJwt.expiresAt > now + 30_000) {
    return cachedJwt.token;
  }
  try {
    const res = await appwriteAccount.createJWT();
    // Appwrite JWTs are valid for 15 minutes; cache for 12 minutes
    cachedJwt = {
      token: res.jwt,
      expiresAt: now + 12 * 60 * 1000,
    };
    return res.jwt;
  } catch {
    cachedJwt = null;
    return null;
  }
}

export async function pingAppwrite(): Promise<boolean> {
  if (!isAppwriteConfigured()) return false;
  try {
    await appwriteClient.ping();
    return true;
  } catch {
    return false;
  }
}
