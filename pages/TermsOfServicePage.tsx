import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-light-text dark:text-dark-text">
      <h1 className="text-3xl sm:text-4xl font-bold font-display text-secondary dark:text-accent mb-6 border-b pb-4">Terms of Service</h1>
      
      <div className="space-y-8 leading-relaxed">
        <p className="text-sm text-light-muted dark:text-dark-muted">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using the MoM's Vyanjan Tiffin Service website ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services. Any participation in this service will constitute acceptance of this agreement.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">2. User Accounts</h2>
          <p>To access some features of the Service, you may be required to create an account. You are responsible for safeguarding your password and for any activities or actions under your password. We encourage you to use a "strong" password (a password that uses a combination of upper and lower case letters, numbers, and symbols) with your account.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">3. Orders, Payments, and Cancellations</h2>
          <p>All orders are subject to availability and confirmation of the order price. Delivery times may vary according to availability and any guarantees or representations made as to delivery times are subject to any delays resulting from postal delays or force majeure for which we will not be responsible.</p>
          <p>To place an order, you must possess a valid credit or debit card issued by a bank acceptable to us. We retain the right to refuse any request made by you. All prices advertised are subject to such changes.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">4. User Conduct</h2>
          <p>You agree not to use the Service for any unlawful purpose or any purpose prohibited under this clause. You agree not to use the Service in any way that could damage the Service, the reputation of MoM's Vyanjan, or the general business of MoM's Vyanjan.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">5. Intellectual Property</h2>
          <p>The Service and all of its original content are the sole property of MoM's Vyanjan Tiffin Service and are, as such, fully protected by the appropriate international copyright and other intellectual property rights laws.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">6. Limitation of Liability</h2>
          <p>To the fullest extent permitted by applicable law, in no event shall MoM's Vyanjan Tiffin Service, its affiliates, directors, or employees, be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages, including without limitation damages for loss of profits, goodwill, use, data, or other intangible losses, arising out of or relating to the use of, or inability to use, the service.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">7. Changes to This Agreement</h2>
          <p>We reserve the right to modify these Terms of Service at any time. We do so by posting and drawing attention to the updated terms on the Site. Your decision to continue to visit and make use of the Site after such changes have been made constitutes your formal acceptance of the new Terms of Service.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">8. Contact Us</h2>
          <p>If you have any questions about this Agreement, please feel free to contact us at <a href="mailto:support@momsvyanjan.example.com" className="text-primary hover:underline">support@momsvyanjan.example.com</a>.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
