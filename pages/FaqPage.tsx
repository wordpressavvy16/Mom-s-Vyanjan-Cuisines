import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface FaqItemProps {
  question: string;
  children: React.ReactNode;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const id = `faq-${question.replace(/\s+/g, '-').toLowerCase()}`;
  
  return (
    <div className="border-b border-neutral-300 dark:border-gray-700">
      <h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={id}
          className="flex justify-between items-center w-full text-left py-4 font-semibold text-lg hover:bg-light-background/50 dark:hover:bg-dark-background/50"
        >
          <span>{question}</span>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </h3>
      <div
        id={id}
        role="region"
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
            <div className="pb-4 text-light-muted dark:text-dark-muted">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};

const FaqPage: React.FC = () => {
  const { siteSettings } = useSiteSettings();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-light-text dark:text-dark-text">
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold font-display text-secondary dark:text-accent">Frequently Asked Questions</h1>
        <p className="text-lg text-light-muted dark:text-dark-muted mt-2">Have a question? We're here to help.</p>
      </header>

      <div className="space-y-2">
        <FaqItem question="How do I place an order?">
          <p>You can place an order by browsing our <Link to="/menu" className="text-primary hover:underline">Menu</Link>, adding your desired meals to the cart, and proceeding to checkout. You will be asked to select a delivery slot before making a payment.</p>
        </FaqItem>
        <FaqItem question="What are the delivery times?">
          <p>We deliver during three main slots: Breakfast (9 AM - 11 AM), Lunch (1 PM - 3 PM), and Dinner (8 PM - 10 PM). You can select your preferred slot during checkout. Please note there is a cutoff time for ordering for each slot to ensure freshness.</p>
        </FaqItem>
        <FaqItem question="Can I customize my meal?">
          <p>Many of our meals offer customization options like spice level (Mild, Medium, Hot) and portion size (Regular, Large). You can select these options on the meal's detail page before adding it to your cart.</p>
        </FaqItem>
         <FaqItem question="What payment methods do you accept?">
          <p>We accept all major credit and debit cards. All payments are processed securely through our third-party payment provider. We do not store your card details on our servers.</p>
        </FaqItem>
         <FaqItem question="How can I track my order?">
          <p>Once your order is out for delivery, you can track it in real-time from your <Link to="/profile" className="text-primary hover:underline">Profile</Link> page. You will find a "Track Order" link next to the relevant order in your history.</p>
        </FaqItem>
        <FaqItem question="What is your cancellation/refund policy?">
            <p>You can cancel an order before its cutoff time for a full refund. For delivered orders, refunds are available for issues like incorrect items or quality problems. For full details, please read our <Link to="/refund-policy" className="text-primary hover:underline">Refund & Cancellation Policy</Link>.</p>
        </FaqItem>
        <FaqItem question="Do you offer weekly or monthly subscriptions?">
            <p>We are currently working on a subscription model to make your daily meals even more convenient! Stay tuned for updates on weekly and monthly plans that will offer great value and simplify your ordering process.</p>
        </FaqItem>
        <FaqItem question="What areas do you deliver to?">
            <p>We are constantly expanding our delivery network. To check if we deliver to your area, please enter your address during the checkout process. Our system will confirm if your location is within our service range.</p>
        </FaqItem>
        <FaqItem question="I have a dietary restriction/allergy. Can you accommodate it?">
            <p>We cater to various dietary preferences, including Vegetarian, Vegan, and Gluten-Free. You can use the filters on our <Link to="/menu" className="text-primary hover:underline">Menu</Link> page to find suitable meals. For specific allergies, please check the 'Ingredients' list on each meal's detail page carefully before ordering.</p>
        </FaqItem>
        <FaqItem question="How does the Loyalty & Rewards program work?">
            <p>We love to reward our loyal customers! You earn points for every dollar you spend. These points help you advance through tiers (Bronze, Silver, Gold), unlocking special rewards. You can also earn points by referring friends. Check your points balance and available coupons in the "Loyalty & Rewards" tab on your <Link to="/profile" className="text-primary hover:underline">Profile</Link> page.</p>
        </FaqItem>
        <FaqItem question="How can I contact customer support?">
            <p>For quick questions, you can use our AI-powered Support Chatbot available at the bottom right of your screen. For more specific issues regarding your order or account, you can email us at <a href={`mailto:${siteSettings.businessInfo.contactEmail}`} className="text-primary hover:underline">{siteSettings.businessInfo.contactEmail}</a>.</p>
        </FaqItem>
      </div>
    </div>
  );
};

export default FaqPage;