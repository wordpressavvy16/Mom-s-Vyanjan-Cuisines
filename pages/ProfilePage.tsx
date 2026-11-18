import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, DietaryPreference, Order, OrderItem as OrderItemType, Review, OrderStatus, CustomerLoyaltyProgramSettings, CustomerLoyaltyTier, Address } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { DIETARY_OPTIONS } from '../constants';
import StarInput from '../components/StarInput';
import StarRatingDisplay from '../components/StarRatingDisplay';
import { submitReview } from '../services/mockDataService';
import { getCustomerLoyaltyProgramSettings } from '../services/configService';

// --- SUB-COMPONENTS FOR TABS ---

// Profile Settings Tab
const SettingsTabContent: React.FC = () => {
    const { currentUser, updateUserProfile } = useAuth();
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');
    const [birthday, setBirthday] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPreference[]>([]);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.firstName);
            setLastName(currentUser.lastName);
            setBio(currentUser.bio || '');
            setDietaryPrefs(currentUser.dietaryPreferences || []);
            setBirthday(currentUser.birthday || '');
            setWhatsappNumber(currentUser.whatsappNumber || '');
        }
    }, [currentUser]);

    const handleSave = async () => {
        if (!currentUser) return;
        const updatedUser: User = {
            ...currentUser,
            firstName, lastName, bio, birthday, whatsappNumber,
            dietaryPreferences: dietaryPrefs,
            profilePictureUrl: avatarPreview || currentUser.profilePictureUrl,
        };
        try {
            await updateUserProfile(updatedUser);
            setIsEditingProfile(false);
            setAvatarPreview(null);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Failed to update profile.");
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => setAvatarPreview(loadEvent.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleDietaryPrefChange = (pref: DietaryPreference) => {
        setDietaryPrefs(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Profile Settings</h2>
                {!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="bg-secondary hover:bg-secondary-dark text-white font-bold py-2 px-4 rounded text-sm">Edit Profile</button>}
            </div>
            <div className="bg-light-surface dark:bg-dark-surface p-6 rounded-lg shadow-md">
            {isEditingProfile ? (
                <div className="space-y-4">
                     <div className="flex items-center space-x-4">
                        <img src={avatarPreview || currentUser?.profilePictureUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                        <div>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden"/>
                            <button onClick={() => fileInputRef.current?.click()} className="text-sm bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded-md">Change Picture</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">First Name</label><input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" /></div>
                        <div><label className="block text-sm font-medium">Last Name</label><input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" /></div>
                    </div>
                     <div><label className="block text-sm font-medium">WhatsApp Number</label><input type="tel" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="e.g., +1234567890" className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" /></div>
                     <div><label className="block text-sm font-medium">Birthday</label><input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" /></div>
                    <div><label className="block text-sm font-medium">Bio</label><textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" /></div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Dietary Preferences</label>
                        <div className="flex flex-wrap gap-2">{DIETARY_OPTIONS.map(pref => (<button key={pref} type="button" onClick={() => handleDietaryPrefChange(pref)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${dietaryPrefs.includes(pref) ? 'bg-primary text-white border-primary-dark' : 'bg-light-surface dark:bg-dark-surface border-neutral-300 dark:border-gray-500'}`}>{pref}</button>))}</div>
                    </div>
                    <div className="flex space-x-2 justify-end">
                        <button onClick={() => setIsEditingProfile(false)} className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
                        <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Save Changes</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 text-sm">
                    <p><strong>Email:</strong> {currentUser?.email}</p>
                    <p><strong>Name:</strong> {currentUser?.firstName} {currentUser?.lastName}</p>
                    <p><strong>WhatsApp:</strong> {currentUser?.whatsappNumber || 'Not set'}</p>
                    <p><strong>Birthday:</strong> {currentUser?.birthday || 'Not set'}</p>
                    <p><strong>Bio:</strong> {currentUser?.bio || 'Not set'}</p>
                    <p><strong>Dietary Preferences:</strong> {currentUser?.dietaryPreferences.join(', ') || 'None'}</p>
                </div>
            )}
            </div>
        </div>
    );
};

// Order History Tab
const OrderHistoryTabContent: React.FC = () => {
    const { currentUser, orders, fetchOrders } = useAuth();
    const [reviewForms, setReviewForms] = useState<{[key: string]: { rating: number; comment: string; isSubmitting: boolean; error?: string }}>({});

    const handleReviewSubmit = async (orderItem: OrderItemType) => {
        if (!currentUser) return;
        const { rating, comment } = reviewForms[orderItem.orderItemId];
        if (rating === 0 || !comment.trim()) {
             setReviewForms(prev => ({ ...prev, [orderItem.orderItemId]: { ...prev[orderItem.orderItemId], error: 'Please rate and comment.' } }));
             return;
        }
        setReviewForms(prev => ({ ...prev, [orderItem.orderItemId]: { ...prev[orderItem.orderItemId], isSubmitting: true }}));
        try {
            await submitReview(currentUser.id, `${currentUser.firstName} ${currentUser.lastName}`, orderItem.id, orderItem.orderItemId, rating, comment);
            await fetchOrders();
            alert('Review submitted!');
        } catch (error) {
            console.error("Failed to submit review:", error);
            setReviewForms(prev => ({ ...prev, [orderItem.orderItemId]: { ...prev[orderItem.orderItemId], isSubmitting: false, error: 'Failed to submit.' } }));
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">My Order History</h2>
            {orders.length > 0 ? (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {orders.map(order => (
                        <div key={order.id} className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">Order #{order.id.substring(0, 8)}</h3>
                                    <p className="text-xs text-light-muted">{new Date(order.orderDate).toLocaleDateString()}</p>
                                    <Link to={`/order-tracking/${order.id}`} className="text-sm text-blue-500 hover:underline">Track Order</Link>
                                </div>
                                <div>
                                    <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                                    <p className="text-xs text-right text-light-muted">{order.status}</p>
                                </div>
                            </div>
                            <div className="mt-4 border-t dark:border-gray-700 pt-2">
                                {order.items.map(item => (
                                    <div key={item.orderItemId} className="py-2">
                                        <p>{item.name} (x{item.quantity})</p>
                                        {order.status === OrderStatus.DELIVERED && !item.reviewId && (
                                            <details className="text-sm">
                                                <summary className="cursor-pointer text-accent">Write a Review</summary>
                                                <div className="p-2 space-y-2">
                                                    <StarInput value={reviewForms[item.orderItemId]?.rating || 0} onChange={(r) => setReviewForms(p => ({...p, [item.orderItemId]: {...(p[item.orderItemId] || {rating: 0, comment: '', isSubmitting: false}), rating: r}}))} />
                                                    <textarea value={reviewForms[item.orderItemId]?.comment || ''} onChange={(e) => setReviewForms(p => ({...p, [item.orderItemId]: {...(p[item.orderItemId] || {rating: 0, comment: '', isSubmitting: false}), comment: e.target.value}}))} placeholder="Your thoughts..." className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white text-xs"/>
                                                    {reviewForms[item.orderItemId]?.error && <p className="text-red-500 text-xs">{reviewForms[item.orderItemId]?.error}</p>}
                                                    <button onClick={() => handleReviewSubmit(item)} disabled={reviewForms[item.orderItemId]?.isSubmitting} className="bg-primary text-white px-2 py-1 text-xs rounded-md">{reviewForms[item.orderItemId]?.isSubmitting ? 'Submitting...' : 'Submit Review'}</button>
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p>You have no past orders.</p>}
        </div>
    );
};

// My Addresses Tab
const AddressesTabContent: React.FC = () => {
    const { currentUser, addUserAddress, updateUserAddress, deleteUserAddress, setDefaultAddress } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [currentAddress, setCurrentAddress] = useState<Partial<Address> | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentAddress) return;
        try {
            if (currentAddress.id) {
                await updateUserAddress(currentAddress as Address);
            } else {
                await addUserAddress(currentAddress as Omit<Address, 'id'>);
            }
            setIsEditing(false);
            setCurrentAddress(null);
        } catch (error) {
            alert('Failed to save address.');
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">My Addresses</h2>
                {!isEditing && <button onClick={() => { setCurrentAddress({ street: '', city: '', zipCode: '', isDefault: false }); setIsEditing(true); }} className="bg-primary text-white font-bold py-2 px-4 rounded text-sm">Add New Address</button>}
            </div>
            {!isEditing && currentUser?.savedAddresses.map(addr => (
                <div key={addr.id} className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md flex justify-between items-center">
                    <div>
                        <p>{addr.street}, {addr.city}, {addr.zipCode}</p>
                        {addr.isDefault && <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    <div className="space-x-2">
                        {!addr.isDefault && <button onClick={() => setDefaultAddress(addr.id)} className="text-xs text-blue-500 hover:underline">Set Default</button>}
                        <button onClick={() => { setCurrentAddress(addr); setIsEditing(true); }} className="text-xs">Edit</button>
                        <button onClick={() => deleteUserAddress(addr.id)} className="text-xs text-red-500">Delete</button>
                    </div>
                </div>
            ))}
             {isEditing && currentAddress && (
                <form onSubmit={handleSave} className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md space-y-3">
                    <h3 className="font-semibold">{currentAddress.id ? 'Edit Address' : 'Add New Address'}</h3>
                     <div><label className="block text-sm">Street</label><input type="text" value={currentAddress.street} onChange={e => setCurrentAddress({...currentAddress, street: e.target.value})} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" required/></div>
                     <div className="grid grid-cols-2 gap-4">
                         <div><label className="block text-sm">City</label><input type="text" value={currentAddress.city} onChange={e => setCurrentAddress({...currentAddress, city: e.target.value})} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" required/></div>
                         <div><label className="block text-sm">Zip Code</label><input type="text" value={currentAddress.zipCode} onChange={e => setCurrentAddress({...currentAddress, zipCode: e.target.value})} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" required/></div>
                     </div>
                     <div className="flex items-center"><input type="checkbox" checked={!!currentAddress.isDefault} onChange={e => setCurrentAddress({...currentAddress, isDefault: e.target.checked})} id="isDefaultAddr" className="h-4 w-4"/><label htmlFor="isDefaultAddr" className="ml-2">Set as default address</label></div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
                        <button type="submit" className="bg-primary text-white px-3 py-1 rounded">Save Address</button>
                    </div>
                </form>
            )}
        </div>
    );
};

// Loyalty & Rewards Tab
const RewardsTabContent: React.FC = () => {
    const { currentUser } = useAuth();
    const [settings, setSettings] = useState<CustomerLoyaltyProgramSettings | null>(null);

    useEffect(() => {
        setSettings(getCustomerLoyaltyProgramSettings());
    }, []);

    if (!settings?.enabled || !currentUser?.customerLoyaltyStatus) return <p>Loyalty program is currently not available.</p>;

    const { points = 0, currentTierId, activeCoupons = [] } = currentUser.customerLoyaltyStatus;
    const currentTier = settings.tiers.find(t => t.id === currentTierId);
    const nextTier = settings.tiers.find(t => t.pointsThreshold > points);
    const progressPercent = nextTier ? (points - (currentTier?.pointsThreshold || 0)) / (nextTier.pointsThreshold - (currentTier?.pointsThreshold || 0)) * 100 : 100;

    const handleCopyReferral = () => {
        const referralLink = `${window.location.origin}${window.location.pathname}#/signup?ref=${currentUser.referralCode}`;
        navigator.clipboard.writeText(referralLink).then(() => alert('Referral link copied!'));
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Loyalty & Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md">
                    <p className="text-light-muted">Your Points</p>
                    <p className="text-3xl font-bold text-primary">{points.toLocaleString()}</p>
                    <p className="text-sm text-light-muted mt-2">Current Tier: <strong>{currentTier?.name || 'Member'}</strong></p>
                </div>
                 <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md">
                    <p className="text-light-muted">Your Referral Code</p>
                    <div className="flex items-center gap-2">
                        <p className="text-lg font-mono bg-gray-100 dark:bg-dark-background px-2 py-1 rounded">{currentUser.referralCode}</p>
                        <button onClick={handleCopyReferral} className="bg-secondary text-white px-2 py-1 text-xs rounded">Copy Link</button>
                    </div>
                     <p className="text-xs text-light-muted mt-2">{settings.referralRewardReferrer.description}</p>
                </div>
            </div>
            {nextTier && (
                 <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md">
                    <p className="text-sm">Progress to <strong>{nextTier.name}</strong> ({nextTier.pointsThreshold} points)</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                        <div className="bg-accent h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            )}
             <div>
                <h3 className="text-xl font-semibold mb-2">My Coupons</h3>
                {activeCoupons.length > 0 ? (
                    <div className="space-y-2">
                        {activeCoupons.map(coupon => (
                            <div key={coupon.id} className="bg-light-surface dark:bg-dark-surface p-3 rounded-lg border-l-4 border-accent">
                                <p className="font-semibold">{coupon.description}</p>
                                <p className="text-sm text-light-muted">Code: {coupon.code} | Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                ) : <p>You have no active coupons right now.</p>}
            </div>
        </div>
    );
};

// Overview Tab
const OverviewTabContent: React.FC = () => {
    const { currentUser, orders } = useAuth();
    const upcomingOrder = orders.find(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md text-center">
                    <p className="text-light-muted">Total Orders</p>
                    <p className="text-4xl font-bold">{orders.length}</p>
                </div>
                <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md text-center">
                    <p className="text-light-muted">Loyalty Points</p>
                    <p className="text-4xl font-bold">{currentUser?.customerLoyaltyStatus?.points || 0}</p>
                </div>
                 <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md text-center">
                    <p className="text-light-muted">Active Coupons</p>
                    <p className="text-4xl font-bold">{currentUser?.customerLoyaltyStatus?.activeCoupons?.length || 0}</p>
                </div>
            </div>
            {upcomingOrder && (
                <div className="bg-light-surface dark:bg-dark-surface p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-2">Next Delivery</h3>
                    <p><strong>Order #{upcomingOrder.id.substring(0,8)}</strong> is scheduled for <strong>{upcomingOrder.deliveryWindowDisplay}</strong>.</p>
                    <p>Status: {upcomingOrder.status}</p>
                    <Link to={`/order-tracking/${upcomingOrder.id}`} className="text-sm text-blue-500 hover:underline mt-2 inline-block">Track Order</Link>
                </div>
            )}
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---

const ProfilePage: React.FC = () => {
  const { currentUser, loading: authLoading, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/');
    }
  }, [currentUser, authLoading, navigate]);

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner text="Loading profile..." size="lg" /></div>;
  }
  
  if (currentUser?.isGuest) {
     return (
        <div className="text-center py-20">
            <h2 className="text-3xl font-semibold">Guest Profile</h2>
            <p className="text-light-muted my-4">Please login or sign up to access your full dashboard.</p>
            <button onClick={openAuthModal} className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg text-lg">Login / Sign Up</button>
        </div>
     );
  }
  
  if (!currentUser) return null;

  const tabs = [
      { id: 'overview', label: 'Overview', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
      { id: 'order-history', label: 'Order History', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
      { id: 'addresses', label: 'My Addresses', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
      { id: 'rewards', label: 'Loyalty & Rewards', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> },
      { id: 'settings', label: 'Profile Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if(window.innerWidth < 768) { // md breakpoint
        setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-200px)]">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
          <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
          ></div>
      )}
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 bg-light-surface dark:bg-dark-surface shadow-xl z-50 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:w-1/4 md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
          <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
              <div className="flex flex-col items-center text-center">
                  <img src={currentUser.profilePictureUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover mb-3" />
                  <h2 className="font-bold text-xl">{currentUser.firstName} {currentUser.lastName}</h2>
                  <p className="text-sm text-light-muted">{currentUser.email}</p>
              </div>
          </div>
          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
              {tabs.map(tab => (
                  <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`w-full flex items-center space-x-3 text-left p-3 rounded-md text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white' : 'text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                     {tab.icon}
                     <span>{tab.label}</span>
                  </button>
              ))}
               <Link to="/menu" className="w-full flex items-center space-x-3 text-left p-3 rounded-md text-sm font-medium whitespace-nowrap text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                  <span>Menu</span>
              </Link>
          </nav>
          <div className="p-4 border-t dark:border-gray-700 mt-auto flex-shrink-0">
            <button onClick={logout} className="w-full flex items-center space-x-3 text-left p-3 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span>Logout</span>
            </button>
          </div>
      </aside>

        {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm z-30 p-2 flex justify-between items-center shadow md:hidden">
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-light-text dark:text-dark-text">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <h1 className="text-lg font-bold text-primary dark:text-dark-accent capitalize">{tabs.find(t => t.id === activeTab)?.label}</h1>
              <div className="w-8"></div>
          </header>

          <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {activeTab === 'overview' && <OverviewTabContent />}
            {activeTab === 'order-history' && <OrderHistoryTabContent />}
            {activeTab === 'addresses' && <AddressesTabContent />}
            {activeTab === 'rewards' && <RewardsTabContent />}
            {activeTab === 'settings' && <SettingsTabContent />}
          </main>
      </div>
    </div>
  );
};

export default ProfilePage;
