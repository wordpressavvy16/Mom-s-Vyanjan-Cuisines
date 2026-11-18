

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import { User, Order, Review, Address } from '../types';
import * as apiService from '../services/apiService';
import LoadingSpinner from './LoadingSpinner';
import StarRatingDisplay from './StarRatingDisplay';

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      const loadData = async () => {
        try {
          const userOrders = await apiService.fetchUserOrders(user.id);
          setOrders(userOrders);
          const userReviews = await apiService.fetchReviewsByUserId(user.id);
          setReviews(userReviews);
        } catch (error) {
          console.error("Error fetching user details for CRM:", error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[110] p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="user-details-title" className="bg-white dark:bg-secondary p-5 sm:p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 pb-3 border-b dark:border-gray-700">
          <h2 id="user-details-title" className="text-xl sm:text-2xl font-semibold text-primary-dark">
            User Details: {user.firstName} {user.lastName}
          </h2>
          <button onClick={onClose} aria-label="Close user details" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading user data..." />
        ) : (
          <div className="space-y-6 text-sm">
            {/* Profile Info */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Profile Information</h3>
              <dl className="space-y-2 bg-gray-50 dark:bg-secondary-dark p-3 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex flex-col"><dt className="font-bold">ID:</dt> <dd className="text-gray-600 dark:text-gray-300 truncate" title={user.id}>{user.id}</dd></div>
                  <div className="flex flex-col"><dt className="font-bold">Role:</dt> <dd className="text-gray-600 dark:text-gray-300">{user.role}</dd></div>
                  <div className="flex flex-col"><dt className="font-bold">Email:</dt> <dd className="text-gray-600 dark:text-gray-300">{user.email} <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${user.isEmailVerified ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'}`}>{user.isEmailVerified ? 'Verified' : 'Not Verified'}</span></dd></div>
                  <div className="flex flex-col"><dt className="font-bold">WhatsApp:</dt> <dd className="text-gray-600 dark:text-gray-300">{user.whatsappNumber || 'N/A'}{user.whatsappNumber && (<span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${user.isWhatsappVerified ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'}`}>{user.isWhatsappVerified ? 'Verified' : 'Not Verified'}</span>)}</dd></div>
                  <div className="flex flex-col"><dt className="font-bold">Dietary Preferences:</dt> <dd>{user.dietaryPreferences.length > 0 ? <span className="text-gray-600 dark:text-gray-300">{user.dietaryPreferences.join(', ')}</span> : <span className="text-gray-500 dark:text-gray-400">None</span>}</dd></div>
                  <div className="flex flex-col"><dt className="font-bold">Referral Code:</dt> <dd className="text-gray-600 dark:text-gray-300 font-mono">{user.referralCode || 'N/A'}</dd></div>
                  {user.referredByCode && (<div className="flex flex-col"><dt className="font-bold">Referred By:</dt> <dd className="text-gray-600 dark:text-gray-300 font-mono">{user.referredByCode}</dd></div>)}
                  <div className="flex flex-col"><dt className="font-bold">Customer Loyalty Points:</dt> <dd className="text-gray-600 dark:text-gray-300">{user.customerLoyaltyStatus?.points || 0}</dd></div>
                  {user.bio && (<div className="flex flex-col sm:col-span-2 pt-2 mt-2 border-t dark:border-gray-700"><dt className="font-bold">Bio:</dt> <dd className="text-gray-600 dark:text-gray-300 italic">{user.bio}</dd></div>)}
              </dl>
            </section>

            {/* Saved Addresses */}
            <section>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Saved Addresses</h3>
                {user.savedAddresses.length > 0 ? (
                    user.savedAddresses.map((addr: Address) => (
                        <div key={addr.id} className="bg-gray-50 dark:bg-secondary-dark p-3 rounded-md mb-2 border dark:border-gray-700 flex justify-between items-start">
                           <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{addr.street}</p>
                            <p className="text-gray-600 dark:text-gray-400">{addr.city}, {addr.zipCode} {addr.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full ml-1">Default</span>}</p>
                           </div>
                           {addr.location && (
                             <a href={`https://www.google.com/maps?q=${addr.location.lat},${addr.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline ml-2 flex-shrink-0">
                                View on Map
                             </a>
                           )}
                        </div>
                    ))
                ) : <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-secondary-dark p-3 rounded-md">No saved addresses.</p>}
            </section>

            {/* Order History */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Order History ({orders.length})</h3>
              {orders.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {orders.map(order => (
                    <div key={order.id} className="bg-gray-50 dark:bg-secondary-dark p-3 rounded-md border dark:border-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                            <p><strong>ID:</strong> <Link to={`/order-tracking/${order.id}`} className="text-blue-600 dark:text-blue-400 hover:underline" title={order.id}>{order.id.substring(0,8)}...</Link></p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Date: {new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-semibold text-gray-800 dark:text-gray-200">${order.totalAmount.toFixed(2)}</p>
                             <p className="text-xs text-gray-600 dark:text-gray-400">{order.status}</p>
                        </div>
                      </div>
                      <details className="mt-1 text-xs">
                        <summary className="cursor-pointer text-blue-500 dark:text-blue-400">View Items ({order.items.length})</summary>
                        <ul className="list-disc list-inside pl-2 mt-1 text-gray-600 dark:text-gray-400">
                          {order.items.map(item => <li key={item.orderItemId}>{item.name} (x{item.quantity})</li>)}
                        </ul>
                      </details>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-secondary-dark p-3 rounded-md">No orders found for this user.</p>}
            </section>

            {/* Payment History (Mock) */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment History (Mock)</h3>
              {orders.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {orders.filter(o => o.paymentTransactionId).map(order => (
                    <div key={`${order.id}-payment`} className="bg-gray-50 dark:bg-secondary-dark p-2 rounded-md border dark:border-gray-700 text-xs">
                      <p className='text-gray-800 dark:text-gray-200'>Paid <span className="font-medium">${order.totalAmount.toFixed(2)}</span> for Order <span title={order.id} className="font-mono">{order.id.substring(0,8)}...</span></p>
                      <p className="text-gray-500 dark:text-gray-400">Transaction ID: {order.paymentTransactionId} (via MockPay)</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-secondary-dark p-3 rounded-md">No payment history.</p>}
            </section>

            {/* Reviews/Feedback */}
            <section>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Reviews & Feedback ({reviews.length})</h3>
              {reviews.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-gray-50 dark:bg-secondary-dark p-3 rounded-md border dark:border-gray-700">
                      <div className="flex items-center mb-1">
                        <StarRatingDisplay rating={review.rating} size="sm"/>
                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{new Date(review.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">For Meal ID: <span title={review.mealId}>{review.mealId.substring(0,8)}...</span></p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-secondary-dark p-3 rounded-md">No reviews submitted by this user.</p>}
            </section>
            
            {/* Mock Communication Log & Actions */}
            <section>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Communication (Mock)</h3>
                <div className="bg-gray-50 dark:bg-secondary-dark p-3 rounded-md border dark:border-gray-700 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Log:</p>
                    <ul className="list-disc list-inside pl-3 text-xs text-gray-600 dark:text-gray-300">
                        <li>Oct 26, 2023: Sent 'Welcome Email' (Workflow: New User Signup)</li>
                        <li>Oct 28, 2023: Sent 'Order Shipped Notification' (WhatsApp - Mock) for Order #sample-123</li>
                    </ul>
                    <div className="mt-2 space-x-2">
                        <button onClick={() => alert(`Mock: Sending ad-hoc email to ${user.email}`)} className="text-xs bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 py-1 px-2 rounded">Send Ad-hoc Email</button>
                        {user.whatsappNumber && <button onClick={() => alert(`Mock: Sending ad-hoc WhatsApp to ${user.whatsappNumber}`)} className="text-xs bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900 text-green-700 dark:text-green-300 py-1 px-2 rounded">Send Ad-hoc WhatsApp</button>}
                    </div>
                </div>
            </section>

          </div>
        )}
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

export default UserDetailsModal;
