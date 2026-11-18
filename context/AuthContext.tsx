import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, Order, CartItem, UserRole, MealSlot, Address } from '../types';
import * as apiService from '../services/apiService';
import * as appwriteService from '../services/appwriteService';
import { clearAppwriteJwtCache, getAppwriteJwt } from '../services/appwriteClient';
import {
  generateUserReferralCode,
  updateUserCustomerLoyaltyOnOrder,
} from '../services/configService';

// Legacy key cleanup on boot so stale PII from earlier versions is purged from localStorage
const LEGACY_LOCAL_USER_KEY = 'momVyanjanUser';
const LEGACY_ALL_USERS_KEY = 'momVyanjanAllUsers';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  signup: (
    firstName: string,
    lastName: string,
    email: string,
    pass: string,
    whatsappNumber?: string,
    referralCodeUsed?: string
  ) => Promise<void>;
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
  addUserAddress: (newAddressData: Omit<Address, 'id'>) => Promise<void>;
  updateUserAddress: (updatedAddress: Address) => Promise<void>;
  deleteUserAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Store authenticated user strictly in React memory (never persist PII or credentials in localStorage)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState<string | null>(null);

  const fetchOrdersForUser = useCallback(async (userId: string) => {
    try {
      const userOrders = await apiService.fetchUserOrders(userId);
      setOrders(userOrders);
    } catch (error) {
      console.error('Failed to fetch user orders:', error);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initAuth = async () => {
      // Purge any legacy client-stored PII / demo accounts
      try {
        localStorage.removeItem(LEGACY_LOCAL_USER_KEY);
        localStorage.removeItem(LEGACY_ALL_USERS_KEY);
      } catch {
        // Ignore storage restrictions
      }

      const hash = window.location.hash;
      const refMatch = hash.match(/[?&]ref=([^&]+)/);
      if (refMatch && refMatch[1] && active) {
        setReferralCodeFromUrl(refMatch[1]);
      }

      // Restore authenticated session strictly from Appwrite server session
      try {
        const appwriteUser = await appwriteService.getCurrentAppwriteSessionUser();
        if (appwriteUser && active) {
          // Refresh profile via JWT-verified backend route if available
          let resolvedUser = appwriteUser;
          try {
            const jwt = await getAppwriteJwt();
            if (jwt) {
              const res = await fetch('/api/users/me', {
                headers: { Authorization: `Bearer ${jwt}` },
              });
              if (res.ok) {
                resolvedUser = await res.json();
              }
            }
          } catch {
            // Keep Appwrite session user if backend /api/users/me is unavailable
          }

          if (active) {
            setCurrentUser(resolvedUser);
            await fetchOrdersForUser(resolvedUser.id);
          }
        }
      } catch {
        // No active Appwrite session
      }

      if (active) setLoading(false);
    };

    initAuth();
    return () => {
      active = false;
    };
  }, [fetchOrdersForUser]);

  const persistUserUpdate = async (updatedUser: User) => {
    const saved = await apiService.saveUserProfile(updatedUser);
    setCurrentUser(saved);
  };

  const updateUserProfile = async (updatedUser: User) => {
    if (!currentUser || currentUser.id !== updatedUser.id) {
      throw new Error('User mismatch or not logged in for profile update.');
    }
    setLoading(true);
    try {
      await persistUserUpdate(updatedUser);
    } finally {
      setLoading(false);
    }
  };

  const addUserAddress = async (newAddressData: Omit<Address, 'id'>) => {
    if (!currentUser) throw new Error('User not logged in.');
    const nextAddresses = [
      ...(currentUser.savedAddresses || []).map(a =>
        newAddressData.isDefault ? { ...a, isDefault: false } : a
      ),
      { ...newAddressData, id: `addr_${Date.now()}` },
    ];
    await persistUserUpdate({ ...currentUser, savedAddresses: nextAddresses });
  };

  const updateUserAddress = async (updatedAddress: Address) => {
    if (!currentUser) throw new Error('User not logged in.');
    const nextAddresses = (currentUser.savedAddresses || []).map(a =>
      a.id === updatedAddress.id
        ? updatedAddress
        : updatedAddress.isDefault
        ? { ...a, isDefault: false }
        : a
    );
    await persistUserUpdate({ ...currentUser, savedAddresses: nextAddresses });
  };

  const deleteUserAddress = async (addressId: string) => {
    if (!currentUser) throw new Error('User not logged in.');
    const nextAddresses = (currentUser.savedAddresses || []).filter(a => a.id !== addressId);
    await persistUserUpdate({ ...currentUser, savedAddresses: nextAddresses });
  };

  const setDefaultAddress = async (addressId: string) => {
    if (!currentUser) throw new Error('User not logged in.');
    const nextAddresses = (currentUser.savedAddresses || []).map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    await persistUserUpdate({ ...currentUser, savedAddresses: nextAddresses });
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      if (!cleanEmail || !pass) {
        throw new Error('Email and password are required.');
      }

      const userToLogin = await appwriteService.loginAppwriteUser(cleanEmail, pass);

      if (userToLogin.role === UserRole.PARTNER && !userToLogin.isApprovedByAdmin) {
        await appwriteService.logoutAppwriteUser();
        throw new Error('Your partner account is awaiting admin approval or has not been fully verified.');
      }

      setCurrentUser(userToLogin);

      if (!userToLogin.isGuest && userToLogin.role !== UserRole.GUEST) {
        await fetchOrdersForUser(userToLogin.id);
        closeAuthModal();
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    firstName: string,
    lastName: string,
    email: string,
    pass: string,
    whatsappNumber?: string,
    referralCodeUsed?: string
  ) => {
    setLoading(true);
    try {
      const cleanFirst = firstName.trim();
      const cleanLast = lastName.trim();
      const cleanEmail = email.trim();
      if (!cleanFirst || !cleanEmail || pass.length < 8) {
        throw new Error('Please provide your name, valid email, and a password of at least 8 characters.');
      }

      const createdUser = await appwriteService.signupAppwriteUser(
        cleanFirst,
        cleanLast,
        cleanEmail,
        pass,
        whatsappNumber?.trim(),
        referralCodeUsed?.trim()
      );

      if (!createdUser.referralCode) {
        createdUser.referralCode = generateUserReferralCode(cleanFirst);
      }

      setCurrentUser(createdUser);
      await fetchOrdersForUser(createdUser.id);
    } catch (appwriteErr) {
      if (appwriteErr instanceof appwriteService.AppwriteException && appwriteErr.code === 409) {
        throw new Error('This email address is already registered.');
      }
      throw appwriteErr;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setOrders([]);
    clearAppwriteJwtCache();
    try {
      localStorage.removeItem(LEGACY_LOCAL_USER_KEY);
      localStorage.removeItem(LEGACY_ALL_USERS_KEY);
    } catch {
      // Ignore storage errors
    }
    void appwriteService.logoutAppwriteUser();
  };

  const addOrder = async (
    cartItems: CartItem[],
    totalAmount: number,
    mealSlot: MealSlot,
    deliveryDate: string,
    deliveryWindowDisplay: string
  ): Promise<Order | null> => {
    if (!currentUser || currentUser.isGuest || currentUser.role === UserRole.GUEST) {
      console.error('User must be logged in to place an order.');
      openAuthModal();
      return null;
    }
    setLoading(true);
    try {
      const newOrder = await apiService.saveOrder(
        currentUser,
        cartItems,
        totalAmount,
        mealSlot,
        deliveryDate,
        deliveryWindowDisplay
      );
      setOrders(prevOrders =>
        [newOrder, ...prevOrders].sort(
          (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
        )
      );

      updateUserCustomerLoyaltyOnOrder(currentUser.id, totalAmount);

      try {
        const refreshed = await appwriteService.getCurrentAppwriteSessionUser();
        if (refreshed) setCurrentUser(refreshed);
      } catch {
        // Non-blocking refresh
      }

      return newOrder;
    } catch (error) {
      console.error('Failed to save order:', error);
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
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        signup,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loading,
        orders,
        fetchOrders: memoizedFetchOrders,
        addOrder,
        updateUserProfile,
        referralCodeFromUrl,
        addUserAddress,
        updateUserAddress,
        deleteUserAddress,
        setDefaultAddress,
      }}
    >
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
