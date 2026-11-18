import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPartnerApplication } from '../services/configService';
import LoadingSpinner from '../components/LoadingSpinner';

const BecomePartnerPage: React.FC = () => {
  const [applicantName, setApplicantName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [serviceAreaNotes, setServiceAreaNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!applicantName || !email || !businessName || !serviceAreaNotes) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      await submitPartnerApplication({ applicantName, email, businessName, serviceAreaNotes });
      setSuccess("Your application has been submitted successfully! We will review it and get back to you soon.");
      // Clear form
      setApplicantName('');
      setEmail('');
      setBusinessName('');
      setServiceAreaNotes('');
    } catch (err: any) {
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-secondary dark:text-accent text-center mb-8 font-display">Partner with Us!</h1>
      <p className="text-light-muted dark:text-dark-muted text-center mb-10">
        Are you a tiffin service provider looking to expand your reach? Join the MoM's Vyanjan network and serve more customers!
        Fill out the form below to apply.
      </p>

      <form onSubmit={handleSubmit} className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-xl shadow-2xl space-y-6">
        {success && <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm">{success}</div>}
        {error && <div className={`p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm ${loading ? '' : 'animate-shake'}`}>{error}</div>}

        <div>
          <label htmlFor="applicantName" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Your Name / Contact Person*</label>
          <input
            type="text"
            id="applicantName"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            required
            className="w-full px-4 py-2 border-2 border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent dark:bg-dark-background dark:text-dark-text dark:border-gray-600 dark:focus:border-dark-accent dark:focus:ring-dark-accent/50"
            placeholder="e.g., John Doe"
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Email Address*</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border-2 border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent dark:bg-dark-background dark:text-dark-text dark:border-gray-600 dark:focus:border-dark-accent dark:focus:ring-dark-accent/50"
            placeholder="you@example.com"
            inputMode="email"
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Your Tiffin Service / Business Name*</label>
          <input
            type="text"
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="w-full px-4 py-2 border-2 border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent dark:bg-dark-background dark:text-dark-text dark:border-gray-600 dark:focus:border-dark-accent dark:focus:ring-dark-accent/50"
            placeholder="e.g., Doe's Delicious Tiffins"
            autoComplete="organization"
          />
        </div>

        <div>
          <label htmlFor="serviceAreaNotes" className="block text-sm font-medium text-light-text dark:text-dark-text mb-1">Service Areas / Notes*</label>
          <textarea
            id="serviceAreaNotes"
            value={serviceAreaNotes}
            onChange={(e) => setServiceAreaNotes(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 border-2 border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent dark:bg-dark-background dark:text-dark-text dark:border-gray-600 dark:focus:border-dark-accent dark:focus:ring-dark-accent/50"
            placeholder="Briefly describe the areas you serve (e.g., specific zip codes, neighborhoods) or any other relevant details."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-lg shadow-md hover:shadow-lg disabled:bg-gray-400"
        >
          {loading ? <LoadingSpinner size="sm" color="text-white" /> : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

export default BecomePartnerPage;