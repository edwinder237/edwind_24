import React from 'react';
import { CookieConsentProvider } from 'contexts/CookieConsentContext';
import CookieConsentBanner from './CookieConsentBanner';
import CookiePreferencesModal from './CookiePreferencesModal';

// Main Cookie Consent Component
const CookieConsent = ({ children }) => {
  return (
    <CookieConsentProvider>
      {children}
      <CookieConsentBanner />
      <CookiePreferencesModal />
    </CookieConsentProvider>
  );
};

// Export individual components for flexibility
export { default as CookieConsentBanner } from './CookieConsentBanner';
export { default as CookiePreferencesModal } from './CookiePreferencesModal';
export { CookieConsentProvider, useCookieConsent } from 'contexts/CookieConsentContext';

export default CookieConsent;