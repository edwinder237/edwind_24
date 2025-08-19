import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCookieConsent,
  saveCookieConsent,
  clearCookieConsent,
  getDefaultConsent,
  getAllAcceptedConsent,
  cleanNonEssentialCookies,
  COOKIE_CATEGORIES,
  COOKIE_DESCRIPTIONS
} from 'utils/cookieUtils';

const CookieConsentContext = createContext();

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

export const CookieConsentProvider = ({ children }) => {
  const [consent, setConsent] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize consent on mount
  useEffect(() => {
    const initializeConsent = () => {
      const savedConsent = getCookieConsent();
      
      if (savedConsent) {
        setConsent(savedConsent.preferences);
        setShowBanner(false);
      } else {
        // No consent found, show banner
        setConsent(getDefaultConsent());
        setShowBanner(true);
      }
      
      setIsLoading(false);
    };

    initializeConsent();
  }, []);

  // Accept all cookies
  const acceptAllCookies = () => {
    const allAccepted = getAllAcceptedConsent();
    setConsent(allAccepted);
    saveCookieConsent(allAccepted);
    setShowBanner(false);
    
    // Trigger analytics/marketing scripts if enabled
    triggerConsentCallbacks(allAccepted);
  };

  // Accept only essential cookies
  const acceptEssentialOnly = () => {
    const essentialOnly = getDefaultConsent();
    setConsent(essentialOnly);
    saveCookieConsent(essentialOnly);
    setShowBanner(false);
    
    // Clean non-essential cookies
    cleanNonEssentialCookies(essentialOnly);
  };

  // Save custom preferences
  const savePreferences = (preferences) => {
    setConsent(preferences);
    saveCookieConsent(preferences);
    setShowBanner(false);
    setShowPreferences(false);
    
    // Clean non-essential cookies based on preferences
    cleanNonEssentialCookies(preferences);
    
    // Trigger consent callbacks
    triggerConsentCallbacks(preferences);
  };

  // Reset consent (for testing or user request)
  const resetConsent = () => {
    clearCookieConsent();
    const defaultConsent = getDefaultConsent();
    setConsent(defaultConsent);
    setShowBanner(true);
    
    // Clean all non-essential cookies
    cleanNonEssentialCookies(defaultConsent);
  };

  // Update specific category consent
  const updateCategoryConsent = (category, enabled) => {
    if (category === COOKIE_CATEGORIES.ESSENTIAL) {
      // Essential cookies cannot be disabled
      return;
    }

    const newConsent = {
      ...consent,
      [category]: enabled
    };

    setConsent(newConsent);
    saveCookieConsent(newConsent);
    
    if (!enabled) {
      // Clean cookies for disabled category
      cleanNonEssentialCookies({ [category]: false });
    }
    
    triggerConsentCallbacks(newConsent);
  };

  // Check if specific category is consented
  const hasConsent = (category) => {
    return consent ? consent[category] : false;
  };

  // Show preferences modal
  const openPreferences = () => {
    setShowPreferences(true);
  };

  // Close preferences modal
  const closePreferences = () => {
    setShowPreferences(false);
  };

  // Trigger callbacks for external scripts (analytics, marketing)
  const triggerConsentCallbacks = (consentPreferences) => {
    // Analytics consent
    if (consentPreferences[COOKIE_CATEGORIES.ANALYTICS]) {
      // Enable Google Analytics or other analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted'
        });
      }
    }

    // Marketing consent  
    if (consentPreferences[COOKIE_CATEGORIES.MARKETING]) {
      // Enable marketing scripts
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted'
        });
      }
    }

    // Dispatch custom event for other integrations
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', {
        detail: { consent: consentPreferences }
      }));
    }
  };

  const value = {
    consent,
    showBanner,
    showPreferences,
    isLoading,
    acceptAllCookies,
    acceptEssentialOnly,
    savePreferences,
    resetConsent,
    updateCategoryConsent,
    hasConsent,
    openPreferences,
    closePreferences,
    cookieCategories: COOKIE_CATEGORIES,
    cookieDescriptions: COOKIE_DESCRIPTIONS
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export default CookieConsentContext;