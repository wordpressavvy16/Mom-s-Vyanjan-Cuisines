
import React, { useState, useEffect } from 'react';
import { User, Order } from '../types';
import { fetchUserOrders } from '../services/mockDataService';
import { generateCrmInsights } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface CrmAiModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

interface AiInsights {
  customerSnapshot?: string;
  keyInsights?: { type: string; insight: string; priority: 'high' | 'medium' | 'low' }[];
  suggestedActions?: { action: string; details: string; isApplicable: boolean }[];
  error?: string;
}

const InsightIcon: React.FC<{ type: string }> = ({ type }) => {
    const baseClasses = "w-6 h-6 mr-3 flex-shrink-0";
    switch (type.toLowerCase()) {
        case 'loyalty':
            return <svg xmlns="http://www.w3.org/2000/svg" className={`${baseClasses} text-yellow-500`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
        case 'churn risk':
            return <svg xmlns="http://www.w3.org/2000/svg" className={`${baseClasses} text-red-500`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
        case 'upsell':
            return <svg xmlns="http://www.w3.org/2000/svg" className={`${baseClasses} text-green-500`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" /></svg>;
        case 'birthday':
            return <svg xmlns="http://www.w3.org/2000/svg" className={`${baseClasses} text-pink-500`} viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
        default:
            return <svg xmlns="http://www.w3.org/2000/svg" className={`${baseClasses} text-gray-400`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
    }
};

const CrmAiModal: React.FC<CrmAiModalProps> = ({ user, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AiInsights | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      const getInsights = async () => {
        setLoading(true);
        setInsights(null);
        try {
          const userOrders = await fetchUserOrders(user.id);
          const aiResponse = await generateCrmInsights(user, userOrders);
          setInsights(aiResponse);
        } catch (error) {
          console.error("Failed to generate AI insights:", error);
          setInsights({ error: "An unexpected error occurred while processing the AI response." } as AiInsights);
        } finally {
          setLoading(false);
        }
      };
      getInsights();
    }
  }, [isOpen, user]);

  const handleQuickAction = (action: string) => {
    alert(`Mock Action Triggered: "${action}" for user ${user.firstName}.`);
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (loading) {
      return <div className="min-h-[300px] flex items-center justify-center"><LoadingSpinner text="AI is analyzing customer data..." /></div>;
    }
    if (insights?.error) {
      return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md text-center">{insights.error}</div>;
    }
    if (!insights) {
      return <div className="p-4 text-center text-gray-500">No insights available.</div>;
    }
    
    return (
        <div className="space-y-6">
            {/* Customer Snapshot */}
            <section>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Customer Snapshot</h3>
                <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-secondary-dark/50 p-3 rounded-md italic">{insights.customerSnapshot}</p>
            </section>

            {/* Key Insights */}
            <section>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Key Insights</h3>
                <div className="space-y-3">
                    {insights.keyInsights?.map((item, index) => (
                        <div key={index} className="flex items-start bg-white dark:bg-secondary-dark p-3 rounded-lg shadow-sm border-l-4 border-primary-light">
                           <InsightIcon type={item.type} />
                           <div>
                             <p className="font-semibold text-gray-800 dark:text-gray-200">{item.type}</p>
                             <p className="text-gray-600 dark:text-gray-400 text-sm">{item.insight}</p>
                           </div>
                        </div>
                    ))}
                </div>
            </section>
            
            {/* Suggested Actions */}
            <section>
                 <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Suggested Quick Actions</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {insights.suggestedActions?.filter(action => action.isApplicable).map((action, index) => (
                         <button key={index} onClick={() => handleQuickAction(action.action)} className="group text-left p-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-900/70 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <p className="font-semibold text-blue-800 dark:text-blue-300">{action.action}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">{action.details}</p>
                         </button>
                    ))}
                 </div>
                 {insights.suggestedActions?.filter(action => action.isApplicable).length === 0 && (
                    <p className="text-sm text-gray-500">No specific actions recommended at this time.</p>
                 )}
            </section>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[120] p-4" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-secondary p-5 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-gray-700">
            <div className="flex items-center">
                <img src={user.profilePictureUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.firstName} className="w-10 h-10 rounded-full mr-3"/>
                <div>
                    <h2 id="ai-crm-title" className="text-xl font-bold text-purple-700 dark:text-purple-400">AI Analysis for {user.firstName} {user.lastName}</h2>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
            </div>
          <button onClick={onClose} aria-label="Close AI analysis modal" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {renderContent()}

        <div className="mt-6 pt-4 border-t dark:border-gray-700 text-right">
            <button 
                onClick={onClose} 
                className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default CrmAiModal;
