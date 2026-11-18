
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, MealSlot, MealSlotConfig, Meal, DietaryPreference, User, TodoItem, InventoryItem, SocialPostStub, EmailWorkflowStub, Order, OrderStatus, PartnerApplication, PurchaseListItem, PurchaseOrder, ConnectedSocialAccount, ConnectedEmailProvider, CustomerLoyaltyProgramSettings, CustomerLoyaltyTier, UserCustomerLoyaltyStatus, DailyMenuSchedule, Testimonial, SocialFeedItem, WhatsAppTemplate, WhatsAppCampaign, WhatsAppAutomation, WhatsAppAction, WhatsAppAnalyticsData, WhatsAppConversation, ChatMessage, WhatsAppButton, SiteSettings, WhatsAppContact } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import UserDetailsModal from '../components/UserDetailsModal';
import RestockItemModal from '../components/RestockItemModal';
import CrmAiModal from '../components/CrmAiModal';
import { generateWhatsAppTemplateContent } from '../services/geminiService';
import {
    getConfiguredMealSlots, updateConfiguredMealSlots,
    getManagedMeals, addManagedMeal, updateManagedMeal, deleteManagedMeal,
    generateDisplayWindow,
    getTodos, addTodo, toggleTodo, deleteTodo, updateTodoReminder, markTodoReminderAlerted,
    getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    getManagedUsers, getPartners,
    getPartnerApplications, updatePartnerApplicationStatus, createManualPartnerUser,
    getPurchaseList, addToPurchaseList, removeFromPurchaseList, updatePurchaseListItem, clearPurchaseList,
    getPurchaseHistory, recordPurchaseOrder,
    getConnectedSocialAccounts, addConnectedSocialAccount, deleteConnectedSocialAccount,
    getConnectedEmailProviders, addConnectedEmailProvider, deleteConnectedEmailProvider,
    getCustomerLoyaltyProgramSettings, saveCustomerLoyaltyProgramSettings,
    getDailyMenuSchedules, addDailyMenuSchedule,
    getTestimonials, addTestimonial, deleteTestimonial,
    getSocialFeedItems, addSocialFeedItem, deleteSocialFeedItem,
    getMainSocialLinks, saveMainSocialLinks,
    getWhatsAppTemplates, saveWhatsAppTemplates,
    getWhatsAppCampaigns, saveWhatsAppCampaigns,
    getWhatsAppAutomations, saveWhatsAppAutomations,
    getWhatsAppAnalytics, getWhatsAppConversations, saveWhatsAppConversations, getWhatsAppContacts, updateConversationTags,
    getSiteSettings, saveSiteSettings
} from '../services/configService';
import { fetchAllOrders, updateOrderStatus as mockAdminUpdateOrderStatus } from '../services/mockDataService';
import * as apiService from '../services/apiService';
import { DIETARY_OPTIONS as ALL_DIETARY_OPTIONS } from '../constants';
import { useSiteSettings } from '../context/SiteSettingsContext';


// Initial form states
const initialMealFormState: Omit<Meal, 'id'> = { name: '', description: '', price: 0, imageUrl: '', category: 'Main Course', ingredients: [], dietaryTags: [], calories: 0, customizationOptions: { spiceLevel: ['Mild', 'Medium', 'Hot'], portionSize: ['Regular', 'Large'] }, partnerId: undefined };
const initialInventoryItemFormState: Omit<InventoryItem, 'id'> = { name: '', quantity: 0, unit: 'pcs', lowStockThreshold: 10, supplier: '', lastPurchasePrice: 0 };
const initialManualPartnerFormState = { firstName: '', lastName: '', email: '', businessName: ''};
const initialSocialAccountFormState: Omit<ConnectedSocialAccount, 'id'> = { platform: 'Facebook', accountName: '', mockApiTokenOrDetails: ''};
const initialEmailProviderFormState: Omit<ConnectedEmailProvider, 'id'> = { providerName: 'MockChimp', mockApiKeyOrDetails: ''};
const initialPurchaseFinalizeFormState = { totalActualCost: 0, paymentMethod: 'Online' as 'Online' | 'Cash', supplierNotes: ''};
const initialCustomerLoyaltyTierFormState: Omit<CustomerLoyaltyTier, 'id'> = { name: '', pointsThreshold: 0, rewardDescription: ''};
const initialTodoFormState = { task: '', reminderDateTime: '', isReminderSet: false };
const initialDailyMenuPlannerFormState: DailyMenuSchedule = { date: new Date().toISOString().split('T')[0], mealSlot: MealSlot.LUNCH, mealIds: [] as string[], isSpecial: false };
const initialTestimonialFormState: Omit<Testimonial, 'id'> = { name: '', rating: 5, comment: '', imageUrl: '' };
const initialSocialFeedItemFormState: Omit<SocialFeedItem, 'id'> = { platform: 'Instagram', imageUrl: '', caption: '', postUrl: '#' };
const initialWhatsAppTemplateFormState: Omit<WhatsAppTemplate, 'id' | 'buttons'> = { name: '', category: 'Utility', content: '', status: 'Pending', mediaUrl: '' };
const initialWhatsAppCampaignFormState: Omit<WhatsAppCampaign, 'id'> = { name: '', targetAudience: 'All Users', templateId: '', status: 'Draft', scheduledAt: new Date(Date.now() + 3600*1000).toISOString().substring(0, 16) };
const initialWhatsAppAutomationFormState: Omit<WhatsAppAutomation, 'id'> = { name: '', trigger: 'New User Signup', actions: [{ type: 'Send Template Message', templateId: '' }], isActive: true };
const initialEmailWorkflowState: Omit<EmailWorkflowStub, 'id' | 'isActive'> = { name: '', trigger: 'New User Signup', action: 'Send Welcome Email', targetSegment: 'All Users', messageTemplate: ''};

// Helper components for the new dashboard layout

const AnalyticsTabContent = ({ orders, users, meals }: { orders: Order[], users: User[], meals: Meal[] }) => {
    const { currencySymbol } = useSiteSettings();

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const newCustomers = users.filter(u => u.id.startsWith('user_') && new Date(parseInt(u.id.split('_')[1])).getTime() > Date.now() - 30 * 86400000).length;

    const topSellingMeals = orders
        .flatMap(order => order.items)
        .reduce((acc, item) => {
            acc[item.id] = (acc[item.id] || 0) + item.quantity;
            return acc;
        }, {} as { [key: string]: number });

    const sortedTopMeals = Object.entries(topSellingMeals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([mealId, count]) => {
            const meal = meals.find(m => m.id === mealId);
            return { name: meal?.name || 'Unknown Meal', count };
        });

    const salesOverTime = orders.reduce((acc, order) => {
        const date = new Date(order.orderDate).toLocaleDateString();
        acc[date] = (acc[date] || 0) + order.totalAmount;
        return acc;
    }, {} as { [key: string]: number });

    const chartData = Object.entries(salesOverTime).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).slice(-7); // Last 7 Days
    const maxSale = Math.max(...chartData.map(([, amount]) => amount), 0);
    
    const kpiCards = [
        { title: 'Total Revenue', value: `${currencySymbol}${totalRevenue.toFixed(2)}`, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg> },
        { title: 'Total Orders', value: totalOrders, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
        { title: 'Avg. Order Value', value: `${currencySymbol}${avgOrderValue.toFixed(2)}`, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> },
        { title: 'New Customers (30d)', value: newCustomers, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> },
    ];
    
    return (
        <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map(card => (
                    <div key={card.title} className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md flex items-center space-x-4">
                        <div className="bg-primary/20 text-primary p-3 rounded-full">{card.icon}</div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                    <h3 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">Sales Overview (Last 7 Days)</h3>
                    {chartData.length > 0 ? (
                        <div className="flex items-end justify-between h-64 border-l border-b border-gray-200 dark:border-gray-700 p-2">
                        {chartData.map(([date, amount]) => (
                            <div key={date} className="flex flex-col items-center flex-grow text-xs text-gray-500 dark:text-gray-400 group">
                                <div className="w-4/5 bg-primary/20 dark:bg-primary/30 hover:bg-primary/40 rounded-t-md transition-all relative" style={{ height: `${(amount / maxSale) * 100}%` }}>
                                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {currencySymbol}{amount.toFixed(0)}
                                    </div>
                                </div>
                                <span className="mt-1">{new Date(date).getDate()}</span>
                            </div>
                        ))}
                    </div>
                    ) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">No sales data for the last 7 days.</p>}
                </div>
                <div className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow-md">
                     <h3 className="font-semibold mb-4 text-gray-700 dark:text-gray-200">Top Selling Meals</h3>
                     <div className="overflow-x-auto">
                         {sortedTopMeals.length > 0 ? (
                             <ul className="space-y-3">
                             {sortedTopMeals.map(meal => (
                                 <li key={meal.name} className="flex justify-between items-center text-sm">
                                     <span className="text-gray-700 dark:text-gray-300 truncate pr-2">{meal.name}</span>
                                     <span className="font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-dark-background px-2 py-0.5 rounded-full">{meal.count}</span>
                                 </li>
                             ))}
                             </ul>
                         ) : <p className="text-center text-gray-500 dark:text-gray-400 py-10">No sales data available.</p>}
                     </div>
                </div>
            </div>
        </div>
    );
}

const GeneralSettingsTabContent = ({siteSettings, onSettingsChange, onSave, onFileSelect}: {siteSettings: SiteSettings, onSettingsChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, onSave: () => void, onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void}) => {
    const logoInputRef = useRef<HTMLInputElement>(null);
    return (
        <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">General Settings</h2>
                <button onClick={onSave} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-3 rounded-md text-sm">Save Settings</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 border dark:border-gray-700 rounded-lg">
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">Business Information</h3>
                    <div className="flex items-center space-x-4">
                        <img src={siteSettings.businessInfo.logoUrl || 'https://via.placeholder.com/100x100.png?text=Logo'} alt="Business Logo Preview" className="w-24 h-24 rounded-lg object-cover bg-gray-200 dark:bg-dark-background"/>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Logo</label>
                            <input type="file" name="logoFile" accept="image/*" onChange={onFileSelect} ref={logoInputRef} className="hidden"/>
                            <div className="flex items-center gap-2 mt-1">
                                <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-semibold py-1 px-2 rounded">Upload Logo</button>
                            </div>
                            <input type="url" name="logoUrl" placeholder="Or enter image URL" value={siteSettings.businessInfo.logoUrl} onChange={onSettingsChange} className="mt-2 block w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs dark:bg-dark-background dark:text-white" />
                        </div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label><input type="text" name="name" value={siteSettings.businessInfo.name} onChange={onSettingsChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-dark-background dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label><input type="text" name="tagline" value={siteSettings.businessInfo.tagline} onChange={onSettingsChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-dark-background dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Email</label><input type="email" name="contactEmail" value={siteSettings.businessInfo.contactEmail} onChange={onSettingsChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-dark-background dark:text-white" /></div>
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">About Us</label><textarea name="aboutUs" value={siteSettings.businessInfo.aboutUs} onChange={onSettingsChange} rows={4} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-dark-background dark:text-white" /></div>
                </div>
                <div className="space-y-4 p-4 border dark:border-gray-700 rounded-lg">
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-200">Currency Settings</h3>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency Code (e.g., USD)</label><input type="text" name="code" value={siteSettings.currency.code} onChange={onSettingsChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-dark-background dark:text-white" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Currency Symbol (e.g., $)</label><input type="text" name="symbol" value={siteSettings.currency.symbol} onChange={onSettingsChange} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm dark:bg-dark-background dark:text-white" /></div>
                </div>
            </div>
        </section>
    );
  };

interface WhatsAppAITabContentProps {
    onOpenTemplateModal: () => void;
    onOpenCampaignModal: () => void;
    onOpenAutomationModal: () => void;
    whatsAppSubTab: 'analytics' | 'conversations' | 'templates' | 'campaigns' | 'automations';
    setWhatsAppSubTab: React.Dispatch<React.SetStateAction<'analytics' | 'conversations' | 'templates' | 'campaigns' | 'automations'>>;
    whatsAppAnalytics: WhatsAppAnalyticsData | null;
    whatsAppContacts: WhatsAppContact[];
    whatsAppConversations: WhatsAppConversation[];
    setWhatsAppConversations: React.Dispatch<React.SetStateAction<WhatsAppConversation[]>>;
    selectedWhatsAppConversation: WhatsAppConversation | null;
    setSelectedWhatsAppConversation: React.Dispatch<React.SetStateAction<WhatsAppConversation | null>>;
    currentChatMessage: string;
    setCurrentChatMessage: React.Dispatch<React.SetStateAction<string>>;
    handleSendChatMessage: (messageText: string) => void;
    whatsAppCampaigns: WhatsAppCampaign[];
    scheduleMockCampaign: (id: string) => void;
    whatsAppAutomations: WhatsAppAutomation[];
    toggleAutomationActive: (id: string) => void;
    whatsAppTemplates: WhatsAppTemplate[];
    requestMockApproval: (id: string) => void;
    tagInput: string;
    setTagInput: React.Dispatch<React.SetStateAction<string>>;
    handleAddTag: (conversationId: string, tagToAdd: string) => void;
    handleRemoveTag: (conversationId: string, tagToRemove: string) => void;
    isNewContactModalOpen: boolean;
    setIsNewContactModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isImportContactsModalOpen: boolean;
    setIsImportContactsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    quickReplies: string[];
    attachmentInputRef: React.RefObject<HTMLInputElement>;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isEmojiPickerOpen: boolean;
    setIsEmojiPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isQuickReplyOpen: boolean;
    setIsQuickReplyOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const WhatsAppAITabContent: React.FC<WhatsAppAITabContentProps> = ({ onOpenTemplateModal, onOpenCampaignModal, onOpenAutomationModal, whatsAppSubTab, setWhatsAppSubTab, whatsAppAnalytics, whatsAppContacts, whatsAppConversations, setWhatsAppConversations, selectedWhatsAppConversation, setSelectedWhatsAppConversation, currentChatMessage, setCurrentChatMessage, handleSendChatMessage, whatsAppCampaigns, scheduleMockCampaign, whatsAppAutomations, toggleAutomationActive, whatsAppTemplates, requestMockApproval, tagInput, setTagInput, handleAddTag, handleRemoveTag, isNewContactModalOpen, setIsNewContactModalOpen, isImportContactsModalOpen, setIsImportContactsModalOpen, quickReplies, attachmentInputRef, handleFileSelect, isEmojiPickerOpen, setIsEmojiPickerOpen, isQuickReplyOpen, setIsQuickReplyOpen }) => {

    const subTabButtonClasses = (tabName: typeof whatsAppSubTab) => `px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${whatsAppSubTab === tabName ? 'bg-secondary text-white' : 'bg-gray-200 dark:bg-dark-surface text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`;

    const selectedContactDetails = whatsAppContacts.find((c: WhatsAppContact) => c.id === selectedWhatsAppConversation?.contactId);

    return (
        <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg space-y-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">WhatsApp Agentic AI Management</h2>
            <div className="flex flex-wrap gap-2 border-b dark:border-gray-700 pb-3">
                <button className={subTabButtonClasses('analytics')} onClick={() => setWhatsAppSubTab('analytics')}>Analytics</button>
                <button className={subTabButtonClasses('conversations')} onClick={() => setWhatsAppSubTab('conversations')}>Conversations</button>
                <button className={subTabButtonClasses('campaigns')} onClick={() => setWhatsAppSubTab('campaigns')}>Campaigns</button>
                <button className={subTabButtonClasses('automations')} onClick={() => setWhatsAppSubTab('automations')}>Automations</button>
                <button className={subTabButtonClasses('templates')} onClick={() => setWhatsAppSubTab('templates')}>Templates</button>
            </div>

            {/* Analytics View */}
            {whatsAppSubTab === 'analytics' && whatsAppAnalytics && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {Object.entries(whatsAppAnalytics.keyMetrics).map(([key, value]) => (
                            <div key={key} className="p-4 bg-gray-50 dark:bg-dark-background rounded-lg shadow">
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Message Trends (Last 7 Days)</h4>
                        <div className="flex items-end justify-between p-4 bg-gray-50 dark:bg-dark-background rounded-lg h-48">
                            {whatsAppAnalytics.trends.map((t) => (
                                <div key={t.day} className="flex flex-col items-center flex-grow text-xs text-gray-600 dark:text-gray-400">
                                    <div className="w-4/5 bg-primary/20 dark:bg-primary/30 hover:bg-primary/40 rounded-t-md transition-all" style={{height: `${(t.sent / Math.max(...whatsAppAnalytics.trends.map((tr)=>tr.sent)))*100}%`}}></div>
                                    <span className="mt-1">{t.day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="overflow-x-auto text-xs"><h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Top Campaigns</h4><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead><tr className="bg-gray-100 dark:bg-dark-background"><th className="px-2 py-1 text-left">Name</th><th className="px-2 py-1 text-right">Sent</th><th className="px-2 py-1 text-right">Read Rate</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{whatsAppAnalytics.topCampaigns.map((c) => <tr key={c.name}><td className="px-2 py-1">{c.name}</td><td className="px-2 py-1 text-right">{c.sent}</td><td className="px-2 py-1 text-right">{c.readRate}%</td></tr>)}</tbody></table></div>
                        <div className="overflow-x-auto text-xs"><h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-200">Top Templates</h4><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead><tr className="bg-gray-100 dark:bg-dark-background"><th className="px-2 py-1 text-left">Name</th><th className="px-2 py-1 text-right">Usage</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{whatsAppAnalytics.topTemplates.map((t) => <tr key={t.name}><td className="px-2 py-1 font-mono">{t.name}</td><td className="px-2 py-1 text-right">{t.usageCount}</td></tr>)}</tbody></table></div>
                    </div>
                </div>
            )}

            {/* Conversations View */}
            {whatsAppSubTab === 'conversations' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[75vh] border dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-dark-background/40">
                    {/* Left Panel: Contact List */}
                    <div className="lg:col-span-3 flex flex-col h-full border-r dark:border-gray-700 pr-2">
                        <div className="p-1 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Conversations</h3>
                            <div className="flex gap-1 mt-2 text-xs">
                                <button onClick={() => setIsNewContactModalOpen(true)} className="flex-1 bg-blue-500 text-white p-1.5 rounded-md hover:bg-blue-600">New Contact</button>
                                <button onClick={() => setIsImportContactsModalOpen(true)} className="flex-1 bg-gray-200 dark:bg-dark-surface p-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Import</button>
                            </div>
                            <input type="search" placeholder="Search contacts or tags..." className="w-full mt-2 text-xs p-1.5 border dark:border-gray-600 rounded-md dark:bg-dark-surface dark:text-white"/>
                        </div>
                        <div className="flex-grow overflow-y-auto mt-2 pr-1">
                            {whatsAppConversations.map((convo) => (
                                <div key={convo.id} onClick={() => setSelectedWhatsAppConversation(convo)} className={`flex items-center p-2 rounded-md cursor-pointer mb-1 ${selectedWhatsAppConversation?.id === convo.id ? 'bg-primary/10 dark:bg-primary/30' : 'hover:bg-gray-100 dark:hover:bg-dark-surface/50'}`}>
                                    <img src={convo.profilePicUrl} alt={convo.contactName} className="w-10 h-10 rounded-full mr-3"/>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="font-semibold text-sm truncate">{convo.contactName}</p>
                                        <p className="text-xs text-gray-500 truncate">{convo.lastMessage}</p>
                                    </div>
                                    {convo.unreadCount > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">{convo.unreadCount}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Middle Panel: Chat View */}
                    <div className="lg:col-span-5 xl:col-span-6 flex flex-col h-full">
                        {selectedWhatsAppConversation ? (
                            <>
                                <div className="border-b dark:border-gray-700 pb-2 mb-2 flex items-center flex-shrink-0">
                                    <img src={selectedWhatsAppConversation.profilePicUrl} alt={selectedWhatsAppConversation.contactName} className="w-8 h-8 rounded-full mr-2"/>
                                    <h4 className="font-semibold">{selectedWhatsAppConversation.contactName}</h4>
                                </div>
                                <div className="flex-grow overflow-y-auto p-2 space-y-3 bg-white dark:bg-dark-surface/80 rounded-md">
                                    {selectedWhatsAppConversation.messages.map(msg => (
                                        <div key={msg.id} className="flex items-end">
                                            {/* This is the corrected chat bubble layout */}
                                            <div 
                                                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm shadow-md
                                                ${msg.sender === 'ai' // Agent messages on the right
                                                    ? 'ml-auto bg-primary/80 dark:bg-primary/70 rounded-br-none text-white' 
                                                    : 'mr-auto bg-white dark:bg-dark-surface rounded-bl-none text-gray-800 dark:text-gray-100' // Customer messages on the left
                                                }`}
                                            >
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                <div className={`text-right text-[10px] mt-1 ${msg.sender === 'ai' ? 'text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 flex-shrink-0 relative">
                                    {isEmojiPickerOpen && <div className="absolute bottom-12 bg-white dark:bg-dark-surface border dark:border-gray-600 p-2 rounded-lg shadow-lg grid grid-cols-6 gap-1">{['😀', '😂', '😍', '👍', '🙏', '🎉', '❤️', '😊', '😢', '🤔', '🔥', '✅'].map(emoji => <button key={emoji} onClick={() => setCurrentChatMessage((p:string) => p+emoji)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">{emoji}</button>)}</div>}
                                    {isQuickReplyOpen && <div className="absolute bottom-12 bg-white dark:bg-dark-surface border dark:border-gray-600 p-1 rounded-lg shadow-lg w-full text-xs space-y-1">{quickReplies.map((reply:string) => <button key={reply} onClick={() => {handleSendChatMessage(reply); setIsQuickReplyOpen(false);}} className="w-full text-left p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">{reply}</button>)}</div>}
                                    <div className="flex items-center gap-2 p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-dark-surface">
                                        <input type="text" value={currentChatMessage} onChange={(e) => setCurrentChatMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage(currentChatMessage)} placeholder="Type your reply..." className="flex-grow bg-transparent focus:outline-none text-sm dark:text-white"/>
                                        <input type="file" ref={attachmentInputRef} onChange={handleFileSelect} className="hidden" />
                                        <button onClick={() => setIsQuickReplyOpen((p:boolean) => !p)} title="Quick Replies" className="p-1 text-gray-500 hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.25 5.5a.75.75 0 000 1.5h11.5a.75.75 0 000-1.5H4.25zm0 4a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-7.5zm0 4a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" /></svg></button>
                                        <button onClick={() => setIsEmojiPickerOpen((p:boolean) => !p)} title="Emoji" className="p-1 text-gray-500 hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zM7.293 11.707a1 1 0 00-1.414-1.414l-1 1a1 1 0 001.414 1.414l1-1zM10 15a4 4 0 110-8 4 4 0 010 8z" /></svg></button>
                                        <button onClick={() => attachmentInputRef.current?.click()} title="Attach File" className="p-1 text-gray-500 hover:text-primary"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.452a1.125 1.125 0 001.59 1.591l3.456-3.554a3 3 0 000-4.243z" clipRule="evenodd" /></svg></button>
                                        <button onClick={() => handleSendChatMessage(currentChatMessage)} className="bg-secondary hover:bg-secondary-dark text-white font-semibold px-3 py-1.5 rounded-md text-sm">Send</button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 rounded-md">Select a conversation to start messaging.</div>
                        )}
                    </div>
                     {/* Right Panel: Contact Info */}
                    <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full overflow-y-auto pl-2 space-y-4">
                        {selectedContactDetails ? (
                        <>
                            <div className="p-3 bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                                <div className="text-center mb-3"><img src={selectedContactDetails.profilePicUrl} alt={selectedContactDetails.name} className="w-20 h-20 rounded-full mx-auto shadow-md"/></div>
                                <h4 className="text-lg font-bold text-center text-gray-800 dark:text-gray-200">{selectedContactDetails.name}</h4>
                                <p className="text-xs text-gray-500 text-center">last seen {selectedContactDetails.lastSeen}</p>
                                <div className="text-xs mt-3 space-y-1">
                                    <p><strong>Email:</strong> {selectedContactDetails.email || 'N/A'}</p>
                                    <p><strong>Phone:</strong> {selectedContactDetails.whatsappNumber}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-1">
                                    {selectedWhatsAppConversation.tags.map(tag => (
                                        <span key={tag} className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full flex items-center">{tag} <button onClick={() => handleRemoveTag(selectedWhatsAppConversation.id, tag)} className="ml-1 text-blue-700 dark:text-blue-300 font-bold">&times;</button></span>
                                    ))}
                                </div>
                                <div className="flex gap-1 mt-2">
                                    <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTag(selectedWhatsAppConversation.id, tagInput)} placeholder="Add a tag..." className="flex-grow p-1 text-xs border dark:border-gray-600 rounded-md dark:bg-dark-background dark:text-white"/>
                                    <button onClick={() => handleAddTag(selectedWhatsAppConversation.id, tagInput)} className="text-xs bg-gray-200 dark:bg-gray-600 px-2 rounded-md hover:bg-gray-300">+</button>
                                </div>
                            </div>
                             <div className="p-3 bg-white dark:bg-dark-surface rounded-lg shadow-sm">
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Attributes</h4>
                                <ul className="text-xs space-y-1">
                                    {Object.entries(selectedContactDetails.attributes).map(([key, value]) => (
                                        <li key={key}><strong>{key}:</strong> {value}</li>
                                    ))}
                                </ul>
                            </div>
                        </>
                        ) : (
                        <div className="flex items-center justify-center h-full text-gray-500 rounded-md">Select a conversation to see details.</div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Campaigns View */}
            {whatsAppSubTab === 'campaigns' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Campaigns</h3>
                  <button onClick={onOpenCampaignModal} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Create Campaign</button>
                </div>
                <div className="overflow-x-auto max-h-96 text-xs">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                     <thead className="bg-gray-100 dark:bg-dark-background sticky top-0"><tr className="text-left"><th className="px-2 py-1.5">Name</th><th className="px-2 py-1.5">Target</th><th className="px-2 py-1.5">Template</th><th className="px-2 py-1.5">Scheduled At</th><th className="px-2 py-1.5">Status</th><th className="px-2 py-1.5 text-center">Actions</th></tr></thead>
                     <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {whatsAppCampaigns.map((c) => (<tr key={c.id}><td className="px-2 py-1.5">{c.name}</td><td className="px-2 py-1.5">{c.targetAudience}</td><td className="px-2 py-1.5 font-mono">{whatsAppTemplates.find((t)=>t.id === c.templateId)?.name || c.templateId}</td><td className="px-2 py-1.5">{new Date(c.scheduledAt).toLocaleString()}</td><td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded-full text-white text-[10px] ${c.status === 'Sent' ? 'bg-green-500' : c.status === 'Scheduled' ? 'bg-blue-500' : c.status === 'Draft' ? 'bg-gray-500' : 'bg-red-500'}`}>{c.status}</span>{c.stats && <details className="text-[10px] text-gray-500"><summary>Stats</summary>sent: {c.stats.sent}, read: {c.stats.read}</details>}</td><td className="px-2 py-1.5 text-center">{c.status === 'Draft' && <button onClick={() => scheduleMockCampaign(c.id)} className="text-blue-500 hover:underline">Schedule</button>}</td></tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Automations View */}
            {whatsAppSubTab === 'automations' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Automations</h3>
                  <button onClick={onOpenAutomationModal} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Create Automation</button>
                </div>
                 <div className="overflow-x-auto max-h-96 text-xs">
                   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                     <thead className="bg-gray-100 dark:bg-dark-background sticky top-0"><tr className="text-left"><th className="px-2 py-1.5">Name</th><th className="px-2 py-1.5">Trigger</th><th className="px-2 py-1.5">Actions</th><th className="px-2 py-1.5 text-center">Status</th></tr></thead>
                     <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {whatsAppAutomations.map((a) => (<tr key={a.id}><td className="px-2 py-1.5">{a.name}</td><td className="px-2 py-1.5">{a.trigger}</td><td className="px-2 py-1.5">{a.actions.map((act, i) => { if (act.type === 'Send Template Message') return <div key={i}>Send: {act.templateName || act.templateId}</div>; if (act.type === 'Wait') return <div key={i}>Wait: {act.delayMinutes}m</div>; if (act.type === 'Add to Audience List') return <div key={i}>Add to: {act.listName}</div>; if (act.type === 'Set Custom Attribute') return <div key={i}>Set: {act.key} = "{act.value}"</div>; return null; })}</td><td className="px-2 py-1.5 text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={a.isActive} onChange={() => toggleAutomationActive(a.id)} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div><span className="ml-2 text-xs font-medium text-gray-900 dark:text-gray-300">{a.isActive ? 'Active' : 'Paused'}</span></label></td></tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Templates View */}
            {whatsAppSubTab === 'templates' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Message Templates</h3>
                  <button onClick={onOpenTemplateModal} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Create Template</button>
                </div>
                <div className="overflow-x-auto max-h-96 text-xs">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-dark-background sticky top-0"><tr className="text-left"><th className="px-2 py-1.5">Name</th><th className="px-2 py-1.5">Category</th><th className="px-2 py-1.5">Content</th><th className="px-2 py-1.5">Status</th><th className="px-2 py-1.5 text-center">Actions</th></tr></thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {whatsAppTemplates.map((t) => (<tr key={t.id}><td className="px-2 py-1.5 font-mono">{t.name}</td><td className="px-2 py-1.5">{t.category}</td><td className="px-2 py-1.5 truncate max-w-xs" title={t.content}>{t.content}</td><td className="px-2 py-1.5"><span className={`px-1.5 py-0.5 rounded-full text-white text-[10px] ${t.status === 'Approved' ? 'bg-green-500' : t.status === 'Rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}>{t.status}</span></td><td className="px-2 py-1.5 text-center">{t.status === 'Pending' && <button onClick={() => requestMockApproval(t.id)} className="text-blue-500 hover:underline">Request Approval</button>}</td></tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </section>
    );
  }


export const DashboardPage: React.FC = () => {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const {siteSettings, updateSiteSettings} = useSiteSettings();
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Common States
  const [activeTab, setActiveTab] = useState('analytics');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [localSiteSettings, setLocalSiteSettings] = useState<SiteSettings>(siteSettings);

  // Delivery Slots States
  const [slotConfigs, setSlotConfigs] = useState<MealSlotConfig[]>([]);
  
  // Meal Management States
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [currentEditingMeal, setCurrentEditingMeal] = useState<Meal | Omit<Meal, 'id'>>({...initialMealFormState});
  const [isNewMeal, setIsNewMeal] = useState(true);
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [mealFormError, setMealFormError] = useState('');
  const [mealImageInputType, setMealImageInputType] = useState<'url' | 'file'>('url');

  // Daily Menu Planner States
  const [dailyMenuSchedules, setDailyMenuSchedules] = useState<DailyMenuSchedule[]>([]);
  const [dailyMenuPlannerForm, setDailyMenuPlannerForm] = useState<DailyMenuSchedule>(initialDailyMenuPlannerFormState);
  const [allAvailableMealsForPlanner, setAllAvailableMealsForPlanner] = useState<Meal[]>([]);


  // To-Do States
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoForm, setTodoForm] = useState(initialTodoFormState);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);


  // Inventory States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [currentInventoryItem, setCurrentInventoryItem] = useState<InventoryItem | Omit<InventoryItem, 'id'>>({...initialInventoryItemFormState});
  const [isNewInventoryItem, setIsNewInventoryItem] = useState(true);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [itemToRestock, setItemToRestock] = useState<InventoryItem | null>(null);

  // CRM States
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserForCrm, setSelectedUserForCrm] = useState<User | null>(null);
  const [isCrmUserModalOpen, setIsCrmUserModalOpen] = useState(false);
  const [isCrmAiModalOpen, setIsCrmAiModalOpen] = useState(false);
  const [selectedUserForAi, setSelectedUserForAi] = useState<User | null>(null);

  // Partner Management States
  const [partners, setPartners] = useState<User[]>([]);
  const [partnerApplications, setPartnerApplications] = useState<PartnerApplication[]>([]);
  const [isManualPartnerModalOpen, setIsManualPartnerModalOpen] = useState(false);
  const [manualPartnerForm, setManualPartnerForm] = useState(initialManualPartnerFormState);
  const [showPartnerApprovalMessage, setShowPartnerApprovalMessage] = useState('');
  const [isPartnerAgreementModalOpen, setIsPartnerAgreementModalOpen] = useState(false);

  // Order Management States
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  
  // Procurement States
  const [purchaseList, setPurchaseList] = useState<PurchaseListItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseOrder[]>([]);
  const [finalizePurchaseForm, setFinalizePurchaseForm] = useState(initialPurchaseFinalizeFormState);

  // Integrations States (Mockups)
  const [socialPosts, setSocialPosts] = useState<SocialPostStub[]>([]);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [currentSocialPost, setCurrentSocialPost] = useState<Omit<SocialPostStub, 'id' | 'status'>>({platform: 'Facebook', content:'', scheduledAt: new Date().toISOString().substring(0,10), targetAccounts: [], imageUrl: ''});
  const [socialImageInputType, setSocialImageInputType] = useState<'url' | 'file'>('url');
  const [emailWorkflows, setEmailWorkflows] = useState<EmailWorkflowStub[]>([]);
  const [isEmailWorkflowModalOpen, setIsEmailWorkflowModalOpen] = useState(false);
  const [currentEmailWorkflow, setCurrentEmailWorkflow] = useState<Omit<EmailWorkflowStub, 'id' | 'isActive'>>(initialEmailWorkflowState);
  const [customEmailWorkflowTrigger, setCustomEmailWorkflowTrigger] = useState('');
  const [customEmailWorkflowAction, setCustomEmailWorkflowAction] = useState('');
  const [customEmailWorkflowTargetSegment, setCustomEmailWorkflowTargetSegment] = useState('');
  const [connectedSocialAccounts, setConnectedSocialAccounts] = useState<ConnectedSocialAccount[]>([]);
  const [isSocialAccountModalOpen, setIsSocialAccountModalOpen] = useState(false);
  const [socialAccountForm, setSocialAccountForm] = useState(initialSocialAccountFormState);
  const [customConnectPlatform, setCustomConnectPlatform] = useState('');
  const [customSchedulePlatform, setCustomSchedulePlatform] = useState('');
  const [connectedEmailProviders, setConnectedEmailProviders] = useState<ConnectedEmailProvider[]>([]);
  const [isEmailProviderModalOpen, setIsEmailProviderModalOpen] = useState(false);
  const [emailProviderForm, setEmailProviderForm] = useState(initialEmailProviderFormState);
  const [customEmailProvider, setCustomEmailProvider] = useState('');


  // Customer Loyalty Program States
  const [customerLoyaltySettings, setCustomerLoyaltySettings] = useState<CustomerLoyaltyProgramSettings>(getCustomerLoyaltyProgramSettings());
  const [isCustomerLoyaltyTierModalOpen, setIsCustomerLoyaltyTierModalOpen] = useState(false);
  const [currentCustomerLoyaltyTier, setCurrentCustomerLoyaltyTier] = useState<CustomerLoyaltyTier | Omit<CustomerLoyaltyTier, 'id'>>(initialCustomerLoyaltyTierFormState);
  const [isNewCustomerLoyaltyTier, setIsNewCustomerLoyaltyTier] = useState(true);
  
  // Site Content States
  const [testimonials, setTestimonialsState] = useState<Testimonial[]>([]);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState<Omit<Testimonial, 'id'>>(initialTestimonialFormState);
  const [testimonialImageInputType, setTestimonialImageInputType] = useState<'url' | 'file'>('url');
  const [socialFeedItems, setSocialFeedItemsState] = useState<SocialFeedItem[]>([]);
  const [isSocialFeedItemModalOpen, setIsSocialFeedItemModalOpen] = useState(false);
  const [currentSocialFeedItem, setCurrentSocialFeedItem] = useState<Omit<SocialFeedItem, 'id'>>(initialSocialFeedItemFormState);
  const [customSocialFeedPlatform, setCustomSocialFeedPlatform] = useState('');
  const [socialFeedImageInputType, setSocialFeedImageInputType] = useState<'url' | 'file'>('url');
  const [mainSocialLinksForm, setMainSocialLinksForm] = useState({ instagram: '', facebook: '' });

  // WhatsApp Agentic AI States
  const [whatsAppAnalytics, setWhatsAppAnalytics] = useState<WhatsAppAnalyticsData | null>(null);
  const [whatsAppContacts, setWhatsAppContacts] = useState<WhatsAppContact[]>([]);
  const [whatsAppConversations, setWhatsAppConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedWhatsAppConversation, setSelectedWhatsAppConversation] = useState<WhatsAppConversation | null>(null);
  const [currentChatMessage, setCurrentChatMessage] = useState('');
  const [whatsAppSubTab, setWhatsAppSubTab] = useState<'analytics' | 'conversations' | 'templates' | 'campaigns' | 'automations'>('analytics');
  const [whatsAppTemplates, setWhatsAppTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isWhatsAppTemplateModalOpen, setIsWhatsAppTemplateModalOpen] = useState(false);
  const [currentWhatsAppTemplate, setCurrentWhatsAppTemplate] = useState<Omit<WhatsAppTemplate, 'id' | 'buttons'>>({...initialWhatsAppTemplateFormState});
  const [mediaInputType, setMediaInputType] = useState<'url' | 'file'>('url');
  const [currentTemplateButtons, setCurrentTemplateButtons] = useState<WhatsAppTemplate['buttons']>([]);
  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);
  const [whatsAppCampaigns, setWhatsAppCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [isWhatsAppCampaignModalOpen, setIsWhatsAppCampaignModalOpen] = useState(false);
  const [currentWhatsAppCampaign, setCurrentWhatsAppCampaign] = useState<Omit<WhatsAppCampaign, 'id'>>(initialWhatsAppCampaignFormState);
  const [customCampaignAudience, setCustomCampaignAudience] = useState('');
  const [whatsAppAutomations, setWhatsAppAutomations] = useState<WhatsAppAutomation[]>([]);
  const [isWhatsAppAutomationModalOpen, setIsWhatsAppAutomationModalOpen] = useState(false);
  const [currentWhatsAppAutomation, setCurrentWhatsAppAutomation] = useState<Omit<WhatsAppAutomation, 'id'>>(initialWhatsAppAutomationFormState);
  const [customAutomationTrigger, setCustomAutomationTrigger] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [isImportContactsModalOpen, setIsImportContactsModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isQuickReplyOpen, setIsQuickReplyOpen] = useState(false);

  const quickReplies = ["Hello! How can I help you?", "Yes, we can do that.", "Please allow us a moment to check.", "Thank you for contacting MoM's Vyanjan."];

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>, onFileReady: (dataUrl: string) => void, maxSizeMB: number = 5) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File is too large. Please select a file under ${maxSizeMB}MB.`);
            if(e.target) e.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            onFileReady(loadEvent.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };


  const loadAllAdminData = useCallback(async () => {
    setLoadingMessage("Loading dashboard data...");
    const [
      remoteSlots,
      remoteMeals,
      remoteSchedules,
      remoteUsers,
      remotePartnerApps,
      remoteTestimonials,
      remoteSocialItems,
      remoteSocialLinks,
      remoteSiteSettings,
      orders,
    ] = await Promise.all([
      apiService.fetchMealSlotsConfig().catch(() => getConfiguredMealSlots()),
      apiService.fetchDashboardMeals(currentUser!).catch(() => getManagedMeals(currentUser!)),
      apiService.fetchDailyMenuSchedules().catch(() => getDailyMenuSchedules()),
      apiService.fetchManagedUsers().catch(() => getManagedUsers()),
      apiService.fetchPartnerApplications().catch(() => getPartnerApplications()),
      apiService.fetchTestimonials().catch(() => getTestimonials()),
      apiService.fetchSocialFeedItems().catch(() => getSocialFeedItems()),
      apiService.fetchMainSocialLinks().catch(() => getMainSocialLinks()),
      apiService.fetchSiteSettings().catch(() => getSiteSettings()),
      fetchAllOrders().catch((e) => { console.error("Error fetching orders for admin", e); return []; }),
    ]);

    setSlotConfigs(remoteSlots);
    setMeals(remoteMeals);
    setAllAvailableMealsForPlanner(remoteMeals); 
    setDailyMenuSchedules(remoteSchedules); 
    const currentTodos = getTodos();
    setTodos(currentTodos);
    const currentInventory = getInventoryItems();
    setInventory(currentInventory);
    const sortedUsers = [...remoteUsers].sort((a,b) => (a.lastName || "").localeCompare(b.lastName || ""));
    setUsers(sortedUsers);
    setPartners(sortedUsers.filter(u => u.role === UserRole.PARTNER && u.isApprovedByAdmin));
    const sortedPartnerApps = [...remotePartnerApps].sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    setPartnerApplications(sortedPartnerApps);
    setPurchaseList(getPurchaseList());
    setPurchaseHistory(getPurchaseHistory());
    setConnectedSocialAccounts(getConnectedSocialAccounts());
    setConnectedEmailProviders(getConnectedEmailProviders());
    setCustomerLoyaltySettings(getCustomerLoyaltyProgramSettings());
    setTestimonialsState(remoteTestimonials);
    setSocialFeedItemsState(remoteSocialItems);
    setMainSocialLinksForm(remoteSocialLinks);
    setWhatsAppAnalytics(getWhatsAppAnalytics());
    setWhatsAppContacts(getWhatsAppContacts());
    setWhatsAppConversations(getWhatsAppConversations());
    setWhatsAppTemplates(getWhatsAppTemplates());
    setWhatsAppCampaigns(getWhatsAppCampaigns());
    setWhatsAppAutomations(getWhatsAppAutomations());
    setLocalSiteSettings(remoteSiteSettings);
    
    setSocialPosts([{id: 'sp1', platform: 'Facebook', content: 'Try our new Paneer Tikka!', scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: 'Scheduled', targetAccounts:[]}, {id: 'sp2', platform: 'Instagram', content: 'Weekend special offer!', scheduledAt: new Date(Date.now() + 2*86400000).toISOString(), status: 'Scheduled', imageUrl: 'https://picsum.photos/seed/insta/300/300', targetAccounts:[]}]);
    setEmailWorkflows([{id: 'ew1', name: 'Welcome New User', trigger: 'New User Signup', action: 'Send Welcome Brochure Email', isActive: true, targetSegment: 'New Users (Last 7 Days)', messageTemplate: 'Hi {{firstName}}, welcome!'}, {id: 'ew2', name: 'Post-Order Feedback', trigger: 'Order Delivered', action: 'Send Feedback Request Email', isActive: false, targetSegment: 'All Users', messageTemplate: 'Hope you enjoyed your {{lastOrderItemName}}!'}]);
    setAllOrders(orders);
    setLoadingMessage(null);
  }, [currentUser]);
  
  const loadManagerData = useCallback(async () => {
    setLoadingMessage("Loading dashboard data...");
    const [allMeals, schedules, orders] = await Promise.all([
      apiService.fetchDashboardMeals(currentUser!).catch(() => getManagedMeals(currentUser!)),
      apiService.fetchDailyMenuSchedules().catch(() => getDailyMenuSchedules()),
      fetchAllOrders().catch((e) => { console.error("Error fetching orders for manager", e); return []; }),
    ]);
    setMeals(allMeals);
    setAllAvailableMealsForPlanner(allMeals); 
    setDailyMenuSchedules(schedules);
    setTodos(getTodos());
    setInventory(getInventoryItems());
    setPurchaseList(getPurchaseList());
    setPurchaseHistory(getPurchaseHistory());
    setActiveTab('orders'); // Manager default
    setAllOrders(orders);
    setLoadingMessage(null);
  }, [currentUser]);


  useEffect(() => {
    if (!authLoading) {
      if (currentUser?.role === UserRole.ADMIN) { loadAllAdminData(); }
      else if (currentUser?.role === UserRole.MANAGER) { loadManagerData(); }
      else if (currentUser) { navigate('/'); } 
      else { navigate('/'); } 
    }
  }, [currentUser, authLoading, navigate, loadAllAdminData, loadManagerData]);

   useEffect(() => {
    const checkReminders = () => {
      const currentTodos = getTodos();
      const now = new Date();
      currentTodos.forEach(todo => {
        if (todo.isReminderSet && todo.reminderDateTime && !todo.reminderAlerted) {
          if (new Date(todo.reminderDateTime) <= now) {
            window.alert(`Reminder: Your task "${todo.task}" is due! (Mock Notification)`);
            markTodoReminderAlerted(todo.id); 
            setTodos(getTodos());
          }
        }
      });
    };

    const intervalId = setInterval(checkReminders, 60000); 
    checkReminders();

    return () => clearInterval(intervalId);
  }, []);


  const handleSlotConfigChange = (slotName: MealSlot, field: keyof MealSlotConfig, value: string | number) => setSlotConfigs(prev => prev.map(slot => slot.name === slotName ? { ...slot, [field]: value } : slot));
  const saveSlotConfigs = () => { const numericConfigs = slotConfigs.map(sc => ({...sc, deliveryHour: Number(sc.deliveryHour), deliveryWindowMinutes: Number(sc.deliveryWindowMinutes), cutoffHoursBeforeDelivery: Number(sc.cutoffHoursBeforeDelivery) })); updateConfiguredMealSlots(numericConfigs); setSlotConfigs(getConfiguredMealSlots()); alert("Delivery slot configurations saved!"); };

  const openMealModal = (meal?: Meal) => { setMealFormError(''); if (meal) { setCurrentEditingMeal(meal); setIngredientsInput(meal.ingredients.join(', ')); setIsNewMeal(false); setMealImageInputType(meal.imageUrl?.startsWith('data:') ? 'file' : 'url'); } else { setCurrentEditingMeal({...initialMealFormState, partnerId: currentUser?.role === UserRole.PARTNER ? currentUser.id : undefined}); setIngredientsInput(''); setIsNewMeal(true); setMealImageInputType('url'); } setIsMealModalOpen(true); };
  const closeMealModal = () => setIsMealModalOpen(false);
  const handleMealFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const { name, value } = e.target; setCurrentEditingMeal(prev => ({ ...prev, [name]: (name === 'price' || name === 'calories') && value !== '' ? Number(value) : value })); };
  const handleMealDietaryTagChange = (tag: DietaryPreference) => setCurrentEditingMeal(prev => { const currentTags = (prev as Meal).dietaryTags || []; const newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag]; return { ...prev, dietaryTags: newTags }; });
  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMealFormError('');
    if(!currentEditingMeal.name || (currentEditingMeal as Meal).price <=0 || !(currentEditingMeal as Meal).category || !(currentEditingMeal as Meal).imageUrl) {
      setMealFormError('Name, Price, Category, and Image are required.');
      return;
    }
    const mealDataToSave = {...currentEditingMeal, ingredients: ingredientsInput.split(',').map(i => i.trim()).filter(i => i) };
    if (isNewMeal) {
      await apiService.addDashboardMeal(mealDataToSave as Omit<Meal, 'id'>, currentUser);
    } else {
      await apiService.updateDashboardMeal(mealDataToSave as Meal, currentUser);
    }
    const refreshed = await apiService.fetchDashboardMeals(currentUser!);
    setMeals(refreshed);
    setAllAvailableMealsForPlanner(refreshed);
    closeMealModal();
  };
  const handleDeleteMeal = async (mealId: string) => {
    if (window.confirm("Are you sure?")) {
      await apiService.deleteDashboardMeal(mealId, currentUser);
      const refreshed = await apiService.fetchDashboardMeals(currentUser!);
      setMeals(refreshed);
      setAllAvailableMealsForPlanner(refreshed);
    }
  };

  const handleDailyMenuFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name === "mealIds") {
        const options = (e.target as HTMLSelectElement).options;
        const selectedMealIds: string[] = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
            selectedMealIds.push(options[i].value);
            }
        }
        setDailyMenuPlannerForm(prev => ({ ...prev, mealIds: selectedMealIds }));
    } else if (type === 'checkbox') {
        setDailyMenuPlannerForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    }
    else {
        setDailyMenuPlannerForm(prev => ({ ...prev, [name]: value }));
    }
  };
  const handleDailyMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dailyMenuPlannerForm.mealIds.length === 0) {
        alert("Please select at least one meal for the schedule.");
        return;
    }
    await apiService.addDailyMenuSchedule(dailyMenuPlannerForm);
    setDailyMenuSchedules(await apiService.fetchDailyMenuSchedules());
    alert(`Menu for ${dailyMenuPlannerForm.date} - ${dailyMenuPlannerForm.mealSlot} saved!`);
    setDailyMenuPlannerForm(initialDailyMenuPlannerFormState); 
  };

  const handleTodoFormChange = (e: React.ChangeEvent<HTMLInputElement>) => { const {name, value, type, checked} = e.target; setTodoForm(prev => ({...prev, [name]: type === 'checkbox' ? checked : value })); };
  const handleSaveTodo = () => { 
    if (!todoForm.task.trim()) return;
    if (editingTodoId) {
      updateTodoReminder(editingTodoId, todoForm.isReminderSet ? todoForm.reminderDateTime : undefined, todoForm.isReminderSet);
    } else {
      addTodo(todoForm.task, todoForm.isReminderSet ? todoForm.reminderDateTime : undefined);
    }
    setTodoForm(initialTodoFormState); 
    setEditingTodoId(null);
    setTodos(getTodos());
  };
  const handleEditTodo = (todo: TodoItem) => { setEditingTodoId(todo.id); setTodoForm({task: todo.task, reminderDateTime: todo.reminderDateTime || '', isReminderSet: !!todo.isReminderSet}); };
  const handleToggleTodo = (id: string) => { toggleTodo(id); setTodos(getTodos()); };
  const handleDeleteTodo = (id: string) => { deleteTodo(id); setTodos(getTodos()); };

  const openInventoryModal = (item?: InventoryItem) => { if (item) { setCurrentInventoryItem(item); setIsNewInventoryItem(false); } else { setCurrentInventoryItem({...initialInventoryItemFormState}); setIsNewInventoryItem(true); } setIsInventoryModalOpen(true); };
  const closeInventoryModal = () => setIsInventoryModalOpen(false);
  const handleInventoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setCurrentInventoryItem(prev => ({ ...prev, [name]: (name === 'quantity' || name === 'lowStockThreshold' || name === 'lastPurchasePrice') ? Number(value) : value })); };
  const handleInventorySubmit = (e: React.FormEvent) => { e.preventDefault(); if (isNewInventoryItem) { addInventoryItem(currentInventoryItem as Omit<InventoryItem, 'id'>); } else { updateInventoryItem(currentInventoryItem as InventoryItem); } setInventory(getInventoryItems()); closeInventoryModal(); };
  const handleDeleteInventoryItem = (id: string) => { if(window.confirm("Are you sure? This will remove the item from inventory.")){deleteInventoryItem(id); setInventory(getInventoryItems());} };
  const handleOpenRestockModal = (item: InventoryItem) => { setItemToRestock(item); setIsRestockModalOpen(true); };
  const handleAddToPurchaseList = (inventoryItem: InventoryItem, quantityToBuy: number, supplier?: string, estimatedPrice?: number) => { addToPurchaseList(inventoryItem, quantityToBuy, supplier, estimatedPrice); setPurchaseList(getPurchaseList()); setIsRestockModalOpen(false); alert(`${inventoryItem.name} added to purchase list.`); };

  const handleAdminUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => { setLoadingMessage("Updating order status..."); try { await mockAdminUpdateOrderStatus(orderId, newStatus); setAllOrders(await fetchAllOrders()); } catch (error) { console.error("Failed to update order status:", error); alert("Error updating order status."); } setLoadingMessage(null); };

  const openCrmUserDetails = (user: User) => { setSelectedUserForCrm(user); setIsCrmUserModalOpen(true); };
  const openCrmAiModal = (user: User) => { setSelectedUserForAi(user); setIsCrmAiModalOpen(true); };

  const handlePartnerAppStatusChange = async (appId: string, status: 'Approved' | 'Rejected') => { 
    const app = partnerApplications.find(a => a.id === appId);
    if (!app) return;
    if (window.confirm(`Are you sure you want to ${status.toLowerCase()} application for ${app.businessName}?`)) { 
        await apiService.updatePartnerApplicationStatus(appId, status); 
        setPartnerApplications(await apiService.fetchPartnerApplications()); 
        if (status === 'Approved') { 
            const refreshedUsers = await apiService.fetchManagedUsers();
            setPartners(refreshedUsers.filter(u => u.role === UserRole.PARTNER && u.isApprovedByAdmin)); 
            setUsers(refreshedUsers); 
            setShowPartnerApprovalMessage(`Partner application for ${app.businessName} has been ${status.toLowerCase()}. Please ask the partner to register or reset their password via secure email authentication.`);
            setTimeout(() => setShowPartnerApprovalMessage(''), 5000);
        }
    } 
  };
  const openManualPartnerModal = () => { setManualPartnerForm(initialManualPartnerFormState); setIsManualPartnerModalOpen(true); };
  const handleManualPartnerFormChange = (e: React.ChangeEvent<HTMLInputElement>) => { const {name, value} = e.target; setManualPartnerForm(prev => ({...prev, [name]: value})); };
  const handleManualPartnerSubmit = (e: React.FormEvent) => { e.preventDefault(); if(!manualPartnerForm.firstName || !manualPartnerForm.lastName || !manualPartnerForm.email || !manualPartnerForm.businessName){ alert("All fields are required for manual partner creation."); return; } const created = createManualPartnerUser(manualPartnerForm); if(created){ setPartners(getPartners()); setUsers(getManagedUsers()); setIsManualPartnerModalOpen(false); } };

  const handlePurchaseListItemUpdate = (itemId: string, newQuantity: number, newSupplier?: string, newEstimatedPrice?: number) => { updatePurchaseListItem(itemId, { quantityToBuy: newQuantity, supplier: newSupplier, estimatedPrice: newEstimatedPrice }); setPurchaseList(getPurchaseList()); };
  const handleRemoveFromPurchaseList = (itemId: string) => { removeFromPurchaseList(itemId); setPurchaseList(getPurchaseList()); };
  const handleFinalizePurchaseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const {name, value} = e.target; setFinalizePurchaseForm(prev => ({...prev, [name]: name === 'totalActualCost' ? parseFloat(value) : value }));};
  const handleConfirmPurchase = () => { if (!currentUser) return; if (purchaseList.length === 0) { alert("Purchase list is empty."); return; } if (finalizePurchaseForm.totalActualCost <= 0) { alert("Please enter a valid total actual cost."); return; } recordPurchaseOrder({ items: purchaseList, totalActualCost: finalizePurchaseForm.totalActualCost, purchasedByUserId: currentUser.id, purchasedByUserName: `${currentUser.firstName} ${currentUser.lastName}`, paymentMethod: finalizePurchaseForm.paymentMethod, supplierNotes: finalizePurchaseForm.supplierNotes }); alert("Purchase recorded and inventory updated!"); clearPurchaseList(); setPurchaseList(getPurchaseList()); setPurchaseHistory(getPurchaseHistory()); setInventory(getInventoryItems()); setFinalizePurchaseForm(initialPurchaseFinalizeFormState); };
  
  const handleSocialAccountFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSocialAccountForm(prev => ({ ...prev, [name]: value }));
    if (name === 'platform' && value !== 'Other') {
        setCustomConnectPlatform('');
    }
  };
  const handleAddSocialAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlatform = socialAccountForm.platform === 'Other' ? customConnectPlatform.trim() : socialAccountForm.platform;
    if (!finalPlatform) {
        alert("Platform name cannot be empty.");
        return;
    }
    addConnectedSocialAccount({ ...socialAccountForm, platform: finalPlatform });
    setConnectedSocialAccounts(getConnectedSocialAccounts());
    setSocialAccountForm(initialSocialAccountFormState);
    setCustomConnectPlatform('');
    setIsSocialAccountModalOpen(false);
  };
  const handleDeleteSocialAccount = (id: string) => { deleteConnectedSocialAccount(id); setConnectedSocialAccounts(getConnectedSocialAccounts());};
  
  const handleEmailProviderFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEmailProviderForm(prev => ({ ...prev, [name]: value }));
    if (name === 'providerName' && value !== 'Other') {
        setCustomEmailProvider('');
    }
  };
  const handleAddEmailProvider = (e: React.FormEvent) => {
      e.preventDefault();
      const finalProvider = emailProviderForm.providerName === 'Other' ? customEmailProvider.trim() : emailProviderForm.providerName;
      if (!finalProvider) {
          alert("Provider name cannot be empty.");
          return;
      }
      addConnectedEmailProvider({...emailProviderForm, providerName: finalProvider});
      setConnectedEmailProviders(getConnectedEmailProviders());
      setEmailProviderForm(initialEmailProviderFormState);
      setCustomEmailProvider('');
      setIsEmailProviderModalOpen(false);
  };
  const handleDeleteEmailProvider = (id: string) => { deleteConnectedEmailProvider(id); setConnectedEmailProviders(getConnectedEmailProviders());};
  
  const openEmailWorkflowModal = () => {
    setCurrentEmailWorkflow({...initialEmailWorkflowState, emailProviderId: connectedEmailProviders[0]?.id});
    setCustomEmailWorkflowTrigger('');
    setCustomEmailWorkflowAction('');
    setCustomEmailWorkflowTargetSegment('');
    setIsEmailWorkflowModalOpen(true);
  };

  const handleScheduleSocialPost = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlatform = currentSocialPost.platform === 'Other' ? customSchedulePlatform.trim() : currentSocialPost.platform;
     if (!finalPlatform || !currentSocialPost.content) {
        alert("Platform and Content are required.");
        return;
    }
    const newPost: SocialPostStub = {
        ...currentSocialPost,
        id: `sp-${Date.now()}`,
        status: 'Scheduled',
        platform: finalPlatform
    };
    setSocialPosts(prev => [newPost, ...prev]);
    setIsSocialModalOpen(false);
    setCurrentSocialPost({platform: 'Facebook', content:'', scheduledAt: new Date().toISOString().substring(0,10), targetAccounts: [], imageUrl: ''});
    setCustomSchedulePlatform('');
  };

  const handleSaveEmailWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTrigger = currentEmailWorkflow.trigger === 'Other' ? customEmailWorkflowTrigger : currentEmailWorkflow.trigger;
    const finalAction = currentEmailWorkflow.action === 'Other' ? customEmailWorkflowAction : currentEmailWorkflow.action;
    const finalTargetSegment = currentEmailWorkflow.targetSegment === 'Other' ? customEmailWorkflowTargetSegment : currentEmailWorkflow.targetSegment;
  
    if ((currentEmailWorkflow.trigger === 'Other' && !finalTrigger) ||
        (currentEmailWorkflow.action === 'Other' && !finalAction) ||
        (currentEmailWorkflow.targetSegment === 'Other' && !finalTargetSegment)) {
      alert("Custom fields must be filled when 'Custom' is selected.");
      return;
    }
  
    const newWorkflow: EmailWorkflowStub = {
      ...currentEmailWorkflow,
      id: `ew-${Date.now()}`,
      isActive: true,
      trigger: finalTrigger,
      action: finalAction,
      targetSegment: finalTargetSegment,
    };
    setEmailWorkflows(prev => [newWorkflow, ...prev]);
    setIsEmailWorkflowModalOpen(false);
  };

  const handleCustomerLoyaltySettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const name = target.name;
    let finalValue: string | number | boolean | object; 

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      finalValue = target.checked;
    } else {
      finalValue = target.value;
      if (name === 'pointsPerDollar' || name.includes('Percentage') || name.includes('Amount') || name.includes('Days') || name.includes('Award') || name === 'pointsThreshold') { 
        finalValue = Number(target.value);
      }
    }
    
    if (name.startsWith('referralRewardNewUser.')) {
        const key = name.split('.')[1] as keyof CustomerLoyaltyProgramSettings['referralRewardNewUser'];
        setCustomerLoyaltySettings(prev => ({ ...prev, referralRewardNewUser: { ...prev.referralRewardNewUser, [key]: finalValue }}));
    } else if (name.startsWith('referralRewardReferrer.')) {
        const key = name.split('.')[1] as keyof CustomerLoyaltyProgramSettings['referralRewardReferrer'];
        setCustomerLoyaltySettings(prev => ({ ...prev, referralRewardReferrer: { ...prev.referralRewardReferrer, [key]: finalValue }}));
    } else {
        setCustomerLoyaltySettings(prev => ({ ...prev, [name]: finalValue }));
    }
  };
  const openCustomerLoyaltyTierModal = (tier?: CustomerLoyaltyTier) => { if(tier) { setCurrentCustomerLoyaltyTier(tier); setIsNewCustomerLoyaltyTier(false); } else { setCurrentCustomerLoyaltyTier(initialCustomerLoyaltyTierFormState); setIsNewCustomerLoyaltyTier(true); } setIsCustomerLoyaltyTierModalOpen(true); };
  const handleCustomerLoyaltyTierFormChange = (e: React.ChangeEvent<HTMLInputElement>) => { const {name, value} = e.target; setCurrentCustomerLoyaltyTier(prev => ({...prev, [name]: name === 'pointsThreshold' ? Number(value) : value})); };
  const handleCustomerLoyaltyTierSubmit = (e: React.FormEvent) => { e.preventDefault(); let updatedTiers = [...customerLoyaltySettings.tiers]; if(isNewCustomerLoyaltyTier) { updatedTiers.push({...currentCustomerLoyaltyTier, id: `tier-${Date.now()}`} as CustomerLoyaltyTier); } else { updatedTiers = updatedTiers.map(t => t.id === (currentCustomerLoyaltyTier as CustomerLoyaltyTier).id ? currentCustomerLoyaltyTier as CustomerLoyaltyTier : t); } setCustomerLoyaltySettings(prev => ({...prev, tiers: updatedTiers.sort((a,b) => a.pointsThreshold - b.pointsThreshold)})); setIsCustomerLoyaltyTierModalOpen(false); };
  const handleDeleteCustomerLoyaltyTier = (tierId: string) => { setCustomerLoyaltySettings(prev => ({...prev, tiers: prev.tiers.filter(t => t.id !== tierId)})); };
  const saveCurrentCustomerLoyaltySettings = () => { saveCustomerLoyaltyProgramSettings(customerLoyaltySettings); alert("Customer Loyalty Program settings saved!"); };

  const openTestimonialModal = (testimonial?: Testimonial) => { setCurrentTestimonial(testimonial ? { name: testimonial.name, rating: testimonial.rating, comment: testimonial.comment, imageUrl: testimonial.imageUrl } : initialTestimonialFormState); setIsTestimonialModalOpen(true); };
  const handleTestimonialFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setCurrentTestimonial(prev => ({ ...prev, [name]: name === 'rating' ? Number(value) : value })); };
  const handleTestimonialSubmit = (e: React.FormEvent) => { e.preventDefault(); addTestimonial(currentTestimonial); setTestimonialsState(getTestimonials()); setIsTestimonialModalOpen(false); };
  const handleDeleteCurrentTestimonial = (id: string) => { if (window.confirm("Delete this testimonial?")) { deleteTestimonial(id); setTestimonialsState(getTestimonials()); } };
  
  const openSocialFeedItemModal = (item?: SocialFeedItem) => {
    setCurrentSocialFeedItem(item ? { platform: item.platform, imageUrl: item.imageUrl, caption: item.caption, postUrl: item.postUrl } : initialSocialFeedItemFormState);
    setCustomSocialFeedPlatform('');
    setIsSocialFeedItemModalOpen(true);
  };
  
  const handleSocialFeedItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "platform" && value !== 'Other') {
        setCustomSocialFeedPlatform('');
    }
    setCurrentSocialFeedItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialFeedItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlatform = currentSocialFeedItem.platform === 'Other' ? customSocialFeedPlatform.trim() : currentSocialFeedItem.platform;
    if (!finalPlatform) {
        alert("Platform name cannot be empty when 'Other' is selected.");
        return;
    }
    const itemToSave: Omit<SocialFeedItem, 'id'> = {
        ...currentSocialFeedItem,
        platform: finalPlatform,
    };
    addSocialFeedItem(itemToSave);
    setSocialFeedItemsState(getSocialFeedItems());
    setIsSocialFeedItemModalOpen(false);
  };
  const handleDeleteCurrentSocialFeedItem = (id: string) => { if (window.confirm("Delete this feed item?")) { deleteSocialFeedItem(id); setSocialFeedItemsState(getSocialFeedItems()); } };
  
  const handleMainSocialLinksChange = (e: React.ChangeEvent<HTMLInputElement>) => { setMainSocialLinksForm(prev => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleSaveMainSocialLinks = () => { saveMainSocialLinks(mainSocialLinksForm); alert("Main social media links saved!"); };
  
  const handleSiteSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalSiteSettings(prev => {
        const isBusinessInfoField = Object.keys(prev.businessInfo).includes(name);
        if(isBusinessInfoField) {
            return {
                ...prev,
                businessInfo: {...prev.businessInfo, [name]: value}
            };
        }
        
        const isCurrencyInfoField = Object.keys(prev.currency).includes(name);
        if(isCurrencyInfoField) {
            return {
                ...prev,
                currency: {...prev.currency, [name]: value}
            };
        }
        return prev;
    });
  }
  const handleSaveSiteSettings = () => {
    updateSiteSettings(localSiteSettings);
  };
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e, (dataUrl) => {
        setLocalSiteSettings(prev => ({
            ...prev,
            businessInfo: { ...prev.businessInfo, logoUrl: dataUrl }
        }));
    });
  };

  // --- WhatsApp AI Handlers ---
  const openWhatsAppTemplateModal = () => {
    setCurrentWhatsAppTemplate(initialWhatsAppTemplateFormState);
    setCurrentTemplateButtons([]);
    setMediaInputType('url');
    setIsWhatsAppTemplateModalOpen(true);
  };
  const handleWhatsAppTemplateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentWhatsAppTemplate(prev => ({ ...prev, [name]: value }));
  };
  const handleTemplateButtonChange = (index: number, field: keyof WhatsAppButton, value: string) => {
    const updatedButtons = [...(currentTemplateButtons || [])];
    (updatedButtons[index] as any)[field] = value;
    setCurrentTemplateButtons(updatedButtons);
  };
  const addTemplateButton = (type: 'URL' | 'QUICK_REPLY') => {
    if ((currentTemplateButtons?.length || 0) < 3) {
        const newButton: WhatsAppButton = { type, text: '', url: type === 'URL' ? '' : undefined };
        setCurrentTemplateButtons(prev => [...(prev || []), newButton]);
    }
  };
  const removeTemplateButton = (index: number) => {
    setCurrentTemplateButtons(prev => (prev || []).filter((_, i) => i !== index));
  };
  const handleGenerateTemplateContent = async () => {
    const purpose = prompt("What is the purpose of this template? (e.g., 'Welcome new users', 'Weekend promotion', 'Request for feedback')");
    const variables = prompt("List any variables, separated by commas (e.g., 'name, order_number, delivery_date')");
    if (!purpose) return;
    setIsGeneratingAiContent(true);
    try {
        const content = await generateWhatsAppTemplateContent(purpose, variables ? variables.split(',').map(v => v.trim()) : []);
        setCurrentWhatsAppTemplate(prev => ({ ...prev, content: content }));
    } catch (e: any) {
        alert(`AI Generation Failed: ${e.message}`);
    } finally {
        setIsGeneratingAiContent(false);
    }
  };
  const handleSaveWhatsAppTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    let templates = getWhatsAppTemplates();
    const newTemplate: WhatsAppTemplate = { ...currentWhatsAppTemplate, id: `w-template-${Date.now()}`, buttons: currentTemplateButtons };
    templates.push(newTemplate);
    saveWhatsAppTemplates(templates);
    setWhatsAppTemplates(templates);
    setIsWhatsAppTemplateModalOpen(false);
    alert('Template saved and submitted for mock approval.');
  };
  const requestMockApproval = (id: string) => {
    setLoadingMessage("Requesting mock approval...");
    setTimeout(() => {
        let templates = getWhatsAppTemplates();
        const index = templates.findIndex(t => t.id === id);
        if (index !== -1) {
            templates[index].status = 'Approved';
            saveWhatsAppTemplates(templates);
            setWhatsAppTemplates(templates);
        }
        setLoadingMessage(null);
    }, 1500);
  };
  const openWhatsAppCampaignModal = () => { 
    setIsWhatsAppCampaignModalOpen(true); 
    setCurrentWhatsAppCampaign(initialWhatsAppCampaignFormState); 
    setCustomCampaignAudience('');
  };
  const handleWhatsAppCampaignFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setCurrentWhatsAppCampaign(prev => ({ ...prev, [name]: value })); };
  const handleSaveWhatsAppCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAudience = currentWhatsAppCampaign.targetAudience === 'Other' ? customCampaignAudience : currentWhatsAppCampaign.targetAudience;
    if (currentWhatsAppCampaign.targetAudience === 'Other' && !finalAudience) {
        alert("Custom Audience cannot be empty.");
        return;
    }

    const campaigns = getWhatsAppCampaigns();
    const newCampaign: WhatsAppCampaign = { ...currentWhatsAppCampaign, id: `w-campaign-${Date.now()}`, targetAudience: finalAudience };
    campaigns.unshift(newCampaign);
    saveWhatsAppCampaigns(campaigns);
    setWhatsAppCampaigns(campaigns);
    setIsWhatsAppCampaignModalOpen(false);
    alert('Campaign saved as draft. You can schedule it from the list.');
  };
  const scheduleMockCampaign = (id: string) => {
    setLoadingMessage("Scheduling campaign...");
    setTimeout(() => {
      let campaigns = getWhatsAppCampaigns();
      const index = campaigns.findIndex(c => c.id === id);
      if (index !== -1) {
          campaigns[index].status = 'Scheduled';
          saveWhatsAppCampaigns(campaigns);
          setWhatsAppCampaigns(campaigns);

          const scheduledTime = new Date(campaigns[index].scheduledAt).getTime();
          const delay = Math.max(0, scheduledTime - Date.now());
          setTimeout(() => {
              let currentCampaigns = getWhatsAppCampaigns();
              const sentIndex = currentCampaigns.findIndex(c => c.id === id);
              if (sentIndex !== -1) {
                  currentCampaigns[sentIndex].status = 'Sent';
                  const totalUsers = getManagedUsers().length;
                  currentCampaigns[sentIndex].stats = { sent: totalUsers, delivered: Math.floor(totalUsers * 0.98), read: Math.floor(totalUsers * 0.65), failed: totalUsers - Math.floor(totalUsers * 0.98) };
                  saveWhatsAppCampaigns(currentCampaigns);
                  setWhatsAppCampaigns(getWhatsAppCampaigns());
              }
          }, delay);
      }
      setLoadingMessage(null);
    }, 1000);
  };
  const openWhatsAppAutomationModal = () => { 
    setIsWhatsAppAutomationModalOpen(true); 
    setCurrentWhatsAppAutomation(initialWhatsAppAutomationFormState);
    setCustomAutomationTrigger('');
  };
  const handleWhatsAppAutomationFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value, type } = e.target; if (type === 'checkbox') { setCurrentWhatsAppAutomation(prev => ({ ...prev, isActive: (e.target as HTMLInputElement).checked })); } else { setCurrentWhatsAppAutomation(prev => ({ ...prev, [name]: value })); } };
  const handleWhatsAppAutomationActionChange = (index: number, field: string, value: string | number) => {
    const newActions = [...(currentWhatsAppAutomation.actions || [])];
    const actionToUpdate = newActions[index];
    (actionToUpdate as any)[field] = value;
    if (actionToUpdate.type === 'Send Template Message' && field === 'templateId' && typeof value === 'string') {
        const template = whatsAppTemplates.find(t => t.id === value);
        actionToUpdate.templateName = template?.name;
    }
    setCurrentWhatsAppAutomation(prev => ({ ...prev, actions: newActions }));
  };
  const handleAutomationActionTypeChange = (index: number, newType: WhatsAppAction['type']) => {
      const oldActions = [...(currentWhatsAppAutomation.actions || [])];
      let newAction: WhatsAppAction;
      switch (newType) {
          case 'Send Template Message':
              newAction = { type: 'Send Template Message', templateId: '' };
              break;
          case 'Wait':
              newAction = { type: 'Wait', delayMinutes: 10 };
              break;
          case 'Add to Audience List':
              newAction = { type: 'Add to Audience List', listName: '' };
              break;
          case 'Set Custom Attribute':
              newAction = { type: 'Set Custom Attribute', key: '', value: '' };
              break;
          default: 
            return;
      }
      const newActions = [...oldActions];
      newActions[index] = newAction;
      setCurrentWhatsAppAutomation(prev => ({...prev, actions: newActions}));
  };
  const addAutomationAction = () => {
      const newAction: WhatsAppAction = { type: 'Send Template Message', templateId: '' };
      setCurrentWhatsAppAutomation(prev => ({...prev, actions: [...(prev.actions || []), newAction]}));
  };
  const removeAutomationAction = (index: number) => {
    setCurrentWhatsAppAutomation(prev => ({...prev, actions: (prev.actions || []).filter((_, i) => i !== index)}));
  };
  const handleSaveWhatsAppAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTrigger = currentWhatsAppAutomation.trigger === 'Other' ? customAutomationTrigger : currentWhatsAppAutomation.trigger;
    if(currentWhatsAppAutomation.trigger === 'Other' && !finalTrigger) {
        alert("Custom Trigger cannot be empty.");
        return;
    }

    const automations = getWhatsAppAutomations();
    // Sanitize actions before saving
    const finalActions = currentWhatsAppAutomation.actions.map(act => {
        if(act.type === 'Send Template Message') {
            const template = whatsAppTemplates.find(t => t.id === act.templateId);
            return { ...act, templateName: template?.name };
        }
        return act;
    });
    const newAutomation: WhatsAppAutomation = { ...currentWhatsAppAutomation, id: `w-auto-${Date.now()}`, actions: finalActions, trigger: finalTrigger };
    automations.push(newAutomation);
    saveWhatsAppAutomations(automations);
    setWhatsAppAutomations(automations);
    setIsWhatsAppAutomationModalOpen(false);
  };
  const toggleAutomationActive = (id: string) => {
    const automations = getWhatsAppAutomations();
    const index = automations.findIndex(a => a.id === id);
    if(index !== -1) {
      automations[index].isActive = !automations[index].isActive;
      saveWhatsAppAutomations(automations);
      setWhatsAppAutomations(automations);
    }
  };
  const handleSendChatMessage = (messageText: string) => {
      const textToSend = messageText.trim();
      if (!textToSend || !selectedWhatsAppConversation) return;

      const newMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: 'ai', // Simulating agent reply
          text: textToSend,
          timestamp: new Date()
      };
      
      const convos = [...whatsAppConversations];
      const convoIndex = convos.findIndex(c => c.id === selectedWhatsAppConversation.id);
      if (convoIndex !== -1) {
          convos[convoIndex].messages.push(newMessage);
          convos[convoIndex].lastMessage = textToSend;
          convos[convoIndex].timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          saveWhatsAppConversations(convos);
          setWhatsAppConversations(convos);
          setSelectedWhatsAppConversation(convos[convoIndex]);
      }

      setCurrentChatMessage('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedWhatsAppConversation) {
        const file = e.target.files[0];
        const newFileMessage: ChatMessage = {
            id: `msg-file-${Date.now()}`,
            sender: 'ai',
            text: `[File Sent: ${file.name}]`,
            timestamp: new Date()
        };
        const convos = [...whatsAppConversations];
        const convoIndex = convos.findIndex(c => c.id === selectedWhatsAppConversation.id);
        if (convoIndex !== -1) {
            convos[convoIndex].messages.push(newFileMessage);
            convos[convoIndex].lastMessage = `📎 File: ${file.name}`;
            saveWhatsAppConversations(convos);
            setWhatsAppConversations(convos);
            setSelectedWhatsAppConversation(convos[convoIndex]);
        }
    }
  };

  const handleAddTag = (conversationId: string, tagToAdd: string) => {
    if (!tagToAdd.trim() || !selectedWhatsAppConversation) return;
    const currentTags = selectedWhatsAppConversation.tags || [];
    if (!currentTags.includes(tagToAdd.trim())) {
        const newTags = [...currentTags, tagToAdd.trim()];
        const updatedConversations = updateConversationTags(conversationId, newTags);
        setWhatsAppConversations(updatedConversations);
        const updatedSelectedConvo = updatedConversations.find(c => c.id === conversationId);
        setSelectedWhatsAppConversation(updatedSelectedConvo || null);
    }
    setTagInput('');
  };

  const handleRemoveTag = (conversationId: string, tagToRemove: string) => {
      if (!selectedWhatsAppConversation) return;
      const newTags = (selectedWhatsAppConversation.tags || []).filter(t => t !== tagToRemove);
      const updatedConversations = updateConversationTags(conversationId, newTags);
      setWhatsAppConversations(updatedConversations);
      const updatedSelectedConvo = updatedConversations.find(c => c.id === conversationId);
      setSelectedWhatsAppConversation(updatedSelectedConvo || null);
  };
  
  if (authLoading || loadingMessage) return <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-dark-background"><LoadingSpinner text={loadingMessage || "Loading Dashboard..."} size="lg" /></div>;
  if (!currentUser) return null; 

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  const navGroups = [
    { title: 'ANALYTICS', roles: [UserRole.ADMIN, UserRole.MANAGER], items: [{ id: 'analytics', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> }] },
    { title: 'OPERATIONS', roles: [UserRole.ADMIN, UserRole.MANAGER], items: [
        { id: 'orders', label: 'Orders', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
        { id: 'todos', label: 'To-Do\'s', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'menu', label: 'Menu', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg> },
        { id: 'dailyMenuPlanner', label: 'Daily Planner', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        { id: 'inventory', label: 'Inventory', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
        { id: 'procurement', label: 'Procurement', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
    ]},
    { title: 'GROWTH', roles: [UserRole.ADMIN], items: [
        { id: 'crm', label: 'CRM', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        { id: 'partners', label: 'Partners', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
        { id: 'loyalty', label: 'Loyalty Program', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg> },
    ]},
    { title: 'PLATFORM', roles: [UserRole.ADMIN], items: [
        { id: 'whatsapp', label: 'WhatsApp AI', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
        { id: 'integrations', label: 'Integrations', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
        { id: 'siteContent', label: 'Site Content', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> },
        { id: 'slots', label: 'Delivery Slots', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'settings', label: 'General Settings', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ]},
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if(window.innerWidth < 768) { // md breakpoint
        setIsSidebarOpen(false);
    }
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-dark-background font-sans">
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            ></div>
        )}
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-dark-surface shadow-xl z-50 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
            <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
                <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
                    <img src={siteSettings.businessInfo.logoUrl || "https://picsum.photos/seed/logo/40/40"} alt="Logo" className="h-8 w-8 rounded-md" />
                    <span>{siteSettings.businessInfo.name}</span>
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Admin Panel</p>
            </div>
            <nav className="flex-grow p-4 space-y-4 overflow-y-auto">
                {navGroups.map(group => (
                    (!group.roles || group.roles.includes(currentUser.role)) && (
                        <div key={group.title}>
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">{group.title}</h3>
                            <ul className="space-y-1">
                                {group.items.map(item => (
                                    <li key={item.id}>
                                        <button onClick={() => handleTabClick(item.id)} className={`w-full flex items-center space-x-3 px-2 py-2.5 text-sm font-medium rounded-md transition-colors ${activeTab === item.id ? 'bg-primary/20 text-primary' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                ))}
            </nav>
            <div className="p-4 border-t dark:border-gray-700 mt-auto flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <img src={currentUser.profilePictureUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt="profile" className="w-10 h-10 rounded-full object-cover"/>
                    <div className="text-sm">
                        <p className="font-semibold text-gray-800 dark:text-gray-200">{currentUser.firstName} {currentUser.lastName}</p>
                        <button 
                            onClick={handleLogout} 
                            className="text-xs text-red-600 dark:text-red-400 hover:underline focus:outline-none"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
             <header className="sticky top-0 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm z-30 p-2 flex justify-between items-center shadow md:hidden">
                 <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                 </button>
                 <h1 className="text-lg font-bold text-primary-dark dark:text-primary-light capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</h1>
                 <div className="w-8"></div>
            </header>

            <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div hidden={activeTab !== 'analytics'}>
                    <AnalyticsTabContent orders={allOrders} users={users} meals={meals} />
                </div>
                <div hidden={activeTab !== 'orders'}>
                    <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Order Management</h2>{(allOrders.length === 0 && !loadingMessage) ? <p className="text-gray-500 dark:text-gray-400">No orders found.</p> : (<div className="overflow-x-auto max-h-[600px]"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm"><thead className="bg-gray-100 dark:bg-dark-background sticky top-0 z-10"><tr><th className="px-3 py-2.5 text-left font-semibold">Order ID</th><th className="px-3 py-2.5 text-left">Date</th><th className="px-3 py-2.5 text-left">User</th><th className="px-3 py-2.5 text-left">Slot</th><th className="px-3 py-2.5 text-right">Total</th><th className="px-3 py-2.5 text-left">Status</th><th className="px-3 py-2.5 text-left">Actions</th></tr></thead><tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">{allOrders.map(order => (<tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-dark-background/50"><td className="px-3 py-2 whitespace-nowrap" title={order.id}>{order.id.substring(0,8)}...</td><td className="px-3 py-2 whitespace-nowrap">{new Date(order.orderDate).toLocaleDateString()}</td><td className="px-3 py-2 whitespace-nowrap" title={order.userId}>{(users.find(u=>u.id === order.userId)?.firstName || order.userId.substring(0,8) + '...')}</td><td className="px-3 py-2 whitespace-nowrap">{order.deliveryWindowDisplay}</td><td className="px-3 py-2 whitespace-nowrap text-right">${order.totalAmount.toFixed(2)}</td><td className="px-3 py-2 whitespace-nowrap"><select value={order.status} onChange={(e) => handleAdminUpdateOrderStatus(order.id, e.target.value as OrderStatus)} className={`p-1.5 rounded text-xs border w-full dark:text-white dark:bg-dark-background ${order.status === OrderStatus.DELIVERED ? 'bg-green-100 dark:bg-green-900/50 border-green-300 text-green-700 dark:text-green-300' : order.status === OrderStatus.OUT_FOR_DELIVERY ? 'bg-orange-100 dark:bg-orange-900/50 border-orange-300 text-orange-700 dark:text-orange-300' : 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 text-yellow-700 dark:text-yellow-300'}`}>{Object.values(OrderStatus).map(status => (<option key={status} value={status}>{status}</option>))}</select></td><td className="px-3 py-2 whitespace-nowrap">{order.status === OrderStatus.OUT_FOR_DELIVERY && (<Link to={`/order-tracking/${order.id}`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium">Track</Link>)}</td></tr>))}</tbody></table></div>)}</section>
                </div>
                <div hidden={activeTab !== 'whatsapp'}>
                    <WhatsAppAITabContent onOpenTemplateModal={openWhatsAppTemplateModal} onOpenCampaignModal={openWhatsAppCampaignModal} onOpenAutomationModal={openWhatsAppAutomationModal} {...{whatsAppSubTab, setWhatsAppSubTab, whatsAppAnalytics, whatsAppContacts, whatsAppConversations, setWhatsAppConversations, selectedWhatsAppConversation, setSelectedWhatsAppConversation, currentChatMessage, setCurrentChatMessage, handleSendChatMessage, whatsAppCampaigns, scheduleMockCampaign, whatsAppAutomations, toggleAutomationActive, whatsAppTemplates, requestMockApproval, tagInput, setTagInput, handleAddTag, handleRemoveTag, isNewContactModalOpen, setIsNewContactModalOpen, isImportContactsModalOpen, setIsImportContactsModalOpen, quickReplies, attachmentInputRef, handleFileSelect, isEmojiPickerOpen, setIsEmojiPickerOpen, isQuickReplyOpen, setIsQuickReplyOpen}} />
                </div>
                <div hidden={activeTab !== 'menu'}>
                    <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg"><div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Manage Meal Menu</h2><button onClick={() => openMealModal()} className="mt-2 sm:mt-0 bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg text-sm">Add New Meal</button></div>{meals.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No meals found.</p> : <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">{meals.map(meal => (<div key={meal.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border dark:border-gray-700 rounded-md hover:shadow-sm dark:hover:bg-dark-background/50"><div className="flex items-center space-x-3 flex-grow min-w-0"><img src={meal.imageUrl} alt={meal.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0"/><div className="min-w-0"><p className="font-medium text-gray-800 dark:text-gray-200 truncate" title={meal.name}>{meal.name} {meal.partnerId && <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full ml-1">Partner Meal</span>}</p><p className="text-sm text-gray-500 dark:text-gray-400">${meal.price.toFixed(2)} - {meal.category}</p><p className="text-xs text-gray-400 truncate hidden sm:block" title={meal.description}>{meal.description}</p></div></div><div className="flex space-x-2 mt-2 sm:mt-0 self-start sm:self-center flex-shrink-0"><button onClick={() => openMealModal(meal)} className="text-xs sm:text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-2.5 rounded">Edit</button><button onClick={() => handleDeleteMeal(meal.id)} className="text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-2.5 rounded">Delete</button></div></div>))}</div>}</section>
                </div>
                <div hidden={activeTab !== 'dailyMenuPlanner'}>
                    {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && (
                    <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Daily Menu Planner</h2>
                        <form onSubmit={handleDailyMenuSubmit} className="space-y-4 p-4 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-dark-background text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                            <label htmlFor="scheduleDate" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                            <input type="date" id="scheduleDate" name="date" value={dailyMenuPlannerForm.date} onChange={handleDailyMenuFormChange} required className="w-full p-2 border dark:border-gray-600 rounded-md dark:bg-dark-surface dark:text-white"/>
                            </div>
                            <div>
                            <label htmlFor="scheduleSlot" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Meal Slot</label>
                            <select id="scheduleSlot" name="mealSlot" value={dailyMenuPlannerForm.mealSlot} onChange={handleDailyMenuFormChange} required className="w-full p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-dark-surface dark:text-white">
                                {Object.values(MealSlot).map(slot => <option key={slot} value={slot}>{slot}</option>)}
                            </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="scheduleMeals" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select Meals for this Slot (Ctrl/Cmd + Click for multiple)</label>
                            <select id="scheduleMeals" name="mealIds" multiple value={dailyMenuPlannerForm.mealIds} onChange={handleDailyMenuFormChange} required className="w-full h-32 p-2 border dark:border-gray-600 rounded-md bg-white dark:bg-dark-surface dark:text-white">
                            {allAvailableMealsForPlanner.map(meal => <option key={meal.id} value={meal.id}>{meal.name} (${meal.price.toFixed(2)})</option>)}
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input type="checkbox" id="isSpecialMenu" name="isSpecial" checked={dailyMenuPlannerForm.isSpecial || false} onChange={handleDailyMenuFormChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/>
                            <label htmlFor="isSpecialMenu" className="ml-2 block text-xs font-medium text-gray-700 dark:text-gray-300">Mark as Special Menu?</label>
                        </div>
                        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg text-sm">Save Schedule</button>
                        </form>
                        <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Current Schedules (Last 10)</h3>
                        {dailyMenuSchedules.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No schedules defined yet.</p> : 
                            <div className="space-y-2 max-h-60 overflow-y-auto text-xs pr-1">
                            {dailyMenuSchedules.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.mealSlot.localeCompare(b.mealSlot)).slice(0,10).map(schedule => (
                                <div key={`${schedule.date}-${schedule.mealSlot}`} className="p-2 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-dark-background">
                                <p className="font-medium">{schedule.date} - {schedule.mealSlot} {schedule.isSpecial && <span className="text-xs bg-accent text-white px-1.5 py-0.5 rounded-full ml-1">Special</span>}</p>
                                <ul className="list-disc list-inside pl-3">
                                    {schedule.mealIds.map(id => {
                                        const meal = allAvailableMealsForPlanner.find(m => m.id === id);
                                        return <li key={`${schedule.date}-${schedule.mealSlot}-${id}`}>{meal ? meal.name : `Meal ID: ${id} (Not found)`}</li>;
                                    })}
                                </ul>
                                </div>
                            ))}
                            </div>
                        }
                        </div>
                    </section>
                    )}
                </div>
                <div hidden={activeTab !== 'siteContent'}>
                    {currentUser.role === UserRole.ADMIN && (
                    <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg space-y-8">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Site Content Management</h2>
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Customer Testimonials</h3>
                                <button onClick={() => openTestimonialModal()} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Add Testimonial</button>
                            </div>
                            {testimonials.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No testimonials yet.</p> : 
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                                    {testimonials.map(t => (
                                        <div key={t.id} className="p-2 border dark:border-gray-700 rounded bg-gray-50 dark:bg-dark-background flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <img src={t.imageUrl || 'https://via.placeholder.com/50x50.png?text=Img'} alt={t.name} className="w-10 h-10 rounded-full object-cover"/>
                                                <div>
                                                    <p className="font-medium">{t.name} ({t.rating}★)</p>
                                                    <p className="text-gray-600 dark:text-gray-400 italic">"{t.comment.substring(0,50)}..."</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteCurrentTestimonial(t.id)} className="text-red-500 text-xs hover:underline ml-2">Delete</button>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Homepage Social Feed Items</h3>
                                <button onClick={() => openSocialFeedItemModal()} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Add Feed Item</button>
                            </div>
                            {socialFeedItems.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No social feed items for homepage.</p> :
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                                    {socialFeedItems.map(item => (
                                        <div key={item.id} className="p-2 border dark:border-gray-700 rounded bg-gray-50 dark:bg-dark-background flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <img src={item.imageUrl || 'https://via.placeholder.com/50x50.png?text=Img'} alt={item.caption.substring(0,20)} className="w-10 h-10 rounded-md object-cover"/>
                                                <div>
                                                    <p className="font-medium">{item.platform}: {item.caption.substring(0,40)}...</p>
                                                    <a href={item.postUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Post</a>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteCurrentSocialFeedItem(item.id)} className="text-red-500 text-xs hover:underline ml-2">Delete</button>
                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                        <div className="border-t dark:border-gray-700 pt-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Main Social Media Profile Links (for Homepage)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <label htmlFor="mainInstaLink" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Instagram URL</label>
                                    <input type="url" id="mainInstaLink" name="instagram" value={mainSocialLinksForm.instagram} onChange={handleMainSocialLinksChange} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" inputMode="url"/>
                                </div>
                                <div>
                                    <label htmlFor="mainFbLink" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Facebook URL</label>
                                    <input type="url" id="mainFbLink" name="facebook" value={mainSocialLinksForm.facebook} onChange={handleMainSocialLinksChange} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" inputMode="url"/>
                                </div>
                            </div>
                            <button onClick={handleSaveMainSocialLinks} className="mt-3 bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-3 rounded-md text-sm">Save Social Links</button>
                        </div>
                    </section>
                    )}
                </div>
                <div hidden={activeTab !== 'slots'}>
                    {currentUser.role === UserRole.ADMIN && (<section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Manage Delivery Slots</h2><div className="space-y-6">{slotConfigs.map(slot => (<div key={slot.id || slot.name} className="p-3 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-dark-background grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"><h3 className="font-semibold text-gray-700 dark:text-gray-200 col-span-full sm:col-span-1 lg:col-span-4">{slot.name} ({slot.displayWindow})</h3><div><label className="text-xs">Delivery Hour (0-23)</label><input type="number" value={slot.deliveryHour} onChange={(e) => handleSlotConfigChange(slot.name, 'deliveryHour', e.target.value)} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded-md text-sm dark:bg-dark-background dark:text-white" inputMode="numeric"/></div><div><label className="text-xs">Window (minutes)</label><input type="number" value={slot.deliveryWindowMinutes} onChange={(e) => handleSlotConfigChange(slot.name, 'deliveryWindowMinutes', e.target.value)} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded-md text-sm dark:bg-dark-background dark:text-white" inputMode="numeric"/></div><div><label className="text-xs">Cutoff (hours before)</label><input type="number" value={slot.cutoffHoursBeforeDelivery} onChange={(e) => handleSlotConfigChange(slot.name, 'cutoffHoursBeforeDelivery', e.target.value)} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded-md text-sm dark:bg-dark-background dark:text-white" inputMode="numeric"/></div></div>))}<button onClick={saveSlotConfigs} className="mt-4 bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg text-sm">Save Slot Changes</button></div></section>)}
                </div>
                <div hidden={activeTab !== 'partners'}>
                    {currentUser.role === UserRole.ADMIN && (<section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg space-y-6"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Partner Management</h2>{showPartnerApprovalMessage && <div className="p-3 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-300 rounded-md text-sm mb-4">{showPartnerApprovalMessage}</div>}<div><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Partner Applications ({partnerApplications.filter(app => app.status === 'Pending').length} Pending)</h3>{partnerApplications.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-sm">No partner applications.</p> : <div className="space-y-2 max-h-60 overflow-y-auto pr-2">{partnerApplications.map(app => (<div key={app.id} className={`p-3 border dark:border-gray-700 rounded-md text-xs ${app.status === 'Pending' ? 'bg-yellow-50 dark:bg-yellow-900/40 border-yellow-200 dark:border-yellow-800' : app.status === 'Approved' ? 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800'}`}><p><strong>{app.businessName}</strong> ({app.email}) - Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p><p>Applicant: {app.applicantName}, Notes: {app.serviceAreaNotes}</p><p>Status: <span className="font-semibold">{app.status}</span></p>{app.status === 'Pending' && (<div className="mt-1.5 space-x-2"><button onClick={() => handlePartnerAppStatusChange(app.id, 'Approved')} className="bg-green-500 hover:bg-green-600 text-white py-0.5 px-1.5 rounded">Approve</button><button onClick={() => handlePartnerAppStatusChange(app.id, 'Rejected')} className="bg-red-500 hover:bg-red-600 text-white py-0.5 px-1.5 rounded">Reject</button></div>)}</div>))}</div>}</div><div><div className="flex justify-between items-center mb-3"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Active Partners ({partners.length})</h3><button onClick={openManualPartnerModal} className="bg-secondary hover:bg-secondary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Add Partner Manually</button></div>{partners.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-sm">No active partners.</p> : <ul className="space-y-1.5 text-sm max-h-60 overflow-y-auto pr-2">{partners.map(p => <li key={p.id} className="p-2 border dark:border-gray-700 rounded bg-gray-50 dark:bg-dark-background flex justify-between items-center"><span>{p.firstName} {p.lastName} ({p.email}) - Agreement: {p.agreementAcknowledged ? <span className="text-green-600 dark:text-green-400">Acknowledged</span> : <span className="text-red-600 dark:text-red-400">Pending</span>}</span><button onClick={() => setIsPartnerAgreementModalOpen(true)} className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600">View Agreement (Mock)</button></li>)}</ul>}</div></section>)}
                </div>
                <div hidden={activeTab !== 'inventory'}>
                    <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg"><div className="flex flex-col sm:flex-row justify-between items-center mb-6"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Inventory Management</h2><button onClick={() => openInventoryModal()} className="mt-2 sm:mt-0 bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg text-sm">Add Item</button></div>{inventory.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No inventory items.</p> : <div className="overflow-x-auto max-h-[500px]"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm"><thead className="bg-gray-100 dark:bg-dark-background sticky top-0 z-10"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-right">Quantity</th><th className="px-3 py-2 text-left">Unit</th><th className="px-3 py-2 text-right">Low Stock At</th><th className="px-3 py-2 text-left">Supplier</th><th className="px-3 py-2 text-right">Last Price</th><th className="px-3 py-2 text-center">Actions</th></tr></thead><tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">{inventory.map(item => (<tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-dark-background/50 ${item.quantity <= item.lowStockThreshold ? 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-medium' : 'dark:text-gray-300'}`}><td className="px-3 py-2">{item.name}</td><td className="px-3 py-2 text-right">{item.quantity}</td><td className="px-3 py-2">{item.unit}</td><td className="px-3 py-2 text-right">{item.lowStockThreshold}</td><td className="px-3 py-2">{item.supplier || 'N/A'}</td><td className="px-3 py-2 text-right">{item.lastPurchasePrice ? `$${item.lastPurchasePrice.toFixed(2)}` : 'N/A'}</td><td className="px-3 py-2 text-center space-x-1"><button onClick={() => handleOpenRestockModal(item)} className="text-green-600 hover:text-green-800 text-xs">Re-stock</button><button onClick={() => openInventoryModal(item)} className="text-blue-600 hover:text-blue-800 text-xs">Edit</button><button onClick={() => handleDeleteInventoryItem(item.id)} className="text-red-600 hover:text-red-800 text-xs">Delete</button></td></tr>))}</tbody></table></div>}</section>
                </div>
                <div hidden={activeTab !== 'procurement'}>
                    <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg space-y-8"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Procurement</h2><div><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Items to Purchase List ({purchaseList.length})</h3>{purchaseList.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-sm">No items in purchase list. Add from Inventory Re-stock.</p> : (<div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-1">{purchaseList.map(item => (<div key={item.itemId} className="p-2.5 border dark:border-gray-700 rounded-md bg-yellow-50 dark:bg-yellow-900/40 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center"><span className="font-medium sm:col-span-2">{item.itemName} ({item.unit})</span><input type="number" value={item.quantityToBuy} onChange={e => handlePurchaseListItemUpdate(item.itemId, parseInt(e.target.value), item.supplier, item.estimatedPrice)} className="p-1 border dark:border-gray-600 rounded w-16 sm:w-20 text-center dark:bg-dark-background dark:text-white" inputMode="numeric"/><input type="text" placeholder="Supplier" value={item.supplier || ''} onChange={e => handlePurchaseListItemUpdate(item.itemId, item.quantityToBuy, e.target.value, item.estimatedPrice)} className="p-1 border dark:border-gray-600 rounded sm:col-span-1 dark:bg-dark-background dark:text-white" inputMode="text"/><div className="flex items-center sm:col-span-1"><span className="mr-1">$</span><input type="number" step="0.01" placeholder="Est. Price/Unit" value={item.estimatedPrice || ''} onChange={e => handlePurchaseListItemUpdate(item.itemId, item.quantityToBuy, item.supplier, parseFloat(e.target.value))} className="p-1 border dark:border-gray-600 rounded w-24 dark:bg-dark-background dark:text-white" inputMode="decimal"/><button onClick={() => handleRemoveFromPurchaseList(item.itemId)} className="ml-2 text-red-500 hover:text-red-700 text-lg">&times;</button></div></div>))}                  <button onClick={() => {if(window.confirm("Clear entire purchase list?")) {clearPurchaseList(); setPurchaseList(getPurchaseList());}}} className="mt-2 text-red-500 hover:underline text-xs">Clear List</button></div>)}</div>{purchaseList.length > 0 && (<div className="border-t dark:border-gray-700 pt-6"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Finalize Purchase Order</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"><div><label>Total Actual Cost*</label><input type="number" name="totalActualCost" value={finalizePurchaseForm.totalActualCost || ''} onChange={handleFinalizePurchaseFormChange} required className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" inputMode="decimal"/></div><div><label>Payment Method*</label><select name="paymentMethod" value={finalizePurchaseForm.paymentMethod} onChange={handleFinalizePurchaseFormChange} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded bg-white dark:bg-dark-surface dark:text-white"><option value="Online">Online</option><option value="Cash">Cash</option></select></div><div className="sm:col-span-2"><label>Supplier Notes (Optional)</label><textarea name="supplierNotes" value={finalizePurchaseForm.supplierNotes} onChange={handleFinalizePurchaseFormChange} rows={2} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"></textarea></div></div><button onClick={handleConfirmPurchase} className="mt-3 bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg text-sm">Confirm Purchase & Update Inventory</button></div>)}<div><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Purchase History ({purchaseHistory.length})</h3>{purchaseHistory.length === 0 ? <p className="text-gray-500 dark:text-gray-400 text-sm">No purchase history found.</p> : (<div className="overflow-x-auto max-h-60 text-xs"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"><thead className="bg-gray-100 dark:bg-dark-background sticky top-0 z-10"><tr><th className="px-2 py-1.5 text-left">ID</th><th className="px-2 py-1.5 text-left">Date</th><th className="px-2 py-1.5 text-left">By</th><th className="px-2 py-1.5 text-right">Cost</th><th className="px-2 py-1.5 text-left">Payment</th><th className="px-2 py-1.5 text-left">Items</th></tr></thead><tbody className="divide-y divide-gray-200 dark:divide-gray-700">{purchaseHistory.map(po => (<tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-dark-background/50"><td title={po.id}>{po.id.substring(0,6)}...</td><td>{new Date(po.purchaseDate).toLocaleDateString()}</td><td>{po.purchasedByUserName}</td><td className="text-right">${po.totalActualCost.toFixed(2)}</td><td>{po.paymentMethod}</td><td><details><summary>{po.items.length} items</summary><ul className="list-disc pl-3">{po.items.map((item, index) => <li key={`${po.id}-${item.itemId}-${index}`}>{item.itemName} (x{item.quantityToBuy})</li>)}</ul></details></td></tr>))}</tbody></table></div>)}</div></section>
                </div>
                <div hidden={activeTab !== 'todos'}>
                    <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">To-Do List</h2><div className="flex flex-col sm:flex-row mb-4 gap-2 items-start"><div className="flex-grow space-y-1"><input type="text" name="task" value={todoForm.task} onChange={handleTodoFormChange} placeholder="New task..." className="w-full p-2 border dark:border-gray-600 rounded-md text-sm dark:bg-dark-background dark:text-white"/><div className="flex items-center gap-2 text-xs"><input type="checkbox" name="isReminderSet" id="isReminderSet" checked={todoForm.isReminderSet} onChange={handleTodoFormChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/><label htmlFor="isReminderSet">Set Reminder</label>{todoForm.isReminderSet && (<input type="datetime-local" name="reminderDateTime" value={todoForm.reminderDateTime} onChange={handleTodoFormChange} className="p-1 border dark:border-gray-600 rounded-md text-xs dark:bg-dark-background dark:text-white"/>)}</div></div><button onClick={handleSaveTodo} className="bg-primary hover:bg-primary-dark text-white py-2 px-3 rounded-md text-sm sm:self-end">{editingTodoId ? 'Update Task' : 'Add Task'}</button></div>{todos.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No tasks yet.</p> : <ul className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">{todos.map(todo => (<li key={todo.id} className={`p-2 border dark:border-gray-700 rounded text-sm ${todo.completed ? 'bg-green-50 dark:bg-green-900/40 line-through text-gray-500' : 'hover:bg-gray-50 dark:hover:bg-dark-background/50'}`}><div className="flex items-center justify-between"><span onClick={() => handleToggleTodo(todo.id)} className="cursor-pointer flex-grow">{todo.task} <span className="text-xs text-gray-400">({new Date(todo.createdAt).toLocaleDateString()})</span></span><div className="space-x-1 flex-shrink-0"><button onClick={() => handleEditTodo(todo)} className="text-yellow-600 hover:text-yellow-800 text-xs">Edit</button><button onClick={() => handleDeleteTodo(todo.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button></div></div>{todo.isReminderSet && todo.reminderDateTime && (<p className="text-xs text-blue-500 mt-0.5">Reminder: {new Date(todo.reminderDateTime).toLocaleString()} {todo.reminderAlerted && <span className="text-green-500">(Alerted)</span>}</p>)}</li>))}</ul>}</section>
                </div>
                <div hidden={activeTab !== 'crm'}>
                    {currentUser.role === UserRole.ADMIN && (<section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Customer Relationship Management</h2>{users.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No users found.</p> : <div className="overflow-x-auto max-h-[500px]"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm"><thead className="bg-gray-100 dark:bg-dark-background sticky top-0 z-10"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2 text-left">WhatsApp</th><th className="px-3 py-2 text-left">Role</th><th className="px-3 py-2 text-left">Birthday</th><th className="px-3 py-2 text-left">Loyalty</th><th className="px-3 py-2 text-center">Actions</th><th className="px-3 py-2 text-center">AI Tools</th></tr></thead><tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">{users.map(user => (<tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-background/50"><td className="px-3 py-2">{user.firstName} {user.lastName}</td><td className="px-3 py-2">{user.email}</td><td className="px-3 py-2">{user.whatsappNumber || 'N/A'}</td><td className="px-3 py-2">{user.role}</td><td className="px-3 py-2">{user.birthday || 'N/A'}</td><td className="px-3 py-2 text-left">{user.customerLoyaltyStatus?.points || 0}</td><td className="px-3 py-2 text-center"><button onClick={() => openCrmUserDetails(user)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs">View Details</button></td><td className="px-3 py-2 text-center"><button onClick={() => openCrmAiModal(user)} className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-xs font-semibold">Analyze</button></td></tr>))}</tbody></table></div>}</section>)}
                </div>
                <div hidden={activeTab !== 'loyalty'}>
                    {currentUser.role === UserRole.ADMIN && (
                    <section className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg space-y-6">
                        <div className="flex justify-between items-center"><h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Customer Loyalty Settings</h2><button onClick={saveCurrentCustomerLoyaltySettings} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-3 rounded-md text-sm">Save Settings</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div><label className="block text-sm font-medium">Enable Program</label><input type="checkbox" name="enabled" checked={customerLoyaltySettings.enabled} onChange={handleCustomerLoyaltySettingsChange} className="mt-1 h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"/></div>
                            <div><label className="block text-sm font-medium">Points per Dollar Spent</label><input type="number" name="pointsPerDollar" value={customerLoyaltySettings.pointsPerDollar} onChange={handleCustomerLoyaltySettingsChange} className="mt-1 w-full p-1.5 border dark:border-gray-600 rounded-md text-sm dark:bg-dark-background dark:text-white" min="0"/></div>
                        </div>
                        <div className="border-t dark:border-gray-700 pt-4">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Referral Rewards</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm p-2 border dark:border-gray-700 rounded bg-gray-50 dark:bg-dark-background">
                                <fieldset className="border dark:border-gray-600 p-2 rounded"><legend className="text-xs px-1 font-medium">For New User (Referred)</legend>
                                    <div><label>Reward Description*</label><input type="text" name="referralRewardNewUser.description" value={customerLoyaltySettings.referralRewardNewUser.description} onChange={handleCustomerLoyaltySettingsChange} className="w-full mt-0.5 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/></div>
                                    <div><label>Discount % (Optional)</label><input type="number" name="referralRewardNewUser.discountPercentage" value={customerLoyaltySettings.referralRewardNewUser.discountPercentage || ''} onChange={handleCustomerLoyaltySettingsChange} className="w-full mt-0.5 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/></div>
                                    <div><label>Fixed Amount Off (Optional)</label><input type="number" name="referralRewardNewUser.fixedAmount" value={customerLoyaltySettings.referralRewardNewUser.fixedAmount || ''} onChange={handleCustomerLoyaltySettingsChange} className="w-full mt-0.5 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/></div>
                                    <div><label>Validity (Days)*</label><input type="number" name="referralRewardNewUser.validityDays" value={customerLoyaltySettings.referralRewardNewUser.validityDays} onChange={handleCustomerLoyaltySettingsChange} className="w-full mt-0.5 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white" min="1"/></div>
                                </fieldset>
                                <fieldset className="border dark:border-gray-600 p-2 rounded"><legend className="text-xs px-1 font-medium">For Referrer</legend>
                                    <div><label>Reward Description*</label><input type="text" name="referralRewardReferrer.description" value={customerLoyaltySettings.referralRewardReferrer.description} onChange={handleCustomerLoyaltySettingsChange} className="w-full mt-0.5 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/></div>
                                    <div><label>Points Award (Optional)</label><input type="number" name="referralRewardReferrer.pointsAward" value={customerLoyaltySettings.referralRewardReferrer.pointsAward || ''} onChange={handleCustomerLoyaltySettingsChange} className="w-full mt-0.5 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/></div>
                                </fieldset>
                            </div>
                        </div>
                        <div className="mt-4"><div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Tiers</h3><button onClick={() => openCustomerLoyaltyTierModal()} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Add Tier</button></div>
                        {customerLoyaltySettings.tiers.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No tiers defined.</p> : <div className="space-y-2 text-sm">{customerLoyaltySettings.tiers.map(tier => (<div key={tier.id} className="p-2 border dark:border-gray-700 rounded-md bg-gray-50 dark:bg-dark-background flex justify-between items-center"><div><p><strong>{tier.name}</strong> at {tier.pointsThreshold} points</p><p className="text-xs text-gray-500 dark:text-gray-400">Reward: {tier.rewardDescription}</p></div><div className="space-x-1"><button onClick={() => openCustomerLoyaltyTierModal(tier)} className="text-xs bg-yellow-400 hover:bg-yellow-500 text-white px-1.5 py-0.5 rounded">Edit</button><button onClick={() => handleDeleteCustomerLoyaltyTier(tier.id)} className="text-xs bg-red-400 hover:bg-red-500 text-white px-1.5 py-0.5 rounded">Del</button></div></div>))}</div>}</div>
                    </section>
                    )}
                </div>
                <div hidden={activeTab !== 'integrations'}>
                    {currentUser.role === UserRole.ADMIN && (
                    <section className="space-y-8">
                        <div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Integrations & Automations</h2>
                        <div className="mb-6 border dark:border-gray-700 p-3 rounded-md bg-gray-50 dark:bg-dark-background">
                            <div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Connected Social Media Accounts</h3><button onClick={() => {setSocialAccountForm(initialSocialAccountFormState); setCustomConnectPlatform(''); setIsSocialAccountModalOpen(true);}} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Connect Account</button></div>
                            {connectedSocialAccounts.length === 0 ? <p className="text-xs text-gray-500 dark:text-gray-400">No social accounts connected.</p> : connectedSocialAccounts.map(acc => (<div key={acc.id} className="flex justify-between items-center text-xs p-1.5 border-b dark:border-gray-700"><p><strong>{acc.platform}</strong>: {acc.accountName} <span className="text-gray-400">(Token: {acc.mockApiTokenOrDetails.substring(0,8)}...)</span></p><button onClick={() => handleDeleteSocialAccount(acc.id)} className="text-red-500 text-xs hover:underline">Disconnect</button></div>))}
                        </div>
                        <div className="mb-6 border dark:border-gray-700 p-3 rounded-md bg-gray-50 dark:bg-dark-background">
                            <div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Connected Email Provider</h3><button onClick={() => {setEmailProviderForm(initialEmailProviderFormState); setIsEmailProviderModalOpen(true);}} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Connect Provider</button></div>
                            {connectedEmailProviders.length === 0 ? <p className="text-xs text-gray-500 dark:text-gray-400">No email provider connected.</p> : connectedEmailProviders.map(prov => (<div key={prov.id} className="flex justify-between items-center text-xs p-1.5 border-b dark:border-gray-700"><p><strong>{prov.providerName}</strong> <span className="text-gray-400">(API Key: {prov.mockApiKeyOrDetails.substring(0,8)}...)</span></p><button onClick={() => handleDeleteEmailProvider(prov.id)} className="text-red-500 text-xs hover:underline">Disconnect</button></div>))}
                        </div>
                        <div className="mb-6 border dark:border-gray-700 p-3 rounded-md bg-gray-50 dark:bg-dark-background"><div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Social Media Planner (Mockup)</h3><button onClick={() => { setCurrentSocialPost({platform: 'Facebook', content:'', scheduledAt: new Date().toISOString().substring(0,10), targetAccounts: [], imageUrl: ''}); setIsSocialModalOpen(true);}} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Schedule Post</button></div>{socialPosts.slice(0,2).map(p => <div key={p.id} className="text-xs p-1.5 border-b dark:border-gray-700"><strong>{p.platform} on {p.targetAccounts?.join(', ') || 'Default'}:</strong> {p.content.substring(0,30)}... (At: {new Date(p.scheduledAt).toLocaleDateString()}) - <i>{p.status}</i></div>)}</div>
                        <div className="mb-6 border dark:border-gray-700 p-3 rounded-md bg-gray-50 dark:bg-dark-background">
                            <div className="flex justify-between items-center mb-2"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Email Workflow Automation (Mockup)</h3><button onClick={openEmailWorkflowModal} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1 px-2.5 rounded-md text-xs">Create Workflow</button></div>
                            {emailWorkflows.slice(0,2).map(ew => <div key={ew.id} className="text-xs p-1.5 border-b dark:border-gray-700"><strong>{ew.name}:</strong> Trigger: {ew.trigger} &rarr; Action: {ew.action} (Status: {ew.isActive ? 'Active' : 'Paused'})<br/>Target: {ew.targetSegment || 'N/A'}<br/>Template: "{ew.messageTemplate ? ew.messageTemplate.substring(0,50)+'...' : 'N/A'}"</div>)}
                        </div>
                        <div className="mb-6 border dark:border-gray-700 p-3 rounded-md bg-gray-50 dark:bg-dark-background"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Support Ticket Automation Rules (Mock)</h3><div className="space-y-3 text-sm"><div><label className="flex items-center cursor-pointer"><input type="checkbox" className="mr-2 h-4 w-4 text-primary focus:ring-primary-dark"/> IF new ticket created, THEN:</label><ul className="list-disc list-inside pl-6 text-xs text-gray-600 dark:text-gray-400 space-y-0.5 mt-1"><li>1. AI Chatbot attempts to resolve query with standard knowledge base.</li><li>2. IF AI cannot resolve OR query contains keywords (e.g., 'refund', 'complaint', 'urgent'), THEN escalate to human agent.</li><li>3. Send Email & WhatsApp Confirmation to User (Template: `Support_Ticket_Received_Escalated_Email/WhatsApp` - Include `&#123;&#123;ticketId&#125;&#125;`, `&#123;&#123;estimatedResponseTime&#125;&#125;`).</li></ul></div><div><label className="flex items-center cursor-pointer"><input type="checkbox" className="mr-2 h-4 w-4 text-primary focus:ring-primary-dark"/> IF ticket assigned to team member, THEN:</label><ul className="list-disc list-inside pl-6 text-xs text-gray-600 dark:text-gray-400 space-y-0.5 mt-1"><li>Send Email to User (Template: `Support_Ticket_Assigned_Email`, Include: `&#123;&#123;assignedAgentName&#125;&#125;`, `&#123;&#123;assignedAgentContactMock&#125;&#125;`)</li><li>Send WhatsApp to User (Template: `Support_Ticket_Assigned_WhatsApp`, Include: `&#123;&#123;assignedAgentName&#125;&#125;`, `&#123;&#123;assignedAgentContactMock&#125;&#125;`)</li></ul><div className="pl-6 mt-1"><label className="text-xs text-gray-500 dark:text-gray-400">Mock Assigned Agent Contact Info Source: </label><select className="text-xs p-1 border dark:border-gray-600 rounded bg-white dark:bg-dark-surface dark:text-white"><option>Pull from Agent Profile</option><option>Manually Enter per ticket</option></select></div></div><div><label className="flex items-center cursor-pointer"><input type="checkbox" className="mr-2 h-4 w-4 text-primary focus:ring-primary-dark"/> IF ticket status changed to 'Resolved' (by AI or Human), THEN:</label><ul className="list-disc list-inside pl-6 text-xs text-gray-600 dark:text-gray-400 space-y-0.5 mt-1"><li>Send Email to User (Template: `Support_Ticket_Resolved_Email`)</li><li>Send WhatsApp to User (Template: `Support_Ticket_Resolved_WhatsApp`)</li></ul></div><div className="flex items-center"><input type="checkbox" className="mr-2 h-4 w-4 text-primary focus:ring-primary-dark" id="assignRule"/><label htmlFor="assignRule" className="cursor-pointer">IF ticket subject contains <input type="text" placeholder="e.g., Urgent, Billing" className="text-xs p-1 border dark:border-gray-600 rounded mx-1 w-1/3 dark:bg-dark-background dark:text-white"/>, THEN Assign to: </label><select className="ml-1 p-1 border dark:border-gray-600 rounded text-xs bg-white dark:bg-dark-surface dark:text-white"><option>Admin User</option><option>Support Team L1</option><option>Billing Department</option></select></div></div></div>
                        <div className="border dark:border-gray-700 p-3 rounded-md bg-gray-50 dark:bg-dark-background"><h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Advanced Integrations (Conceptual)</h3><div className="space-y-2 text-xs"><div className="p-1.5 border-b dark:border-gray-700"><strong>AI Voice Agent Configuration:</strong><p className="text-gray-500 dark:text-gray-400 mt-0.5">API Endpoint: <input type="text" placeholder="[Your_Voice_Agent_API_URL]" className="text-xs p-0.5 border dark:border-gray-600 rounded w-1/2 dark:bg-dark-background dark:text-white"/></p><p className="text-gray-500 dark:text-gray-400">Auth Token: <input type="text" placeholder="[Your_Agent_Auth_Token]" className="text-xs p-0.5 border dark:border-gray-600 rounded w-1/2 dark:bg-dark-background dark:text-white"/></p><button className="text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded mt-1 hover:bg-gray-300 dark:hover:bg-gray-500">Test Connection</button></div><div className="p-1.5"><strong>External Ticketing System API:</strong><p className="text-gray-500 dark:text-gray-400 mt-0.5">API URL: <input type="text" placeholder="[Your_Ticketing_API_URL]" className="text-xs p-0.5 border dark:border-gray-600 rounded w-1/2 dark:bg-dark-background dark:text-white"/></p><p className="text-gray-500 dark:text-gray-400">Status: <span className="font-medium text-red-500">Not Connected (Mock)</span></p></div></div></div>
                        </div>
                    </section>
                    )}
                </div>
                 <div hidden={activeTab !== 'settings'}>
                    <GeneralSettingsTabContent siteSettings={localSiteSettings} onSettingsChange={handleSiteSettingsChange} onSave={handleSaveSiteSettings} onFileSelect={handleLogoFileChange} />
                </div>
            </main>
        </div>
      
        {/* All Modals */}
        {isMealModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"><div className="bg-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{isNewMeal ? 'Add New Meal' : 'Edit Meal'}</h3>{mealFormError && <p className="text-red-500 text-sm mb-2">{mealFormError}</p>}<form onSubmit={handleMealSubmit} className="space-y-3 text-sm"><div><label>Name*</label><input type="text" name="name" value={(currentEditingMeal as Meal).name || ''} onChange={handleMealFormChange} required className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Description</label><textarea name="description" value={(currentEditingMeal as Meal).description || ''} onChange={handleMealFormChange} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" rows={2}></textarea></div><div className="grid grid-cols-2 gap-3"><div><label>Price*</label><input type="number" name="price" value={(currentEditingMeal as Meal).price === 0 ? '' : (currentEditingMeal as Meal).price} onChange={handleMealFormChange} required min="0.01" step="0.01" className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Calories</label><input type="number" name="calories" value={(currentEditingMeal as Meal).calories === 0 ? '' : (currentEditingMeal as Meal).calories} onChange={handleMealFormChange} min="0" className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div></div><div><label className="block mb-1">Image*</label><div className="flex gap-2 text-xs mb-1"><label><input type="radio" value="url" checked={mealImageInputType === 'url'} onChange={()=>setMealImageInputType('url')}/> URL</label><label><input type="radio" value="file" checked={mealImageInputType === 'file'} onChange={()=>setMealImageInputType('file')}/> Upload</label></div>{mealImageInputType === 'url' ? <input type="url" name="imageUrl" value={(currentEditingMeal as Meal).imageUrl || ''} onChange={handleMealFormChange} placeholder="https://example.com/image.png" className="w-full p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/> : <input type="file" name="imageFile" accept="image/*" onChange={(e) => handleFileSelection(e, (dataUrl) => setCurrentEditingMeal(prev => ({ ...prev, imageUrl: dataUrl })))} className="w-full text-xs p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/>}{(currentEditingMeal as Meal).imageUrl && <img src={(currentEditingMeal as Meal).imageUrl} alt="preview" className="mt-2 h-20 w-20 object-cover rounded"/>}</div><div><label>Category*</label><input type="text" name="category" value={(currentEditingMeal as Meal).category || 'Main Course'} onChange={handleMealFormChange} required className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Ingredients (comma-separated)</label><input type="text" value={ingredientsInput} onChange={(e) => setIngredientsInput(e.target.value)} className="w-full mt-0.5 p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label className="block text-xs font-medium mb-1">Dietary Tags</label><div className="flex flex-wrap gap-1.5">{ALL_DIETARY_OPTIONS.map(tag => (<button key={tag} type="button" onClick={() => handleMealDietaryTagChange(tag)} className={`px-2 py-1 text-xs rounded-full border transition-colors ${(currentEditingMeal as Meal).dietaryTags?.includes(tag) ? 'bg-primary text-white border-primary-dark' : 'bg-gray-100 hover:bg-gray-200 dark:bg-dark-background dark:hover:bg-gray-700'}`}>{tag}</button>))}</div></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={closeMealModal} className="bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 font-semibold py-1.5 px-3 rounded text-xs">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-3 rounded text-xs">{isNewMeal ? 'Add Meal' : 'Save Changes'}</button></div></form></div></div>)}
        {isInventoryModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-semibold mb-4">{isNewInventoryItem ? 'Add Inventory Item' : 'Edit Inventory Item'}</h3><form onSubmit={handleInventorySubmit} className="space-y-4 text-sm"><div><label>Item Name*</label><input type="text" name="name" value={(currentInventoryItem as InventoryItem).name || ''} onChange={handleInventoryFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="grid grid-cols-2 gap-4"><div><label>Quantity*</label><input type="number" name="quantity" value={(currentInventoryItem as InventoryItem).quantity} onChange={handleInventoryFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Unit*</label><input type="text" name="unit" value={(currentInventoryItem as InventoryItem).unit} onChange={handleInventoryFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div></div><div className="grid grid-cols-2 gap-4"><div><label>Low Stock Threshold*</label><input type="number" name="lowStockThreshold" value={(currentInventoryItem as InventoryItem).lowStockThreshold} onChange={handleInventoryFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Last Purchase Price</label><input type="number" name="lastPurchasePrice" value={(currentInventoryItem as InventoryItem).lastPurchasePrice || ''} onChange={handleInventoryFormChange} step="0.01" className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div></div><div><label>Supplier</label><input type="text" name="supplier" value={(currentInventoryItem as InventoryItem).supplier || ''} onChange={handleInventoryFormChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2"><button type="button" onClick={closeInventoryModal} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-sm dark:bg-gray-600 dark:text-gray-200">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-sm">{isNewInventoryItem ? 'Add Item' : 'Save Changes'}</button></div></form></div></div>)}
        {isRestockModalOpen && itemToRestock && <RestockItemModal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} item={itemToRestock} onAddToPurchaseList={handleAddToPurchaseList} />}
        {isCrmUserModalOpen && selectedUserForCrm && <UserDetailsModal isOpen={isCrmUserModalOpen} onClose={() => setIsCrmUserModalOpen(false)} user={selectedUserForCrm} />}
        {isCrmAiModalOpen && selectedUserForAi && <CrmAiModal isOpen={isCrmAiModalOpen} onClose={() => setIsCrmAiModalOpen(false)} user={selectedUserForAi} />}
        {isManualPartnerModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-semibold mb-4">Add Partner Manually</h3><form onSubmit={handleManualPartnerSubmit} className="space-y-4 text-sm"><div><label>First Name*</label><input type="text" name="firstName" value={manualPartnerForm.firstName} onChange={handleManualPartnerFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Last Name*</label><input type="text" name="lastName" value={manualPartnerForm.lastName} onChange={handleManualPartnerFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Email*</label><input type="email" name="email" value={manualPartnerForm.email} onChange={handleManualPartnerFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Business Name*</label><input type="text" name="businessName" value={manualPartnerForm.businessName} onChange={handleManualPartnerFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsManualPartnerModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-sm dark:bg-gray-600 dark:text-gray-200">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-sm">Create Partner</button></div></form></div></div>)}
        {isPartnerAgreementModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-lg"><h3 className="text-lg font-semibold mb-4">Partner Agreement (Mock)</h3><div className="prose prose-sm dark:prose-invert max-w-none border dark:border-gray-700 p-4 rounded-md bg-gray-50 dark:bg-dark-background max-h-60 overflow-y-auto"><p>This is a mock agreement detailing the terms and conditions of partnership...</p></div><div className="text-right mt-4"><button onClick={() => setIsPartnerAgreementModalOpen(false)} className="bg-primary hover:bg-primary-dark text-white font-semibold py-1.5 px-3 rounded-md text-sm">Close</button></div></div></div>)}
        {isSocialAccountModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-semibold mb-4">Connect Social Account</h3><form onSubmit={handleAddSocialAccount} className="space-y-4 text-sm"><div><label>Platform*</label><select name="platform" value={socialAccountForm.platform} onChange={handleSocialAccountFormChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>Facebook</option><option>Instagram</option><option>Twitter</option><option>LinkedIn</option><option>Pinterest</option><option>TikTok</option><option>YouTube</option><option>WhatsApp</option><option value="Other">Other...</option></select></div>{socialAccountForm.platform === 'Other' && (<div><label>Custom Platform Name*</label><input type="text" value={customConnectPlatform} onChange={e => setCustomConnectPlatform(e.target.value)} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div>)}<div><label>Account Name / Handle*</label><input type="text" name="accountName" value={socialAccountForm.accountName} onChange={handleSocialAccountFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>API Token / Details (Mock)</label><input type="text" name="mockApiTokenOrDetails" value={socialAccountForm.mockApiTokenOrDetails} onChange={handleSocialAccountFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsSocialAccountModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-xs dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-xs">Connect</button></div></form></div></div>)}
        {isEmailProviderModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-semibold mb-4">Connect Email Provider</h3><form onSubmit={handleAddEmailProvider} className="space-y-4 text-sm"><div><label>Provider*</label><select name="providerName" value={emailProviderForm.providerName} onChange={handleEmailProviderFormChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>MockChimp</option><option>SendGrid</option><option>Mailgun</option><option>Brevo</option><option>Amazon SES</option><option value="Other">Other...</option></select></div>{emailProviderForm.providerName === 'Other' && (<div><label>Custom Provider Name*</label><input type="text" value={customEmailProvider} onChange={e => setCustomEmailProvider(e.target.value)} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div>)}<div><label>API Key / Details (Mock)</label><input type="text" name="mockApiKeyOrDetails" value={emailProviderForm.mockApiKeyOrDetails} onChange={handleEmailProviderFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsEmailProviderModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-xs dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-xs">Connect</button></div></form></div></div>)}
        {isSocialModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-semibold mb-4">Schedule Social Post</h3><form onSubmit={handleScheduleSocialPost} className="space-y-4 text-sm"><div><label>Platform*</label><select name="platform" value={currentSocialPost.platform} onChange={e => {setCurrentSocialPost(p => ({...p, platform: e.target.value})); if(e.target.value !== 'Other') setCustomSchedulePlatform('')}} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>Facebook</option><option>Instagram</option><option>Twitter</option><option value="Other">Other...</option></select></div>{currentSocialPost.platform === 'Other' && (<div><label>Custom Platform Name*</label><input type="text" value={customSchedulePlatform} onChange={e => setCustomSchedulePlatform(e.target.value)} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div>)}<div><label>Content*</label><textarea name="content" value={currentSocialPost.content} onChange={e => setCurrentSocialPost(p => ({...p, content: e.target.value}))} required rows={3} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label className="block mb-1">Image (Optional)</label><div className="flex gap-2 text-xs mb-1"><label><input type="radio" value="url" checked={socialImageInputType === 'url'} onChange={()=>setSocialImageInputType('url')}/> URL</label><label><input type="radio" value="file" checked={socialImageInputType === 'file'} onChange={()=>setSocialImageInputType('file')}/> Upload</label></div>{socialImageInputType === 'url' ? <input type="url" name="imageUrl" value={currentSocialPost.imageUrl || ''} onChange={e => setCurrentSocialPost(p => ({...p, imageUrl: e.target.value}))} placeholder="https://example.com/image.png" className="w-full p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/> : <input type="file" name="imageFile" accept="image/*" onChange={(e) => handleFileSelection(e, (dataUrl) => setCurrentSocialPost(prev => ({ ...prev, imageUrl: dataUrl })))} className="w-full text-xs p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/>}{currentSocialPost.imageUrl && <img src={currentSocialPost.imageUrl} alt="preview" className="mt-2 h-20 w-20 object-cover rounded"/>}</div><div><label>Scheduled At*</label><input type="datetime-local" name="scheduledAt" value={currentSocialPost.scheduledAt} onChange={e => setCurrentSocialPost(p => ({...p, scheduledAt: e.target.value}))} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsSocialModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-xs dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-xs">Schedule</button></div></form></div></div>)}
        {isEmailWorkflowModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-lg font-semibold mb-4">Create Email Workflow</h3><form onSubmit={handleSaveEmailWorkflow} className="space-y-4 text-sm"><div><label>Workflow Name*</label><input type="text" name="name" value={currentEmailWorkflow.name} onChange={e => setCurrentEmailWorkflow(p => ({...p, name: e.target.value}))} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Trigger*</label><select name="trigger" value={currentEmailWorkflow.trigger} onChange={e => {setCurrentEmailWorkflow(p => ({...p, trigger: e.target.value})); if(e.target.value !== 'Other') setCustomEmailWorkflowTrigger('');}} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>New User Signup</option><option>Order Placed</option><option>Order Delivered</option><option>User Inactive for 30 days</option><option value="Other">Custom...</option></select></div>{currentEmailWorkflow.trigger === 'Other' && (<div><label>Custom Trigger*</label><input type="text" value={customEmailWorkflowTrigger} onChange={e => setCustomEmailWorkflowTrigger(e.target.value)} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div>)}<div><label>Action*</label><select name="action" value={currentEmailWorkflow.action} onChange={e => {setCurrentEmailWorkflow(p => ({...p, action: e.target.value})); if(e.target.value !== 'Other') setCustomEmailWorkflowAction('');}} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>Send Welcome Email</option><option>Send Promotional Offer</option><option>Send Feedback Request Email</option><option value="Other">Custom...</option></select></div>{currentEmailWorkflow.action === 'Other' && (<div><label>Custom Action*</label><input type="text" value={customEmailWorkflowAction} onChange={e => setCustomEmailWorkflowAction(e.target.value)} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div>)}<div><label>Message Template (Mock)</label><textarea name="messageTemplate" value={currentEmailWorkflow.messageTemplate} onChange={e => setCurrentEmailWorkflow(p => ({...p, messageTemplate: e.target.value}))} rows={2} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white" placeholder="Hi {{firstName}}, ..."/></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsEmailWorkflowModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-xs dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-xs">Create Workflow</button></div></form></div></div>)}
        {isWhatsAppTemplateModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-xl font-semibold mb-4">Create WhatsApp Template</h3><form onSubmit={handleSaveWhatsAppTemplate} className="space-y-4 text-sm"><div><label>Template Name* <span className="text-xs text-gray-500">(e.g., welcome_v1, no spaces, lowercase)</span></label><input type="text" name="name" value={currentWhatsAppTemplate.name} onChange={handleWhatsAppTemplateFormChange} required pattern="^[a-z0-9_]+$" className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Category*</label><select name="category" value={currentWhatsAppTemplate.category} onChange={handleWhatsAppTemplateFormChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>Utility</option><option>Marketing</option><option>Authentication</option></select></div><div><label>Content* <span className="text-xs text-gray-500">(Use {`{{1}}`}, {`{{2}}`} for variables)</span></label><textarea name="content" value={currentWhatsAppTemplate.content} onChange={handleWhatsAppTemplateFormChange} required rows={4} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/><button type="button" onClick={handleGenerateTemplateContent} disabled={isGeneratingAiContent} className="text-xs mt-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 py-1 px-2 rounded hover:bg-purple-200">{isGeneratingAiContent ? <LoadingSpinner size="sm" /> : 'Generate with AI'}</button></div><div><label className="block mb-1">Media Header (Optional)</label><div className="flex gap-2 text-xs mb-1"><label><input type="radio" value="url" checked={mediaInputType === 'url'} onChange={()=>setMediaInputType('url')}/> URL</label><label><input type="radio" value="file" checked={mediaInputType === 'file'} onChange={()=>setMediaInputType('file')}/> Upload</label></div>{mediaInputType === 'url' ? <input type="url" name="mediaUrl" value={currentWhatsAppTemplate.mediaUrl || ''} onChange={handleWhatsAppTemplateFormChange} placeholder="https://example.com/image.png" className="w-full p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/> : <input type="file" name="mediaFile" accept="image/*,video/*" onChange={(e) => handleFileSelection(e, (dataUrl) => setCurrentWhatsAppTemplate(prev => ({ ...prev, mediaUrl: dataUrl })))} className="w-full text-xs p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/>}{currentWhatsAppTemplate.mediaUrl && <img src={currentWhatsAppTemplate.mediaUrl} alt="media preview" className="mt-2 h-20 w-auto object-cover rounded"/>}</div><div><h4 className="text-xs font-medium mb-1">Buttons (Optional, max 3)</h4><div className="space-y-2">{currentTemplateButtons?.map((btn, index) => (<div key={index} className="flex gap-2 items-center p-2 border dark:border-gray-600 rounded"><span className="text-gray-500">{btn.type === 'URL' ? 'URL' : 'Reply'}</span><input type="text" placeholder="Button Text" value={btn.text} onChange={e => handleTemplateButtonChange(index, 'text', e.target.value)} required className="flex-grow p-1 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/>{btn.type === 'URL' && <input type="url" placeholder="https://..." value={btn.url || ''} onChange={e => handleTemplateButtonChange(index, 'url', e.target.value)} required className="flex-grow p-1 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/>}<button type="button" onClick={() => removeTemplateButton(index)} className="text-red-500 font-bold p-1">&times;</button></div>))}</div>{(currentTemplateButtons?.length || 0) < 3 && (<div className="flex gap-2 mt-2 text-xs"><button type="button" onClick={() => addTemplateButton('QUICK_REPLY')} className="bg-gray-200 dark:bg-gray-600 p-1 px-2 rounded hover:bg-gray-300">Add Quick Reply</button><button type="button" onClick={() => addTemplateButton('URL')} className="bg-gray-200 dark:bg-gray-600 p-1 px-2 rounded hover:bg-gray-300">Add URL Button</button></div>)}</div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsWhatsAppTemplateModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-xs dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-xs">Create & Submit</button></div></form></div></div>)}
        {isWhatsAppCampaignModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-semibold mb-4">Create WhatsApp Campaign</h3><form onSubmit={handleSaveWhatsAppCampaign} className="space-y-4 text-sm"><div><label>Campaign Name*</label><input type="text" name="name" value={currentWhatsAppCampaign.name} onChange={handleWhatsAppCampaignFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Target Audience*</label><select name="targetAudience" value={currentWhatsAppCampaign.targetAudience} onChange={(e) => {setCurrentWhatsAppCampaign(p => ({...p, targetAudience: e.target.value})); if(e.target.value !== 'Other') setCustomCampaignAudience('')}} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>All Users</option><option>Active Customers (Last 90d)</option><option>High Value Customers</option><option value="Other">Custom Segment...</option></select></div>{currentWhatsAppCampaign.targetAudience === 'Other' && (<div><label>Custom Audience Name*</label><input type="text" value={customCampaignAudience} onChange={e => setCustomCampaignAudience(e.target.value)} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div>)}<div><label>Message Template*</label><select name="templateId" value={currentWhatsAppCampaign.templateId} onChange={handleWhatsAppCampaignFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option value="" disabled>Select a template</option>{whatsAppTemplates.filter(t => t.status === 'Approved').map(t => <option key={t.id} value={t.id}>{t.name} ({t.category})</option>)}</select></div><div><label>Schedule At*</label><input type="datetime-local" name="scheduledAt" value={currentWhatsAppCampaign.scheduledAt} onChange={handleWhatsAppCampaignFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsWhatsAppCampaignModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-xs dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-xs">Save as Draft</button></div></form></div></div>)}
        {isWhatsAppAutomationModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-xl font-semibold mb-4">Create Automation Workflow</h3><form onSubmit={handleSaveWhatsAppAutomation} className="space-y-4 text-sm"><div><label>Automation Name*</label><input type="text" name="name" value={currentWhatsAppAutomation.name} onChange={handleWhatsAppAutomationFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Trigger*</label><select name="trigger" value={currentWhatsAppAutomation.trigger} onChange={(e) => {handleWhatsAppAutomationFormChange(e); if(e.target.value !== 'Other') setCustomAutomationTrigger('')}} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>New User Signup</option><option>Order Placed</option><option>Order Delivered</option><option value="Other">Custom...</option></select></div>{currentWhatsAppAutomation.trigger === 'Other' && (<div><label>Custom Trigger*</label><input type="text" value={customAutomationTrigger} onChange={e => setCustomAutomationTrigger(e.target.value)} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div>)}<div><h4 className="text-xs font-medium mb-1">Actions*</h4><div className="space-y-2">{currentWhatsAppAutomation.actions.map((action, index) => (<div key={index} className="p-2 border dark:border-gray-600 rounded space-y-2 bg-gray-50 dark:bg-dark-background/50"><div className="flex justify-between items-center"><select value={action.type} onChange={e => handleAutomationActionTypeChange(index, e.target.value as WhatsAppAction['type'])} className="p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"><option value="Send Template Message">Send Template Message</option><option value="Wait">Wait</option><option value="Add to Audience List">Add to Audience List</option><option value="Set Custom Attribute">Set Custom Attribute</option></select><button type="button" onClick={() => removeAutomationAction(index)} className="text-red-500 font-bold p-1">&times;</button></div>{action.type === 'Send Template Message' && (<select value={action.templateId} onChange={e => handleWhatsAppAutomationActionChange(index, 'templateId', e.target.value)} className="w-full p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"><option value="" disabled>Select a template</option>{whatsAppTemplates.filter(t=>t.status==='Approved').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>)}{action.type === 'Wait' && (<div className="flex items-center gap-1"><input type="number" value={action.delayMinutes} onChange={e => handleWhatsAppAutomationActionChange(index, 'delayMinutes', parseInt(e.target.value))} className="w-20 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/><span>minutes</span></div>)}{action.type === 'Add to Audience List' && (<input type="text" placeholder="Audience List Name" value={action.listName} onChange={e => handleWhatsAppAutomationActionChange(index, 'listName', e.target.value)} className="w-full p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/>)}{action.type === 'Set Custom Attribute' && (<div className="flex gap-2"><input type="text" placeholder="Attribute Key" value={action.key} onChange={e => handleWhatsAppAutomationActionChange(index, 'key', e.target.value)} className="w-1/2 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/><input type="text" placeholder="Attribute Value" value={action.value} onChange={e => handleWhatsAppAutomationActionChange(index, 'value', e.target.value)} className="w-1/2 p-1 border dark:border-gray-600 rounded text-xs dark:bg-dark-surface dark:text-white"/></div>)}</div>))}</div><button type="button" onClick={addAutomationAction} className="text-xs mt-1 bg-gray-200 dark:bg-gray-600 p-1 px-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500">+ Add Action</button></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsWhatsAppAutomationModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-xs dark:bg-gray-600 dark:hover:bg-gray-500">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-xs">Save Automation</button></div></form></div></div>)}
        {isCustomerLoyaltyTierModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-semibold mb-4">{isNewCustomerLoyaltyTier ? 'Add New Tier' : 'Edit Tier'}</h3><form onSubmit={handleCustomerLoyaltyTierSubmit} className="space-y-4 text-sm"><div><label>Tier Name*</label><input type="text" name="name" value={(currentCustomerLoyaltyTier as CustomerLoyaltyTier).name || ''} onChange={handleCustomerLoyaltyTierFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Points Threshold*</label><input type="number" name="pointsThreshold" value={(currentCustomerLoyaltyTier as CustomerLoyaltyTier).pointsThreshold} onChange={handleCustomerLoyaltyTierFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Reward Description*</label><input type="text" name="rewardDescription" value={(currentCustomerLoyaltyTier as CustomerLoyaltyTier).rewardDescription} onChange={handleCustomerLoyaltyTierFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsCustomerLoyaltyTierModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-sm dark:bg-gray-600 dark:text-gray-200">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-sm">{isNewCustomerLoyaltyTier ? 'Add Tier' : 'Save Changes'}</button></div></form></div></div>)}
        {isTestimonialModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-semibold mb-4">Add Testimonial</h3><form onSubmit={handleTestimonialSubmit} className="space-y-4 text-sm"><div><label>Customer Name*</label><input type="text" name="name" value={currentTestimonial.name} onChange={handleTestimonialFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Rating (1-5)*</label><input type="number" name="rating" value={currentTestimonial.rating} onChange={handleTestimonialFormChange} required min="1" max="5" className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>Comment*</label><textarea name="comment" value={currentTestimonial.comment} onChange={handleTestimonialFormChange} required rows={3} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"></textarea></div><div><label className="block mb-1">Customer Image (Optional)</label><div className="flex gap-2 text-xs mb-1"><label><input type="radio" value="url" checked={testimonialImageInputType === 'url'} onChange={()=>setTestimonialImageInputType('url')}/> URL</label><label><input type="radio" value="file" checked={testimonialImageInputType === 'file'} onChange={()=>setTestimonialImageInputType('file')}/> Upload</label></div>{testimonialImageInputType === 'url' ? <input type="url" name="imageUrl" value={currentTestimonial.imageUrl || ''} onChange={handleTestimonialFormChange} className="w-full p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/> : <input type="file" name="imageFile" accept="image/*" onChange={(e) => handleFileSelection(e, (dataUrl) => setCurrentTestimonial(prev => ({ ...prev, imageUrl: dataUrl })))} className="w-full text-xs p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/>}{currentTestimonial.imageUrl && <img src={currentTestimonial.imageUrl} alt="preview" className="mt-2 h-16 w-16 rounded-full object-cover"/>}</div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsTestimonialModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-sm dark:bg-gray-600 dark:text-gray-200">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-sm">Add Testimonial</button></div></form></div></div>)}
        {isSocialFeedItemModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-semibold mb-4">Add Social Feed Item</h3><form onSubmit={handleSocialFeedItemSubmit} className="space-y-4 text-sm"><div><label>Platform*</label><select name="platform" value={currentSocialFeedItem.platform} onChange={handleSocialFeedItemFormChange} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"><option>Instagram</option><option>Facebook</option><option>Twitter</option><option value="Other">Other...</option></select></div>{currentSocialFeedItem.platform === 'Other' && <div><label>Custom Platform Name*</label><input type="text" value={customSocialFeedPlatform} onChange={e => setCustomSocialFeedPlatform(e.target.value)} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div>}<div><label className="block mb-1">Image URL*</label><div className="flex gap-2 text-xs mb-1"><label><input type="radio" value="url" checked={socialFeedImageInputType === 'url'} onChange={()=>setSocialFeedImageInputType('url')}/> URL</label><label><input type="radio" value="file" checked={socialFeedImageInputType === 'file'} onChange={()=>setSocialFeedImageInputType('file')}/> Upload</label></div>{socialFeedImageInputType === 'url' ? <input type="url" name="imageUrl" value={currentSocialFeedItem.imageUrl || ''} onChange={handleSocialFeedItemFormChange} required className="w-full p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/> : <input type="file" name="imageFile" accept="image/*" onChange={(e) => handleFileSelection(e, (dataUrl) => setCurrentSocialFeedItem(prev => ({ ...prev, imageUrl: dataUrl })))} className="w-full text-xs p-1.5 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/>}{currentSocialFeedItem.imageUrl && <img src={currentSocialFeedItem.imageUrl} alt="preview" className="mt-2 h-20 w-auto object-cover rounded"/>}</div><div><label>Caption*</label><textarea name="caption" value={currentSocialFeedItem.caption} onChange={handleSocialFeedItemFormChange} required rows={3} className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"></textarea></div><div><label>Post URL*</label><input type="url" name="postUrl" value={currentSocialFeedItem.postUrl} onChange={handleSocialFeedItemFormChange} required className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2 pt-2"><button type="button" onClick={() => setIsSocialFeedItemModalOpen(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1.5 px-3 rounded-md text-sm dark:bg-gray-600 dark:text-gray-200">Cancel</button><button type="submit" className="bg-primary hover:bg-primary-dark text-white py-1.5 px-3 rounded-md text-sm">Add Item</button></div></form></div></div>)}
        {isNewContactModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-semibold mb-4">Add New WhatsApp Contact (Mock)</h3><form onSubmit={(e) => { e.preventDefault(); setIsNewContactModalOpen(false); alert("Mock: Contact Added"); }} className="space-y-4 text-sm"><p>This is a mock form. In a real app, this would add a new contact to your list.</p><div><label>Name</label><input type="text" className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div><label>WhatsApp Number</label><input type="tel" className="w-full mt-1 p-2 border dark:border-gray-600 rounded dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2"><button type="button" onClick={() => setIsNewContactModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 px-3 py-1.5 rounded">Cancel</button><button type="submit" className="bg-blue-500 text-white px-3 py-1.5 rounded">Add</button></div></form></div></div>)}
        {isImportContactsModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110] p-4"><div className="bg-white dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-semibold mb-4">Import Contacts (Mock)</h3><form onSubmit={(e) => { e.preventDefault(); setIsImportContactsModalOpen(false); alert("Mock: Import Started"); }} className="space-y-4 text-sm"><p>This is a mock form. In a real app, you could upload a CSV file.</p><div><label>Upload CSV File</label><input type="file" accept=".csv" className="w-full mt-1 p-2 border dark:border-gray-600 rounded text-xs dark:bg-dark-background dark:text-white"/></div><div className="flex justify-end space-x-2"><button type="button" onClick={() => setIsImportContactsModalOpen(false)} className="bg-gray-200 dark:bg-gray-600 px-3 py-1.5 rounded">Cancel</button><button type="submit" className="bg-blue-500 text-white px-3 py-1.5 rounded">Import</button></div></form></div></div>)}
    </div>
  );
};
