

import React from 'react';
import { SocialFeedItem } from '../types';

interface SocialFeedMockupProps {
  feedItems: SocialFeedItem[];
  mainProfileLinks: { instagram: string; facebook: string };
}

const SocialFeedMockup: React.FC<SocialFeedMockupProps> = ({ feedItems, mainProfileLinks }) => {
  if (!feedItems || feedItems.length === 0) {
    return <p className="text-center text-light-muted py-8">Connect with us on social media for the latest updates!</p>;
  }

  const getPlatformIcon = (platform: SocialFeedItem['platform']) => {
    switch (platform) {
      case 'Instagram':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.272.058 2.123.247 2.882.544.817.328 1.446.802 2.062 1.42s.935 1.246 1.263 2.063c.297.758.486 1.61.544 2.881.058 1.267.07 1.647.07 4.85s-.012 3.583-.07 4.85c-.058 1.271-.247 2.123-.544 2.881-.328.818-.802 1.447-1.42 2.063s-1.246.935-2.063 1.263c-.758.297-1.61.486-2.881.544-1.267.058-1.647.07-4.85.07s-3.583-.012-4.85-.07c-1.271-.058-2.123-.247-2.881-.544-.818-.328-1.447-.802-2.063-1.42s-.935-1.246-1.263-2.063c-.297-.758-.486-1.61-.544-2.881C2.175 15.583 2.163 15.204 2.163 12s.012-3.583.07-4.85c.058-1.271.247 2.123.544-2.881.328-.818.802-1.447 1.42-2.063s1.246-.935 2.063-1.263c.758-.297 1.61-.486 2.881.544C8.417 2.175 8.796 2.163 12 2.163zm0 1.802c-3.147 0-3.504.011-4.73.067-1.18.054-1.803.232-2.228.393-.508.19-.888.445-1.273.83s-.64.765-.83 1.273c-.16.425-.338 1.048-.393 2.228C.011 8.496 0 8.853 0 12s.011 3.504.067 4.73c.054 1.18.232 1.803.393 2.228.19.508.445.888.83 1.273s.765.64 1.273.83c.425.16.81.338 2.228.393 1.226.056 1.583.067 4.73.067s3.504-.011 4.73-.067c1.18-.054 1.803.232 2.228-.393.508-.19.888-.445 1.273-.83s.64-.765.83-1.273c.16-.425.338-1.048-.393-2.228.056-1.226.067-1.583.067-4.73s-.011-3.504-.067-4.73c-.054-1.18-.232-1.803-.393-2.228-.19-.508-.445-.888-.83-1.273s-.765-.64-1.273-.83c-.425-.16-1.048-.338-2.228-.393C15.504 3.976 15.147 3.965 12 3.965zm0 3.046c-2.761 0-5 2.239-5 5s2.239 5 5 5 5-2.239 5-5-2.239-5-5-5zm0 8.198c-1.769 0-3.2-1.432-3.2-3.198s1.431-3.198 3.2-3.198 3.2 1.432 3.2 3.198-1.431 3.198-3.2 3.198zm3.057-6.587c-.535 0-.968.433-.968.968s.433.968.968.968.968-.433.968-.968-.433-.968-.968-.968z"/></svg>;
      case 'Facebook':
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor"><path d="M22.676 0H1.324C.593 0 0 .593 0 1.324v21.352C0 23.407.593 24 1.324 24h11.494v-9.294H9.689v-3.621h3.129V8.41c0-3.1 1.893-4.785 4.659-4.785 1.325 0 2.463.099 2.795.142v3.24h-1.92c-1.5 0-1.792.721-1.792 1.771v2.311h3.584l-.465 3.621h-3.119V24h6.115c.73 0 1.323-.593 1.323-1.324V1.324C24 .593 23.407 0 22.676 0z"/></svg>;
      default: // Twitter or other
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z"/></svg>;
    }
  };
  
  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {feedItems.map(item => ( // Display all fetched items, or slice if needed
            <a 
            key={item.id} 
            href={item.postUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block bg-light-surface dark:bg-dark-surface rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
            >
            {item.imageUrl && (
                <div className="aspect-square overflow-hidden">
                    <img 
                    src={item.imageUrl} 
                    alt={item.caption.substring(0, 30)} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    />
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center text-xs text-light-muted mb-2">
                {getPlatformIcon(item.platform)}
                <span className="ml-2 font-semibold text-light-text dark:text-dark-text">{item.platform}</span>
                </div>
                <p className="text-sm text-light-text dark:text-dark-text leading-relaxed line-clamp-3">{item.caption}</p>
            </div>
            </a>
        ))}
        </div>
        {(mainProfileLinks.instagram || mainProfileLinks.facebook) && (
            <div className="text-center mt-10">
                <p className="text-light-text dark:text-dark-text mb-4 text-lg font-display">Follow us for more delicious updates & stories!</p>
                <div className="space-x-4">
                    {mainProfileLinks.instagram && (
                         <a href={mainProfileLinks.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-semibold py-3 px-6 rounded-full hover:opacity-90 transition-all duration-300 text-base shadow-md hover:shadow-lg transform hover:scale-105">
                            {getPlatformIcon('Instagram')} <span className="ml-2">Our Instagram</span>
                        </a>
                    )}
                    {mainProfileLinks.facebook && (
                         <a href={mainProfileLinks.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-full hover:bg-blue-700 transition-all duration-300 text-base shadow-md hover:shadow-lg transform hover:scale-105">
                             {getPlatformIcon('Facebook')} <span className="ml-2">Our Facebook</span>
                        </a>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default SocialFeedMockup;