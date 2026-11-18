import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Meal, DietaryPreference } from '../types';
import MealCard from '../components/MealCard';
import * as apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { DIETARY_OPTIONS } from '../constants';

const useInView = (options: IntersectionObserverInit) => {
  const ref = React.useRef(null);
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target as Element);
      }
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options]);

  return [ref, isInView] as const;
};


const MenuPage: React.FC = () => {
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDietaryPrefs, setSelectedDietaryPrefs] = useState<DietaryPreference[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [gridRef, isGridVisible] = useInView({ threshold: 0.05 });

  useEffect(() => {
    const loadMeals = async () => {
      setIsLoading(true);
      try {
        const meals = await apiService.fetchMeals();
        setAllMeals(meals);
        setFilteredMeals(meals);
      } catch (error) {
        console.error("Failed to load meals:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMeals();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(allMeals.map(meal => meal.category));
    return ['', ...Array.from(uniqueCategories)]; // Add "All" option
  }, [allMeals]);

  useEffect(() => {
    let currentMeals = [...allMeals];

    // Filter by search term
    if (searchTerm) {
      currentMeals = currentMeals.filter(meal =>
        meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by dietary preferences (AND logic - meal must have ALL selected prefs)
    if (selectedDietaryPrefs.length > 0) {
      currentMeals = currentMeals.filter(meal =>
        selectedDietaryPrefs.every(pref => meal.dietaryTags.includes(pref))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
        currentMeals = currentMeals.filter(meal => meal.category === selectedCategory);
    }

    setFilteredMeals(currentMeals);
  }, [searchTerm, selectedDietaryPrefs, selectedCategory, allMeals]);

  const handleDietaryPrefChange = (pref: DietaryPreference) => {
    setSelectedDietaryPrefs(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner text="Fetching our delicious menu..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="bg-gradient-to-br from-secondary to-secondary-dark text-white py-12 px-4 rounded-lg shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-center font-display">Our Delicious Menu</h1>
          <p className="text-center mt-2 text-lg text-white/90">Explore a wide variety of meals, crafted with love and fresh ingredients.</p>
        </div>
      </header>

      {/* Filters Section */}
      <section aria-labelledby="filter-heading" className="p-4 sm:p-6 bg-light-surface/70 dark:bg-dark-surface/70 backdrop-blur-sm rounded-lg shadow sticky top-[68px] z-40 md:top-[76px]">
        <h2 id="filter-heading" className="sr-only">Filter meals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label htmlFor="search-meals-input" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Search Meals</label>
            <input
              type="search"
              id="search-meals-input"
              placeholder="e.g., Paneer, Spicy, Salad"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-accent-yellow focus:border-secondary dark:bg-dark-background dark:text-dark-text"
            />
          </div>
           <div>
            <label htmlFor="category" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Category</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-accent-yellow focus:border-secondary bg-light-surface dark:bg-dark-background dark:text-dark-text"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === '' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
          <div role="group" aria-labelledby="dietary-pref-label">
            <span id="dietary-pref-label" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Dietary Preferences</span>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(pref => (
                <button
                  key={pref}
                  onClick={() => handleDietaryPrefChange(pref)}
                  aria-pressed={selectedDietaryPrefs.includes(pref)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedDietaryPrefs.includes(pref)
                      ? 'bg-primary text-white border-primary-dark ring-2 ring-primary/50'
                      : 'bg-light-surface text-light-text border-neutral-300 hover:bg-neutral-200 dark:bg-dark-surface dark:text-dark-text dark:border-gray-500 dark:hover:bg-dark-background'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Meals Grid Section */}
      <main>
        {filteredMeals.length > 0 ? (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMeals.map((meal, index) => (
              <div 
                key={meal.id} 
                className={`transition-all duration-700 ease-out ${isGridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} 
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                  <MealCard meal={meal} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-2xl font-display text-light-text dark:text-dark-text mb-2">No Matches Found</p>
            <p className="text-light-muted dark:text-dark-muted">
              We couldn't find any meals matching your current filters.
              <br />
              Try clearing some filters or searching for something else!
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MenuPage;
