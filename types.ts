

export enum DietaryPreference {
  VEGETARIAN = 'Vegetarian',
  VEGAN = 'Vegan',
  GLUTEN_FREE = 'Gluten-Free',
  LOW_CARB = 'Low Carb',
  HIGH_PROTEIN = 'High Protein',
  NONE = 'None'
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  PARTNER = 'partner',
  GUEST = 'guest'
}

export enum MealSlot {
  BREAKFAST = 'Breakfast',
  LUNCH = 'Lunch',
  DINNER = 'Dinner',
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  ingredients: string[];
  dietaryTags: DietaryPreference[];
  calories?: number;
  customizationOptions?: {
    spiceLevel?: ['Mild', 'Medium', 'Hot'];
    portionSize?: ['Regular', 'Large'];
  };
  partnerId?: string; 
}

export interface CartItem extends Meal {
  quantity: number;
  selectedSpiceLevel?: 'Mild' | 'Medium' | 'Hot';
  selectedPortionSize?: 'Regular' | 'Large';
}

export interface UserActiveCoupon {
  id: string;
  code: string; // e.g., WELCOME10, REF_FRIEND5
  description: string;
  discountPercentage?: number;
  fixedAmount?: number;
  expiryDate: string; // ISO String
  referralSource: 'newUserBonus' | 'referrerBonus' | 'tierReward' | 'adminGrant';
}
export interface UserCustomerLoyaltyStatus {
  points: number;
  currentTierId?: string; // ID of the current CustomerLoyaltyTier
  rewardsEarned: string[]; // Descriptions of rewards earned
  activeCoupons?: UserActiveCoupon[];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profilePictureUrl?: string;
  dietaryPreferences: DietaryPreference[];
  savedAddresses: Address[];
  isGuest?: boolean;
  serviceZipCodes?: string[]; 
  whatsappNumber?: string;
  isEmailVerified?: boolean;
  isWhatsappVerified?: boolean;
  isApprovedByAdmin?: boolean; // For partners, true if admin approved their application/account
  agreementAcknowledged?: boolean; // For partners, true if they acknowledged the digital agreement
  customerLoyaltyStatus?: UserCustomerLoyaltyStatus;
  referralCode?: string; // Unique code for this user to refer others
  referredByCode?: string; // Referral code of the user who referred this user
  bio?: string;
  birthday?: string; // YYYY-MM-DD
}

export interface Address {
  id: string;
  street: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
  location?: { lat: number; lng: number };
}

export interface ChatMessage {
  id:string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
}

export enum OrderStatus {
  PENDING_PAYMENT = 'Pending Payment',
  PROCESSING = 'Processing',
  CONFIRMED = 'Confirmed',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
  DELEGATED = 'Delegated' 
}

export interface Review {
  id: string;
  orderItemId: string; 
  mealId: string; 
  userId: string;
  userName: string; 
  rating: number; 
  comment: string;
  timestamp: Date;
}

export interface OrderItem extends Meal {
  orderItemId: string; 
  quantity: number;
  selectedSpiceLevel?: 'Mild' | 'Medium' | 'Hot';
  selectedPortionSize?: 'Regular' | 'Large';
  priceAtPurchase: number; 
  reviewId?: string; 
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: Date; 
  status: OrderStatus;
  mealSlot: MealSlot; 
  deliveryDate: string; 
  deliveryWindowDisplay: string; 
  paymentTransactionId?: string;
  delegatedToPartnerId?: string; 
  destinationAddress?: Address; 
  destinationCoordinates?: { lat: number; lng: number }; 
  currentLocation?: { lat: number; lng: number }; 
  deliveryPerson?: { 
    id: string;
    name: string;
    phone?: string;
    vehicle?: string; 
    currentLocation?: { lat: number; lng: number }; 
  };
}

export interface DeliverySlotOption {
    key: string; 
    date: Date; 
    slot: MealSlot; 
    label: string; 
    config: MealSlotConfig; 
}
  
export interface MealSlotConfig {
    id?: MealSlot; 
    name: MealSlot;
    deliveryHour: number; 
    deliveryWindowMinutes: number; 
    cutoffHoursBeforeDelivery: number;
    displayWindow: string; 
}

export interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  createdAt: string; 
  reminderDateTime?: string; // ISO string
  isReminderSet?: boolean;
  reminderAlerted?: boolean; // To prevent multiple alerts for the same reminder in a session
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string; 
  lowStockThreshold: number;
  supplier?: string;
  lastPurchasePrice?: number;
}

export interface PurchaseListItem {
  itemId: string; 
  itemName: string;
  quantityToBuy: number;
  unit: string;
  supplier?: string; 
  estimatedPrice?: number; 
}

export interface PurchaseOrder {
  id: string;
  items: PurchaseListItem[]; 
  totalActualCost: number;
  purchaseDate: string; 
  purchasedByUserId: string;
  purchasedByUserName: string;
  paymentMethod: 'Online' | 'Cash';
  status: 'Completed'; 
  supplierNotes?: string; 
}


export interface SocialPostStub {
  id: string;
  platform: string; 
  content: string;
  scheduledAt: string; 
  imageUrl?: string;
  status: 'Scheduled' | 'Posted' | 'Error' | 'Draft'; 
  targetAccounts?: string[]; 
}

export interface EmailWorkflowStub {
  id: string;
  name: string;
  trigger: string; 
  action: string; 
  isActive: boolean;
  emailProviderId?: string; 
  targetSegment?: string; 
  messageTemplate?: string; 
}

export interface PartnerApplication {
  id: string;
  applicantName: string; 
  email: string;
  businessName: string;
  serviceAreaNotes: string; 
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string; 
}

export interface ConnectedSocialAccount {
  id: string;
  platform: string;
  accountName: string; 
  mockApiTokenOrDetails: string; 
}

export interface ConnectedEmailProvider {
  id: string;
  providerName: string; 
  mockApiKeyOrDetails: string; 
}

export interface CustomerLoyaltyTier {
  id: string;
  name: string;
  pointsThreshold: number;
  rewardDescription: string; 
}

export interface CustomerLoyaltyProgramSettings {
  enabled: boolean;
  pointsPerDollar: number;
  tiers: CustomerLoyaltyTier[];
  referralRewardNewUser: { 
    description: string; 
    discountPercentage?: number; 
    fixedAmount?: number; 
    validityDays: number; 
  };
  referralRewardReferrer: { 
    description: string; 
    pointsAward?: number; 
  };
}

export interface DailyMenuSchedule {
  date: string; // YYYY-MM-DD
  mealSlot: MealSlot;
  mealIds: string[]; // Array of Meal IDs
  isSpecial?: boolean; 
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number; 
  comment: string;
  imageUrl?: string; 
}

export interface SocialFeedItem {
  id: string;
  platform: string; 
  imageUrl?: string; 
  caption: string;
  postUrl: string; 
}

export interface OpeningHoursSpecification {
  dayOfWeek: string[]; // e.g., ["Monday", "Tuesday"]
  opens: string; // e.g., "09:00"
  closes: string; // e.g., "22:00"
}

export interface BusinessInfo {
    name: string;
    tagline: string;
    logoUrl: string;
    contactEmail: string;
    contactWhatsapp: string;
    address: string;
    location: { lat: number, lng: number };
    aboutUs: string;
    priceRange?: string; // e.g., "$$"
    servesCuisine?: string; // e.g., "Indian"
    openingHours?: OpeningHoursSpecification[];
}

export interface SiteSettings {
    businessInfo: BusinessInfo;
    currency: {
        code: string;
        symbol: string;
    };
}


// --- WhatsApp Agentic AI Types ---

export interface WhatsAppButton {
  type: 'URL' | 'QUICK_REPLY';
  text: string;
  url?: string; // Only for URL type
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'Marketing' | 'Utility' | 'Authentication';
  content: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document' | 'audio';
  buttons?: WhatsAppButton[];
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  targetAudience: string;
  templateId: string;
  templateName?: string; // For display
  status: 'Draft' | 'Scheduled' | 'Sent' | 'Failed';
  scheduledAt: string; // ISO string
  stats?: {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

// New type for advanced workflow actions
export type WhatsAppAction = {
    type: 'Send Template Message';
    templateId: string;
    templateName?: string;
} | {
    type: 'Wait';
    delayMinutes: number;
} | {
    type: 'Add to Audience List';
    listName: string;
} | {
    type: 'Set Custom Attribute';
    key: string;
    value: string;
};

export interface WhatsAppAutomation {
    id: string;
    name: string;
    trigger: string;
    conditions?: {
        userSegment?: 'All Users' | 'Active Customers (Last 90d)' | 'New Users (Last 30d)' | 'High Value Customers';
        orderTotalGreaterThan?: number;
    };
    actions: WhatsAppAction[];
    isActive: boolean;
}

export interface WhatsAppAnalyticsData {
    keyMetrics: {
        messagesSent: number;
        messagesDelivered: number;
        messagesRead: number;
    };
    trends: { day: string; sent: number }[];
    topCampaigns: { name: string; sent: number; readRate: number }[];
    topTemplates: { name:string; usageCount: number }[];
}

export interface WhatsAppContact {
    id: string;
    name: string;
    whatsappNumber: string;
    profilePicUrl: string;
    email?: string;
    lastSeen: string;
    attributes: { [key: string]: string };
}

export interface WhatsAppConversation {
    id: string;
    contactId: string; // Link to WhatsAppContact
    contactName: string;
    profilePicUrl: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    messages: ChatMessage[];
    tags: string[]; // e.g., ['support-request', 'new-lead']
}