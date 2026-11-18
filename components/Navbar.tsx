import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { UserRole } from '../types'; 

const NavItem: React.FC<{ to: string, children: React.ReactNode, id?: string }> = ({ to, children, id }) => {
  return (
    <NavLink 
      to={to} 
      id={id}
      className={({ isActive }) => 
        `relative font-medium text-light-text dark:text-dark-text transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-light-surface dark:focus-visible:ring-offset-dark-surface focus-visible:rounded-sm
         before:content-[''] before:absolute before:bottom-[-4px] before:left-1/2 before:w-0 before:h-[2px] before:transition-all before:duration-300 before:ease-out before:-translate-x-1/2
         hover:text-accent dark:hover:text-dark-accent hover:before:w-full hover:before:bg-gradient-to-r hover:before:from-accent hover:before:to-primary
         ${isActive 
            ? 'text-primary dark:text-dark-accent font-semibold before:w-full before:!h-[3px] before:bg-primary dark:before:bg-dark-accent' 
            : ''
         }`
      }
    >
      {children}
    </NavLink>
  );
};

const Navbar: React.FC = () => {
  const { currentUser, logout, openAuthModal, loading } = useAuth();
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { businessName, businessLogoUrl } = useSiteSettings();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (cartCount > 0) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 700); // Animation duration
      return () => clearTimeout(timer);
    }
  }, [cartCount, location]);


  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderUserSpecificLinks = () => {
    if (loading) {
      return <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>;
    }
    if (currentUser) {
      if (currentUser.isGuest || currentUser.role === UserRole.GUEST) {
        return (
          <button 
            id="nav-auth-button"
            onClick={openAuthModal}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-full transition-all duration-300 transform hover:-translate-y-px active:translate-y-0 active:scale-95 shadow-md hover:shadow-lg"
          >
            Login / Sign Up
          </button>
        );
      }
      
      let dashboardLinkPath = "/profile";

      if (currentUser.role === UserRole.ADMIN) dashboardLinkPath = "/dashboard";
      else if (currentUser.role === UserRole.MANAGER) dashboardLinkPath = "/dashboard"; 
      else if (currentUser.role === UserRole.PARTNER) dashboardLinkPath = "/partner-dashboard";

      return (
        <div className="flex items-center space-x-3">
          <NavLink to={dashboardLinkPath} className="text-light-text dark:text-dark-text hover:text-primary dark:hover:text-dark-accent transition-colors flex items-center group" aria-label={`View your dashboard`}>
            {currentUser.profilePictureUrl ? (
                <img src={currentUser.profilePictureUrl} alt={`${currentUser.firstName} ${currentUser.lastName}`} className="w-9 h-9 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors"/>
            ) : (
                <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="font-bold text-secondary dark:text-accent">{currentUser.firstName?.charAt(0)}</span>
                </div>
            )}
          </NavLink>
        </div>
      );
    }
    
    return (
       <button 
          id="nav-auth-button"
          onClick={openAuthModal}
          className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-full transition-all duration-300 transform hover:-translate-y-px active:translate-y-0 active:scale-95 shadow-md hover:shadow-lg"
        >
          Login / Sign Up
        </button>
    );
  };

  return (
    <nav aria-label="Main navigation" className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
        <NavLink to="/" className="text-2xl font-bold text-secondary hover:text-secondary-dark dark:text-accent dark:hover:text-white transition-colors flex items-center gap-2 font-display">
            {businessLogoUrl && <img src={businessLogoUrl} alt={`${businessName} logo`} className="h-10 w-auto rounded-md" />}
          {businessName}
        </NavLink>
        <div className="flex items-center space-x-6">
          <NavItem to="/menu" id="nav-menu-link">Menu</NavItem>
          
          <NavLink to="/cart" id="nav-cart-link" className="relative text-light-text dark:text-dark-text hover:text-primary dark:hover:text-dark-accent transition-colors group" aria-label={`View your cart, ${cartCount} items`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transition-transform duration-300 ease-in-out group-hover:rotate-[-10deg] group-hover:scale-110" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cartCount > 0 && (
              <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${animateCart ? 'animate-badge-pop animate-badge-glow' : ''}`} aria-hidden="true">
                {cartCount}
              </span>
            )}
          </NavLink>
          <button 
            onClick={toggleTheme} 
            className="text-light-text dark:text-dark-text hover:text-primary dark:hover:text-dark-accent transition-colors p-1.5 rounded-full hover:bg-neutral-300/50 dark:hover:bg-dark-surface"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
            )}
            </button>
          {renderUserSpecificLinks()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;