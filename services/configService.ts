import { Meal, MealSlot, MealSlotConfig, DietaryPreference, UserRole, User, TodoItem, InventoryItem, PartnerApplication, PurchaseListItem, PurchaseOrder, ConnectedSocialAccount, ConnectedEmailProvider, SocialPostStub, CustomerLoyaltyProgramSettings, CustomerLoyaltyTier, UserCustomerLoyaltyStatus, UserActiveCoupon, DailyMenuSchedule, Testimonial, SocialFeedItem, SiteSettings, Address, WhatsAppTemplate, WhatsAppCampaign, WhatsAppAutomation, OpeningHoursSpecification, WhatsAppAction, WhatsAppAnalyticsData, WhatsAppConversation, ChatMessage, WhatsAppButton, WhatsAppContact, Order, Review, OrderStatus, OrderItem, CartItem } from '../types';
import { DEFAULT_MOCK_REVIEWS_DB_CONST, DEFAULT_MOCK_ORDERS_DB_CONST } from '../constants';

const LOCAL_STORAGE_MEAL_SLOTS_KEY = 'momVyanjanMealSlotsConfig';
const LOCAL_STORAGE_MEALS_KEY = 'momVyanjanManagedMeals';
const LOCAL_STORAGE_ALL_USERS_KEY = 'momVyanjanAllUsers';
const LOCAL_STORAGE_TODOS_KEY = 'momVyanjanTodos';
const LOCAL_STORAGE_INVENTORY_KEY = 'momVyanjanInventory';
const LOCAL_STORAGE_PARTNER_APPLICATIONS_KEY = 'momVyanjanPartnerApplications';
const LOCAL_STORAGE_PURCHASE_LIST_KEY = 'momVyanjanPurchaseList';
const LOCAL_STORAGE_PURCHASE_HISTORY_KEY = 'momVyanjanPurchaseHistory';
const LOCAL_STORAGE_SOCIAL_ACCOUNTS_KEY = 'momVyanjanSocialAccounts';
const LOCAL_STORAGE_EMAIL_PROVIDERS_KEY = 'momVyanjanEmailProviders';
const LOCAL_STORAGE_CUSTOMER_LOYALTY_SETTINGS_KEY = 'momVyanjanCustomerLoyaltySettings';
const LOCAL_STORAGE_DAILY_MENU_SCHEDULES_KEY = 'momVyanjanDailyMenuSchedules';
const LOCAL_STORAGE_TESTIMONIALS_KEY = 'momVyanjanTestimonials';
const LOCAL_STORAGE_SOCIAL_FEED_ITEMS_KEY = 'momVyanjanSocialFeedItems';
const LOCAL_STORAGE_MAIN_SOCIAL_LINKS_KEY = 'momVyanjanMainSocialLinks';
const LOCAL_STORAGE_SITE_SETTINGS_KEY = 'momVyanjanSiteSettings';
const LOCAL_STORAGE_WHATSAPP_TEMPLATES_KEY = 'momVyanjanWhatsAppTemplates';
const LOCAL_STORAGE_WHATSAPP_CAMPAIGNS_KEY = 'momVyanjanWhatsAppCampaigns';
const LOCAL_STORAGE_WHATSAPP_AUTOMATIONS_KEY = 'momVyanjanWhatsAppAutomations';
const LOCAL_STORAGE_WHATSAPP_CONTACTS_KEY = 'momVyanjanWhatsAppContacts';
const LOCAL_STORAGE_WHATSAPP_CONVERSATIONS_KEY = 'momVyanjanWhatsAppConversations';

// New keys from mockDataService
const LOCAL_STORAGE_ORDERS_KEY = 'momVyanjanOrders';
const LOCAL_STORAGE_REVIEWS_KEY = 'momVyanjanReviews';


// --- In-memory DBs ---
let MOCK_ORDERS_DB_RUNTIME: Order[] = [];
let MOCK_REVIEWS_DB_RUNTIME: Review[] = [];


// --- Default Configurations ---
const DEFAULT_MEAL_SLOTS_CONFIG: MealSlotConfig[] = [
  { id: MealSlot.BREAKFAST, name: MealSlot.BREAKFAST, deliveryHour: 9, deliveryWindowMinutes: 120, cutoffHoursBeforeDelivery: 3, displayWindow: "9:00 AM - 11:00 AM" },
  { id: MealSlot.LUNCH, name: MealSlot.LUNCH, deliveryHour: 13, deliveryWindowMinutes: 120, cutoffHoursBeforeDelivery: 3, displayWindow: "1:00 PM - 3:00 PM" },
  { id: MealSlot.DINNER, name: MealSlot.DINNER, deliveryHour: 20, deliveryWindowMinutes: 120, cutoffHoursBeforeDelivery: 3, displayWindow: "8:00 PM - 10:00 PM" },
];

const DEFAULT_OPENING_HOURS: OpeningHoursSpecification[] = DEFAULT_MEAL_SLOTS_CONFIG.map(slot => {
    const deliveryEndHour = slot.deliveryHour + Math.floor(slot.deliveryWindowMinutes / 60);
    const deliveryEndMinute = slot.deliveryWindowMinutes % 60;
    return {
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: `${String(slot.deliveryHour).padStart(2, '0')}:00`,
        closes: `${String(deliveryEndHour).padStart(2, '0')}:${String(deliveryEndMinute).padStart(2, '0')}`
    }
});


const DEFAULT_SITE_SETTINGS: SiteSettings = {
  businessInfo: {
    name: "MoM's Vyanjan Tiffin Service",
    tagline: "Taste of Home, Delivered.",
    logoUrl: "", // Default empty, can be uploaded by admin
    contactEmail: "support@momsvyanjan.example.com",
    contactWhatsapp: "+1234567890",
    address: "123 Food Street, Flavor Town, 90210",
    location: { lat: 34.0522, lng: -118.2437 },
    aboutUs: "We are a family-run tiffin service dedicated to bringing you delicious, wholesome, and authentic home-style meals. Cooked with the freshest ingredients and a lot of love, we aim to deliver comfort and happiness to your doorstep every day.",
    priceRange: "$$",
    servesCuisine: "Indian",
    openingHours: DEFAULT_OPENING_HOURS,
  },
  currency: {
    code: 'USD',
    symbol: '$',
  },
};

const DEFAULT_MOCK_MEALS: Meal[] = [
  { id: '1', name: 'Paneer Butter Masala Delight', description: 'Creamy paneer curry with rich tomato gravy, perfect with naan or rice.', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW5kaWFuJTIwZm9vZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=400&h=300&q=80', category: 'Main Course', ingredients: ['Paneer', 'Butter', 'Cream', 'Tomato', 'Onion', 'Spices'], dietaryTags: [DietaryPreference.VEGETARIAN], calories: 450, customizationOptions: { spiceLevel: ['Mild', 'Medium', 'Hot'], portionSize: ['Regular', 'Large']} },
  { id: '2', name: 'Vegan Lentil Shepherd\'s Pie', description: 'Hearty lentils and mixed vegetables topped with fluffy mashed sweet potato.', price: 14.50, imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a058387cc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8dmVnYW4lMjBmb29kfGVufDB8fDB8fHww&auto=format&fit=crop&w=400&h=300&q=80', category: 'Main Course', ingredients: ['Lentils', 'Carrots', 'Peas', 'Corn', 'Onion', 'Sweet Potato'], dietaryTags: [DietaryPreference.VEGAN, DietaryPreference.GLUTEN_FREE], calories: 380, customizationOptions: {portionSize: ['Regular', 'Large']} },
  { id: '3', name: 'Spicy Chana Masala', description: 'Flavorful chickpea curry with a balanced spice kick, served with a hint of lemon.', price: 11.50, imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGluZGlhbiUyMGZvb2R8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&h=300&q=80', category: 'Main Course', ingredients: ['Chickpeas', 'Onion', 'Tomato', 'Ginger', 'Garlic', 'Spices', 'Cilantro'], dietaryTags: [DietaryPreference.VEGETARIAN, DietaryPreference.VEGAN], calories: 320, customizationOptions: { spiceLevel: ['Mild', 'Medium', 'Hot']}},
  { id: '4', name: 'Classic Dal Makhani', description: 'Rich and creamy black lentils slow-cooked with butter and aromatic spices.', price: 10.99, imageUrl: 'https://plus.unsplash.com/premium_photo-1695298407000-8704b78671e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGluZGlhbiUyMGZvb2R8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&h=300&q=80', category: 'Main Course', ingredients: ['Black Lentils', 'Kidney Beans', 'Butter', 'Cream', 'Tomato Puree', 'Spices'], dietaryTags: [DietaryPreference.VEGETARIAN], calories: 400, customizationOptions: { spiceLevel: ['Mild', 'Medium', 'Hot']}},
  { id: '5', name: 'Aloo Gobi Adraki', description: 'Homestyle potatoes and cauliflower florets tossed with ginger and turmeric.', price: 9.50, imageUrl: 'https://images.unsplash.com/photo-1606491048802-8004277c5hsx?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YWxvbyUyMGdvYmhpfGVufDB8fDB8fHww&auto=format&fit=crop&w=400&h=300&q=80', category: 'Side Dish', ingredients: ['Potatoes', 'Cauliflower', 'Ginger', 'Turmeric', 'Cumin Seeds', 'Spices'], dietaryTags: [DietaryPreference.VEGAN, DietaryPreference.GLUTEN_FREE], calories: 250 },
  { id: '6', name: 'Methi Thepla (Set of 3)', description: 'Soft Gujarati flatbreads with fenugreek leaves, perfect with yogurt or pickle.', price: 7.00, imageUrl: 'https://picsum.photos/seed/thepla/400/300', category: 'Breads & Sides', ingredients: ['Whole Wheat Flour', 'Fenugreek Leaves', 'Yogurt', 'Spices'], dietaryTags: [DietaryPreference.VEGETARIAN], calories: 280 },
  { id: '7', name: 'Moong Dal Cheela (Set of 2)', description: 'Savory lentil pancakes, a light and protein-rich option.', price: 8.50, imageUrl: 'https://picsum.photos/seed/cheela/400/300', category: 'Breakfast & Snacks', ingredients: ['Moong Dal', 'Ginger', 'Green Chilies', 'Cilantro'], dietaryTags: [DietaryPreference.VEGAN, DietaryPreference.GLUTEN_FREE, DietaryPreference.HIGH_PROTEIN], calories: 220 },
  { id: 'default-partner-meal-1', name: 'Partner Special: Chicken Biryani', description: 'Aromatic and flavorful chicken biryani, a specialty from our trusted partner.', price: 15.99, imageUrl: 'https://plus.unsplash.com/premium_photo-1694699354981-493b788386614?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fGJpcnlhbml8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&h=300&q=80', category: 'Main Course', ingredients: ['Chicken', 'Basmati Rice', 'Yogurt', 'Spices', 'Saffron'], dietaryTags: [], calories: 550, partnerId: 'partnerUserIdExample' },
  { id: 'default-partner-meal-2', name: 'Partner Veg Korma', description: 'Mixed vegetables in a creamy cashew-based gravy, from our partner kitchen.', price: 13.50, imageUrl: 'https://images.unsplash.com/photo-1589647363585-f4a7d38779df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8a29ybWF8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=400&h=300&q=80', category: 'Main Course', ingredients: ['Mixed Vegetables', 'Cashew', 'Cream', 'Spices'], dietaryTags: [DietaryPreference.VEGETARIAN], calories: 420, partnerId: 'partnerUserIdExample' },
];

const DEFAULT_TODOS: TodoItem[] = [
    { id: 'todo-1', task: 'Check inventory for paneer and onions', completed: true, createdAt: new Date().toISOString() },
    { id: 'todo-2', task: 'Plan weekend special menu', completed: false, createdAt: new Date().toISOString(), isReminderSet: true, reminderDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
    { id: 'todo-3', task: 'Finalize Q4 marketing budget', completed: false, createdAt: new Date().toISOString() },
];

const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  { id: 'inv-1', name: 'Paneer Blocks', quantity: 20, unit: 'kg', lowStockThreshold: 15, supplier: 'Amul Dairy' },
  { id: 'inv-2', name: 'Basmati Rice', quantity: 50, unit: 'kg', lowStockThreshold: 20, supplier: 'India Gate' },
  { id: 'inv-3', name: 'Onions', quantity: 15, unit: 'kg', lowStockThreshold: 10, supplier: 'Local Market' },
  { id: 'inv-4', name: 'Tomatoes', quantity: 12, unit: 'kg', lowStockThreshold: 10, supplier: 'Local Market' },
  { id: 'inv-5', name: 'Takeaway Containers - 500ml', quantity: 250, unit: 'pcs', lowStockThreshold: 100, supplier: 'Packaging Co.' },
];

const DEFAULT_PARTNER_APPLICATIONS: PartnerApplication[] = [
    { id: 'pa-1', applicantName: 'Suresh Gupta', email: 'suresh@guptatiffins.com', businessName: "Gupta's Tiffins", serviceAreaNotes: 'Serves zip codes 90210, 90212. Specializes in North Indian.', status: 'Pending', submittedAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'pa-2', applicantName: 'Priya Singh', email: 'priya@southdelights.net', businessName: "South Delights", serviceAreaNotes: 'South Indian cuisine, covers downtown area.', status: 'Approved', submittedAt: new Date(Date.now() - 3*86400000).toISOString() },
];

const DEFAULT_CUSTOMER_LOYALTY_SETTINGS: CustomerLoyaltyProgramSettings = {
    enabled: true,
    pointsPerDollar: 10,
    tiers: [
        { id: 'tier-bronze', name: 'Bronze Member', pointsThreshold: 1000, rewardDescription: 'Get a free side dish on your next order!' },
        { id: 'tier-silver', name: 'Silver Member', pointsThreshold: 5000, rewardDescription: '15% off your next order (up to $10)!' },
        { id: 'tier-gold', name: 'Gold Member', pointsThreshold: 15000, rewardDescription: 'Get a free meal on us!' }
    ],
    referralRewardNewUser: {
      description: '10% off your first order!',
      discountPercentage: 10,
      validityDays: 30
    },
    referralRewardReferrer: {
      description: 'Earn 500 points!',
      pointsAward: 500
    }
};

const DEFAULT_DAILY_SCHEDULES: DailyMenuSchedule[] = [
    { date: new Date().toISOString().split('T')[0], mealSlot: MealSlot.LUNCH, mealIds: ['1', '3', '5'], isSpecial: true },
    { date: new Date().toISOString().split('T')[0], mealSlot: MealSlot.DINNER, mealIds: ['2', '4'], isSpecial: false },
    { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], mealSlot: MealSlot.LUNCH, mealIds: ['6', '7'], isSpecial: false },
];

const DEFAULT_TESTIMONIALS: Testimonial[] = [
    { id: 'testi-1', name: 'Anjali P.', rating: 5, comment: "The Paneer Butter Masala was heavenly! Tasted just like home. The delivery was prompt and the packaging was great. Highly recommend!", imageUrl: 'https://i.pravatar.cc/150?u=anjali' },
    { id: 'testi-2', name: 'Raj V.', rating: 4, comment: "A solid tiffin service. The food is consistently good and feels very wholesome. The Vegan Shepherd's Pie was a pleasant surprise. Would love more variety in the sides.", imageUrl: 'https://i.pravatar.cc/150?u=raj' },
    { id: 'testi-3', name: 'Chloe T.', rating: 5, comment: "As someone who is new to Indian food, MoM's Vyanjan has been the perfect introduction. Delicious, not too heavy, and the spice levels are just right. Love it!", imageUrl: 'https://i.pravatar.cc/150?u=chloe' },
];

const DEFAULT_SOCIAL_FEED_ITEMS: SocialFeedItem[] = [
  { id: 'social-1', platform: 'Instagram', imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60', caption: 'Fresh, vibrant, and packed with flavor! 🌱 Our salad of the day is a rainbow on a plate. #HealthyEating #TiffinService #MomsVyanjan', postUrl: '#' },
  { id: 'social-2', platform: 'Facebook', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Zm9vZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60', caption: "What's for dinner tonight? Let us take care of it! Our delicious home-style meals are just an order away. Link in bio to see today's menu!", postUrl: '#' },
];

const DEFAULT_MAIN_SOCIAL_LINKS = {
    instagram: 'https://instagram.com/momsvyanjan_mock',
    facebook: 'https://facebook.com/momsvyanjan_mock',
};

const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
    { id: 'w-template-1', name: 'welcome_message', category: 'Utility', content: 'Hello {{1}}! Welcome to MoM\'s Vyanjan Tiffin Service. We are excited to have you with us. Explore our daily menu here: [Link]', status: 'Approved', buttons: [] },
    { id: 'w-template-2', name: 'order_confirmation', category: 'Utility', content: 'Hi {{1}}, your order #{{2}} has been confirmed and will be delivered during your selected slot: {{3}}. Thank you for choosing us!', status: 'Approved', buttons: [] },
    { 
        id: 'w-template-3', 
        name: 'feedback_request', 
        category: 'Marketing', 
        content: 'We hope you enjoyed your meal! Could you take a moment to leave us a review? Your feedback helps us improve. Thanks!', 
        status: 'Approved',
        buttons: [
            { type: 'QUICK_REPLY', text: '⭐️⭐️⭐️⭐️⭐️' },
            { type: 'QUICK_REPLY', text: '⭐️⭐️⭐️' },
            { type: 'URL', text: 'Write a Review', url: 'https://momsvyanjan.example.com/profile' }
        ]
    },
    { id: 'w-template-4', name: 'promo_weekend', category: 'Marketing', content: 'Weekend Special! Get 15% off on all orders above $50. Use code: WEEKEND15. Order now! 🍛', status: 'Pending', buttons: [] },
    { id: 'w-template-5', name: 'order_delivered', category: 'Utility', content: 'Great news, {{1}}! Your MoM\'s Vyanjan order #{{2}} has been delivered. We hope you enjoy your delicious meal!', status: 'Approved', buttons: [] },
    { id: 'w-template-6', name: 'festive_offer', category: 'Marketing', content: 'Happy {{1}}! ✨ Celebrate with MoM\'s Vyanjan. Enjoy a special 20% discount on all orders this week. Let us add to your festive cheer!', status: 'Approved', buttons: [] },
];

const DEFAULT_WHATSAPP_AUTOMATIONS: WhatsAppAutomation[] = [
    {
        id: 'w-auto-1',
        name: 'Welcome New Users',
        trigger: 'New User Signup',
        actions: [
            { type: 'Send Template Message', templateId: 'w-template-1', templateName: 'welcome_message' },
            { type: 'Add to Audience List', listName: 'New Subscribers' }
        ],
        isActive: true
    },
    {
        id: 'w-auto-2',
        name: 'Post-Delivery Feedback',
        trigger: 'Order Delivered',
        actions: [
            { type: 'Wait', delayMinutes: 60 },
            { type: 'Send Template Message', templateId: 'w-template-3', templateName: 'feedback_request' }
        ],
        isActive: false
    }
];

const DEFAULT_WHATSAPP_CONTACTS: WhatsAppContact[] = [
    { id: 'wacontact-1', name: 'Priya Sharma', whatsappNumber: '+919876543210', profilePicUrl: 'https://i.pravatar.cc/150?u=priya', email: 'priya.sharma@example.com', lastSeen: '11:05 AM', attributes: { 'City': 'Mumbai', 'Loyalty Tier': 'Gold' } },
    { id: 'wacontact-2', name: 'Amit Patel', whatsappNumber: '+919123456789', profilePicUrl: 'https://i.pravatar.cc/150?u=amit', email: 'amit.patel@example.com', lastSeen: '10:43 AM', attributes: { 'City': 'Delhi', 'Last Order': 'Paneer Butter Masala' } },
    { id: 'wacontact-3', name: 'John Doe', whatsappNumber: '+12345678900', profilePicUrl: 'https://i.pravatar.cc/150?u=john', email: 'john.doe@example.com', lastSeen: 'Yesterday', attributes: { 'Inquiry': 'Vegan Options' } },
];

const DEFAULT_WHATSAPP_CONVERSATIONS: WhatsAppConversation[] = [
    { 
        id: 'conv-1', 
        contactId: 'wacontact-1',
        contactName: 'Priya Sharma', 
        lastMessage: 'Okay, thank you for the update!', 
        timestamp: '10:45 AM', 
        unreadCount: 0, 
        profilePicUrl: 'https://i.pravatar.cc/150?u=priya',
        tags: ['vip-customer', 'feedback-received'],
        messages: [
            { id: 'c1m1', sender: 'user', text: 'Hi, I have a question about my last order.', timestamp: new Date(Date.now() - 3600000 * 2) },
            { id: 'c1m2', sender: 'ai', text: 'Hello Priya! I can certainly help with that. Could you please provide the order ID?', timestamp: new Date(Date.now() - 3600000 * 1.9) },
            { id: 'c1m3', sender: 'user', text: 'It\'s #ORD-789123', timestamp: new Date(Date.now() - 3600000 * 1) },
            { id: 'c1m4', sender: 'ai', text: 'Thank you. I see the order was for Paneer Butter Masala. It was delivered yesterday. Is there a specific issue?', timestamp: new Date(Date.now() - 300000) },
            { id: 'c1m5', sender: 'user', text: 'Yes, it was a bit too spicy for my liking, although it was delicious!', timestamp: new Date(Date.now() - 240000) },
            { id: 'c1m6', sender: 'ai', text: 'I apologize for that. I\'ve added a note to your profile to prefer mild spice levels for future orders. As a token of our apology, we\'ve added 100 loyalty points to your account.', timestamp: new Date(Date.now() - 180000) },
            { id: 'c1m7', sender: 'user', text: 'Okay, thank you for the update!', timestamp: new Date(Date.now() - 120000) }
        ]
    },
    { 
        id: 'conv-2', 
        contactId: 'wacontact-2',
        contactName: 'Amit Patel', 
        lastMessage: 'Can I change my delivery address for tomorrow?', 
        timestamp: '10:42 AM', 
        unreadCount: 2, 
        profilePicUrl: 'https://i.pravatar.cc/150?u=amit',
        tags: ['address-change', 'urgent'],
        messages: [
            { id: 'c2m1', sender: 'user', text: 'Can I change my delivery address for tomorrow?', timestamp: new Date(Date.now() - 60000 * 5) }
        ]
    },
    { 
        id: 'conv-3', 
        contactId: 'wacontact-3',
        contactName: 'John Doe', 
        lastMessage: 'Great, sounds good.', 
        timestamp: 'Yesterday', 
        unreadCount: 0, 
        profilePicUrl: 'https://i.pravatar.cc/150?u=john',
        tags: ['product-inquiry'],
        messages: [
            { id: 'c3m1', sender: 'user', text: 'Is the dal makhani vegan?', timestamp: new Date(Date.now() - 86400000 * 1.2) },
            { id: 'c3m2', sender: 'ai', text: 'Our Classic Dal Makhani is vegetarian but contains cream and butter, so it is not vegan. Our Vegan Lentil Shepherd\'s Pie is a great vegan alternative!', timestamp: new Date(Date.now() - 86400000 * 1.1) },
            { id: 'c3m3', sender: 'user', text: 'Great, sounds good.', timestamp: new Date(Date.now() - 86400000 * 1.0) }
        ]
    },
];

// --- Helper Functions ---
const getData = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Error parsing data for key ${key} from localStorage`, error);
  }
  return defaultValue;
};

const saveData = <T,>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving data for key ${key} to localStorage`, error);
  }
};

// --- Initialization Block ---
(() => {
  // Load Orders
  const storedOrdersRaw = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
  if (storedOrdersRaw) {
    try {
      const parsedOrders: Order[] = JSON.parse(storedOrdersRaw);
      MOCK_ORDERS_DB_RUNTIME = parsedOrders.map(order => ({
        ...order,
        orderDate: new Date(order.orderDate), 
      }));
    } catch (e) {
      console.error("Failed to parse orders from localStorage, resetting to defaults:", e);
      MOCK_ORDERS_DB_RUNTIME = DEFAULT_MOCK_ORDERS_DB_CONST.map(o => ({...o, orderDate: new Date(o.orderDate)})); 
      saveData(LOCAL_STORAGE_ORDERS_KEY, MOCK_ORDERS_DB_RUNTIME);
    }
  } else {
    MOCK_ORDERS_DB_RUNTIME = DEFAULT_MOCK_ORDERS_DB_CONST.map(o => ({...o, orderDate: new Date(o.orderDate)}));
    saveData(LOCAL_STORAGE_ORDERS_KEY, MOCK_ORDERS_DB_RUNTIME);
  }

  // Load Reviews
  const storedReviewsRaw = localStorage.getItem(LOCAL_STORAGE_REVIEWS_KEY);
  if(storedReviewsRaw) {
    try {
        MOCK_REVIEWS_DB_RUNTIME = JSON.parse(storedReviewsRaw).map((review: Review) => ({
            ...review,
            timestamp: new Date(review.timestamp) 
        }));
    } catch (e) {
        console.error("Failed to parse reviews from localStorage, resetting to defaults:", e);
        MOCK_REVIEWS_DB_RUNTIME = [...DEFAULT_MOCK_REVIEWS_DB_CONST].map(r => ({...r, timestamp: new Date(r.timestamp)}));
        saveData(LOCAL_STORAGE_REVIEWS_KEY, MOCK_REVIEWS_DB_RUNTIME); 
    }
  } else {
      MOCK_REVIEWS_DB_RUNTIME = [...DEFAULT_MOCK_REVIEWS_DB_CONST].map(r => ({...r, timestamp: new Date(r.timestamp)}));
      saveData(LOCAL_STORAGE_REVIEWS_KEY, MOCK_REVIEWS_DB_RUNTIME); 
  }
})();


// --- Site Settings ---
export const getSiteSettings = (): SiteSettings => {
  return getData(LOCAL_STORAGE_SITE_SETTINGS_KEY, DEFAULT_SITE_SETTINGS);
};

export const saveSiteSettings = (settings: SiteSettings): void => {
  saveData(LOCAL_STORAGE_SITE_SETTINGS_KEY, settings);
};


// --- Meal Slot Configuration ---
export const getConfiguredMealSlots = (): MealSlotConfig[] => {
  let slots = getData<MealSlotConfig[]>(LOCAL_STORAGE_MEAL_SLOTS_KEY, DEFAULT_MEAL_SLOTS_CONFIG);
  // Ensure displayWindow is present (for migrating from older versions)
  slots = slots.map(slot => ({ ...slot, displayWindow: slot.displayWindow || generateDisplayWindow(slot) }));
  return slots;
};

export const updateConfiguredMealSlots = (newConfigs: MealSlotConfig[]): void => {
  // Update displayWindow before saving
  const configsWithDisplayWindow = newConfigs.map(config => ({
    ...config,
    displayWindow: generateDisplayWindow(config)
  }));
  saveData(LOCAL_STORAGE_MEAL_SLOTS_KEY, configsWithDisplayWindow);
};

export function generateDisplayWindow(config: MealSlotConfig): string {
  const formatTime = (hour: number) => new Date(1970, 0, 1, hour).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const startHour = config.deliveryHour;
  const endHour = startHour + Math.floor(config.deliveryWindowMinutes / 60);
  const endMinute = config.deliveryWindowMinutes % 60;
  
  const tempDate = new Date();
  tempDate.setHours(endHour, endMinute);

  return `${formatTime(startHour)} - ${tempDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}


// --- Meal Management ---
export const getManagedMeals = (user?: User): Meal[] => {
  let meals = getData<Meal[]>(LOCAL_STORAGE_MEALS_KEY, DEFAULT_MOCK_MEALS);
  if (user && user.role === UserRole.PARTNER) {
    return meals.filter(meal => meal.partnerId === user.id);
  }
  return meals;
};

export const addManagedMeal = (newMealData: Omit<Meal, 'id'>, user: User | null): Meal => {
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER && user.role !== UserRole.PARTNER)) {
    throw new Error("Unauthorized to add meals.");
  }
  const allMeals = getManagedMeals();
  const newMeal: Meal = {
    ...newMealData,
    id: `meal-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    partnerId: user.role === UserRole.PARTNER ? user.id : undefined,
  };
  allMeals.push(newMeal);
  saveData(LOCAL_STORAGE_MEALS_KEY, allMeals);
  return newMeal;
};

export const updateManagedMeal = (updatedMeal: Meal, user: User | null): Meal => {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER && (user.role === UserRole.PARTNER && updatedMeal.partnerId !== user.id))) {
      throw new Error("Unauthorized to update this meal.");
    }
    const allMeals = getManagedMeals();
    const index = allMeals.findIndex(m => m.id === updatedMeal.id);
    if (index !== -1) {
        allMeals[index] = updatedMeal;
        saveData(LOCAL_STORAGE_MEALS_KEY, allMeals);
        return updatedMeal;
    }
    throw new Error("Meal not found for update.");
};

export const deleteManagedMeal = (mealId: string, user: User | null): void => {
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER && user.role !== UserRole.PARTNER)) {
      throw new Error("Unauthorized to delete meals.");
    }
    let allMeals = getManagedMeals();
    const mealToDelete = allMeals.find(m => m.id === mealId);

    if (user.role === UserRole.PARTNER && mealToDelete?.partnerId !== user.id) {
         throw new Error("Unauthorized: Partner can only delete their own meals.");
    }

    allMeals = allMeals.filter(m => m.id !== mealId);
    saveData(LOCAL_STORAGE_MEALS_KEY, allMeals);
};


// --- Daily Menu Planner ---
export const getDailyMenuSchedules = (): DailyMenuSchedule[] => {
    return getData(LOCAL_STORAGE_DAILY_MENU_SCHEDULES_KEY, DEFAULT_DAILY_SCHEDULES);
};

export const addDailyMenuSchedule = (newSchedule: DailyMenuSchedule) => {
    let schedules = getDailyMenuSchedules();
    // Remove any existing schedule for the same date and slot
    schedules = schedules.filter(s => !(s.date === newSchedule.date && s.mealSlot === newSchedule.mealSlot));
    schedules.push(newSchedule);
    saveData(LOCAL_STORAGE_DAILY_MENU_SCHEDULES_KEY, schedules);
};

// Function to get today's meals for the homepage
export const getTodaysScheduledMeals = (slot: MealSlot): Meal[] => {
    const todayStr = new Date().toISOString().split('T')[0];
    const schedules = getDailyMenuSchedules();
    const allMeals = getManagedMeals();

    const todaysSchedule = schedules.find(s => s.date === todayStr && s.mealSlot === slot);
    if (todaysSchedule) {
        return todaysSchedule.mealIds.map(id => allMeals.find(m => m.id === id)).filter(m => m !== undefined) as Meal[];
    }
    return [];
};


// --- To-Do List Management ---
export const getTodos = (): TodoItem[] => {
  return getData(LOCAL_STORAGE_TODOS_KEY, DEFAULT_TODOS);
};

export const addTodo = (task: string, reminderDateTime?: string): void => {
  const todos = getTodos();
  const newTodo: TodoItem = {
    id: `todo-${Date.now()}`,
    task,
    completed: false,
    createdAt: new Date().toISOString(),
    reminderDateTime,
    isReminderSet: !!reminderDateTime
  };
  todos.unshift(newTodo); // Add to top
  saveData(LOCAL_STORAGE_TODOS_KEY, todos);
};

export const toggleTodo = (id: string): void => {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveData(LOCAL_STORAGE_TODOS_KEY, todos);
  }
};

export const deleteTodo = (id: string): void => {
  let todos = getTodos();
  todos = todos.filter(t => t.id !== id);
  saveData(LOCAL_STORAGE_TODOS_KEY, todos);
};

export const updateTodoReminder = (id: string, reminderDateTime: string | undefined, isReminderSet: boolean): void => {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.isReminderSet = isReminderSet;
    todo.reminderDateTime = isReminderSet ? reminderDateTime : undefined;
    todo.reminderAlerted = false; // Reset alerted status when reminder is changed
    saveData(LOCAL_STORAGE_TODOS_KEY, todos);
  }
};

export const markTodoReminderAlerted = (id: string): void => {
    const todos = getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.reminderAlerted = true;
        saveData(LOCAL_STORAGE_TODOS_KEY, todos);
    }
}


// --- Inventory Management ---
export const getInventoryItems = (): InventoryItem[] => {
  return getData(LOCAL_STORAGE_INVENTORY_KEY, DEFAULT_INVENTORY_ITEMS);
};

export const addInventoryItem = (newItemData: Omit<InventoryItem, 'id'>): void => {
  const items = getInventoryItems();
  const newItem: InventoryItem = { ...newItemData, id: `inv-${Date.now()}` };
  items.push(newItem);
  saveData(LOCAL_STORAGE_INVENTORY_KEY, items);
};

export const updateInventoryItem = (updatedItem: InventoryItem): void => {
  let items = getInventoryItems();
  const index = items.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    items[index] = updatedItem;
    saveData(LOCAL_STORAGE_INVENTORY_KEY, items);
  }
};

export const deleteInventoryItem = (id: string): void => {
    let items = getInventoryItems();
    items = items.filter(i => i.id !== id);
    saveData(LOCAL_STORAGE_INVENTORY_KEY, items);
};


// --- User Management / CRM ---
export const getManagedUsers = (): User[] => {
  return getData<User[]>(LOCAL_STORAGE_ALL_USERS_KEY, []);
};

export const saveManagedUsers = (users: User[]): void => {
    saveData(LOCAL_STORAGE_ALL_USERS_KEY, users);
};

export const getPartners = (): User[] => {
  const allUsers = getManagedUsers();
  return allUsers.filter(user => user.role === UserRole.PARTNER && user.isApprovedByAdmin);
};

export const deleteManagedUser = (userIdToDelete: string, currentAdminId: string): boolean => {
    if (userIdToDelete === currentAdminId) {
        alert("Error: Admins cannot delete their own account.");
        return false;
    }
    let allUsers = getManagedUsers();
    allUsers = allUsers.filter(u => u.id !== userIdToDelete);
    saveManagedUsers(allUsers);
    return true;
};

// --- Partner Application Management ---
export const getPartnerApplications = (): PartnerApplication[] => {
    return getData(LOCAL_STORAGE_PARTNER_APPLICATIONS_KEY, DEFAULT_PARTNER_APPLICATIONS);
};

export const submitPartnerApplication = async (applicationData: Omit<PartnerApplication, 'id' | 'status' | 'submittedAt'>): Promise<PartnerApplication> => {
    const applications = getPartnerApplications();
    // Simulate check for existing email
    const existing = applications.find(app => app.email.toLowerCase() === applicationData.email.toLowerCase());
    if (existing && existing.status !== 'Rejected') {
        throw new Error(`An application with email ${applicationData.email} is already ${existing.status.toLowerCase()}.`);
    }
    const newApplication: PartnerApplication = {
        ...applicationData,
        id: `pa-${Date.now()}`,
        status: 'Pending',
        submittedAt: new Date().toISOString(),
    };
    applications.unshift(newApplication);
    saveData(LOCAL_STORAGE_PARTNER_APPLICATIONS_KEY, applications);
    return newApplication;
};

export const updatePartnerApplicationStatus = (appId: string, status: 'Approved' | 'Rejected'): void => {
    const applications = getPartnerApplications();
    const appIndex = applications.findIndex(a => a.id === appId);
    if (appIndex !== -1) {
        applications[appIndex].status = status;
        if (status === 'Approved') {
            // Automatically create a partner user account
            createManualPartnerUser({
                firstName: applications[appIndex].applicantName.split(' ')[0] || 'Partner',
                lastName: applications[appIndex].applicantName.split(' ').slice(1).join(' ') || 'User',
                email: applications[appIndex].email,
                businessName: applications[appIndex].businessName
            });
        }
        saveData(LOCAL_STORAGE_PARTNER_APPLICATIONS_KEY, applications);
    }
};

export const createManualPartnerUser = (partnerData: {firstName: string, lastName: string, email: string, businessName: string}): User | null => {
    const allUsers = getManagedUsers();
    if (allUsers.find(u => u.email.toLowerCase() === partnerData.email.toLowerCase())) {
        alert(`Error: A user with the email ${partnerData.email} already exists.`);
        return null;
    }

    const newPartnerUser: User = {
        id: `user-partner-${Date.now()}`,
        firstName: partnerData.firstName,
        lastName: partnerData.lastName,
        email: partnerData.email,
        bio: `${partnerData.businessName}`,
        role: UserRole.PARTNER,
        isApprovedByAdmin: true,
        agreementAcknowledged: false, // They must acknowledge it on first login
        profilePictureUrl: `https://picsum.photos/seed/${partnerData.firstName}/100/100`,
        dietaryPreferences: [],
        savedAddresses: [],
        customerLoyaltyStatus: { points: 0, rewardsEarned: [], activeCoupons: [] },
        referralCode: generateUserReferralCode(partnerData.firstName),
    };

    allUsers.push(newPartnerUser);
    saveManagedUsers(allUsers);
    return newPartnerUser;
};

export const acknowledgePartnerAgreement = (partnerId: string) => {
    const users = getManagedUsers();
    const partnerIndex = users.findIndex(u => u.id === partnerId && u.role === UserRole.PARTNER);
    if (partnerIndex !== -1) {
        users[partnerIndex].agreementAcknowledged = true;
        saveManagedUsers(users);
    }
};

// --- Procurement Management ---
export const getPurchaseList = (): PurchaseListItem[] => {
  return getData(LOCAL_STORAGE_PURCHASE_LIST_KEY, []);
};
const savePurchaseList = (list: PurchaseListItem[]) => {
  saveData(LOCAL_STORAGE_PURCHASE_LIST_KEY, list);
};
export const getPurchaseHistory = (): PurchaseOrder[] => {
  return getData(LOCAL_STORAGE_PURCHASE_HISTORY_KEY, []);
};
export const addToPurchaseList = (inventoryItem: InventoryItem, quantityToBuy: number, supplier?: string, estimatedPrice?: number) => {
  let list = getPurchaseList();
  const existingIndex = list.findIndex(item => item.itemId === inventoryItem.id);
  if (existingIndex !== -1) {
    list[existingIndex].quantityToBuy += quantityToBuy;
  } else {
    list.push({
      itemId: inventoryItem.id,
      itemName: inventoryItem.name,
      quantityToBuy,
      unit: inventoryItem.unit,
      supplier: supplier || inventoryItem.supplier,
      estimatedPrice: estimatedPrice || inventoryItem.lastPurchasePrice
    });
  }
  savePurchaseList(list);
};
export const removeFromPurchaseList = (itemId: string) => {
  let list = getPurchaseList();
  list = list.filter(item => item.itemId !== itemId);
  savePurchaseList(list);
};
export const updatePurchaseListItem = (itemId: string, updates: Partial<PurchaseListItem>) => {
    let list = getPurchaseList();
    const index = list.findIndex(item => item.itemId === itemId);
    if(index !== -1) {
        list[index] = {...list[index], ...updates};
        savePurchaseList(list);
    }
};
export const clearPurchaseList = () => {
  savePurchaseList([]);
};
export const recordPurchaseOrder = (purchaseData: Omit<PurchaseOrder, 'id' | 'purchaseDate' | 'status'>) => {
  // Update inventory based on purchase
  const inventory = getInventoryItems();
  purchaseData.items.forEach(purchasedItem => {
    const invIndex = inventory.findIndex(invItem => invItem.id === purchasedItem.itemId);
    if (invIndex !== -1) {
      inventory[invIndex].quantity += purchasedItem.quantityToBuy;
      if(purchasedItem.estimatedPrice) {
        inventory[invIndex].lastPurchasePrice = purchasedItem.estimatedPrice;
      }
    }
  });
  saveData(LOCAL_STORAGE_INVENTORY_KEY, inventory);

  // Record the purchase order
  const history = getPurchaseHistory();
  const newPurchaseOrder: PurchaseOrder = {
    ...purchaseData,
    id: `po-${Date.now()}`,
    purchaseDate: new Date().toISOString(),
    status: 'Completed',
  };
  history.unshift(newPurchaseOrder);
  saveData(LOCAL_STORAGE_PURCHASE_HISTORY_KEY, history);
};


// --- Integrations ---
export const getConnectedSocialAccounts = (): ConnectedSocialAccount[] => {
    return getData(LOCAL_STORAGE_SOCIAL_ACCOUNTS_KEY, []);
};
export const addConnectedSocialAccount = (account: Omit<ConnectedSocialAccount, 'id'>) => {
    const accounts = getConnectedSocialAccounts();
    accounts.push({ ...account, id: `socacc-${Date.now()}` });
    saveData(LOCAL_STORAGE_SOCIAL_ACCOUNTS_KEY, accounts);
};
export const deleteConnectedSocialAccount = (id: string) => {
    let accounts = getConnectedSocialAccounts();
    accounts = accounts.filter(acc => acc.id !== id);
    saveData(LOCAL_STORAGE_SOCIAL_ACCOUNTS_KEY, accounts);
};

export const getConnectedEmailProviders = (): ConnectedEmailProvider[] => {
    return getData(LOCAL_STORAGE_EMAIL_PROVIDERS_KEY, []);
};
export const addConnectedEmailProvider = (provider: Omit<ConnectedEmailProvider, 'id'>) => {
    const providers = getConnectedEmailProviders();
    providers.push({ ...provider, id: `emailprov-${Date.now()}` });
    saveData(LOCAL_STORAGE_EMAIL_PROVIDERS_KEY, providers);
};
export const deleteConnectedEmailProvider = (id: string) => {
    let providers = getConnectedEmailProviders();
    providers = providers.filter(p => p.id !== id);
    saveData(LOCAL_STORAGE_EMAIL_PROVIDERS_KEY, providers);
};

// --- Customer Loyalty Program ---
export const getCustomerLoyaltyProgramSettings = (): CustomerLoyaltyProgramSettings => {
  return getData(LOCAL_STORAGE_CUSTOMER_LOYALTY_SETTINGS_KEY, DEFAULT_CUSTOMER_LOYALTY_SETTINGS);
};

export const saveCustomerLoyaltyProgramSettings = (settings: CustomerLoyaltyProgramSettings): void => {
  saveData(LOCAL_STORAGE_CUSTOMER_LOYALTY_SETTINGS_KEY, settings);
};

// This function is called when a user places an order
export const updateUserCustomerLoyaltyOnOrder = (userId: string, orderTotal: number) => {
    const settings = getCustomerLoyaltyProgramSettings();
    if (!settings.enabled) return;

    const allUsers = getManagedUsers();
    const userIndex = allUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    const user = allUsers[userIndex];
    if (!user.customerLoyaltyStatus) {
        user.customerLoyaltyStatus = { points: 0, rewardsEarned: [], activeCoupons: [] };
    }

    const pointsEarned = Math.floor(orderTotal * settings.pointsPerDollar);
    user.customerLoyaltyStatus.points += pointsEarned;

    // Check for new tier
    const sortedTiers = [...settings.tiers].sort((a,b) => b.pointsThreshold - a.pointsThreshold);
    for (const tier of sortedTiers) {
        if (user.customerLoyaltyStatus.points >= tier.pointsThreshold) {
            if (user.customerLoyaltyStatus.currentTierId !== tier.id) {
                user.customerLoyaltyStatus.currentTierId = tier.id;
                // Potentially add a reward/coupon for reaching a new tier
                 user.customerLoyaltyStatus.rewardsEarned.push(`Reached ${tier.name} tier!`);
            }
            break; 
        }
    }

    allUsers[userIndex] = user;
    saveManagedUsers(allUsers);
};

export const generateUserReferralCode = (name: string): string => {
    const sanitizedName = name.replace(/\s+/g, '').toUpperCase().substring(0, 5);
    const randomNum = Math.floor(100 + Math.random() * 900); // 3-digit random number
    return `${sanitizedName}${randomNum}`;
};

export const applyReferralRewards = (newUserId: string, referringUserCode: string) => {
    const settings = getCustomerLoyaltyProgramSettings();
    if (!settings.enabled) return;

    const allUsers = getManagedUsers();
    const newUserIndex = allUsers.findIndex(u => u.id === newUserId);
    const referringUserIndex = allUsers.findIndex(u => u.referralCode === referringUserCode);

    if (newUserIndex === -1 || referringUserIndex === -1) {
        console.warn("Could not apply referral rewards: User not found.");
        return;
    }

    // Apply reward to the new user
    const newUserReward = settings.referralRewardNewUser;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + newUserReward.validityDays);

    const newCoupon: UserActiveCoupon = {
        id: `coupon-ref-new-${Date.now()}`,
        code: `WELCOME_${newUserId.substring(0,4)}`,
        description: newUserReward.description,
        discountPercentage: newUserReward.discountPercentage,
        fixedAmount: newUserReward.fixedAmount,
        expiryDate: expiryDate.toISOString(),
        referralSource: 'newUserBonus'
    };

    if (!allUsers[newUserIndex].customerLoyaltyStatus) { allUsers[newUserIndex].customerLoyaltyStatus = { points: 0, rewardsEarned: [], activeCoupons: [] }; }
    if (!allUsers[newUserIndex].customerLoyaltyStatus!.activeCoupons) { allUsers[newUserIndex].customerLoyaltyStatus!.activeCoupons = []; }
    allUsers[newUserIndex].customerLoyaltyStatus!.activeCoupons!.push(newCoupon);

    // Apply reward to the referring user
    const referrerReward = settings.referralRewardReferrer;
    if (referrerReward.pointsAward && referrerReward.pointsAward > 0) {
        if (!allUsers[referringUserIndex].customerLoyaltyStatus) { allUsers[referringUserIndex].customerLoyaltyStatus = { points: 0, rewardsEarned: [], activeCoupons: [] }; }
        allUsers[referringUserIndex].customerLoyaltyStatus!.points += referrerReward.pointsAward;
    }
    
    saveManagedUsers(allUsers);
};

// Address Management
export const addUserAddress = (userId: string, newAddressData: Omit<Address, 'id'>): User | null => {
    const users = getManagedUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const newAddress: Address = {
        ...newAddressData,
        id: `addr-${Date.now()}`
    };

    if (!users[userIndex].savedAddresses) {
        users[userIndex].savedAddresses = [];
    }

    // if it's the first address or set to default, make it default
    if (users[userIndex].savedAddresses.length === 0 || newAddress.isDefault) {
        users[userIndex].savedAddresses.forEach(addr => addr.isDefault = false);
        newAddress.isDefault = true;
    }
    
    users[userIndex].savedAddresses.push(newAddress);
    saveManagedUsers(users);
    return users[userIndex];
};

export const updateUserAddress = (userId: string, updatedAddress: Address): User | null => {
    const users = getManagedUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const addressIndex = users[userIndex].savedAddresses.findIndex(addr => addr.id === updatedAddress.id);
    if (addressIndex === -1) return null;

    if (updatedAddress.isDefault) {
        users[userIndex].savedAddresses.forEach(addr => addr.isDefault = false);
    }
    
    users[userIndex].savedAddresses[addressIndex] = updatedAddress;
    saveManagedUsers(users);
    return users[userIndex];
};

export const deleteUserAddress = (userId: string, addressId: string): User | null => {
    const users = getManagedUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    
    users[userIndex].savedAddresses = users[userIndex].savedAddresses.filter(addr => addr.id !== addressId);
    
    // if the deleted address was the default, make the first one default
    if (users[userIndex].savedAddresses.length > 0 && !users[userIndex].savedAddresses.some(a => a.isDefault)) {
        users[userIndex].savedAddresses[0].isDefault = true;
    }

    saveManagedUsers(users);
    return users[userIndex];
};

export const setUserDefaultAddress = (userId: string, addressId: string): User | null => {
    const users = getManagedUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    users[userIndex].savedAddresses.forEach(addr => {
        addr.isDefault = addr.id === addressId;
    });

    saveManagedUsers(users);
    return users[userIndex];
};


// --- Site Content ---
export const getTestimonials = (): Testimonial[] => getData(LOCAL_STORAGE_TESTIMONIALS_KEY, DEFAULT_TESTIMONIALS);
export const addTestimonial = (testimonialData: Omit<Testimonial, 'id'>) => {
    const testimonials = getTestimonials();
    const newTestimonial: Testimonial = { ...testimonialData, id: `testi-${Date.now()}` };
    testimonials.unshift(newTestimonial);
    saveData(LOCAL_STORAGE_TESTIMONIALS_KEY, testimonials);
};
export const deleteTestimonial = (id: string) => {
    let testimonials = getTestimonials();
    testimonials = testimonials.filter(t => t.id !== id);
    saveData(LOCAL_STORAGE_TESTIMONIALS_KEY, testimonials);
};

export const getSocialFeedItems = (): SocialFeedItem[] => getData(LOCAL_STORAGE_SOCIAL_FEED_ITEMS_KEY, DEFAULT_SOCIAL_FEED_ITEMS);
export const addSocialFeedItem = (itemData: Omit<SocialFeedItem, 'id'>) => {
    const items = getSocialFeedItems();
    const newItem: SocialFeedItem = { ...itemData, id: `social-${Date.now()}` };
    items.unshift(newItem);
    saveData(LOCAL_STORAGE_SOCIAL_FEED_ITEMS_KEY, items);
};
export const deleteSocialFeedItem = (id: string) => {
    let items = getSocialFeedItems();
    items = items.filter(i => i.id !== id);
    saveData(LOCAL_STORAGE_SOCIAL_FEED_ITEMS_KEY, items);
};

export const getMainSocialLinks = (): { instagram: string, facebook: string } => getData(LOCAL_STORAGE_MAIN_SOCIAL_LINKS_KEY, DEFAULT_MAIN_SOCIAL_LINKS);
export const saveMainSocialLinks = (links: { instagram: string, facebook: string }) => {
    saveData(LOCAL_STORAGE_MAIN_SOCIAL_LINKS_KEY, links);
};


// --- WhatsApp Agentic AI ---
export const getWhatsAppTemplates = (): WhatsAppTemplate[] => getData(LOCAL_STORAGE_WHATSAPP_TEMPLATES_KEY, DEFAULT_WHATSAPP_TEMPLATES);
export const saveWhatsAppTemplates = (templates: WhatsAppTemplate[]) => saveData(LOCAL_STORAGE_WHATSAPP_TEMPLATES_KEY, templates);

export const getWhatsAppCampaigns = (): WhatsAppCampaign[] => getData(LOCAL_STORAGE_WHATSAPP_CAMPAIGNS_KEY, []);
export const saveWhatsAppCampaigns = (campaigns: WhatsAppCampaign[]) => saveData(LOCAL_STORAGE_WHATSAPP_CAMPAIGNS_KEY, campaigns);

export const getWhatsAppAutomations = (): WhatsAppAutomation[] => getData(LOCAL_STORAGE_WHATSAPP_AUTOMATIONS_KEY, DEFAULT_WHATSAPP_AUTOMATIONS);
export const saveWhatsAppAutomations = (automations: WhatsAppAutomation[]) => saveData(LOCAL_STORAGE_WHATSAPP_AUTOMATIONS_KEY, automations);

export const getWhatsAppAnalytics = (): WhatsAppAnalyticsData => {
    return {
        keyMetrics: { messagesSent: 10482, messagesDelivered: 10123, messagesRead: 7890 },
        trends: [
            { day: '7 days ago', sent: 1200 }, { day: '6 days ago', sent: 1350 }, { day: '5 days ago', sent: 1100 }, { day: '4 days ago', sent: 1500 }, { day: '3 days ago', sent: 1450 }, { day: '2 days ago', sent: 1800 }, { day: 'Yesterday', sent: 1950 }
        ],
        topCampaigns: [
            { name: 'Diwali Special 2023', sent: 5200, readRate: 85 },
            { name: 'Weekend Bonanza Oct', sent: 2500, readRate: 72 },
        ],
        topTemplates: [
            { name: 'order_confirmation', usageCount: 8940 },
            { name: 'order_delivered', usageCount: 8512 },
            { name: 'welcome_message', usageCount: 1510 },
        ]
    };
};

export const getWhatsAppContacts = (): WhatsAppContact[] => getData(LOCAL_STORAGE_WHATSAPP_CONTACTS_KEY, DEFAULT_WHATSAPP_CONTACTS);
export const saveWhatsAppContacts = (contacts: WhatsAppContact[]) => saveData(LOCAL_STORAGE_WHATSAPP_CONTACTS_KEY, contacts);

export const getWhatsAppConversations = (): WhatsAppConversation[] => getData(LOCAL_STORAGE_WHATSAPP_CONVERSATIONS_KEY, DEFAULT_WHATSAPP_CONVERSATIONS);
export const saveWhatsAppConversations = (conversations: WhatsAppConversation[]) => saveData(LOCAL_STORAGE_WHATSAPP_CONVERSATIONS_KEY, conversations);

export const updateConversationTags = (conversationId: string, newTags: string[]): WhatsAppConversation[] => {
    let convos = getWhatsAppConversations();
    const index = convos.findIndex(c => c.id === conversationId);
    if (index !== -1) {
        convos[index].tags = newTags;
        saveWhatsAppConversations(convos);
    }
    return convos;
};


// --- Order & Review Management (Moved from mockDataService) ---
export const getAllOrders = (): Order[] => {
  return [...MOCK_ORDERS_DB_RUNTIME].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
};

export const getOrderById = (orderId: string): Order | null => {
  const order = MOCK_ORDERS_DB_RUNTIME.find(o => o.id === orderId) || null;
  return order ? { ...order } : null;
};

export const getReviewsForMeal = (mealId: string): Review[] => {
  const reviews = MOCK_REVIEWS_DB_RUNTIME.filter(review => review.mealId === mealId);
  return [...reviews].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getReviewsByUserId = (userId: string): Review[] => {
  const reviews = MOCK_REVIEWS_DB_RUNTIME.filter(review => review.userId === userId);
  return [...reviews].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const addReview = (userId: string, userName: string, mealId: string, orderItemId: string, rating: number, comment: string): Review => {
  const newReview: Review = {
    id: `review-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId, userName, mealId, orderItemId, rating, comment,
    timestamp: new Date(),
  };
  MOCK_REVIEWS_DB_RUNTIME.push(newReview);
  
  const orderIndex = MOCK_ORDERS_DB_RUNTIME.findIndex(order => order.items.some(item => item.orderItemId === orderItemId));
  if (orderIndex !== -1) {
    const itemIndex = MOCK_ORDERS_DB_RUNTIME[orderIndex].items.findIndex(item => item.orderItemId === orderItemId);
    if (itemIndex !== -1) {
      MOCK_ORDERS_DB_RUNTIME[orderIndex].items[itemIndex].reviewId = newReview.id;
      saveData(LOCAL_STORAGE_ORDERS_KEY, MOCK_ORDERS_DB_RUNTIME);
    }
  }
  saveData(LOCAL_STORAGE_REVIEWS_KEY, MOCK_REVIEWS_DB_RUNTIME);
  return newReview;
};

export const addOrder = (currentUser: User, cartItems: CartItem[], totalAmount: number, mealSlot: MealSlot, deliveryDate: string, deliveryWindowDisplay: string, destinationAddress?: Address): Order => {
  const orderItems: OrderItem[] = cartItems.map((cartItem, index) => ({
    ...cartItem, 
    orderItemId: `orderitem-${Date.now()}-${index}`, 
    priceAtPurchase: cartItem.price, 
  }));

  const finalDestinationAddress = destinationAddress || 
                                 currentUser.savedAddresses.find(a=>a.isDefault) || 
                                 { id: 'addr-mock-' + Date.now(), street: '123 Mock St', city: 'Anytown', zipCode: '90001', isDefault: true, location: { lat: 34.0522, lng: -118.2437 } };

  const mockLat = finalDestinationAddress.location?.lat || 34.0522 + (Math.random() - 0.5) * 0.1;
  const mockLng = finalDestinationAddress.location?.lng || -118.2437 + (Math.random() - 0.5) * 0.1;

  const newOrder: Order = {
    id: `order-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    userId: currentUser.id,
    items: orderItems,
    totalAmount: totalAmount,
    orderDate: new Date(),
    status: OrderStatus.CONFIRMED,
    paymentTransactionId: `txn-${Date.now()}`,
    mealSlot: mealSlot,
    deliveryDate: deliveryDate,
    deliveryWindowDisplay: deliveryWindowDisplay,
    destinationAddress: finalDestinationAddress,
    destinationCoordinates: { lat: mockLat, lng: mockLng },
  };
  MOCK_ORDERS_DB_RUNTIME.unshift(newOrder);
  saveData(LOCAL_STORAGE_ORDERS_KEY, MOCK_ORDERS_DB_RUNTIME);
  return newOrder;
};

export const getUserOrders = (userId: string): Order[] => {
  const userOrders = MOCK_ORDERS_DB_RUNTIME.filter(order => order.userId === userId);
  return [...userOrders].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
};

export const setOrderStatus = (orderId: string, newStatus: OrderStatus, newLocation?: { lat: number; lng: number }): Order | null => {
  const orderIndex = MOCK_ORDERS_DB_RUNTIME.findIndex(o => o.id === orderId);
  if (orderIndex === -1) return null;

  const order = MOCK_ORDERS_DB_RUNTIME[orderIndex];
  order.status = newStatus;

  if (newStatus === OrderStatus.OUT_FOR_DELIVERY) {
    const defaultStartLat = order.destinationCoordinates ? order.destinationCoordinates.lat - 0.02 : 34.0000;
    const defaultStartLng = order.destinationCoordinates ? order.destinationCoordinates.lng - 0.02 : -118.3000;
    order.currentLocation = newLocation || order.currentLocation || { lat: defaultStartLat, lng: defaultStartLng };
    if (!order.deliveryPerson) {
      order.deliveryPerson = {
        id: `dp-${order.id.substring(0,5)}`,
        name: ["Raju Rastogi", "Sita Devi", "Amit Kumar"][Math.floor(Math.random()*3)],
        vehicle: "Scooter",
        currentLocation: order.currentLocation
      };
    } else {
        order.deliveryPerson.currentLocation = order.currentLocation;
    }
  } else if (newStatus === OrderStatus.DELIVERED) {
    order.currentLocation = order.destinationCoordinates;
    if(order.deliveryPerson) order.deliveryPerson.currentLocation = order.destinationCoordinates;
  }
  
  MOCK_ORDERS_DB_RUNTIME[orderIndex] = order;
  saveData(LOCAL_STORAGE_ORDERS_KEY, MOCK_ORDERS_DB_RUNTIME);
  return { ...order };
};

export const setOrderLocation = (orderId: string, newOrderLocation: { lat: number; lng: number }, newDeliveryPersonLocation?: { lat: number; lng: number }): Order | null => {
  const orderIndex = MOCK_ORDERS_DB_RUNTIME.findIndex(o => o.id === orderId);
  if (orderIndex === -1) return null;
  
  const order = MOCK_ORDERS_DB_RUNTIME[orderIndex];
  order.currentLocation = newOrderLocation;
  if (order.deliveryPerson) { 
    order.deliveryPerson.currentLocation = newDeliveryPersonLocation || newOrderLocation;
  }
  
  MOCK_ORDERS_DB_RUNTIME[orderIndex] = order;
  // Note: Persisting every tick can be heavy. Consider persisting on major events only.
  // saveData(LOCAL_STORAGE_ORDERS_KEY, MOCK_ORDERS_DB_RUNTIME); 
  return { ...order };
};
