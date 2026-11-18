import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Meal, MealSlot, Testimonial, SocialFeedItem } from '../types';
import MealCard from '../components/MealCard';
import LoadingSpinner from '../components/LoadingSpinner';
import TestimonialCard from '../components/TestimonialCard';
import SocialFeedMockup from '../components/SocialFeedMockup';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { getTodaysScheduledMeals, getTestimonials, getSocialFeedItems, getMainSocialLinks } from '../services/configService';
import TypingEffect from '../components/TypingEffect';

// A simple hook to detect when an element is in the viewport
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


const getCurrentMealSlot = (): MealSlot => {
  const hour = new Date().getHours();
  if (hour < 11) return MealSlot.BREAKFAST; 
  if (hour < 16) return MealSlot.LUNCH;   
  return MealSlot.DINNER;                
};

const HomePage: React.FC = () => {
  const [dailyMenu, setDailyMenu] = useState<Meal[]>([]);
  const [currentSlot, setCurrentSlot] = useState<MealSlot>(getCurrentMealSlot());
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [socialFeedItems, setSocialFeedItems] = useState<SocialFeedItem[]>([]);
  const [mainSocialLinks, setMainSocialLinks] = useState({ instagram: '', facebook: '' });
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const { currentUser } = useAuth();
  const { siteSettings } = useSiteSettings();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);

  // Scroll-triggered animations
  const [whyUsRef, isWhyUsVisible] = useInView({ threshold: 0.1 });
  const [stepsRef, isStepsVisible] = useInView({ threshold: 0.1 });
  const [dailyMenuRef, isDailyMenuVisible] = useInView({ threshold: 0.1 });
  const [testimonialsRef, isTestimonialsVisible] = useInView({ threshold: 0.1 });
  const [socialFeedRef, isSocialFeedVisible] = useInView({ threshold: 0.1 });

  const cyclingTexts = ["Fresh Every Day.", "with Mom's Love."];

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const offset = window.pageYOffset;
        heroRef.current.style.backgroundPositionY = `${offset * 0.5}px`;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadHomepageData = async () => {
      setIsLoadingMenu(true);
      try {
        const slot = getCurrentMealSlot();
        setCurrentSlot(slot);
        const scheduledMeals = getTodaysScheduledMeals(slot); 
        setDailyMenu(scheduledMeals);
        
        const fetchedTestimonials = getTestimonials();
        setTestimonials(fetchedTestimonials);

        const fetchedSocialFeedItems = getSocialFeedItems();
        setSocialFeedItems(fetchedSocialFeedItems);
        
        setMainSocialLinks(getMainSocialLinks());

      } catch (error) {
        console.error("Failed to load homepage data:", error);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    loadHomepageData();
  }, []);

  const WhyUsBenefits = [
    { key: 'benefit1', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-secondary dark:text-accent transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110" role="img"><title>Heart Icon</title><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>, title: "Taste of Home", description: "Authentic recipes and familiar flavors that remind you of mom's kitchen." },
    { key: 'benefit2', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-secondary dark:text-accent transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110" role="img"><title>Leaf Icon</title><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 009-9h-9v9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 019 9h-9V3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 01-9-9h9v9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 00-9 9h9V3z" /></svg>, title: "Pure & Wholesome", description: "Fresh, locally-sourced ingredients, prepared with the utmost care and hygiene." },
    { key: 'benefit3', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-secondary dark:text-accent transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110" role="img"><title>Thumbs Up Icon</title><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.548 7.491A5.25 5.25 0 0116.5 21H6.75a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h3.879z" /></svg>, title: "Cooked with Love", description: "Our meals are more than food; they're a gesture of warmth and affection." },
    { key: 'benefit4', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-secondary dark:text-accent transition-transform duration-300 group-hover:rotate-[15deg] group-hover:scale-110" role="img"><title>Calendar Icon</title><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>, title: "Your Daily Comfort", description: "Daily comfort, simplified. Wholesome meals delivered fresh to your door." },
  ];

  const StepsToMeal = [
    { key: 'step1', iconPath: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12", title: "Discover Today's Menu", description: "See what's lovingly prepared for you today." },
    { key: 'step2', iconPath: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z", title: "Select Your Favorites", description: "Choose the meals that make your heart (and tummy) happy." },
    { key: 'step3', iconPath: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106A48.554 48.554 0 0012 5.25c-2.28 0-4.547.209-6.75.61a1.125 1.125 0 00-.987 1.106v.958m0 0H2.25m14.25 0a2.056 2.056 0 011.58.86 17.908 17.908 0 013.213 9.193c.039.62-.47.1124-1.09.1124h-1.125", title: "Relax & Enjoy", description: "We cook with care and deliver it fresh, ready for you to savor." },
  ];

  return (
    <div className="space-y-16 md:space-y-20 lg:space-y-24 pb-12">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="py-20 md:py-32 flex items-center justify-center min-h-screen text-center bg-cover bg-center relative rounded-b-3xl bg-fixed"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&h=900&q=80')" }} 
      >
        <div className="absolute inset-0 bg-black/50 rounded-b-3xl"></div> {/* Overlay */}
        <div className="hero-content relative z-10 p-6 rounded-xl bg-light-surface/60 dark:bg-dark-surface/70 backdrop-blur-lg max-w-3xl mx-auto shadow-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-light-text dark:text-dark-text mb-6 leading-tight tracking-tight flex flex-col justify-center items-center min-h-[90px] sm:min-h-[60px] md:min-h-[75px] opacity-0 animate-slide-up-fade [animation-delay:300ms]">
            <span className="text-secondary dark:text-accent">Savor the Authentic Taste of Home,</span>
            <TypingEffect texts={cyclingTexts} classNames={["text-primary", "text-secondary dark:text-accent"]} />
          </h1>
          <p className="text-lg sm:text-xl text-light-muted dark:text-dark-muted mb-10 max-w-2xl mx-auto opacity-0 animate-slide-up-fade [animation-delay:500ms]">
            {siteSettings.businessInfo.tagline} Delicious, wholesome meals, cooked with the freshest ingredients and a sprinkle of motherly care, delivered to your doorstep.
          </p>
          <a
            href="#daily-menu-section"
            className="relative bg-primary hover:bg-primary-dark text-white font-semibold py-3.5 px-10 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50 opacity-0 animate-fade-in-pulse [animation-delay:700ms]
                       after:content-[''] after:absolute after:inset-[-4px] after:border-radius-inherit after:bg-primary/50 after:opacity-0 after:animate-subtle-pulse [animation-delay:1.5s]"
          >
            View Today's Comfort Menu
          </a>
        </div>
      </section>

      {/* Why Us? Section */}
      <section ref={whyUsRef} className={`container mx-auto px-4 sm:px-6 transition-all duration-1000 ${isWhyUsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-3xl md:text-4xl font-bold font-display text-light-text dark:text-dark-text mb-4 text-center">More Than Just a Meal</h2>
        <p className="text-center text-light-muted dark:text-dark-muted mb-12 md:mb-16 max-w-xl mx-auto text-lg">We believe in bringing you the warmth and comfort of home-cooked food, effortlessly.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {WhyUsBenefits.map((benefit, index) => (
            <div key={benefit.key} className={`group bg-light-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg text-center transition-all duration-500 hover:shadow-2xl flex flex-col items-center focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ${isWhyUsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 100}ms`}}>
              <div className="mb-5">{benefit.icon}</div>
              <h3 className="text-xl font-semibold font-display text-light-text dark:text-dark-text mb-2">{benefit.title}</h3>
              <p className="text-light-muted dark:text-dark-muted text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Simple Steps to a Tasty Meal */}
       <section ref={stepsRef} className={`py-16 bg-secondary/10 dark:bg-dark-surface rounded-xl transition-all duration-1000 ${isStepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-light-text dark:text-dark-text mb-12 md:mb-16 text-center">Your Meal, In <span className="text-primary">3 Simple Steps</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
            {StepsToMeal.map((step, index) => (
              <div key={step.key} className={`group flex flex-col items-center p-4 transition-all duration-500 ${isStepsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 150}ms`}}>
                <div className="bg-light-surface dark:bg-dark-background p-5 rounded-full shadow-xl mb-6 w-28 h-28 flex items-center justify-center border-4 border-accent/50 dark:border-dark-accent/50 transition-transform duration-300 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-secondary dark:text-dark-accent transition-transform duration-300 group-hover:rotate-12" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={step.iconPath} />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold font-display text-light-text dark:text-dark-text mb-2">{index + 1}. {step.title}</h3>
                <p className="text-light-muted dark:text-dark-muted text-base">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Meal Menu Section */}
      <section id="daily-menu-section" ref={dailyMenuRef} className={`container mx-auto px-4 sm:px-6 scroll-mt-24 transition-all duration-1000 pb-16 ${isDailyMenuVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-3xl md:text-4xl font-bold font-display text-light-text dark:text-dark-text mb-4 text-center">
          Fresh from Mom's Kitchen: Today's <span className="text-primary">{currentSlot}</span>
        </h2>
        <p className="text-center text-light-muted dark:text-dark-muted mb-12 md:mb-16 max-w-xl mx-auto text-lg">Handpicked and lovingly prepared, just for you.</p>
        {isLoadingMenu ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner text={`Loading today's ${currentSlot.toLowerCase()} menu...`} size="lg" color="text-secondary" />
          </div>
        ) : dailyMenu.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {dailyMenu.slice(0,3).map((meal, index) => ( 
              <div key={meal.id} className={`transition-all duration-700 ease-out ${isDailyMenuVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                  <MealCard meal={meal} isFresh={index === 0} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-light-surface dark:bg-dark-surface rounded-xl shadow-xl p-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto text-gray-400 mb-4" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            <p className="text-2xl text-light-text dark:text-dark-text font-display mb-4">Mom's resting for {currentSlot.toLowerCase()} time!</p>
            <p className="text-light-muted dark:text-dark-muted mb-8">No specific meals are scheduled for this slot today. Why not explore our full menu?</p>
            <Link 
              to="/menu" 
              className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-full transition-colors text-lg shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Explore All Meals
            </Link>
          </div>
        )}
        {(dailyMenu.length > 3 || (dailyMenu.length === 0 && !isLoadingMenu)) && ( 
            <div className="text-center mt-12">
                <Link 
                    to={`/menu${dailyMenu.length > 0 ? `?slot=${currentSlot.toLowerCase()}&date=today` : ''}`} 
                    className="bg-secondary hover:bg-secondary-dark text-white font-semibold py-3.5 px-10 rounded-full transition-colors text-lg shadow-md hover:shadow-xl transform hover:scale-105"
                >
                    {dailyMenu.length > 0 ? `View All Today's ${currentSlot} Meals` : "Explore Full Menu"}
                </Link>
            </div>
        )}
      </section>
      
      {/* Customer Testimonials Section */}
      {testimonials.length > 0 && (
        <section ref={testimonialsRef} className={`py-16 bg-light-surface/50 dark:bg-dark-surface/50 rounded-xl min-h-[200px] transition-all duration-1000 ${isTestimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-light-text dark:text-dark-text mb-4 text-center">Straight from Our <span className="text-primary">Happy Tummies</span></h2>
            <p className="text-center text-light-muted dark:text-dark-muted mb-12 md:mb-16 max-w-xl mx-auto text-lg">See what our extended family is saying about their tiffin experience.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {testimonials.slice(0, 3).map((testimonial, index) => (
                <div key={testimonial.id} className={`transition-all duration-700 ease-out ${isTestimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${index * 100}ms` }}>
                    <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
            {testimonials.length > 3 && (
                <div className="text-center mt-12">
                     <button onClick={() => alert("Mock: Navigating to all testimonials page.")} className="text-secondary dark:text-accent hover:text-primary underline font-semibold text-lg transition-colors">
                        Read More Stories &rarr;
                    </button>
                </div>
            )}
          </div>
        </section>
      )}

      {/* Social Media Feed Section */}
      {socialFeedItems.length > 0 && (
        <section ref={socialFeedRef} className={`container mx-auto px-4 sm:px-6 min-h-[200px] transition-all duration-1000 ${isSocialFeedVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-light-text dark:text-dark-text mb-4 text-center">A Glimpse into Our <span className="text-primary">Kitchen & Community</span></h2>
          <p className="text-center text-light-muted dark:text-dark-muted mb-12 md:mb-16 max-w-xl mx-auto text-lg">Follow our journey and see what's cooking on social media!</p>
          <SocialFeedMockup feedItems={socialFeedItems.slice(0, 2)} mainProfileLinks={mainSocialLinks} /> {/* Display up to 2 items */}
        </section>
      )}

    </div>
  );
};

export default HomePage;