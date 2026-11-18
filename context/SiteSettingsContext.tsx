import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { getSiteSettings, saveSiteSettings } from '../services/configService';
import { SiteSettings } from '../types';

interface SiteSettingsContextType {
  siteSettings: SiteSettings;
  updateSiteSettings: (newSettings: SiteSettings) => void;
  updateCurrency: (code: string, symbol: string) => void;
  // Convenience accessors
  currencySymbol: string;
  currencyCode: string;
  businessName: string;
  businessLogoUrl: string;
  loading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadedSettings = getSiteSettings();
    setSiteSettings(loadedSettings);
    setLoading(false);
  }, []);

  const updateSiteSettings = (newSettings: SiteSettings) => {
    saveSiteSettings(newSettings);
    setSiteSettings(newSettings);
    alert("Site settings updated successfully!");
  };

  const updateCurrency = (code: string, symbol: string) => {
    if (siteSettings) {
      const newSettings = {
        ...siteSettings,
        currency: { code, symbol }
      };
      updateSiteSettings(newSettings);
    }
  };

  if (loading || !siteSettings) {
      // Render a blank screen or a minimal loader, as the whole app depends on this.
      return <div className="fixed inset-0 bg-background z-[9999]"></div>;
  }

  return (
    <SiteSettingsContext.Provider value={{ 
        siteSettings,
        updateSiteSettings,
        updateCurrency,
        currencySymbol: siteSettings.currency.symbol, 
        currencyCode: siteSettings.currency.code, 
        businessName: siteSettings.businessInfo.name,
        businessLogoUrl: siteSettings.businessInfo.logoUrl,
        loading
    }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = (): SiteSettingsContextType => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};