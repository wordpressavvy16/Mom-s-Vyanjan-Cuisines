

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, DietaryPreference, Order, CartItem, UserRole, MealSlot, Address } from '../types';
import * as apiService from '../services/apiService';
import { getManagedUsers, saveManagedUsers, generateUserReferralCode, applyReferralRewards, addUserAddress as serviceAddUserAddress, updateUserAddress as serviceUpdateUserAddress, deleteUserAddress as serviceDeleteUserAddress, setUserDefaultAddress as serviceSetUserDefaultAddress, updateUserCustomerLoyaltyOnOrder } from '../services/configService'; // Some logic remains here until full backend

const LOCAL_STORAGE_CURRENT_USER_KEY = 'momVyanjanUser';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  signup: (firstName: string, lastName: string, email: string, pass: string, whatsappNumber?: string, referralCodeUsed?: string) => Promise<void>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loading: boolean;
  orders: Order[];
  fetchOrders: () => Promise<void>;
  addOrder: (
    cartItems: CartItem[], 
    totalAmount: number, 
    mealSlot: MealSlot, 
    deliveryDate: string, 
    deliveryWindowDisplay: string 
  ) => Promise<Order | null>;
  updateUserProfile: (updatedUser: User) => Promise<void>;
  referralCodeFromUrl: string | null;
  // Address Management
  addUserAddress: (newAddressData: Omit<Address, 'id'>) => Promise<void>;
  updateUserAddress: (updatedAddress: Address) => Promise<void>;
  deleteUserAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState<string | null>(null);

  const fetchOrdersForUser = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const userOrders = await apiService.fetchUserOrders(userId);
      setOrders(userOrders);
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
      setOrders([]); 
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    // Check for referral code in URL hash
    const hash = window.location.hash; // e.g., #/signup?ref=USERCODE123
    const refMatch = hash.match(/[?&]ref=([^&]+)/);
    if (refMatch && refMatch[1]) {
      setReferralCodeFromUrl(refMatch[1]);
    }

    const storedUser = localStorage.getItem(LOCAL_STORAGE_CURRENT_USER_KEY);
    if (storedUser) {
      const user: User = JSON.parse(storedUser);
      setCurrentUser(user);
      if (user && !user.isGuest) {
        fetchOrdersForUser(user.id);
      }
    }
    
    // User initialization logic can remain here for now as it's part of the app's startup
    let allUsers = getManagedUsers(); // Use configService
    if (allUsers.length === 0) {
        const defaultUsers: User[] = [
             { id: 'adminUserId', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: UserRole.ADMIN, dietaryPreferences: [], savedAddresses: [], profilePictureUrl: 'https://picsum.photos/seed/admin/100/100', isEmailVerified: true, isWhatsappVerified: false, isApprovedByAdmin: true, customerLoyaltyStatus: { points: 0, rewardsEarned: [], activeCoupons: [] }, referralCode: generateUserReferralCode('Admin'), birthday: '1985-05-20' },
             { id: 'managerUserId', firstName: 'Manager', lastName: 'User', email: 'manager@example.com', role: UserRole.MANAGER, dietaryPreferences: [DietaryPreference.VEGETARIAN], savedAddresses: [], profilePictureUrl: 'https://picsum.photos/seed/manager/100/100', isEmailVerified: true, isWhatsappVerified: false, isApprovedByAdmin: true, customerLoyaltyStatus: { points: 0, rewardsEarned: [], activeCoupons: [] }, referralCode: generateUserReferralCode('Manager') },
             { id: 'partnerUserIdExample', firstName: 'Partner', lastName: 'Tiffins', email: 'partner@example.com', role: UserRole.PARTNER, dietaryPreferences: [], savedAddresses: [], profilePictureUrl: 'https://picsum.photos/seed/partner/100/100', serviceZipCodes: ['90210', '90211'], isEmailVerified: true, isWhatsappVerified: false, isApprovedByAdmin: true, agreementAcknowledged: true, customerLoyaltyStatus: { points: 0, rewardsEarned: [], activeCoupons: [] }, referralCode: generateUserReferralCode('Partner') },
             { id: 'mockUserId', firstName: 'Test', lastName: 'User', email: 'user@example.com', role: UserRole.USER, dietaryPreferences: [DietaryPreference.VEGETARIAN], savedAddresses: [], profilePictureUrl: 'https://picsum.photos/seed/user/100/100', isEmailVerified: true, isWhatsappVerified: false, customerLoyaltyStatus: { points: 1200, currentTierId: 'tier-bronze', rewardsEarned: [], activeCoupons: [] }, referralCode: generateUserReferralCode('Test'), birthday: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0] }
        ];
        saveManagedUsers(defaultUsers); // Use configService
        allUsers = defaultUsers;
    }
    allUsers = allUsers.map(u => ({
        ...u,
        referralCode: u.referralCode || generateUserReferralCode(u.firstName || 'User'),
        customerLoyaltyStatus: u.customerLoyaltyStatus || { points: 0, rewardsEarned: [], activeCoupons: [] }
    }));
    saveManagedUsers(allUsers);


    setLoading(false);
  }, [fetchOrdersForUser]);

  
  const updateUserInAllUsersList = async (updatedUser: User) => {
    let allUsers = await apiService.fetchManagedUsers();
    const userIndex = allUsers.findIndex(u => u.id === updatedUser.id);
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser;
    } else {
      allUsers.push(updatedUser); 
    }
    await apiService.saveManagedUsers(allUsers);
  };

  const updateUserProfile = async (updatedUser: User) => {
    if (!currentUser || currentUser.id !== updatedUser.id) {
      throw new Error("User mismatch or not logged in for profile update.");
    }
    setLoading(true);
    await updateUserInAllUsersList(updatedUser); 
    setCurrentUser(updatedUser);
    localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
    setLoading(false);
  };

  const addUserAddress = async (newAddressData: Omit<Address, 'id'>) => {
    if (!currentUser) throw new Error("User not logged in.");
    const updatedUser = serviceAddUserAddress(currentUser.id, newAddressData);
    if (updatedUser) {
        setCurrentUser(updatedUser);
        localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const updateUserAddress = async (updatedAddress: Address) => {
      if (!currentUser) throw new Error("User not logged in.");
      const updatedUser = serviceUpdateUserAddress(currentUser.id, updatedAddress);
      if (updatedUser) {
          setCurrentUser(updatedUser);
          localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
  };
  
  const deleteUserAddress = async (addressId: string) => {
      if (!currentUser) throw new Error("User not logged in.");
      const updatedUser = serviceDeleteUserAddress(currentUser.id, addressId);
      if (updatedUser) {
          setCurrentUser(updatedUser);
          localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
  };
  
  const setDefaultAddress = async (addressId: string) => {
      if (!currentUser) throw new Error("User not logged in.");
      const updatedUser = serviceSetUserDefaultAddress(currentUser.id, addressId);
      if (updatedUser) {
          setCurrentUser(updatedUser);
          localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedUser));
      }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    let userToLogin: User | null = null;
    let allUsers = await apiService.fetchManagedUsers();
    
    const existingUserInAll = allUsers.find(u => u.email === email);

    if (existingUserInAll && pass === 'password') { 
        if (existingUserInAll.role === UserRole.PARTNER && !existingUserInAll.isApprovedByAdmin) {
            setLoading(false);
            throw new Error("Your partner account is awaiting admin approval or has not been fully verified.");
        }
        userToLogin = existingUserInAll;
    } else if (pass === 'password' && !existingUserInAll) { 
        userToLogin = {
            id: 'guestUserId-' + Date.now(), 
            firstName: 'Guest', lastName: 'User', email: email, role: UserRole.GUEST,
            dietaryPreferences: [], savedAddresses: [], isGuest: true,
            isEmailVerified: false, isWhatsappVerified: false,
            customerLoyaltyStatus: { points: 0, rewardsEarned: [], activeCoupons: [] },
            referralCode: generateUserReferralCode('Guest'),
          };
    } else {
        setLoading(false);
        throw new Error("Invalid email or password.");
    }
    
    setCurrentUser(userToLogin);
    localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(userToLogin));

    if (userToLogin && !userToLogin.isGuest && userToLogin.role !== UserRole.GUEST) {
      await fetchOrdersForUser(userToLogin.id);
    } else {
      setOrders([]); 
    }
    
    if (userToLogin && userToLogin.role !== UserRole.GUEST) {
        closeAuthModal();
    }
    setLoading(false);
  };

  const signup = async (firstName: string, lastName: string, email: string, pass: string, whatsappNumber?: string, referralCodeUsed?: string) => {
    setLoading(true);
    let allUsers = getManagedUsers(); // Still need sync access for immediate check
    if (allUsers.find(u => u.email === email)) {
        setLoading(false);
        throw new Error("This email address is already registered.");
    }

    const newUser: User = {
      id: `user_${Date.now()}`, 
      firstName, lastName, email, role: UserRole.USER,
      whatsappNumber: whatsappNumber || undefined,
      isEmailVerified: false, isWhatsappVerified: false, isApprovedByAdmin: false, agreementAcknowledged: false, 
      dietaryPreferences: [], savedAddresses: [], 
      profilePictureUrl: `https://picsum.photos/seed/${firstName}/100/100`,
      customerLoyaltyStatus: { points: 0, currentTierId: undefined, rewardsEarned: [], activeCoupons: [] },
      referralCode: generateUserReferralCode(firstName),
      referredByCode: referralCodeUsed || undefined,
    };
    
    allUsers.push(newUser); 
    await apiService.saveManagedUsers(allUsers);

    if (referralCodeUsed) {
        const referringUser = allUsers.find(u => u.referralCode === referralCodeUsed && u.id !== newUser.id);
        if (referringUser) {
            applyReferralRewards(newUser.id, referringUser.referralCode as string);
            allUsers = getManagedUsers(); // Re-fetch sync for immediate update
            const updatedNewUser = allUsers.find(u => u.id === newUser.id) || newUser;
            setCurrentUser(updatedNewUser);
            localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(updatedNewUser));
        } else {
            setCurrentUser(newUser);
            localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(newUser));
            console.warn("Referral code used during signup was invalid or self-referral attempt.");
        }
    } else {
        setCurrentUser(newUser);
        localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(newUser));
    }
    
    await fetchOrdersForUser(newUser.id); 
    setLoading(false);
  };

  const logout = () => {
    setCurrentUser(null);
    setOrders([]);
    localStorage.removeItem(LOCAL_STORAGE_CURRENT_USER_KEY);
  };
  
  const addOrder = async (
    cartItems: CartItem[], 
    totalAmount: number,
    mealSlot: MealSlot,
    deliveryDate: string, 
    deliveryWindowDisplay: string
  ): Promise<Order | null> => {
    if (!currentUser || currentUser.isGuest || currentUser.role === UserRole.GUEST) {
        console.error("User must be logged in to place an order.");
        openAuthModal();
        return null;
    }
    setLoading(true);
    try {
        const newOrder = await apiService.saveOrder(currentUser, cartItems, totalAmount, mealSlot, deliveryDate, deliveryWindowDisplay);
        setOrders(prevOrders => [newOrder, ...prevOrders].sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())); 
        
        updateUserCustomerLoyaltyOnOrder(currentUser.id, totalAmount);
        
        const refreshedUser = getManagedUsers().find(u => u.id === currentUser.id); // Sync get for immediate feedback
        if (refreshedUser) {
            setCurrentUser(refreshedUser);
            localStorage.setItem(LOCAL_STORAGE_CURRENT_USER_KEY, JSON.stringify(refreshedUser));
        }

        return newOrder;
    } catch (error) {
        console.error("Failed to save order:", error);
        return null;
    } finally {
        setLoading(false);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const memoizedFetchOrders = useCallback(async () => {
    if (currentUser && !currentUser.isGuest && currentUser.role !== UserRole.GUEST) {
      await fetchOrdersForUser(currentUser.id);
    }
  }, [currentUser, fetchOrdersForUser]);

  return (
    <AuthContext.Provider value={{ 
        currentUser, login, logout, signup, 
        isAuthModalOpen, openAuthModal, closeAuthModal, loading, 
        orders, 
        fetchOrders: memoizedFetchOrders, 
        addOrder,
        updateUserProfile,
        referralCodeFromUrl,
        addUserAddress,
        updateUserAddress,
        deleteUserAddress,
        setDefaultAddress
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
