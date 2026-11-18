import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Meal, DietaryPreference } from '../types';
import { useCart } from '../context/CartContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface MealCardProps {
  meal: Meal;
  isFresh?: boolean;
}

export const DietaryTagStyles: Record<DietaryPreference, { classes: string; icon: string }> = {
  [DietaryPreference.VEGETARIAN]: { classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700', icon: '🟢' },
  [DietaryPreference.VEGAN]: { classes: 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700', icon: '🌱' },
  [DietaryPreference.GLUTEN_FREE]: { classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700', icon: '🌾' },
  [DietaryPreference.LOW_CARB]: { classes: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-900/50 dark:text-sky-300 dark:border-sky-700', icon: '🥗' },
  [DietaryPreference.HIGH_PROTEIN]: { classes: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700', icon: '💪' },
  [DietaryPreference.NONE]: { classes: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600', icon: '' },
};


const MealCard: React.FC<MealCardProps> = ({ meal, isFresh }) => {
  const { addToCart, lastAddedItemId } = useCart();
  const { currencySymbol } = useSiteSettings();
  const isJustAdded = lastAddedItemId === meal.id;
  
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const freshBadgeRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const { current: card } = cardRef;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    const rotateX = (y / height - 0.5) * -20; // Max 10 deg rotation
    const rotateY = (x / width - 0.5) * 20;   // Max 10 deg rotation

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    card.style.transition = 'transform 0.1s linear';

    // Parallax for inner elements
    const elementsToAnimate = [
        { ref: imageRef, z: 35, factor: 0.07 },
        { ref: contentRef, z: 50, factor: 0.05 },
        { ref: freshBadgeRef, z: 60, factor: 0.1 },
        { ref: priceRef, z: 20, factor: 0.04 },
    ];

    elementsToAnimate.forEach(({ ref, z, factor }) => {
        if (ref.current) {
            ref.current.style.transform = `translateZ(${z}px) translateX(${rotateY * factor}px) translateY(${rotateX * -factor}px)`;
        }
    });
  };

  const handleMouseLeave = () => {
    const { current: card } = cardRef;
    if (!card) return;
    
    card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    
    const elementsToReset = [imageRef, contentRef, freshBadgeRef, priceRef];
    elementsToReset.forEach(ref => {
        if (ref.current) {
            ref.current.style.transform = `translateZ(0px) translateX(0px) translateY(0px)`;
            ref.current.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
        }
    });
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    e.stopPropagation();
    addToCart(meal);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Image failed to load for meal "${meal.name}": ${e.currentTarget.src}`);
    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
  };

  return (
    <Link 
      ref={cardRef}
      to={`/meal/${meal.id}`} 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label={`View details for ${meal.name}`} 
      className="block group bg-light-surface dark:bg-dark-surface rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden dark:border dark:border-transparent dark:hover:border-dark-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-dark-background"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="relative overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
        <img 
          ref={imageRef}
          src={meal.imageUrl} 
          alt={meal.name} 
          className="w-full h-48 object-cover transition-transform duration-500" 
          onError={handleImageError}
          loading="lazy"
        />
         <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-glare-effect pointer-events-none"></div>
         {isFresh && (
            <div ref={freshBadgeRef} className="fresh-badge absolute top-3 right-3 bg-gradient-to-r from-accent to-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-subtle-float">
                🌿 Fresh Today
            </div>
         )}
        <div ref={priceRef} className="absolute top-2 left-2 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm text-light-text dark:text-dark-text text-sm font-semibold px-3 py-1 rounded-full shadow-md">
          {currencySymbol}{meal.price.toFixed(2)}
        </div>
      </div>
      <div ref={contentRef} className="p-4 flex flex-col flex-grow" style={{ transformStyle: 'preserve-3d' }}>
        <h3 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2 truncate group-hover:text-primary dark:group-hover:text-dark-accent font-display">{meal.name}</h3>
        <p className="text-light-muted dark:text-dark-muted text-sm mb-3 leading-relaxed">{meal.description}</p>
        
        <div className="flex-grow"></div>
        
        <div className="mb-4 flex flex-wrap gap-1.5">
          {meal.dietaryTags.slice(0, 3).map((tag, index) => {
             const style = DietaryTagStyles[tag] || DietaryTagStyles[DietaryPreference.NONE];
             return (
                 <span key={`${meal.id}-tag-${tag}-${index}`} className={`text-xs font-semibold px-2 py-1 rounded-full border flex items-center ${style.classes}`}>
                    {style.icon && <span className="mr-1">{style.icon}</span>}
                    {tag}
                </span>
             )
          })}
        </div>

        <button 
          onClick={handleAddToCart}
          disabled={isJustAdded}
          aria-label={`Add ${meal.name} to your cart`}
          className={`w-full group mt-auto font-semibold py-2.5 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
            isJustAdded 
            ? 'bg-accent text-white cursor-default' 
            : 'bg-primary hover:bg-gradient-to-r hover:from-primary hover:to-orange-500 dark:hover:to-orange-400 text-white transform hover:scale-105 hover:shadow-lg active:scale-95'
          }`}
        >
          {isJustAdded ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>Added!</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </Link>
  );
};

export default MealCard;