export const translations: Record<string, Record<string, string>> = {
  en: {
    home: 'Home',
    models: 'Models',
    services: 'Services',
    dealers: 'Dealers',
    contact: 'Contact',
    about: 'About',
    news: 'News',
    parts: 'Parts',
    financing: 'Financing',
    testDrive: 'Test Drive',
    quote: 'Get Quote',
    compare: 'Compare',
    configurator: 'Configurator',
    login: 'Login',
    register: 'Register',
    search: 'Search',
    readMore: 'Read More',
    viewAll: 'View All',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
   页: 'Page',
  },
  am: {
    home: 'መነሻ',
    models: 'ሞደሎች',
    services: 'አገልግሎቶች',
    dealers: 'መሸጫ ቦታዎች',
    contact: 'ያግኙን',
    about: 'ስለ እኛ',
    news: 'ዜና',
    parts: 'ምክንያቶች',
    financing: 'ፋይናንስ',
    testDrive: 'ፀ.setHeight试验区',
    quote: 'ዋጋ ያግኙ',
    compare: ' JsonRequest comparisons',
    configurator: ' cấu hình',
    login: 'ግባ',
    register: 'ተመዝግብ',
    search: 'ፈልግ',
    readMore: 'ተጨማሪ ያንብቡ',
    viewAll: 'ሁሉንም ይመልከቱ',
    loading: 'በመጫን ላይ...',
    error: 'ስህተት',
    success: 'ተሳክቷል',
    submit: 'ያስገቡ',
    cancel: 'ሰርዝ',
    save: 'አስቀምጥ',
    delete: 'ሰርዝ',
    edit: 'አስተካክል',
    close: 'ዝጋ',
    back: 'ተመለስ',
    next: 'ቀጥል',
    previous: 'ቀዳሚ',
    page: 'ገጹ',
  },
};

export type Locale = 'en' | 'am';
export type Language = Locale;

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, locale?: Locale): string {
  const lang = locale || currentLocale;
  return translations[lang]?.[key] || translations.en[key] || key;
}

export function useTranslation() {
  return {
    t,
    locale: currentLocale,
    language: currentLocale,
    setLocale,
  };
}

export function useLanguage(selector?: (state: { locale: Locale; setLocale: (locale: Locale) => void; language: Locale; setLanguage: (lang: Locale) => void }) => any) {
  const state = {
    locale: currentLocale,
    language: currentLocale,
    setLocale,
    setLanguage: (lang: Locale) => { currentLocale = lang; },
    t,
  };
  return selector ? selector(state) : state;
}
