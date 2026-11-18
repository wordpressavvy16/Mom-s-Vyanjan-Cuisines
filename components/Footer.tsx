
import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '../context/SiteSettingsContext';

// Simple SVG Icons for Social Media
const FacebookIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v3.24h-1.58c-1.238 0-1.64.773-1.64 1.562V12h3.535l-.56 3.89h-2.975v6.987C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.345 4.22c.636-.247 1.363-.416 2.427-.465C9.793 2.013 10.148 2 12.315 2zm-1.04 2.115c-2.36 0-2.68.01-3.63.056-1.003.046-1.517.208-1.942.37-1.012.39-1.745 1.12-2.135 2.132-.164.425-.325.94-.37 1.942-.046.95-.056 1.27-.056 3.63s.01 2.68.056 3.63c.046 1.003.208 1.517.37 1.942.39 1.012 1.12 1.745 2.132 2.135.425.164.94.325 1.942.37.95.046 1.27.056 3.63.056s2.68-.01 3.63-.056c1.003-.046 1.517-.208 1.942-.37 1.012-.39 1.745-1.12 2.135-2.132.164-.425-.325-.94.37-1.942.046-.95.056-1.27.056-3.63s-.01-2.68-.056-3.63c-.046-1.003-.208-1.517-.37-1.942-.39-1.012-1.12-1.745-2.132-2.135-.425-.164-.94-.325-1.942-.37-.95-.046-1.27-.056-3.63-.056zM12 6.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 8.468a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.338-9.87a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z" clipRule="evenodd" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
);

const WhatsAppIcon = () => (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 12c0 1.78.46 3.45 1.29 4.9L2 22l5.25-1.38c1.37.76 2.94 1.18 4.59 1.18h.01c5.46 0 9.91-4.45 9.91-9.91s-4.45-9.9-9.91-9.9zM12.04 20.12h-.01c-1.48 0-2.92-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.83-1.35-1.27-2.92-1.27-4.59 0-4.43 3.6-8.03 8.04-8.03s8.04 3.6 8.04 8.04-3.6 8.03-8.04 8.03zM17.8 14.19c-.21-.11-1.26-.62-1.45-.7s-.34-.11-.48.11c-.14.22-.55.7-.67.84s-.25.17-.46.06c-.21-.11-1-1.23-1.9-2.22-.8-.85-1.28-1.54-1.43-1.8s-.01-.27.1-.38c.11-.11.25-.28.37-.42s.17-.22.25-.37.04-.28-.02-.38c-.06-.11-.48-1.15-.66-1.58-.18-.43-.36-.37-.48-.37h-.45c-.14 0-.38.06-.58.28-.2.22-.78.76-.78 1.85s.8 2.15.91 2.3c.11.14 1.57 2.4 3.8 3.35.53.22.95.35 1.27.45.5.15 1 .13 1.38.08.43-.06 1.26-.51 1.44-1 .18-.48.18-.9.13-1s-.2-.14-.4-.25z" />
    </svg>
);

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
  <li>
    <Link to={to} className="text-dark-muted hover:text-dark-accent transition-colors duration-200">{children}</Link>
  </li>
);

const Footer: React.FC = () => {
  const { businessName, siteSettings } = useSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-dark-text pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Column 1: About */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-4">{businessName}</h3>
            <p className="text-dark-muted text-sm">{siteSettings.businessInfo.aboutUs}</p>
          </div>

          {/* Column 2: Company */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4 tracking-wide">Company</h3>
            <ul className="space-y-3 text-sm">
              <FooterLink to="/about">About Us</FooterLink>
              <FooterLink to="/blog">Blog</FooterLink>
              <FooterLink to="/become-partner">Become a Partner</FooterLink>
            </ul>
          </div>
          
          {/* Column 3: Legal */}
          <div>
            <h3 className="text-base font-semibold text-white mb-4 tracking-wide">Legal</h3>
            <ul className="space-y-3 text-sm">
              <FooterLink to="/privacy-policy">Privacy Policy</FooterLink>
              <FooterLink to="/terms-of-service">Terms of Service</FooterLink>
              <FooterLink to="/cookie-policy">Cookie Policy</FooterLink>
              <FooterLink to="/refund-policy">Refund Policy</FooterLink>
              <FooterLink to="/accessibility">Accessibility</FooterLink>
            </ul>
          </div>
          
          {/* Column 4: Help */}
          <div>
             <h3 className="text-base font-semibold text-white mb-4 tracking-wide">Get Help</h3>
            <ul className="space-y-3 text-sm">
              <FooterLink to="/faq">FAQs</FooterLink>
              <FooterLink to="/profile">My Profile</FooterLink>
              <FooterLink to="/cart">View Cart</FooterLink>
            </ul>
          </div>

          {/* Column 5: Social */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-base font-semibold text-white mb-4 tracking-wide">Social Links</h3>
            <div className="flex space-x-5">
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-dark-accent" aria-label="Facebook">
                <FacebookIcon />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-dark-accent" aria-label="Instagram">
                <InstagramIcon />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-dark-accent" aria-label="Twitter">
                <TwitterIcon />
              </a>
               <a href={`https://wa.me/${siteSettings.businessInfo.contactWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-dark-muted hover:text-dark-accent" aria-label="WhatsApp">
                <WhatsAppIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-dark-muted/20 pt-8 text-center text-sm text-dark-muted">
            <p>&copy; {year} {businessName}. All Rights Reserved.</p>
            <p className="mt-1">By using this site, you agree to our <Link to="/terms-of-service" className="underline hover:text-white">Terms of Service</Link> and <Link to="/privacy-policy" className="underline hover:text-white">Privacy Policy</Link>.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;