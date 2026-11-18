
import React from 'react';

const RefundPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-light-text dark:text-dark-text">
      <h1 className="text-3xl sm:text-4xl font-bold font-display text-secondary dark:text-accent mb-6 border-b pb-4">Refund & Cancellation Policy</h1>
      
      <div className="space-y-8 leading-relaxed">
        <p className="text-sm text-light-muted dark:text-dark-muted">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">1. Cancellation Policy</h2>
          <p>We understand that plans can change. You can cancel your order for a specific meal slot before the cutoff time to receive a full refund. The cutoff times are as follows:</p>
          <ul className="list-disc list-inside space-y-2 mt-4 pl-4">
            <li><strong>Breakfast Slot:</strong> Cancellation must be made by 11:00 PM the previous night.</li>
            <li><strong>Lunch Slot:</strong> Cancellation must be made by 9:00 AM on the day of delivery.</li>
            <li><strong>Dinner Slot:</strong> Cancellation must be made by 4:00 PM on the day of delivery.</li>
          </ul>
          <p className="mt-2">Cancellations requested after these times cannot be processed, as the meal preparation will have already begun. To cancel an order, please go to your profile and find the order in your "Order History".</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">2. Refund Eligibility</h2>
          <p>We strive for perfection, but if you are not satisfied with your order, you may be eligible for a refund under the following circumstances:</p>
          <ul className="list-disc list-inside space-y-2 mt-4 pl-4">
            <li><strong>Quality Issues:</strong> If the food delivered is spoiled, stale, or otherwise not fit for consumption.</li>
            <li><strong>Incorrect Items:</strong> If you received items that you did not order.</li>
            <li><strong>Non-Delivery:</strong> If your order was confirmed but never delivered to your address.</li>
          </ul>
          <p className="mt-2">Please note that refunds for matters of personal taste will be handled on a case-by-case basis. We encourage you to read the meal descriptions carefully before ordering.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">3. How to Request a Refund</h2>
          <p>To request a refund, please follow these steps:</p>
           <ul className="list-disc list-inside space-y-2 mt-4 pl-4">
            <li>Contact our customer support team within <strong>2 hours</strong> of receiving your delivery. You can reach us at <a href="mailto:support@momsvyanjan.example.com" className="text-primary hover:underline">support@momsvyanjan.example.com</a>.</li>
            <li>Provide your <strong>Order ID</strong> and a detailed description of the issue.</li>
            <li>For quality or incorrect item issues, please provide a clear <strong>photograph</strong> of the meal as evidence. This helps us understand the problem and improve our service.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold font-display mb-3">4. Refund Process</h2>
          <p>Once we receive your refund request, our team will review the case. If your request is approved, the refund will be processed to your original method of payment within <strong>5-7 business days</strong>. You will receive an email confirmation once the refund has been initiated.</p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
