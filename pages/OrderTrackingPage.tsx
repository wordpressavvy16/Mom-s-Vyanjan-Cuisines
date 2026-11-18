import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order, OrderStatus, UserRole } from '../types';
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderTrackingMap from '../components/OrderTrackingMap';
import { useAuth } from '../context/AuthContext';

const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }
    const loadOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedOrder = await apiService.fetchOrderById(orderId);
        if (fetchedOrder) {
          const isOwner = fetchedOrder.userId === currentUser?.id;
          const isAdmin = currentUser?.role === UserRole.ADMIN;
          const isManager = currentUser?.role === UserRole.MANAGER;

          if (isOwner || isAdmin || isManager) {
            setOrder(fetchedOrder);
          } else {
            setError("You are not authorized to view this order's tracking information.");
            setOrder(null);
          }
        } else {
          setError("Order not found.");
        }
      } catch (err) {
        console.error("Error fetching order for tracking:", err);
        setError("Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
    const unsubscribe = apiService.subscribeToOrder(orderId, (updatedOrder) => {
      setOrder(updatedOrder);
    });
    return () => {
      unsubscribe();
    };
  }, [orderId, currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner text="Loading order tracking information..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-red-500">{error}</p>
        <Link to="/profile" className="mt-4 inline-block bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded">
          Back to Profile
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-10 text-xl">Order details could not be loaded.</div>;
  }
  
  if (order.status !== OrderStatus.OUT_FOR_DELIVERY && order.status !== OrderStatus.DELIVERED) {
      return (
          <div className="text-center py-10">
              <p className="text-xl text-light-text dark:text-dark-text mb-2">This order is not yet out for delivery.</p>
              <p className="text-light-muted dark:text-dark-muted">Current status: <span className="font-semibold">{order.status}</span></p>
              <Link to="/profile" className="mt-4 inline-block bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded">
                View My Orders
              </Link>
          </div>
      )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-secondary dark:text-accent font-display">Track Your Order: #{order.id.substring(0, 8)}</h1>
        <p className="text-lg text-light-muted dark:text-dark-muted">Status: <span className={`font-semibold ${order.status === OrderStatus.DELIVERED ? 'text-status-success' : 'text-status-warning'}`}>{order.status}</span></p>
      </header>

      <section className="bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4">Delivery Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-light-muted dark:text-dark-muted">Delivery Slot:</p>
            <p className="font-medium text-light-text dark:text-dark-text">{order.deliveryWindowDisplay}</p>
          </div>
          <div>
            <p className="text-light-muted dark:text-dark-muted">Destination:</p>
            <p className="font-medium text-light-text dark:text-dark-text">
              {order.destinationAddress ? `${order.destinationAddress.street}, ${order.destinationAddress.city}` : 'N/A'}
            </p>
          </div>
          {order.deliveryPerson && (
            <>
            <div>
                <p className="text-light-muted dark:text-dark-muted">Delivery Person:</p>
                <p className="font-medium text-light-text dark:text-dark-text">{order.deliveryPerson.name}</p>
            </div>
            <div>
                <p className="text-light-muted dark:text-dark-muted">Vehicle:</p>
                <p className="font-medium text-light-text dark:text-dark-text">{order.deliveryPerson.vehicle || 'N/A'}</p>
            </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-light-surface dark:bg-dark-surface p-2 sm:p-4 rounded-xl shadow-lg">
         <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-4 px-4 sm:px-0 pt-2">Live Tracking Map</h2>
        {order.destinationCoordinates ? (
          <OrderTrackingMap order={order} />
        ) : (
          <div className="p-4 text-center text-light-muted dark:text-dark-muted bg-light-background dark:bg-dark-background border border-neutral-300 dark:border-gray-700 rounded-md">
            <p className="font-semibold">Map Unavailable</p>
            <p className="text-sm mt-1">
              Live tracking map is not available because destination coordinates are missing for this order.
            </p>
          </div>
        )}
      </section>
      
      {order.status === OrderStatus.DELIVERED && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-md">
            <p className="text-lg font-semibold text-green-700 dark:text-green-300">This order has been successfully delivered!</p>
          </div>
      )}

      <div className="text-center mt-8">
        <Link 
            to={currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER ? '/dashboard' : '/profile'} 
            className="bg-secondary hover:bg-secondary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Back to {currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER ? 'Dashboard' : 'My Orders'}
        </Link>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
