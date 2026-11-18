import React from 'react';
import { Link } from 'react-router-dom';

const CookiePolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-light-text dark:text-dark-text">
      <h1 className="text-3xl sm:text-4xl font-bold font-display text-secondary dark:text-accent mb-6 border-b pb-4">Cookie Policy</h1>
      
      <div className="space-y-8 leading-relaxed">
        <p className="text-sm text-light-muted dark:text-dark-muted">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">1. What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device (computer, tablet, mobile phone) when you visit certain websites. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">2. How We Use Cookies</h2>
          <p>We use cookies for a variety of reasons detailed below. Unfortunately, in most cases, there are no industry standard options for disabling cookies without completely disabling the functionality and features they add to this site. It is recommended that you leave on all cookies if you are not sure whether you need them or not in case they are used to provide a service that you use.</p>
          <ul className="list-disc list-inside space-y-2 mt-4 pl-4">
            <li><strong>Essential Cookies:</strong> These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in, or filling your shopping cart.</li>
            <li><strong>Functionality Cookies:</strong> These cookies enable the website to provide enhanced functionality and personalization. For example, we use a cookie to remember your choice of light or dark theme.</li>
            <li><strong>Performance Cookies:</strong> These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. (Note: This is a mock site and does not use performance cookies).</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">3. Your Choices Regarding Cookies</h2>
          <p>You can manage your cookie preferences through your browser settings. You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">More Information</h2>
          <p>For more details about how we handle your personal data, please see our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.</p>
          <p>If you have any questions about our use of cookies, you can contact us at: <a href="mailto:support@momsvyanjan.example.com" className="text-primary hover:underline">support@momsvyanjan.example.com</a>.</p>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
