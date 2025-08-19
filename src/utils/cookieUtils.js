// Cookie categories and their purposes
export const COOKIE_CATEGORIES = {
  ESSENTIAL: 'essential',
  ANALYTICS: 'analytics', 
  MARKETING: 'marketing',
  PREFERENCES: 'preferences'
};

export const COOKIE_DESCRIPTIONS = {
  [COOKIE_CATEGORIES.ESSENTIAL]: {
    name: 'Essential Cookies',
    description: 'These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.',
    required: true,
    examples: ['Authentication tokens', 'Session management', 'Security cookies']
  },
  [COOKIE_CATEGORIES.ANALYTICS]: {
    name: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
    required: false,
    examples: ['Google Analytics', 'Page views', 'User behavior tracking']
  },
  [COOKIE_CATEGORIES.MARKETING]: {
    name: 'Marketing Cookies',
    description: 'These cookies are used to track visitors across websites to display relevant advertisements and marketing content.',
    required: false,
    examples: ['Ad targeting', 'Social media tracking', 'Conversion tracking']
  },
  [COOKIE_CATEGORIES.PREFERENCES]: {
    name: 'Preference Cookies',
    description: 'These cookies remember your choices and preferences to provide a more personalized experience.',
    required: false,
    examples: ['Language settings', 'Theme preferences', 'Region selection']
  }
};

// Cookie consent storage key
const CONSENT_STORAGE_KEY = 'edwind_cookie_consent';
const CONSENT_VERSION = '1.0';

// Get cookie consent from localStorage
export const getCookieConsent = () => {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;
    
    const consent = JSON.parse(stored);
    
    // Check if consent is still valid (version check)
    if (consent.version !== CONSENT_VERSION) {
      return null;
    }
    
    // Check if consent is expired (valid for 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (Date.now() - consent.timestamp > oneYear) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }
    
    return consent;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return null;
  }
};

// Save cookie consent to localStorage
export const saveCookieConsent = (preferences) => {
  try {
    const consent = {
      preferences,
      timestamp: Date.now(),
      version: CONSENT_VERSION
    };
    
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
    return true;
  } catch (error) {
    console.error('Error saving cookie consent:', error);
    return false;
  }
};

// Clear cookie consent
export const clearCookieConsent = () => {
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing cookie consent:', error);
    return false;
  }
};

// Get default consent (essential only)
export const getDefaultConsent = () => ({
  [COOKIE_CATEGORIES.ESSENTIAL]: true,
  [COOKIE_CATEGORIES.ANALYTICS]: false,
  [COOKIE_CATEGORIES.MARKETING]: false,
  [COOKIE_CATEGORIES.PREFERENCES]: false
});

// Get all accepted consent
export const getAllAcceptedConsent = () => ({
  [COOKIE_CATEGORIES.ESSENTIAL]: true,
  [COOKIE_CATEGORIES.ANALYTICS]: true,
  [COOKIE_CATEGORIES.MARKETING]: true,
  [COOKIE_CATEGORIES.PREFERENCES]: true
});

// Cookie utility functions
export const setCookie = (name, value, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getCookie = (name) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Clean non-essential cookies based on consent
export const cleanNonEssentialCookies = (consent) => {
  // List of known non-essential cookies to clean
  const cookiesToClean = {
    [COOKIE_CATEGORIES.ANALYTICS]: ['_ga', '_ga_*', '_gid', '_gat', '_gtag'],
    [COOKIE_CATEGORIES.MARKETING]: ['_fbp', '_fbc', '__utma', '__utmb', '__utmc', '__utmz'],
    [COOKIE_CATEGORIES.PREFERENCES]: ['theme', 'language', 'region']
  };
  
  Object.keys(cookiesToClean).forEach(category => {
    if (!consent[category]) {
      cookiesToClean[category].forEach(cookieName => {
        if (cookieName.includes('*')) {
          // Handle wildcard cookies
          const prefix = cookieName.replace('*', '');
          const cookies = document.cookie.split(';');
          cookies.forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            if (name.startsWith(prefix)) {
              deleteCookie(name);
            }
          });
        } else {
          deleteCookie(cookieName);
        }
      });
    }
  });
};