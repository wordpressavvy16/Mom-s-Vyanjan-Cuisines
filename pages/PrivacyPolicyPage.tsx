import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-light-text dark:text-dark-text">
      <h1 className="text-3xl sm:text-4xl font-bold font-display text-secondary dark:text-accent mb-6 border-b pb-4">Privacy Policy</h1>
      
      <div className="space-y-8 leading-relaxed">
        <p className="text-sm text-light-muted dark:text-dark-muted">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">1. Introduction</h2>
          <p>Welcome to MoM's Vyanjan Tiffin Service ("we," "our," "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">2. Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
          <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, that you voluntarily give to us when you register with the Site or place an order.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, browser type, and access times. This is used for system administration and to improve the service.</li>
            <li><strong>Financial Data:</strong> We use a third-party payment processor for all payments. We do not store or collect your payment card details. That information is provided directly to our third-party payment processors.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">3. How We Use Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
          <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
            <li>Create and manage your account.</li>
            <li>Process your orders and manage payments, fees, and charges.</li>
            <li>Deliver your tiffin meals to your specified address.</li>
            <li>Email you regarding your account or order status.</li>
            <li>Administer promotions, and rewards through our loyalty program.</li>
            <li>Request feedback and contact you about your use of the Site.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">4. Your Data Protection Rights (GDPR)</h2>
          <p>If you are a resident of the European Economic Area (EEA), you have certain data protection rights. We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your Personal Data.</p>
          <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
            <li><strong>The right to access, update or delete the information we have on you.</strong> You can manage your information from your profile page.</li>
            <li><strong>The right of rectification.</strong> You have the right to have your information rectified if that information is inaccurate or incomplete.</li>
            <li><strong>The right to object.</strong> You have the right to object to our processing of your Personal Data.</li>
            <li><strong>The right of restriction.</strong> You have the right to request that we restrict the processing of your personal information.</li>
            <li><strong>The right to data portability.</strong> You have the right to be provided with a copy of the information we have on you in a structured, machine-readable and commonly used format.</li>
            <li><strong>The right to withdraw consent.</strong> You also have the right to withdraw your consent at any time where we relied on your consent to process your personal information.</li>
          </ul>
          <p className="mt-2">You can exercise these rights from your profile page or by contacting us.</p>
        </section>
        
         <section>
          <h2 className="text-2xl font-semibold font-display mb-3">5. A Note on Health Information</h2>
          <p>Our services are not intended to provide medical or dietary advice for health conditions. We do not collect Protected Health Information (PHI) as defined by health privacy laws like the Health Insurance Portability and Accountability Act (HIPAA). Any dietary preferences you provide are used solely to filter meal choices and are not treated as PHI.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">6. Data Security</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">7. Cookie Policy</h2>
          <p>We use cookies to help customize the Site and improve your experience. For more information on how we use cookies, please refer to our <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">8. Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:support@momsvyanjan.example.com" className="text-primary hover:underline">support@momsvyanjan.example.com</a>.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
