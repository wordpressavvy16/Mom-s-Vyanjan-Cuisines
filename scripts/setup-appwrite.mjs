import 'dotenv/config';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * Idempotent Appwrite Database & Collection Setup Script for MoM's Vyanjan
 *
 * Usage:
 *   Add APPWRITE_API_KEY=... in .env.local (or pass via environment) and run:
 *   node scripts/setup-appwrite.mjs
 *
 * Required API Key Scopes in Appwrite Console:
 *   databases.read, databases.write, collections.read, collections.write,
 *   attributes.read, attributes.write, indexes.read, indexes.write,
 *   documents.read, documents.write,
 *   buckets.read, buckets.write, files.read, files.write
 */

const ENDPOINT = process.env.APPWRITE_ENDPOINT || process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || process.env.VITE_APPWRITE_DATABASE_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID) {
  console.error('Error: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_DATABASE_ID must be set in .env.local.');
  process.exit(1);
}

if (!API_KEY) {
  console.error('Error: APPWRITE_API_KEY environment variable is required.');
  console.error('Add APPWRITE_API_KEY=standard_xxx to .env.local and re-run: node scripts/setup-appwrite.mjs');
  process.exit(1);
}

async function appwriteFetch(path, method = 'GET', body) {
  const res = await fetch(`${ENDPOINT}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function ensureDatabase() {
  try {
    await appwriteFetch(`/databases/${DATABASE_ID}`);
    console.log(`✓ Database "${DATABASE_ID}" already exists.`);
  } catch (err) {
    if (err.status !== 404) throw err;
    await appwriteFetch('/databases', 'POST', {
      databaseId: DATABASE_ID,
      name: "MoM's Vyanjan DB",
      enabled: true,
    });
    console.log(`✓ Created database "${DATABASE_ID}".`);
  }
}

async function ensureCollection(collectionId, name, permissions, documentSecurity = false) {
  try {
    await appwriteFetch(`/databases/${DATABASE_ID}/collections/${collectionId}`);
    console.log(`✓ Collection "${collectionId}" already exists.`);
  } catch (err) {
    if (err.status !== 404) throw err;
    await appwriteFetch(`/databases/${DATABASE_ID}/collections`, 'POST', {
      collectionId,
      name,
      permissions,
      documentSecurity,
      enabled: true,
    });
    console.log(`✓ Created collection "${collectionId}" (documentSecurity=${documentSecurity}).`);
  }
}

async function ensureBucket(bucketId, name, permissions) {
  try {
    await appwriteFetch(`/storage/buckets/${bucketId}`);
    console.log(`✓ Storage bucket "${bucketId}" already exists.`);
  } catch (err) {
    if (err.status !== 404) throw err;
    await appwriteFetch('/storage/buckets', 'POST', {
      bucketId,
      name,
      permissions,
      fileSecurity: true,
      enabled: true,
      maximumFileSize: 5 * 1024 * 1024, // 5 MB
      allowedFileExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      compression: 'none',
      encryption: true,
      antivirus: true,
    });
    console.log(`✓ Created storage bucket "${bucketId}".`);
  }
}

async function ensureAttribute(collectionId, attr) {
  const { type, key, ...rest } = attr;
  const endpointMap = {
    string: 'string',
    integer: 'integer',
    float: 'float',
    boolean: 'boolean',
    email: 'email',
  };
  const path = `/databases/${DATABASE_ID}/collections/${collectionId}/attributes/${endpointMap[type]}`;
  try {
    await appwriteFetch(path, 'POST', { key, ...rest });
    console.log(`  + Attribute ${collectionId}.${key} (${type})`);
  } catch (err) {
    if (err.status === 409) {
      // Already exists
      return;
    }
    throw err;
  }
}

async function ensureIndex(collectionId, key, type, attributes) {
  try {
    await appwriteFetch(`/databases/${DATABASE_ID}/collections/${collectionId}/indexes`, 'POST', {
      key,
      type,
      attributes,
    });
    console.log(`  + Index ${collectionId}.${key}`);
  } catch (err) {
    if (err.status === 409) return;
    throw err;
  }
}

async function seedDocumentIfMissing(collectionId, documentId, data) {
  try {
    await appwriteFetch(`/databases/${DATABASE_ID}/collections/${collectionId}/documents/${documentId}`);
  } catch (err) {
    if (err.status !== 404) throw err;
    await appwriteFetch(`/databases/${DATABASE_ID}/collections/${collectionId}/documents`, 'POST', {
      documentId,
      data,
    });
    console.log(`  • Seeded ${collectionId}/${documentId}`);
  }
}

async function main() {
  console.log(`Connecting to Appwrite at ${ENDPOINT} (Project: ${PROJECT_ID})...`);
  await ensureDatabase();

  const schema = [
    {
      id: 'users',
      name: 'Users',
      documentSecurity: true,
      permissions: ['create("users")'],
      attributes: [
        { type: 'string', key: 'firstName', size: 128, required: true },
        { type: 'string', key: 'lastName', size: 128, required: false, default: '' },
        { type: 'string', key: 'email', size: 255, required: true },
        { type: 'string', key: 'role', size: 32, required: true },
        { type: 'string', key: 'profilePictureUrl', size: 2048, required: false, default: '' },
        { type: 'string', key: 'dietaryPreferences', size: 2048, required: false, default: '[]' },
        { type: 'string', key: 'savedAddresses', size: 16384, required: false, default: '[]' },
        { type: 'boolean', key: 'isGuest', required: false, default: false },
        { type: 'string', key: 'serviceZipCodes', size: 2048, required: false, default: '[]' },
        { type: 'string', key: 'whatsappNumber', size: 64, required: false, default: '' },
        { type: 'boolean', key: 'isEmailVerified', required: false, default: false },
        { type: 'boolean', key: 'isWhatsappVerified', required: false, default: false },
        { type: 'boolean', key: 'isApprovedByAdmin', required: false, default: false },
        { type: 'boolean', key: 'agreementAcknowledged', required: false, default: false },
        { type: 'string', key: 'customerLoyaltyStatus', size: 16384, required: false, default: '{}' },
        { type: 'string', key: 'referralCode', size: 64, required: false, default: '' },
        { type: 'string', key: 'referredByCode', size: 64, required: false, default: '' },
        { type: 'string', key: 'bio', size: 2048, required: false, default: '' },
        { type: 'string', key: 'birthday', size: 32, required: false, default: '' },
      ],
      indexes: [{ key: 'idx_email', type: 'key', attributes: ['email'] }],
    },
    {
      id: 'meals',
      name: 'Meals',
      documentSecurity: false,
      permissions: ['read("any")'],
      attributes: [
        { type: 'string', key: 'name', size: 255, required: true },
        { type: 'string', key: 'description', size: 4096, required: true },
        { type: 'float', key: 'price', required: true },
        { type: 'string', key: 'imageUrl', size: 2048, required: true },
        { type: 'string', key: 'category', size: 128, required: true },
        { type: 'string', key: 'ingredients', size: 4096, required: false, default: '[]' },
        { type: 'string', key: 'dietaryTags', size: 2048, required: false, default: '[]' },
        { type: 'integer', key: 'calories', required: false, default: 0 },
        { type: 'string', key: 'customizationOptions', size: 2048, required: false, default: '{}' },
        { type: 'string', key: 'partnerId', size: 64, required: false, default: '' },
      ],
      indexes: [{ key: 'idx_partner', type: 'key', attributes: ['partnerId'] }],
    },
    {
      id: 'orders',
      name: 'Orders',
      documentSecurity: true,
      permissions: ['create("users")'],
      attributes: [
        { type: 'string', key: 'userId', size: 64, required: true },
        { type: 'string', key: 'items', size: 32768, required: true },
        { type: 'float', key: 'totalAmount', required: true },
        { type: 'string', key: 'orderDate', size: 64, required: true },
        { type: 'string', key: 'status', size: 64, required: true },
        { type: 'string', key: 'mealSlot', size: 64, required: true },
        { type: 'string', key: 'deliveryDate', size: 32, required: true },
        { type: 'string', key: 'deliveryWindowDisplay', size: 255, required: true },
        { type: 'string', key: 'paymentTransactionId', size: 128, required: false, default: '' },
        { type: 'string', key: 'delegatedToPartnerId', size: 64, required: false, default: '' },
        { type: 'string', key: 'destinationAddress', size: 4096, required: false, default: '' },
        { type: 'string', key: 'destinationCoordinates', size: 512, required: false, default: '' },
        { type: 'string', key: 'currentLocation', size: 512, required: false, default: '' },
        { type: 'string', key: 'deliveryPerson', size: 1024, required: false, default: '' },
      ],
      indexes: [{ key: 'idx_userId', type: 'key', attributes: ['userId'] }],
    },
    {
      id: 'reviews',
      name: 'Reviews',
      documentSecurity: true,
      permissions: ['read("any")', 'create("users")'],
      attributes: [
        { type: 'string', key: 'orderItemId', size: 64, required: true },
        { type: 'string', key: 'mealId', size: 64, required: true },
        { type: 'string', key: 'userId', size: 64, required: true },
        { type: 'string', key: 'userName', size: 128, required: true },
        { type: 'integer', key: 'rating', required: true },
        { type: 'string', key: 'comment', size: 4096, required: true },
        { type: 'string', key: 'timestamp', size: 64, required: true },
      ],
      indexes: [
        { key: 'idx_mealId', type: 'key', attributes: ['mealId'] },
        { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      ],
    },
    {
      id: 'meal_slot_configs',
      name: 'Meal Slot Configs',
      documentSecurity: false,
      permissions: ['read("any")'],
      attributes: [
        { type: 'string', key: 'name', size: 64, required: true },
        { type: 'integer', key: 'deliveryHour', required: true },
        { type: 'integer', key: 'deliveryWindowMinutes', required: true },
        { type: 'integer', key: 'cutoffHoursBeforeDelivery', required: true },
        { type: 'string', key: 'displayWindow', size: 128, required: true },
      ],
    },
    {
      id: 'daily_menu_schedules',
      name: 'Daily Menu Schedules',
      documentSecurity: false,
      permissions: ['read("any")'],
      attributes: [
        { type: 'string', key: 'date', size: 32, required: true },
        { type: 'string', key: 'mealSlot', size: 64, required: true },
        { type: 'string', key: 'mealIds', size: 8192, required: true },
        { type: 'boolean', key: 'isSpecial', required: false, default: false },
      ],
    },
    {
      id: 'partner_applications',
      name: 'Partner Applications',
      documentSecurity: true,
      permissions: ['create("any")'],
      attributes: [
        { type: 'string', key: 'applicantName', size: 128, required: true },
        { type: 'string', key: 'email', size: 255, required: true },
        { type: 'string', key: 'businessName', size: 255, required: true },
        { type: 'string', key: 'serviceAreaNotes', size: 2048, required: true },
        { type: 'string', key: 'status', size: 32, required: true },
        { type: 'string', key: 'submittedAt', size: 64, required: true },
      ],
    },
    {
      id: 'testimonials',
      name: 'Testimonials',
      documentSecurity: false,
      permissions: ['read("any")'],
      attributes: [
        { type: 'string', key: 'name', size: 128, required: true },
        { type: 'integer', key: 'rating', required: true },
        { type: 'string', key: 'comment', size: 2048, required: true },
        { type: 'string', key: 'imageUrl', size: 2048, required: false, default: '' },
      ],
    },
    {
      id: 'social_feed_items',
      name: 'Social Feed Items',
      documentSecurity: false,
      permissions: ['read("any")'],
      attributes: [
        { type: 'string', key: 'platform', size: 64, required: true },
        { type: 'string', key: 'imageUrl', size: 2048, required: false, default: '' },
        { type: 'string', key: 'caption', size: 2048, required: true },
        { type: 'string', key: 'postUrl', size: 2048, required: true },
      ],
    },
    {
      id: 'site_settings',
      name: 'Site Settings',
      documentSecurity: false,
      permissions: ['read("any")'],
      attributes: [
        { type: 'string', key: 'siteSettingsJson', size: 16384, required: true },
        { type: 'string', key: 'mainSocialLinksJson', size: 2048, required: false, default: '{}' },
      ],
    },
  ];

  for (const col of schema) {
    await ensureCollection(col.id, col.name, col.permissions, Boolean(col.documentSecurity));
    for (const attr of col.attributes) {
      await ensureAttribute(col.id, attr);
    }
    if (col.indexes) {
      // Wait briefly for Appwrite attribute provisioning before creating indexes
      await new Promise(r => setTimeout(r, 1500));
      for (const idx of col.indexes) {
        await ensureIndex(col.id, idx.key, idx.type, idx.attributes);
      }
    }
  }

  // Wait briefly for attributes to become available before seeding
  await new Promise(r => setTimeout(r, 2000));

  // Seed default meal slot configs
  await seedDocumentIfMissing('meal_slot_configs', 'slot_breakfast', {
    name: 'Breakfast',
    deliveryHour: 9,
    deliveryWindowMinutes: 120,
    cutoffHoursBeforeDelivery: 3,
    displayWindow: '9:00 AM - 11:00 AM',
  });
  await seedDocumentIfMissing('meal_slot_configs', 'slot_lunch', {
    name: 'Lunch',
    deliveryHour: 13,
    deliveryWindowMinutes: 120,
    cutoffHoursBeforeDelivery: 3,
    displayWindow: '1:00 PM - 3:00 PM',
  });
  await seedDocumentIfMissing('meal_slot_configs', 'slot_dinner', {
    name: 'Dinner',
    deliveryHour: 20,
    deliveryWindowMinutes: 120,
    cutoffHoursBeforeDelivery: 3,
    displayWindow: '8:00 PM - 10:00 PM',
  });

  // Seed initial sample meals
  await seedDocumentIfMissing('meals', 'meal_1', {
    name: 'Paneer Butter Masala Delight',
    description: 'Creamy tomato-butter paneer curry served with fragrant jeera rice and warm rotis.',
    price: 12.99,
    imageUrl: 'https://picsum.photos/seed/paneer/400/300',
    category: 'Main Course',
    ingredients: JSON.stringify(['Paneer', 'Tomatoes', 'Butter', 'Cream', 'Spices']),
    dietaryTags: JSON.stringify(['Vegetarian']),
    calories: 650,
    customizationOptions: JSON.stringify({ spiceLevel: ['Mild', 'Medium', 'Hot'], portionSize: ['Regular', 'Large'] }),
    partnerId: '',
  });

  await seedDocumentIfMissing('meals', 'meal_2', {
    name: "Vegan Lentil Shepherd's Pie",
    description: 'Hearty spiced lentils and seasonal vegetables baked under a creamy herb potato mash.',
    price: 14.5,
    imageUrl: 'https://picsum.photos/seed/veganpie/400/300',
    category: 'Main Course',
    ingredients: JSON.stringify(['Lentils', 'Potatoes', 'Carrots', 'Peas', 'Herbs']),
    dietaryTags: JSON.stringify(['Vegan', 'Gluten-Free']),
    calories: 520,
    customizationOptions: JSON.stringify({ spiceLevel: ['Mild', 'Medium', 'Hot'], portionSize: ['Regular', 'Large'] }),
    partnerId: '',
  });

  // Provision Storage Bucket for meal photos, logos, and profile avatars
  await ensureBucket(
    process.env.VITE_APPWRITE_BUCKET_MEDIA || 'media',
    "MoM's Vyanjan Media",
    ['read("any")', 'create("users")']
  );

  console.log('\n✅ Appwrite setup complete!');
}

main().catch(err => {
  console.error('❌ Setup failed:', err.message, err.data || '');
  process.exit(1);
});
