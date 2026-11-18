import React from 'react';

const AccessibilityStatementPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-light-text dark:text-dark-text">
      <h1 className="text-3xl sm:text-4xl font-bold font-display text-secondary dark:text-accent mb-6 border-b pb-4">Accessibility Statement</h1>
      
      <div className="space-y-8 leading-relaxed">
        <p className="text-sm text-light-muted dark:text-dark-muted">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">Our Commitment</h2>
          <p>MoM's Vyanjan Tiffin Service is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">Conformance Status</h2>
          <p>The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. MoM's Vyanjan is partially conformant with WCAG 2.1 level AA. Partially conformant means that some parts of the content do not fully conform to the accessibility standard.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">Measures Taken</h2>
          <p>We take the following measures to ensure accessibility of our application:</p>
          <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
            <li>Include accessibility as part of our mission statement.</li>
            <li>Assign clear accessibility targets and responsibilities.</li>
            <li>Employ formal accessibility quality assurance methods.</li>
            <li>Use semantic HTML and ARIA attributes to improve navigation and understanding for assistive technologies.</li>
            <li>Ensure sufficient color contrast and provide alternative text for images.</li>
            <li>Enable keyboard navigation throughout the site.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">Feedback</h2>
          <p>We welcome your feedback on the accessibility of MoM's Vyanjan. Please let us know if you encounter accessibility barriers on our site:</p>
          <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
            <li><strong>Email:</strong> <a href="mailto:accessibility@momsvyanjan.example.com" className="text-primary hover:underline">accessibility@momsvyanjan.example.com</a></li>
            <li><strong>Postal Address:</strong> 123 Food Street, Flavor Town, 90210</li>
          </ul>
          <p className="mt-2">We try to respond to feedback within 5 business days.</p>
        </section>
      </div>
    </div>
  );
};

export default AccessibilityStatementPage;
