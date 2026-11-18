import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Meal, Review, DietaryPreference } from '../types';
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import GeminiChatPopup from '../components/GeminiChatPopup';
import { DietaryTagStyles } from '../components/MealCard'; 
import StarRatingDisplay from '../components/StarRatingDisplay';


const MealDetailPage: React.FC = () => {
  const { mealId } = useParams<{ mealId: string }>();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { currencySymbol, currencyCode } = useSiteSettings();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<string | undefined>(undefined);
  const [selectedPortionSize, setSelectedPortionSize] = useState<string | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);


  useEffect(() => {
    if (!mealId) {
      navigate('/menu');
      return;
    }
    const loadMealDetails = async () => {
      setIsLoading(true);
      try {
        const mealData = await apiService.fetchMealById(mealId);
        setMeal(mealData);
        if (mealData) {
          setSelectedSpiceLevel(mealData.customizationOptions?.spiceLevel?.[0]);
          setSelectedPortionSize(mealData.customizationOptions?.portionSize?.[0]);
          const mealReviews = await apiService.fetchReviewsForMeal(mealData.id);
          setReviews(mealReviews);
        }
      } catch (error) {
        console.error("Failed to load meal details:", error);
        navigate('/menu'); // Or show an error message
      } finally {
        setIsLoading(false);
      }
    };
    loadMealDetails();
  }, [mealId, navigate]);

  const handleAddToCart = () => {
    if (meal) {
      addToCart(meal, quantity, selectedSpiceLevel, selectedPortionSize);
      // Maybe show a success notification
    }
  };

  const getItemInCart = () => cartItems.find(item => item.id === meal?.id);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner text="Loading meal details..." size="lg" />
      </div>
    );
  }

  if (!meal) {
    return <div className="text-center text-xl text-red-500 py-10">Meal not found.</div>;
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

  const mealSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": meal.name,
    "image": meal.imageUrl,
    "description": meal.description,
    "sku": meal.id,
    "mpn": meal.id,
    "brand": {
      "@type": "Brand",
      "name": "MoM's Vyanjan"
    },
    ...(reviews.length > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating.toFixed(1),
        "reviewCount": reviews.length
      }
    }),
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": currencyCode,
      "price": meal.price.toFixed(2),
      "priceValidUntil": new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(), // Price valid for 30 days
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock"
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
       <script type="application/ld+json">
        {JSON.stringify(mealSchema)}
      </script>
      <div className="bg-light-surface dark:bg-dark-surface p-6 md:p-8 rounded-xl shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image and Basic Info */}
          <div>
            <img src={meal.imageUrl} alt={meal.name} className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg mb-6" />
            <div className="flex flex-wrap gap-2 mb-4">
              {meal.dietaryTags.map(tag => {
                const style = DietaryTagStyles[tag as DietaryPreference] || DietaryTagStyles[DietaryPreference.NONE];
                return (
                  <span key={tag} className={`text-sm font-medium px-3 py-1 rounded-full border flex items-center ${style.classes}`}>
                    {style.icon && <span className="mr-1.5">{style.icon}</span>}
                    {tag}
                  </span>
                )
              })}
            </div>
            {meal.calories && <p className="text-light-muted dark:text-dark-muted mb-4"><span className="font-semibold">Calories:</span> {meal.calories} kcal (approx.)</p>}
          </div>

          {/* Details, Customization, Add to Cart */}
          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary dark:text-accent font-display">{meal.name}</h1>
            <div className="flex items-center space-x-2">
                <StarRatingDisplay rating={averageRating} />
                <span className="text-light-muted dark:text-dark-muted">({reviews.length} reviews)</span>
            </div>
            <p className="text-light-text dark:text-dark-text text-lg leading-relaxed">{meal.description}</p>
            
            <p className="text-4xl font-bold text-light-text dark:text-dark-text">{currencySymbol}{meal.price.toFixed(2)}</p>

            {/* Customization Options */}
            {meal.customizationOptions?.spiceLevel && (
              <div role="radiogroup" aria-labelledby="spice-level-label">
                <span id="spice-level-label" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Spice Level:</span>
                <div className="flex space-x-2">
                  {meal.customizationOptions.spiceLevel.map(level => (
                    <button
                      key={level}
                      role="radio"
                      aria-checked={selectedSpiceLevel === level}
                      onClick={() => setSelectedSpiceLevel(level)}
                      className={`px-4 py-2 border rounded-md text-sm transition-colors ${selectedSpiceLevel === level ? 'bg-primary text-white border-primary-dark ring-2 ring-primary/50' : 'bg-light-surface dark:bg-dark-background text-light-text dark:text-dark-text border-neutral-300 dark:border-gray-600 hover:bg-neutral-200/50 dark:hover:bg-dark-background/80'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {meal.customizationOptions?.portionSize && (
              <div role="radiogroup" aria-labelledby="portion-size-label">
                <span id="portion-size-label" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Portion Size:</span>
                <div className="flex space-x-2">
                  {meal.customizationOptions.portionSize.map(size => (
                    <button
                      key={size}
                      role="radio"
                      aria-checked={selectedPortionSize === size}
                      onClick={() => setSelectedPortionSize(size)}
                      className={`px-4 py-2 border rounded-md text-sm transition-colors ${selectedPortionSize === size ? 'bg-primary text-white border-primary-dark ring-2 ring-primary/50' : 'bg-light-surface dark:bg-dark-background text-light-text dark:text-dark-text border-neutral-300 dark:border-gray-600 hover:bg-neutral-200/50 dark:hover:bg-dark-background/80'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity and Add to Cart */}
            <div className="flex items-center space-x-4 pt-4">
              <div className="flex items-center border border-neutral-300 dark:border-gray-600 rounded-md">
                <button aria-label="Decrease quantity" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-2 text-light-text dark:text-dark-text hover:bg-neutral-200/50 dark:hover:bg-dark-background/80 rounded-l-md">-</button>
                <input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-12 text-center border-y-0 focus:ring-accent-yellow focus:border-secondary bg-transparent dark:text-dark-text dark:border-gray-600"
                    inputMode="numeric"
                    aria-label="Quantity"
                 />
                <button aria-label="Increase quantity" onClick={() => setQuantity(q => q + 1)} className="px-3 py-2 text-light-text dark:text-dark-text hover:bg-neutral-200/50 dark:hover:bg-dark-background/80 rounded-r-md">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                className="flex-grow bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-lg shadow-md hover:shadow-lg"
              >
                {getItemInCart() ? `Add ${quantity} More` : `Add ${quantity} to Cart`}
              </button>
            </div>
             <button
                onClick={() => setIsChatOpen(true)}
                className="w-full group mt-4 bg-secondary hover:bg-secondary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <span>Ask AI About This Meal</span>
            </button>
          </div>
        </div>

        {/* Ingredients */}
        <div className="mt-10 pt-6 border-t dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-light-text dark:text-dark-text mb-3">Ingredients</h2>
          <ul className="list-disc list-inside text-light-muted dark:text-dark-muted space-y-1">
            {meal.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        {/* Reviews Section */}
        <div className="mt-10 pt-6 border-t dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-light-text dark:text-dark-text mb-4">Customer Reviews</h2>
            {reviews.length > 0 ? (
                <div className="space-y-6">
                {reviews.map(review => (
                    <div key={review.id} className="p-4 border dark:border-gray-700 rounded-lg bg-light-background dark:bg-dark-background">
                    <div className="flex items-center mb-2">
                        <StarRatingDisplay rating={review.rating} />
                        <span className="ml-2 text-sm font-semibold text-light-text dark:text-dark-text">{review.userName}</span>
                        <span className="ml-auto text-xs text-light-muted dark:text-dark-muted">{new Date(review.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-light-muted dark:text-dark-muted">{review.comment}</p>
                    </div>
                ))}
                </div>
            ) : (
                <p className="text-light-muted dark:text-dark-muted">No reviews yet for this meal. Be the first to share your thoughts!</p>
            )}
        </div>
      </div>
      {isChatOpen && meal && <GeminiChatPopup meal={meal} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default MealDetailPage;
