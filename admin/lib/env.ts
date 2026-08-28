// Environment configuration utility for Geely Ethiopia Platform

// No hardcoded domain fallback here on purpose: this value feeds customer-
// facing links (e.g. the quotation sign link), and a hardcoded default
// silently pointing at the wrong environment is exactly the bug this guards
// against. Every environment (.env, .env.production, and the real
// deployment's own .env) must set NEXT_PUBLIC_SITE_URL explicitly.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  // Application Settings
  app: {
    url: requireEnv('NEXT_PUBLIC_SITE_URL'),
    env: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
  },

  // API & CMS
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337',
    strapi: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337',
    token: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN,
  },

  // Database
  database: {
    url: process.env.DATABASE_URL,
    strapi: {
      client: process.env.STRAPI_DATABASE_CLIENT || 'postgres',
      host: process.env.STRAPI_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.STRAPI_DATABASE_PORT || '5432'),
      name: process.env.STRAPI_DATABASE_NAME || 'geely_ethiopia_strapi',
      username: process.env.STRAPI_DATABASE_USERNAME || 'postgres',
      password: process.env.STRAPI_DATABASE_PASSWORD || 'password',
    }
  },

  // Company Information
  company: {
    name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Geely Ethiopia',
    legal: process.env.NEXT_PUBLIC_COMPANY_LEGAL || 'Kerchanshe Auto PLC',
    taxId: process.env.NEXT_PUBLIC_TAX_ID || 'ET-123456789',
    currency: process.env.NEXT_PUBLIC_CURRENCY || 'ETB',
    currencySymbol: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'ETB',
    locale: process.env.NEXT_PUBLIC_LOCALE || 'en-ET',
  },

  // Contact Information
  contact: {
    phone: {
      main: process.env.NEXT_PUBLIC_PHONE_MAIN || '+251-11-000-0000',
      sales: process.env.NEXT_PUBLIC_PHONE_SALES || '+251-11-111-1111',
      service: process.env.NEXT_PUBLIC_PHONE_SERVICE || '+251-11-222-2222',
    },
    email: {
      main: process.env.NEXT_PUBLIC_EMAIL_MAIN || 'info@geelyethiopia.com',
      sales: process.env.NEXT_PUBLIC_EMAIL_SALES || 'sales@geelyethiopia.com',
      service: process.env.NEXT_PUBLIC_EMAIL_SERVICE || 'service@geelyethiopia.com',
    },
    address: {
      hq: process.env.NEXT_PUBLIC_HQ_ADDRESS || 'Sarbet, Addis Ababa, Ethiopia',
      coordinates: {
        lat: parseFloat(process.env.NEXT_PUBLIC_HQ_LAT || '9.0192'),
        lng: parseFloat(process.env.NEXT_PUBLIC_HQ_LNG || '38.7525'),
      }
    }
  },

  // Social Media
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/geelyethiopia',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/geelyethiopia',
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/geelyethiopia',
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com/@geelyethiopia',
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/company/geely-ethiopia',
  },

  // Banking Partners
  banks: {
    cbe: {
      name: process.env.NEXT_PUBLIC_BANK_CBE_NAME || 'Commercial Bank of Ethiopia',
      rate: parseFloat(process.env.NEXT_PUBLIC_BANK_CBE_RATE || '12.5'),
    },
    awash: {
      name: process.env.NEXT_PUBLIC_BANK_AWASH_NAME || 'Awash Bank',
      rate: parseFloat(process.env.NEXT_PUBLIC_BANK_AWASH_RATE || '13.2'),
    },
    dashen: {
      name: process.env.NEXT_PUBLIC_BANK_DASHEN_NAME || 'Dashen Bank',
      rate: parseFloat(process.env.NEXT_PUBLIC_BANK_DASHEN_RATE || '13.8'),
    },
    united: {
      name: process.env.NEXT_PUBLIC_BANK_UNITED_NAME || 'United Bank',
      rate: parseFloat(process.env.NEXT_PUBLIC_BANK_UNITED_RATE || '14.1'),
    },
    abyssinia: {
      name: process.env.NEXT_PUBLIC_BANK_ABYSSINIA_NAME || 'Bank of Abyssinia',
      rate: parseFloat(process.env.NEXT_PUBLIC_BANK_ABYSSINIA_RATE || '13.5'),
    }
  },

  // Vehicle Settings
  vehicles: {
    apiEndpoint: process.env.NEXT_PUBLIC_MODELS_API_ENDPOINT || '/api/vehicles',
    enableCompare: process.env.NEXT_PUBLIC_ENABLE_VEHICLE_COMPARE === 'true',
    maxCompareItems: parseInt(process.env.NEXT_PUBLIC_MAX_COMPARE_ITEMS || '3'),
    enableVirtualTour: process.env.NEXT_PUBLIC_ENABLE_VIRTUAL_TOUR === 'true',
  },

  // Financing Settings
  financing: {
    minLoanAmount: parseInt(process.env.NEXT_PUBLIC_MIN_LOAN_AMOUNT || '500000'),
    maxLoanAmount: parseInt(process.env.NEXT_PUBLIC_MAX_LOAN_AMOUNT || '10000000'),
    minDownPaymentPercent: parseInt(process.env.NEXT_PUBLIC_MIN_DOWN_PAYMENT_PERCENT || '20'),
    maxLoanTermMonths: parseInt(process.env.NEXT_PUBLIC_MAX_LOAN_TERM_MONTHS || '84'),
    defaultInterestRate: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_INTEREST_RATE || '13.5'),
  },

  // Feature Flags
  features: {
    testDrive: process.env.NEXT_PUBLIC_ENABLE_TEST_DRIVE === 'true',
    onlineBooking: process.env.NEXT_PUBLIC_ENABLE_ONLINE_BOOKING === 'true',
    chatSupport: process.env.NEXT_PUBLIC_ENABLE_CHAT_SUPPORT === 'true',
    newsletter: process.env.NEXT_PUBLIC_ENABLE_NEWSLETTER === 'true',
    partsOrder: process.env.NEXT_PUBLIC_ENABLE_PARTS_ORDER === 'true',
    serviceBooking: process.env.NEXT_PUBLIC_ENABLE_SERVICE_BOOKING === 'true',
  },

  // External Services
  external: {
    googleMaps: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    googleAnalytics: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    whatsapp: {
      token: process.env.WHATSAPP_TOKEN,
      phoneId: process.env.WHATSAPP_PHONE_ID,
    },
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM,
      fromName: process.env.SMTP_FROM_NAME || 'Geely Ethiopia',
      enabled: process.env.SMTP_ENABLED === 'true',
    }
  },

  // Strapi CMS Endpoints
  strapi: {
    vehicles: process.env.NEXT_PUBLIC_STRAPI_VEHICLES_ENDPOINT || '/api/vehicles',
    news: process.env.NEXT_PUBLIC_STRAPI_NEWS_ENDPOINT || '/api/news-articles',
    testimonials: process.env.NEXT_PUBLIC_STRAPI_TESTIMONIALS_ENDPOINT || '/api/testimonials',
    dealers: process.env.NEXT_PUBLIC_STRAPI_DEALERS_ENDPOINT || '/api/dealers',
    promotions: process.env.NEXT_PUBLIC_STRAPI_PROMOTIONS_ENDPOINT || '/api/promotions',
    parts: process.env.NEXT_PUBLIC_STRAPI_PARTS_ENDPOINT || '/api/spare-parts',
  },

  // Development & Analytics
  analytics: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    hotjar: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_HOTJAR === 'true',
      id: process.env.NEXT_PUBLIC_HOTJAR_ID,
    }
  },

  // Security
  security: {
    csp: process.env.NEXT_PUBLIC_ENABLE_CSP === 'true',
    rateLimiting: process.env.NEXT_PUBLIC_ENABLE_RATE_LIMITING === 'true',
    rateLimit: {
      max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
    }
  },

  // Development Tools
  dev: {
    devtools: process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS === 'true',
    logging: process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
  }
};

// Export specific configurations for easy access
export const strapiConfig = {
  url: env.api.strapi,
  token: env.api.token,
  endpoints: env.strapi,
};

export const bankingConfig = env.banks;
export const companyConfig = env.company;
export const contactConfig = env.contact;
export const socialConfig = env.social;
export const featureFlags = env.features;