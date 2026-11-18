


import React, { useState, useEffect } from 'react'; 
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(''); 
  const [lastName, setLastName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState(''); 
  const [error, setError] = useState('');
  const { login, signup, loading, referralCodeFromUrl } = useAuth(); 
  const [showVerificationPrompts, setShowVerificationPrompts] = useState(false);

  useEffect(() => {
    if (isOpen && !isLoginView && referralCodeFromUrl) {
      setReferralCodeInput(referralCodeFromUrl);
    }
    if (!isOpen) { 
        setReferralCodeInput('');
        setError(''); // Clear error on close
        setShowVerificationPrompts(false); // Reset view on close
        // Reset form fields if needed
        setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setWhatsappNumber('');
    }
  }, [isOpen, isLoginView, referralCodeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowVerificationPrompts(false);
    try {
      if (isLoginView) {
        await login(email, password);
        // onClose(); // Close modal on successful login handled by AuthContext
      } else {
        await signup(firstName, lastName, email, password, whatsappNumber, referralCodeInput.trim());
        setShowVerificationPrompts(true); 
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowVerificationPrompts(false);
    onClose();
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError('');
    // Reset fields when switching views for better UX
    setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setWhatsappNumber(''); setReferralCodeInput(referralCodeFromUrl && !isLoginView ? referralCodeFromUrl : '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-md relative">
        <button onClick={handleCloseModal} aria-label="Close authentication modal" className="absolute top-3 right-3 text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text p-1 group">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {!showVerificationPrompts ? (
          <>
            <h2 id="auth-modal-title" className="text-2xl font-bold text-center text-secondary dark:text-accent mb-6 font-display">{isLoginView ? 'Login' : 'Sign Up'}</h2>
            {error && <div role="alert"><p className="text-red-500 text-sm mb-4 text-center">{error}</p></div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginView && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-light-text dark:text-dark-text">First Name*</label>
                      <input type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-secondary sm:text-sm dark:bg-dark-background dark:border-gray-600 dark:text-dark-text" autoComplete="given-name" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-light-text dark:text-dark-text">Last Name*</label>
                      <input type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-secondary sm:text-sm dark:bg-dark-background dark:border-gray-600 dark:text-dark-text" autoComplete="family-name" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="whatsappNumber" className="block text-sm font-medium text-light-text dark:text-dark-text">WhatsApp Number (Optional)</label>
                    <input type="tel" id="whatsappNumber" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-secondary sm:text-sm dark:bg-dark-background dark:border-gray-600 dark:text-dark-text" placeholder="e.g., +1234567890" inputMode="tel" autoComplete="tel"/>
                  </div>
                </>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-light-text dark:text-dark-text">Email Address*</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-secondary sm:text-sm dark:bg-dark-background dark:border-gray-600 dark:text-dark-text" inputMode="email" autoComplete="email"/>
              </div>
              <div>
                <label htmlFor="password"className="block text-sm font-medium text-light-text dark:text-dark-text">Password*</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isLoginView ? 1 : 8} className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-secondary sm:text-sm dark:bg-dark-background dark:border-gray-600 dark:text-dark-text" autoComplete={isLoginView ? "current-password" : "new-password"} />
                {!isLoginView && <p className="text-xs text-light-muted dark:text-dark-muted mt-1">Minimum 8 characters.</p>}
              </div>
               {!isLoginView && (
                <div>
                  <label htmlFor="referralCodeInput" className="block text-sm font-medium text-light-text dark:text-dark-text">Referral Code (Optional)</label>
                  <input 
                    type="text" 
                    id="referralCodeInput" 
                    value={referralCodeInput} 
                    onChange={(e) => setReferralCodeInput(e.target.value)} 
                    className="mt-1 block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-yellow focus:border-secondary sm:text-sm dark:bg-dark-background dark:border-gray-600 dark:text-dark-text" 
                    placeholder="Enter if you have one"
                    autoComplete="off"
                  />
                </div>
              )}
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-gray-400">
                {loading ? <LoadingSpinner size="sm" color="text-white"/> : (isLoginView ? 'Login' : 'Create Account')}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-light-text dark:text-dark-text">
              {isLoginView ? "Don't have an account? " : "Already have an account? "}
              <button onClick={toggleView} className="font-medium text-secondary dark:text-dark-accent hover:text-secondary-dark dark:hover:text-accent">
                {isLoginView ? 'Sign up' : 'Login'}
              </button>
            </p>
          </>
        ) : (
          // Verification Prompts View
          <div className="text-center">
            <h2 className="text-2xl font-bold text-secondary dark:text-accent-dark mb-4 font-display">Account Created!</h2>
            <p className="text-light-text dark:text-dark-text mb-6">Welcome, {firstName}! For full functionality, please verify your contact methods.</p>
            
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700 rounded-md">
                <p className="text-sm text-blue-700 dark:text-blue-300">An email verification link has been sent to <strong>{email}</strong>. (Mock)</p>
                <button className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:underline" onClick={() => alert('Mock: Resending email verification...')}>Resend Email</button>
              </div>
              
              {whatsappNumber && (
                <div className="p-3 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-700 rounded-md">
                  <p className="text-sm text-green-700 dark:text-green-300">An OTP has been sent to your WhatsApp <strong>{whatsappNumber}</strong>. (Mock)</p>
                  <button className="mt-1 text-xs text-green-600 dark:text-green-400 hover:underline" onClick={() => alert('Mock: Resending WhatsApp OTP...')}>Resend OTP</button>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleCloseModal} 
              className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
            >
              Continue to App
            </button>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-3">You can also verify later from your profile.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;