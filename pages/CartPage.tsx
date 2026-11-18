import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CartItem, DeliverySlotOption, Meal } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getAvailableDeliverySlots } from '../utils/timeUtils';
import MealCard from '../components/MealCard';
import { getManagedMeals } from '../services/configService';


const EmptyCartContent: React.FC = () => {
    const [popularMeals, setPopularMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch a few meals to suggest
        const allMeals = getManagedMeals();
        // Simple logic: show first 3 meals as "popular". A real app would have better logic.
        setPopularMeals(allMeals.slice(0, 3)); 
        setLoading(false);
    }, []);

    return (
        <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 mx-auto text-gray-400 mb-6 transition-transform duration-300 hover:scale-110 hover:-rotate-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <h2 className="text-3xl font-semibold text-textDark dark:text-textLight mb-4">Your Cart is Empty</h2>
            <p className="text-textMuted mb-8">Looks like you haven't added any delicious meals yet!</p>
            <Link 
                to="/menu" 
                className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
                Browse Our Menu
            </Link>

            {loading ? <LoadingSpinner text="Loading suggestions..."/> : popularMeals.length > 0 && (
                <div className="mt-16">
                    <h3 className="text-2xl font-semibold text-textDark dark:text-textLight mb-8">Need some inspiration? Try our bestsellers!</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        {popularMeals.map(meal => (
                            <MealCard key={meal.id} meal={meal} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}


const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart();
  const { currentUser, openAuthModal, addOrder, loading: authLoading } = useAuth();
  const { currencySymbol } = useSiteSettings();
  const navigate = useNavigate();
  
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [availableSlots, setAvailableSlots] = useState<DeliverySlotOption[]>([]);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);

  useEffect(() => {
    const slots = getAvailableDeliverySlots(new Date());
    setAvailableSlots(slots);
  }, []);

  const selectedDeliverySlot = availableSlots.find(s => s.key === selectedSlotKey);

  const deliveryFee = cartTotal > 50 || cartTotal === 0 ? 0 : 5.00; // Free delivery for empty cart too
  const estimatedTax = cartTotal * 0.05; // Example 5% tax
  const finalTotal = cartTotal - discount + estimatedTax + deliveryFee;

  const handleCheckout = async () => {
    setCheckoutError(null);
    if (!currentUser || currentUser.isGuest) {
      openAuthModal();
      return;
    }

    if (!selectedDeliverySlot) {
        setCheckoutError("Please select a delivery slot before proceeding.");
        return;
    }

    setIsProcessingPayment(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); 

      const paymentSuccessful = Math.random() > 0.1;

      if (paymentSuccessful) {
        const newOrder = await addOrder(
            cartItems, 
            finalTotal, 
            selectedDeliverySlot.slot, 
            selectedDeliverySlot.date.toISOString(), 
            selectedDeliverySlot.label
        );
        if (newOrder) {
          alert(`Payment Successful! Your Order #${newOrder.id.substring(0,8)} for ${selectedDeliverySlot.label} is confirmed.`);
          clearCart();
          navigate('/profile'); 
        } else {
          throw new Error("Failed to create order after payment.");
        }
      } else {
        throw new Error("Payment failed. Please try again or use a different payment method.");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      setCheckoutError(error.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === 'YUMMY10') {
      const calculatedDiscount = cartTotal * 0.10;
      setDiscount(calculatedDiscount);
      alert(`Promo code YUMMY10 applied! You saved ${currencySymbol}${calculatedDiscount.toFixed(2)}.`);
    } else {
      setDiscount(0);
      alert('Invalid promo code.');
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // To prevent potential infinite loops if the placeholder also fails
    e.currentTarget.onerror = null; 
    e.currentTarget.src = `https://via.placeholder.com/200x200.png?text=Image+Not+Found`;
  };

  if (isProcessingPayment) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <LoadingSpinner text="Processing your payment, please wait..." size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-300">You will be redirected shortly.</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return <EmptyCartContent />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-textDark dark:text-textLight mb-8">Your Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items & Delivery Slot List */}
        <div className="lg:col-span-2 space-y-6">
          <section aria-labelledby="cart-items-heading">
            <h2 id="cart-items-heading" className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Items</h2>
            {cartItems.map((item: CartItem) => (
              <div key={item.id} className="flex items-center bg-white dark:bg-dark-surface p-4 rounded-lg shadow hover:shadow-md dark:hover:shadow-gray-700/[.2] transition-shadow mb-4">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-md mr-4" 
                  onError={handleImageError}
                />
                <div className="flex-grow">
                  <Link to={`/meal/${item.id}`} className="text-lg font-semibold text-primary hover:underline dark:hover:text-dark-accent">{item.name}</Link>
                  <p className="text-sm text-gray-500 dark:text-dark-muted">
                      {item.selectedPortionSize && `Portion: ${item.selectedPortionSize} `}
                      {item.selectedSpiceLevel && `Spice: ${item.selectedSpiceLevel}`}
                  </p>
                  <p className="text-gray-700 dark:text-dark-text font-medium">{currencySymbol}{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3 mx-2 md:mx-4">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Decrease quantity of ${item.name}`} className="p-1 text-gray-600 dark:text-dark-text border dark:border-gray-600 rounded-full w-7 h-7 flex items-center justify-center transition-colors hover:bg-primary hover:text-white hover:border-primary active:scale-90">-</button>
                  <span className='dark:text-white' aria-label={`Current quantity ${item.quantity}`}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Increase quantity of ${item.name}`} className="p-1 text-gray-600 dark:text-dark-text border dark:border-gray-600 rounded-full w-7 h-7 flex items-center justify-center transition-colors hover:bg-primary hover:text-white hover:border-primary active:scale-90">+</button>
                </div>
                <p className="text-lg font-semibold text-gray-800 dark:text-dark-text w-20 text-right">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</p>
                <button onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name} from cart`} className="ml-4 text-red-500 hover:text-red-700 dark:hover:text-red-400 group">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-125" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.298.26m-3.298-.26l1.209-1.935A1.875 1.875 0 017.945 3h8.11c.796 0 1.503.429 1.875 1.07l1.21 1.935m-12.986 0H19.5" />
                  </svg>
                </button>
              </div>
            ))}
            {cartItems.length > 0 && (
              <button 
                  onClick={clearCart} 
                  className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline mt-2"
                  >
                  Clear Entire Cart
              </button>
            )}
          </section>

          {/* Delivery Slot Selection */}
          <fieldset className="bg-white dark:bg-dark-surface p-4 rounded-lg shadow">
            <legend className="text-xl font-semibold text-gray-700 dark:text-dark-text mb-3">Select Delivery Slot</legend>
            {availableSlots.length > 0 ? (
              <div className="space-y-2">
                {availableSlots.map(slot => (
                  <label key={slot.key} className={`flex items-center p-3 border rounded-md cursor-pointer hover:border-primary transition-all ${selectedSlotKey === slot.key ? 'bg-primary/10 dark:bg-dark-accent/20 border-primary dark:border-dark-accent ring-2 ring-primary dark:ring-dark-accent' : 'border-gray-300 dark:border-gray-600'}`}>
                    <input
                      type="radio"
                      name="deliverySlot"
                      value={slot.key}
                      checked={selectedSlotKey === slot.key}
                      onChange={(e) => setSelectedSlotKey(e.target.value)}
                      className="form-radio h-5 w-5 text-primary focus:ring-secondary"
                    />
                    <span className="ml-3 text-gray-700 dark:text-dark-text">{slot.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-dark-muted">No delivery slots available at this moment. Please check back later.</p>
            )}
          </fieldset>
        </div>

        {/* Order Summary */}
        <aside className="lg:col-span-1 bg-gray-50 dark:bg-dark-surface p-6 rounded-lg shadow-lg h-fit sticky top-24">
          <h2 className="text-2xl font-semibold text-textDark dark:text-dark-text mb-6 border-b dark:border-gray-600 pb-3">Order Summary</h2>
          {checkoutError && !isProcessingPayment && (
            <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{checkoutError}</span>
            </div>
          )}
          <dl className="space-y-3 mb-4">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-dark-muted">Subtotal ({cartCount} items):</dt>
              <dd className="font-medium dark:text-white">{currencySymbol}{cartTotal.toFixed(2)}</dd>
            </div>
             <div className="flex justify-between items-center text-sm text-gray-600 dark:text-dark-muted">
                <dt><label htmlFor="promo-code-input">Promo Code:</label></dt>
                 <dd className="flex">
                    <input 
                        type="text" 
                        id="promo-code-input"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        className="px-2 py-1 border border-gray-300 dark:border-gray-500 rounded-l-md w-28 text-xs focus:ring-primary focus:border-primary dark:bg-dark-background dark:text-white"
                    />
                    <button onClick={applyPromoCode} className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded-r-md text-xs dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Apply</button>
                 </dd>
            </div>
            {discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                    <dt>Discount (YUMMY10):</dt>
                    <dd className="font-medium">-{currencySymbol}{discount.toFixed(2)}</dd>
                </div>
            )}
            <div className="flex justify-between text-gray-600 dark:text-dark-muted">
              <dt>Estimated Tax (5%):</dt>
              <dd className="font-medium dark:text-white">{currencySymbol}{estimatedTax.toFixed(2)}</dd>
            </div>
             <div className="flex justify-between text-gray-600 dark:text-dark-muted">
              <dt>Delivery Fee:</dt>
              <dd className="font-medium dark:text-white">{deliveryFee === 0 ? 'FREE' : `${currencySymbol}${deliveryFee.toFixed(2)}`}</dd>
            </div>
            {selectedDeliverySlot && (
                 <div className="flex justify-between text-gray-600 dark:text-dark-muted border-t dark:border-gray-600 pt-2 mt-2">
                    <dt>Delivery Slot:</dt>
                    <dd className="font-medium text-right dark:text-white">{selectedDeliverySlot.label}</dd>
                </div>
            )}
          </dl>
          <div className="border-t dark:border-gray-600 pt-4 mt-4">
            <div className="flex justify-between text-xl font-bold text-textDark dark:text-dark-text">
              <dt>Total:</dt>
              <dd>{currencySymbol}{finalTotal.toFixed(2)}</dd>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={authLoading || isProcessingPayment || !selectedSlotKey || availableSlots.length === 0}
            className="relative w-full mt-6 bg-gradient-to-r from-primary to-orange-500 dark:from-dark-accent dark:to-primary hover:from-primary-dark hover:to-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 text-lg shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed overflow-hidden
                       before:content-[''] before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:animate-shimmer-slide"
          >
            {authLoading ? 'Loading...' : (currentUser && !currentUser.isGuest ? 'Proceed to Checkout' : 'Login to Checkout')}
          </button>
          {!selectedSlotKey && availableSlots.length > 0 && (
             <p className="text-xs text-red-500 text-center mt-2">Please select a delivery slot.</p>
          )}
           <Link 
            to="/menu" 
            className="block text-center mt-4 text-secondary-dark dark:text-primary-light hover:text-primary underline"
            >
            Continue Shopping
            </Link>
        </aside>
      </div>
    </div>
  );
};

export default CartPage;