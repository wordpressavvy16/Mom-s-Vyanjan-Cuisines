import React from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const AboutUsPage: React.FC = () => {
  const { siteSettings } = useSiteSettings();
  const { name, aboutUs, logoUrl } = siteSettings.businessInfo;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-light-text dark:text-dark-text">
      <header className="text-center mb-12">
        {logoUrl && <img src={logoUrl} alt={`${name} logo`} className="w-24 h-24 mx-auto rounded-lg mb-4 shadow-md" />}
        <h1 className="text-4xl sm:text-5xl font-bold font-display text-secondary dark:text-accent">About {name}</h1>
      </header>
      
      <div className="space-y-8 leading-relaxed text-lg bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-lg shadow-xl">
        <section>
          <h2 className="text-2xl sm:text-3xl font-semibold font-display mb-4">Our Story</h2>
          <p className="mb-4">{aboutUs}</p>
          <p>We believe that food is more than just sustenance; it's a connection to our roots, a source of comfort, and a way to show love. Our journey began with a simple idea: to provide delicious, wholesome, and authentic home-style meals for those who miss the taste of their mother's cooking. In today's fast-paced world, we offer a convenient solution without compromising on quality, taste, or health.</p>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-semibold font-display mb-4">Our Mission</h2>
          <p>Our mission is to deliver happiness to your doorstep, one tiffin at a time. We are dedicated to:</p>
          <ul className="list-disc list-inside space-y-2 mt-4 pl-4">
            <li><strong>Authenticity:</strong> Using traditional recipes and cooking methods to bring you the genuine taste of home.</li>
            <li><strong>Quality:</strong> Sourcing the freshest local ingredients and maintaining the highest standards of hygiene.</li>
            <li><strong>Convenience:</strong> Making it easy for you to enjoy a nutritious, home-cooked meal every day.</li>
            <li><strong>Community:</strong> Building a family of happy customers who trust us with their daily meals.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AboutUsPage;
