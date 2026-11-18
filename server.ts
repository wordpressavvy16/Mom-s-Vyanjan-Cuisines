import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import {
  Client,
  Account,
  Databases,
  Query,
  Permission,
  Role,
  ID,
  AppwriteException,
} from 'node-appwrite';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const GEMINI_MODEL = 'gemini-2.5-flash';

type RoleName = 'guest' | 'user' | 'partner' | 'manager' | 'admin';

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  isApprovedByAdmin: boolean;
}

interface AuthedRequest extends Request {
  authUser?: AuthenticatedUser;
}

function getAppwriteServerConfig() {
  const endpoint = (process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT || '').trim();
  const projectId = (process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID || '').trim();
  const databaseId = (process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID || '').trim();
  const apiKey = (process.env.APPWRITE_API_KEY || '').trim();

  return {
    endpoint,
    projectId,
    databaseId,
    apiKey,
    collections: {
      users: process.env.VITE_APPWRITE_COLLECTION_USERS || 'users',
      meals: process.env.VITE_APPWRITE_COLLECTION_MEALS || 'meals',
      orders: process.env.VITE_APPWRITE_COLLECTION_ORDERS || 'orders',
      reviews: process.env.VITE_APPWRITE_COLLECTION_REVIEWS || 'reviews',
      dailyMenus: process.env.VITE_APPWRITE_COLLECTION_DAILY_MENUS || 'daily_menu_schedules',
      partnerApplications: process.env.VITE_APPWRITE_COLLECTION_PARTNER_APPLICATIONS || 'partner_applications',
      siteSettings: process.env.VITE_APPWRITE_COLLECTION_SITE_SETTINGS || 'site_settings',
    },
  };
}

function getAdminDatabases(): { databases: Databases; databaseId: string; collections: ReturnType<typeof getAppwriteServerConfig>['collections'] } | null {
  const cfg = getAppwriteServerConfig();
  if (!cfg.endpoint || !cfg.projectId || !cfg.databaseId || !cfg.apiKey) {
    return null;
  }
  const client = new Client()
    .setEndpoint(cfg.endpoint)
    .setProject(cfg.projectId)
    .setKey(cfg.apiKey);

  return {
    databases: new Databases(client),
    databaseId: cfg.databaseId,
    collections: cfg.collections,
  };
}

function getGeminiClient(): GoogleGenAI | null {
  const key = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
  if (!key || key === 'PLACEHOLDER_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
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

function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function docToSafeUser(doc: Record<string, any>): Record<string, any> {
  return {
    id: doc.$id,
    firstName: doc.firstName || 'User',
    lastName: doc.lastName || '',
    email: doc.email || '',
    role: doc.role || 'user',
    profilePictureUrl: doc.profilePictureUrl || undefined,
    dietaryPreferences: safeJsonParse<string[]>(doc.dietaryPreferences, []),
    savedAddresses: safeJsonParse<any[]>(doc.savedAddresses, []),
    isGuest: Boolean(doc.isGuest),
    serviceZipCodes: safeJsonParse<string[]>(doc.serviceZipCodes, []),
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

function docToSafeOrder(doc: Record<string, any>): Record<string, any> {
  return {
    id: doc.$id,
    userId: doc.userId,
    items: safeJsonParse<any[]>(doc.items, []),
    totalAmount: Number(doc.totalAmount ?? 0),
    orderDate: doc.orderDate || doc.$createdAt,
    status: doc.status || 'Confirmed',
    mealSlot: doc.mealSlot || 'Lunch',
    deliveryDate: doc.deliveryDate || '',
    deliveryWindowDisplay: doc.deliveryWindowDisplay || '',
    paymentTransactionId: doc.paymentTransactionId || undefined,
    delegatedToPartnerId: doc.delegatedToPartnerId || undefined,
    destinationAddress: safeJsonParse(doc.destinationAddress, undefined),
    destinationCoordinates: safeJsonParse(doc.destinationCoordinates, undefined),
    currentLocation: safeJsonParse(doc.currentLocation, undefined),
    deliveryPerson: safeJsonParse(doc.deliveryPerson, undefined),
  };
}

function docToSafeMeal(doc: Record<string, any>): Record<string, any> {
  return {
    id: doc.$id,
    name: doc.name || '',
    description: doc.description || '',
    price: Number(doc.price ?? 0),
    imageUrl: doc.imageUrl || '',
    category: doc.category || 'Main Course',
    ingredients: safeJsonParse<string[]>(doc.ingredients, []),
    dietaryTags: safeJsonParse<string[]>(doc.dietaryTags, []),
    calories: doc.calories !== undefined && doc.calories !== null ? Number(doc.calories) : undefined,
    customizationOptions: safeJsonParse(doc.customizationOptions, {
      spiceLevel: ['Mild', 'Medium', 'Hot'],
      portionSize: ['Regular', 'Large'],
    }),
    partnerId: doc.partnerId || undefined,
  };
}

function handleServerError(res: Response, err: unknown, fallbackMsg: string): void {
  if (err instanceof AppwriteException) {
    const status = err.code && err.code >= 400 && err.code < 600 ? err.code : 500;
    res.status(status).json({ error: err.message || fallbackMsg });
    return;
  }
  const message = err instanceof Error ? err.message : fallbackMsg;
  console.error('[Server API Error]', message);
  res.status(500).json({ error: fallbackMsg });
}

async function resolveAuthUser(req: AuthedRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const jwt = authHeader.slice(7).trim();
  if (!jwt) return null;

  const cfg = getAppwriteServerConfig();
  if (!cfg.endpoint || !cfg.projectId) {
    return null;
  }

  const userClient = new Client()
    .setEndpoint(cfg.endpoint)
    .setProject(cfg.projectId)
    .setJWT(jwt);

  const account = new Account(userClient);
  const appwriteUser = await account.get();

  let role: RoleName = 'user';
  let isApprovedByAdmin = false;

  const admin = getAdminDatabases();
  if (admin) {
    try {
      const profileDoc = await admin.databases.getDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.users,
        documentId: appwriteUser.$id,
      });
      const dbRole = String((profileDoc as any).role || 'user').toLowerCase();
      if (dbRole === 'admin' || dbRole === 'manager' || dbRole === 'partner' || dbRole === 'user') {
        role = dbRole;
      }
      isApprovedByAdmin = Boolean((profileDoc as any).isApprovedByAdmin);
    } catch {
      // Fallback to Appwrite Auth labels if profile doc doesn't exist yet
      const labels = Array.isArray((appwriteUser as any).labels) ? (appwriteUser as any).labels : [];
      if (labels.includes('admin')) role = 'admin';
      else if (labels.includes('manager')) role = 'manager';
      else if (labels.includes('partner')) role = 'partner';
    }
  } else {
    const labels = Array.isArray((appwriteUser as any).labels) ? (appwriteUser as any).labels : [];
    if (labels.includes('admin')) role = 'admin';
    else if (labels.includes('manager')) role = 'manager';
    else if (labels.includes('partner')) role = 'partner';
  }

  return {
    id: appwriteUser.$id,
    email: appwriteUser.email,
    name: appwriteUser.name,
    role,
    isApprovedByAdmin,
  };
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authUser = await resolveAuthUser(req);
    if (!authUser) {
      res.status(401).json({ error: 'Authentication required. Please sign in with a valid session.' });
      return;
    }
    req.authUser = authUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

function requireRole(...allowedRoles: RoleName[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    const user = req.authUser;
    if (!user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient role permissions.' });
      return;
    }
    if (user.role === 'partner' && !user.isApprovedByAdmin) {
      res.status(403).json({ error: 'Forbidden: partner account is pending admin approval.' });
      return;
    }
    next();
  };
}

function requireServerAppwrite(res: Response) {
  const admin = getAdminDatabases();
  if (!admin) {
    res.status(503).json({
      error: 'SERVER_APPWRITE_NOT_CONFIGURED',
      message: 'Server APPWRITE_API_KEY is not configured yet in .env.local.',
    });
    return null;
  }
  return admin;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // Security headers (iframe-compatible for AI Studio preview)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false,
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin requests and localhost / Cloud Run preview domains
        if (!origin) return callback(null, true);
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.endsWith('.run.app')
        ) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'AI rate limit exceeded. Please wait a few minutes.' },
  });

  const publicWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many submissions from this IP. Please try again later.' },
  });

  app.use('/api', apiLimiter);

  // --- Health ---
  app.get('/api/health', (_req: Request, res: Response) => {
    const cfg = getAppwriteServerConfig();
    res.json({
      ok: true,
      serverAppwriteConfigured: Boolean(cfg.endpoint && cfg.projectId && cfg.databaseId && cfg.apiKey),
      geminiConfigured: Boolean(getGeminiClient()),
    });
  });

  // --- User Profile & RBAC Routes ---
  app.get('/api/users/me', requireAuth, async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;
    try {
      const doc = await admin.databases.getDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.users,
        documentId: req.authUser.id,
      });
      res.json(docToSafeUser(doc as Record<string, any>));
    } catch (err) {
      if (err instanceof AppwriteException && err.code === 404) {
        res.status(404).json({ error: 'Profile not found.' });
        return;
      }
      handleServerError(res, err, 'Failed to fetch user profile.');
    }
  });

  app.put('/api/users/me', requireAuth, async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;

    try {
      const body = req.body || {};
      // Whitelist only user-editable profile attributes; NEVER allow client to set role/approval/loyalty
      const updateData: Record<string, any> = {};
      if (typeof body.firstName === 'string') updateData.firstName = sanitizeString(body.firstName, 128);
      if (typeof body.lastName === 'string') updateData.lastName = sanitizeString(body.lastName, 128);
      if (typeof body.profilePictureUrl === 'string') updateData.profilePictureUrl = sanitizeString(body.profilePictureUrl, 2048);
      if (Array.isArray(body.dietaryPreferences)) updateData.dietaryPreferences = JSON.stringify(body.dietaryPreferences.slice(0, 20));
      if (Array.isArray(body.savedAddresses)) updateData.savedAddresses = JSON.stringify(body.savedAddresses.slice(0, 20));
      if (typeof body.whatsappNumber === 'string') updateData.whatsappNumber = sanitizeString(body.whatsappNumber, 64);
      if (typeof body.bio === 'string') updateData.bio = sanitizeString(body.bio, 2048);
      if (typeof body.birthday === 'string') updateData.birthday = sanitizeString(body.birthday, 32);
      if (Array.isArray(body.serviceZipCodes)) updateData.serviceZipCodes = JSON.stringify(body.serviceZipCodes.slice(0, 50));
      if (typeof body.agreementAcknowledged === 'boolean') updateData.agreementAcknowledged = body.agreementAcknowledged;

      const doc = await admin.databases.updateDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.users,
        documentId: req.authUser.id,
        data: updateData,
      });
      res.json(docToSafeUser(doc as Record<string, any>));
    } catch (err) {
      handleServerError(res, err, 'Failed to update profile.');
    }
  });

  app.get('/api/users', requireAuth, requireRole('admin', 'manager'), async (_req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin) return;
    try {
      const list = await admin.databases.listDocuments({
        databaseId: admin.databaseId,
        collectionId: admin.collections.users,
        queries: [Query.limit(100)],
      });
      res.json(list.documents.map(doc => docToSafeUser(doc as Record<string, any>)));
    } catch (err) {
      handleServerError(res, err, 'Failed to list users.');
    }
  });

  app.put('/api/users/:id/admin-update', requireAuth, requireRole('admin'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin) return;
    try {
      const targetUserId = sanitizeString(req.params.id, 64);
      const body = req.body || {};
      const data: Record<string, any> = {};
      if (typeof body.role === 'string' && ['user', 'partner', 'manager', 'admin'].includes(body.role)) {
        data.role = body.role;
      }
      if (typeof body.isApprovedByAdmin === 'boolean') {
        data.isApprovedByAdmin = body.isApprovedByAdmin;
      }
      const doc = await admin.databases.updateDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.users,
        documentId: targetUserId,
        data,
      });
      res.json(docToSafeUser(doc as Record<string, any>));
    } catch (err) {
      handleServerError(res, err, 'Failed to update user privileges.');
    }
  });

  // --- Orders (Ownership & Role Protected) ---
  app.get('/api/orders', requireAuth, async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;

    try {
      const queries = [Query.orderDesc('$createdAt'), Query.limit(100)];
      if (req.authUser.role === 'user' || req.authUser.role === 'guest') {
        queries.push(Query.equal('userId', req.authUser.id));
      }
      const list = await admin.databases.listDocuments({
        databaseId: admin.databaseId,
        collectionId: admin.collections.orders,
        queries,
      });
      let orders = list.documents.map(doc => docToSafeOrder(doc as Record<string, any>));
      if (req.authUser.role === 'partner') {
        orders = orders.filter(
          o =>
            o.delegatedToPartnerId === req.authUser?.id ||
            (Array.isArray(o.items) && o.items.some((i: any) => i.partnerId === req.authUser?.id))
        );
      }
      res.json(orders);
    } catch (err) {
      handleServerError(res, err, 'Failed to fetch orders.');
    }
  });

  app.get('/api/orders/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;

    try {
      const orderId = sanitizeString(req.params.id, 64);
      const doc = await admin.databases.getDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.orders,
        documentId: orderId,
      });
      const order = docToSafeOrder(doc as Record<string, any>);
      const isOwner = order.userId === req.authUser.id;
      const isStaff = req.authUser.role === 'admin' || req.authUser.role === 'manager';
      const isAssignedPartner =
        req.authUser.role === 'partner' &&
        (order.delegatedToPartnerId === req.authUser.id ||
          (Array.isArray(order.items) && order.items.some((i: any) => i.partnerId === req.authUser?.id)));

      if (!isOwner && !isStaff && !isAssignedPartner) {
        res.status(403).json({ error: 'Forbidden: you do not have access to this order.' });
        return;
      }
      res.json(order);
    } catch (err) {
      handleServerError(res, err, 'Failed to fetch order.');
    }
  });

  app.post('/api/orders', requireAuth, async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;

    try {
      const { cartItems, mealSlot, deliveryDate, deliveryWindowDisplay, destinationAddress } = req.body || {};
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        res.status(400).json({ error: 'cartItems must be a non-empty array.' });
        return;
      }

      // Verify item prices against Appwrite meals catalog when present to prevent client-side price tampering
      let computedTotal = 0;
      const verifiedItems: any[] = [];
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const qty = Math.max(1, Math.min(50, Math.floor(Number(item.quantity || 1))));
        let unitPrice = Number(item.price || 0);
        let mealName = sanitizeString(item.name, 255);
        let partnerId = sanitizeString(item.partnerId, 64);

        if (typeof item.id === 'string' && item.id) {
          try {
            const mealDoc = await admin.databases.getDocument({
              databaseId: admin.databaseId,
              collectionId: admin.collections.meals,
              documentId: item.id,
            });
            unitPrice = Number((mealDoc as any).price ?? unitPrice);
            mealName = (mealDoc as any).name || mealName;
            partnerId = (mealDoc as any).partnerId || partnerId;
          } catch {
            // If meal isn't seeded in Appwrite DB yet, validate positive price
          }
        }
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          res.status(400).json({ error: 'Invalid item price.' });
          return;
        }
        computedTotal += unitPrice * qty;
        verifiedItems.push({
          ...item,
          name: mealName,
          price: unitPrice,
          quantity: qty,
          partnerId: partnerId || undefined,
          orderItemId: `${ID.unique()}-${i}`,
          priceAtPurchase: unitPrice,
        });
      }

      const partnerItem = verifiedItems.find(i => i.partnerId);
      const orderPayload = {
        userId: req.authUser.id, // Always bind to authenticated JWT user ID
        items: JSON.stringify(verifiedItems),
        totalAmount: Number(computedTotal.toFixed(2)),
        orderDate: new Date().toISOString(),
        status: 'Confirmed',
        mealSlot: sanitizeString(mealSlot, 64) || 'Lunch',
        deliveryDate: sanitizeString(deliveryDate, 32),
        deliveryWindowDisplay: sanitizeString(deliveryWindowDisplay, 255),
        paymentTransactionId: `txn-srv-${Date.now()}`,
        delegatedToPartnerId: partnerItem?.partnerId || '',
        destinationAddress: destinationAddress ? JSON.stringify(destinationAddress) : '',
        destinationCoordinates: destinationAddress?.location
          ? JSON.stringify(destinationAddress.location)
          : JSON.stringify({ lat: 34.0522, lng: -118.2437 }),
        currentLocation: JSON.stringify({ lat: 34.0407, lng: -118.2468 }),
        deliveryPerson: JSON.stringify({
          id: 'dp-1',
          name: 'Raju Bhai',
          vehicle: 'Scooter',
          currentLocation: { lat: 34.0407, lng: -118.2468 },
        }),
      };

      const permissions = [Permission.read(Role.user(req.authUser.id))];
      if (partnerItem?.partnerId) {
        permissions.push(Permission.read(Role.user(partnerItem.partnerId)));
      }

      const doc = await admin.databases.createDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.orders,
        documentId: ID.unique(),
        data: orderPayload,
        permissions,
      });

      // Award loyalty points server-side
      try {
        const userDoc = await admin.databases.getDocument({
          databaseId: admin.databaseId,
          collectionId: admin.collections.users,
          documentId: req.authUser.id,
        });
        const loyalty = safeJsonParse((userDoc as any).customerLoyaltyStatus, {
          points: 0,
          rewardsEarned: [],
          activeCoupons: [],
        });
        const pointsEarned = Math.max(0, Math.floor(computedTotal * 10));
        await admin.databases.updateDocument({
          databaseId: admin.databaseId,
          collectionId: admin.collections.users,
          documentId: req.authUser.id,
          data: {
            customerLoyaltyStatus: JSON.stringify({
              ...loyalty,
              points: Number(loyalty.points || 0) + pointsEarned,
            }),
          },
        });
      } catch {
        // Non-blocking if user doc not yet created
      }

      res.status(201).json(docToSafeOrder(doc as Record<string, any>));
    } catch (err) {
      handleServerError(res, err, 'Failed to create order.');
    }
  });

  app.put('/api/orders/:id/status', requireAuth, requireRole('admin', 'manager', 'partner'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;
    try {
      const orderId = sanitizeString(req.params.id, 64);
      const { status, newLocation } = req.body || {};
      const validStatuses = ['Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: 'Invalid order status.' });
        return;
      }

      const existing = docToSafeOrder(
        (await admin.databases.getDocument({
          databaseId: admin.databaseId,
          collectionId: admin.collections.orders,
          documentId: orderId,
        })) as Record<string, any>
      );

      if (req.authUser.role === 'partner' && existing.delegatedToPartnerId !== req.authUser.id) {
        res.status(403).json({ error: 'Forbidden: partner can only update assigned orders.' });
        return;
      }

      const data: Record<string, any> = { status };
      if (newLocation && typeof newLocation.lat === 'number' && typeof newLocation.lng === 'number') {
        data.currentLocation = JSON.stringify({ lat: newLocation.lat, lng: newLocation.lng });
      }

      const updated = await admin.databases.updateDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.orders,
        documentId: orderId,
        data,
      });
      res.json(docToSafeOrder(updated as Record<string, any>));
    } catch (err) {
      handleServerError(res, err, 'Failed to update order status.');
    }
  });

  app.put('/api/orders/:id/location', requireAuth, requireRole('admin', 'manager', 'partner'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;
    try {
      const orderId = sanitizeString(req.params.id, 64);
      const { newOrderLocation, newDeliveryPersonLocation } = req.body || {};
      if (!newOrderLocation || typeof newOrderLocation.lat !== 'number' || typeof newOrderLocation.lng !== 'number') {
        res.status(400).json({ error: 'Valid newOrderLocation coordinates are required.' });
        return;
      }

      const existing = docToSafeOrder(
        (await admin.databases.getDocument({
          databaseId: admin.databaseId,
          collectionId: admin.collections.orders,
          documentId: orderId,
        })) as Record<string, any>
      );

      if (req.authUser.role === 'partner' && existing.delegatedToPartnerId !== req.authUser.id) {
        res.status(403).json({ error: 'Forbidden: partner can only update assigned orders.' });
        return;
      }

      const data: Record<string, any> = {
        currentLocation: JSON.stringify({ lat: newOrderLocation.lat, lng: newOrderLocation.lng }),
      };
      if (newDeliveryPersonLocation && existing.deliveryPerson) {
        data.deliveryPerson = JSON.stringify({
          ...existing.deliveryPerson,
          currentLocation: { lat: Number(newDeliveryPersonLocation.lat), lng: Number(newDeliveryPersonLocation.lng) },
        });
      }

      const updated = await admin.databases.updateDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.orders,
        documentId: orderId,
        data,
      });
      res.json(docToSafeOrder(updated as Record<string, any>));
    } catch (err) {
      handleServerError(res, err, 'Failed to update order location.');
    }
  });

  // --- Meals Catalog Management (RBAC Protected) ---
  app.post('/api/meals', requireAuth, requireRole('admin', 'manager', 'partner'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;
    try {
      const meal = req.body || {};
      const payload = {
        name: sanitizeString(meal.name, 255),
        description: sanitizeString(meal.description, 4096),
        price: Number(meal.price ?? 0),
        imageUrl: sanitizeString(meal.imageUrl, 2048),
        category: sanitizeString(meal.category, 128) || 'Main Course',
        ingredients: JSON.stringify(Array.isArray(meal.ingredients) ? meal.ingredients : []),
        dietaryTags: JSON.stringify(Array.isArray(meal.dietaryTags) ? meal.dietaryTags : []),
        calories: meal.calories !== undefined ? Number(meal.calories) : 0,
        customizationOptions: JSON.stringify(
          meal.customizationOptions || { spiceLevel: ['Mild', 'Medium', 'Hot'], portionSize: ['Regular', 'Large'] }
        ),
        partnerId: req.authUser.role === 'partner' ? req.authUser.id : sanitizeString(meal.partnerId, 64),
      };

      const doc = await admin.databases.createDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.meals,
        documentId: ID.unique(),
        data: payload,
      });
      res.status(201).json(docToSafeMeal(doc as Record<string, any>));
    } catch (err) {
      handleServerError(res, err, 'Failed to create meal.');
    }
  });

  app.put('/api/meals/:id', requireAuth, requireRole('admin', 'manager', 'partner'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;
    try {
      const mealId = sanitizeString(req.params.id, 64);
      const existing = (await admin.databases.getDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.meals,
        documentId: mealId,
      })) as Record<string, any>;

      if (req.authUser.role === 'partner' && existing.partnerId !== req.authUser.id) {
        res.status(403).json({ error: 'Forbidden: partner can only update their own meals.' });
        return;
      }

      const meal = req.body || {};
      const payload = {
        name: sanitizeString(meal.name, 255),
        description: sanitizeString(meal.description, 4096),
        price: Number(meal.price ?? 0),
        imageUrl: sanitizeString(meal.imageUrl, 2048),
        category: sanitizeString(meal.category, 128) || 'Main Course',
        ingredients: JSON.stringify(Array.isArray(meal.ingredients) ? meal.ingredients : []),
        dietaryTags: JSON.stringify(Array.isArray(meal.dietaryTags) ? meal.dietaryTags : []),
        calories: meal.calories !== undefined ? Number(meal.calories) : 0,
        customizationOptions: JSON.stringify(
          meal.customizationOptions || { spiceLevel: ['Mild', 'Medium', 'Hot'], portionSize: ['Regular', 'Large'] }
        ),
        partnerId: req.authUser.role === 'partner' ? req.authUser.id : sanitizeString(meal.partnerId, 64),
      };

      const doc = await admin.databases.updateDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.meals,
        documentId: mealId,
        data: payload,
      });
      res.json(docToSafeMeal(doc as Record<string, any>));
    } catch (err) {
      handleServerError(res, err, 'Failed to update meal.');
    }
  });

  app.delete('/api/meals/:id', requireAuth, requireRole('admin', 'manager', 'partner'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin || !req.authUser) return;
    try {
      const mealId = sanitizeString(req.params.id, 64);
      const existing = (await admin.databases.getDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.meals,
        documentId: mealId,
      })) as Record<string, any>;

      if (req.authUser.role === 'partner' && existing.partnerId !== req.authUser.id) {
        res.status(403).json({ error: 'Forbidden: partner can only delete their own meals.' });
        return;
      }

      await admin.databases.deleteDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.meals,
        documentId: mealId,
      });
      res.json({ ok: true });
    } catch (err) {
      handleServerError(res, err, 'Failed to delete meal.');
    }
  });

  // --- Partner Applications (PII Protected) ---
  app.get('/api/partner-applications', requireAuth, requireRole('admin', 'manager'), async (_req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin) return;
    try {
      const list = await admin.databases.listDocuments({
        databaseId: admin.databaseId,
        collectionId: admin.collections.partnerApplications,
        queries: [Query.orderDesc('$createdAt'), Query.limit(100)],
      });
      res.json(
        list.documents.map((doc: Record<string, any>) => ({
          id: doc.$id,
          applicantName: doc.applicantName,
          email: doc.email,
          businessName: doc.businessName,
          serviceAreaNotes: doc.serviceAreaNotes,
          status: doc.status || 'Pending',
          submittedAt: doc.submittedAt || doc.$createdAt,
        }))
      );
    } catch (err) {
      handleServerError(res, err, 'Failed to load partner applications.');
    }
  });

  app.post('/api/partner-applications', publicWriteLimiter, async (req: Request, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin) return;
    try {
      const { applicantName, email, businessName, serviceAreaNotes } = req.body || {};
      const cleanName = sanitizeString(applicantName, 128);
      const cleanEmail = sanitizeString(email, 255);
      const cleanBiz = sanitizeString(businessName, 255);
      const cleanNotes = sanitizeString(serviceAreaNotes, 2048);

      if (!cleanName || !cleanEmail.includes('@') || !cleanBiz || !cleanNotes) {
        res.status(400).json({ error: 'All partner application fields with a valid email are required.' });
        return;
      }

      const doc = await admin.databases.createDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.partnerApplications,
        documentId: ID.unique(),
        data: {
          applicantName: cleanName,
          email: cleanEmail,
          businessName: cleanBiz,
          serviceAreaNotes: cleanNotes,
          status: 'Pending',
          submittedAt: new Date().toISOString(),
        },
        // Restrict read permissions so other users cannot enumerate applicant emails
        permissions: [],
      });

      res.status(201).json({
        id: doc.$id,
        applicantName: (doc as any).applicantName,
        email: (doc as any).email,
        businessName: (doc as any).businessName,
        serviceAreaNotes: (doc as any).serviceAreaNotes,
        status: (doc as any).status,
        submittedAt: (doc as any).submittedAt,
      });
    } catch (err) {
      handleServerError(res, err, 'Failed to submit partner application.');
    }
  });

  app.put('/api/partner-applications/:id/status', requireAuth, requireRole('admin'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin) return;
    try {
      const appId = sanitizeString(req.params.id, 64);
      const { status } = req.body || {};
      if (status !== 'Approved' && status !== 'Rejected') {
        res.status(400).json({ error: 'Status must be Approved or Rejected.' });
        return;
      }
      await admin.databases.updateDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.partnerApplications,
        documentId: appId,
        data: { status },
      });
      res.json({ ok: true });
    } catch (err) {
      handleServerError(res, err, 'Failed to update partner application status.');
    }
  });

  // --- Site Settings & Daily Menus (Admin / Manager Only) ---
  app.put('/api/site-settings', requireAuth, requireRole('admin'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin) return;
    try {
      const { siteSettings, mainSocialLinks } = req.body || {};
      if (!siteSettings) {
        res.status(400).json({ error: 'siteSettings payload required.' });
        return;
      }
      const data: Record<string, any> = {
        siteSettingsJson: JSON.stringify(siteSettings),
      };
      if (mainSocialLinks) {
        data.mainSocialLinksJson = JSON.stringify(mainSocialLinks);
      }
      await admin.databases.upsertDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.siteSettings,
        documentId: 'default',
        data,
      });
      res.json({ ok: true });
    } catch (err) {
      handleServerError(res, err, 'Failed to update site settings.');
    }
  });

  app.post('/api/daily-menus', requireAuth, requireRole('admin', 'manager'), async (req: AuthedRequest, res: Response) => {
    const admin = requireServerAppwrite(res);
    if (!admin) return;
    try {
      const { date, mealSlot, mealIds, isSpecial } = req.body || {};
      if (!date || !mealSlot || !Array.isArray(mealIds)) {
        res.status(400).json({ error: 'date, mealSlot, and mealIds are required.' });
        return;
      }
      const docId = `${date}_${mealSlot}`.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 36);
      await admin.databases.upsertDocument({
        databaseId: admin.databaseId,
        collectionId: admin.collections.dailyMenus,
        documentId: docId,
        data: {
          date: sanitizeString(date, 32),
          mealSlot: sanitizeString(mealSlot, 64),
          mealIds: JSON.stringify(mealIds),
          isSpecial: Boolean(isSpecial),
        },
      });
      res.json({ ok: true });
    } catch (err) {
      handleServerError(res, err, 'Failed to save daily menu schedule.');
    }
  });

  // --- Server-Side Gemini AI Proxy Routes (Never expose GEMINI_API_KEY to browser) ---
  app.post('/api/ai/meal-chat', aiLimiter, async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'API_KEY_NOT_CONFIGURED' });
      return;
    }
    try {
      const { meal, userQuery } = req.body || {};
      const cleanQuery = sanitizeString(userQuery, 800);
      const mealName = sanitizeString(meal?.name, 200);
      const mealDesc = sanitizeString(meal?.description, 800);
      const ingredients = Array.isArray(meal?.ingredients) ? meal.ingredients.slice(0, 30).join(', ') : '';
      const calories = meal?.calories ? `Approximate Calories: ${Number(meal.calories)}.` : '';

      const prompt = `You are a helpful AI assistant for a tiffin service called "MoM's Vyanjan".
A customer is asking about the meal: "${mealName}".
Meal Description: "${mealDesc}".
Meal Ingredients: ${ingredients}.
${calories}

Customer's question: "${cleanQuery}"

Please provide a concise, friendly, and helpful answer. If the question is unrelated to food, tiffins, or this meal, politely state that you can only answer food-related questions.
Keep your response to 2-3 sentences.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
      res.json({ text: (response.text || '').trim() });
    } catch (err) {
      handleServerError(res, err, 'Failed to generate meal chat response.');
    }
  });

  app.post('/api/ai/support-chat', aiLimiter, async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'API_KEY_NOT_CONFIGURED' });
      return;
    }
    try {
      const { userQuery, chatHistory } = req.body || {};
      const cleanQuery = sanitizeString(userQuery, 800);
      const historyPrompt = Array.isArray(chatHistory)
        ? chatHistory
            .slice(-6)
            .map((msg: any) => `${msg.sender === 'user' ? 'User' : 'AI'}: ${sanitizeString(msg.text, 500)}`)
            .join('\n')
        : '';

      const prompt = `You are a friendly and helpful customer support chatbot for 'MoM's Vyanjan Tiffin Service'.
Your role is to answer customer questions about our service (e.g., how to order, menu options, delivery areas, payment methods), help with general inquiries, and guide users on how to resolve complaints.
For specific complaints requiring investigation (e.g., issues with a past order, refunds), please advise them to contact our human support team at support@momsvyanjan.example.com or call us at 1-800-000-0000.
Do not ask for or handle sensitive personal information like order IDs or email addresses yourself.
Keep your answers concise and polite.

${historyPrompt ? `Conversation History:\n${historyPrompt}\n\n` : ''}User Query: "${cleanQuery}"
AI Response:`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
      res.json({ text: (response.text || '').trim() });
    } catch (err) {
      handleServerError(res, err, 'Failed to generate support chat response.');
    }
  });

  app.post('/api/ai/meal-suggestion', aiLimiter, async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'API_KEY_NOT_CONFIGURED' });
      return;
    }
    try {
      const cleanPrefs = sanitizeString(req.body?.preferences, 500);
      const prompt = `As an AI for MoM's Vyanjan Tiffin Service, suggest a tiffin meal idea based on these preferences: "${cleanPrefs}".
Provide a short, appealing name and a one-sentence description. For example: 'Sunshine Bowl: A vibrant mix of quinoa, roasted sweet potatoes, and fresh greens.'`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
      res.json({ text: (response.text || '').trim() });
    } catch (err) {
      handleServerError(res, err, 'Failed to generate meal suggestion.');
    }
  });

  app.post('/api/ai/whatsapp-template', aiLimiter, requireAuth, requireRole('admin', 'manager'), async (req: AuthedRequest, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'API_KEY_NOT_CONFIGURED' });
      return;
    }
    try {
      const purpose = sanitizeString(req.body?.purpose, 500);
      const variables = Array.isArray(req.body?.variables)
        ? req.body.variables.slice(0, 15).map((v: unknown) => sanitizeString(v, 64))
        : [];

      const prompt = `You are an expert copywriter for WhatsApp marketing.
Write a concise, friendly, and engaging WhatsApp message template for a tiffin service named "MoM's Vyanjan".
The purpose of this template is: "${purpose}".
The template MUST include placeholders for the following variables, formatted as {{variable_name}} or {{number}}. The variables are: ${variables.join(', ')}.
The response should be ONLY the template content itself, without any introduction, explanation, or markdown formatting.
The template must comply with WhatsApp's commerce policies by being helpful and not overly promotional. Use WhatsApp formatting like *bold* and _italics_ sparingly and effectively.`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { temperature: 0.7 },
      });
      res.json({ text: (response.text || '').trim() });
    } catch (err) {
      handleServerError(res, err, 'Failed to generate WhatsApp template.');
    }
  });

  app.post('/api/ai/crm-insights', aiLimiter, requireAuth, requireRole('admin', 'manager'), async (req: AuthedRequest, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({ error: 'API_KEY_NOT_CONFIGURED' });
      return;
    }
    try {
      const { user, orders } = req.body || {};
      if (!user) {
        res.status(400).json({ error: 'user payload is required.' });
        return;
      }
      const orderSummary = Array.isArray(orders)
        ? orders
            .slice(0, 5)
            .map((o: any) => {
              const dt = o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'Unknown date';
              const items = Array.isArray(o.items) ? o.items.map((i: any) => sanitizeString(i.name, 80)).join(', ') : '';
              return `Order on ${dt}: ${items} for a total of $${Number(o.totalAmount || 0).toFixed(2)}.`;
            })
            .join('\n')
        : '';

      const prompt = `
      You are an expert CRM analyst for a tiffin service called "MoM's Vyanjan".
      Analyze the following customer and their recent order history to provide actionable insights.

      CUSTOMER DATA:
      - Name: ${sanitizeString(user.firstName, 64)} ${sanitizeString(user.lastName, 64)}
      - Role: ${sanitizeString(user.role, 32)}
      - Loyalty Points: ${Number(user.customerLoyaltyStatus?.points || 0)}
      - Birthday: ${sanitizeString(user.birthday, 32) || 'Not provided'}
      - Order History (last 5 orders):
      ${orderSummary || 'No recent orders.'}

      TASK:
      Based on this data, provide a JSON object with the following structure, ensuring all fields are present:
      {
        "customerSnapshot": "A brief, 2-sentence summary of the customer's value and engagement level.",
        "keyInsights": [
          { "type": "Loyalty", "insight": "Description of their loyalty status and potential.", "priority": "high" },
          { "type": "Churn Risk", "insight": "Analysis of churn risk based on order frequency. If risk is low, say so.", "priority": "medium" },
          { "type": "Upsell", "insight": "Suggest a specific upsell opportunity (e.g., 'Suggest a side dish with their next order'). If none, state that.", "priority": "low" },
          { "type": "Birthday", "insight": "Mention if their birthday is coming up soon (within the next 30 days).", "priority": "high" }
        ],
        "suggestedActions": [
          { "action": "Send Birthday Offer via WhatsApp", "details": "Craft a personalized birthday message with a special discount.", "isApplicable": false },
          { "action": "Launch Re-engagement Email", "details": "Send a 'we miss you' email with a small discount to encourage a new order.", "isApplicable": false },
          { "action": "Add to 'High Value' Segment", "details": "Tag this user for premium offers and priority support.", "isApplicable": false }
        ]
      }

      RULES:
      - Today's date is ${new Date().toLocaleDateString()}.
      - A birthday is 'coming up' if it's within the next 30 days.
      - Churn risk is high if there are no orders in the last 60 days. Medium if none in last 30. Low otherwise.
      - A customer is 'High Value' if they have over 5000 loyalty points or have placed more than 5 orders.
      - Make the insights and actions concise and directly usable by a CRM manager.
      - Ensure 'isApplicable' is a boolean based on the data and rules.
      `;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      let jsonString = (response.text || '{}').trim();
      if (jsonString.startsWith('```json')) jsonString = jsonString.slice(7);
      if (jsonString.endsWith('```')) jsonString = jsonString.slice(0, -3);
      res.json(JSON.parse(jsonString.trim()));
    } catch (err) {
      handleServerError(res, err, 'Failed to generate CRM insights.');
    }
  });

  // Catch-all JSON 404 for unknown /api/* routes (Express 5 syntax)
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // --- Frontend Serving (Vite in dev, dist/ in production) ---
  if (NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((_req: Request, res: Response) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MoM's Vyanjan server running on http://0.0.0.0:${PORT} (${NODE_ENV})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
