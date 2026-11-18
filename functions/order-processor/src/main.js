import { Client, Databases } from 'node-appwrite';

/**
 * Appwrite Function: order-processor
 * Triggered on `databases.6afd5fad00308dc976ef.collections.orders.documents.*.create`
 * or via direct HTTP POST with { orderId, userId, totalAmount }.
 */
export default async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const apiKey = req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !databaseId || !apiKey) {
    error('Missing Appwrite Function configuration (endpoint, projectId, databaseId, or API key).');
    return res.json({ ok: false, message: 'Server configuration missing on function.' }, 500);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const databases = new Databases(client);

  let payload = {};
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.json({ ok: false, message: 'Invalid JSON payload' }, 400);
  }

  const orderId = payload.$id || payload.orderId;
  const userId = payload.userId;
  const totalAmount = Number(payload.totalAmount || 0);

  if (!userId || !orderId) {
    return res.json({ ok: true, message: 'Health check / no order payload provided.' });
  }

  try {
    const pointsEarned = Math.max(0, Math.floor(totalAmount * 10));
    const userDoc = await databases.getDocument(databaseId, 'users', userId);

    let loyalty = { points: 0, rewardsEarned: [], activeCoupons: [] };
    try {
      loyalty = JSON.parse(userDoc.customerLoyaltyStatus || '{}');
    } catch {
      loyalty = { points: 0, rewardsEarned: [], activeCoupons: [] };
    }

    const updatedLoyalty = {
      ...loyalty,
      points: Number(loyalty.points || 0) + pointsEarned,
      rewardsEarned: Array.isArray(loyalty.rewardsEarned) ? loyalty.rewardsEarned : [],
      activeCoupons: Array.isArray(loyalty.activeCoupons) ? loyalty.activeCoupons : [],
    };

    await databases.updateDocument(databaseId, 'users', userId, {
      customerLoyaltyStatus: JSON.stringify(updatedLoyalty),
    });

    log(`Processed order ${orderId}: awarded ${pointsEarned} loyalty points to user ${userId}.`);
    return res.json({ ok: true, orderId, userId, pointsEarned, totalPoints: updatedLoyalty.points });
  } catch (err) {
    error(`Failed to process order ${orderId}: ${err.message}`);
    return res.json({ ok: false, message: err.message }, 500);
  }
};
