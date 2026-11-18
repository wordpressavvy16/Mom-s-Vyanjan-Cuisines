
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { pingAppwrite } from './services/appwriteClient';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import MealDetailPage from './pages/MealDetailPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import PartnerDashboardPage from './pages/PartnerDashboardPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import BecomePartnerPage from './pages/BecomePartnerPage';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import SupportChatbot from './components/SupportChatbot';
import LiveOrderCounter from './components/LiveOrderCounter';
import AccessibilityToolbar from './components/AccessibilityToolbar';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AccessibilityStatementPage from './pages/AccessibilityStatementPage';
import AboutUsPage from './pages/AboutUsPage';
import BlogPage from './pages/BlogPage';
import FaqPage from './pages/FaqPage';
import RefundPolicyPage from './pages/RefundPolicyPage';


const AppContent = () => {
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  useEffect(() => {
    void pingAppwrite();
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/meal/:mealId" element={<MealDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/partner-dashboard" element={<PartnerDashboardPage />} />
          <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
          <Route path="/become-partner" element={<BecomePartnerPage />} />
          {/* Legal and Info Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />
          <Route path="/accessibility" element={<AccessibilityStatementPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
        </Routes>
      </main>
      <Footer />
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />}
      <SupportChatbot />
      <LiveOrderCounter />
      <AccessibilityToolbar />
    </div>
  );
}


const App: React.FC = () => {
  return (
      <AppContent />
  );
};


export default App;