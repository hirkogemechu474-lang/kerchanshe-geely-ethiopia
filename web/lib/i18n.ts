import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useEffect } from 'react';

export type Language = 'en' | 'am';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'geely-language',
      skipHydration: true,
    }
  )
);

// Translation type
export interface Translations {
  [key: string]: string | Translations;
}

// English translations
export const en: Translations = {
  common: {
    home: 'Home',
    models: 'Models',
    electric: 'Electric',
    compare: 'Compare',
    offers: 'Offers',
    dealers: 'Dealers',
    financing: 'Financing',
    news: 'News',
    about: 'About',
    contact: 'Contact',
    getQuote: 'Get Quote',
    bookTestDrive: 'Book Test Drive',
    learnMore: 'Learn More',
    viewDetails: 'View Details',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  
  header: {
    aKerchansheCompany: 'A Kerchanshe Group Company',
    customerService: 'Customer Service',
    language: 'Language',
  },
  
  home: {
    hero: {
      title: 'Welcome to Geely Ethiopia',
      subtitle: 'Bringing global automotive excellence to Ethiopia through the trusted partnership of Zhejiang Geely Holding Group and Kerchanshe Group.',
      exploreVehicles: 'Explore Vehicles',
    },
    spotlight: {
      title: 'Explore Every Angle',
      subtitle: 'Experience our vehicles like never before with our interactive 360° viewer.',
    },
    featured: {
      title: 'Featured Models',
      subtitle: 'Discover our range of vehicles designed for Ethiopian roads and lifestyle.',
    },
  },
  
  models: {
    title: 'Our Models',
    subtitle: 'Explore the complete Geely vehicle range',
    allCategories: 'All Categories',
    suv: 'SUV',
    sedan: 'Sedan',
    hatchback: 'Hatchback',
    electric: 'Electric',
    from: 'From',
    specifications: 'Specifications',
    features: 'Features',
    colors: 'Colors',
    compare: 'Compare',
    configure: 'Configure',
  },
  
  compare: {
    title: 'Compare Models',
    subtitle: 'Compare up to 3 Geely vehicles to find the perfect match for your needs',
    selectVehicles: 'Select vehicles to compare',
    highlightDifferences: 'Highlight Differences',
    clearAll: 'Clear All',
    performance: 'Performance & Powertrain',
    fuelEfficiency: 'Fuel & Efficiency',
    capacity: 'Capacity & Dimensions',
    warranty: 'Warranty & Support',
    category: 'Category',
    startingPrice: 'Starting Price',
    engine: 'Engine',
    power: 'Power Output',
    transmission: 'Transmission',
    drivetrain: 'Drivetrain',
    fuelType: 'Fuel Type',
    fuelEconomy: 'Fuel Economy / Range',
    seating: 'Seating Capacity',
    warrantyCoverage: 'Warranty Coverage',
  },
  
  configurator: {
    title: 'Configure Your Geely',
    subtitle: 'Customize your vehicle with your preferred trim, color, and wheels',
    step1: 'Select Model',
    step2: 'Choose Trim Level',
    step3: 'Select Exterior Color',
    step4: 'Choose Wheels',
    yourConfiguration: 'Your Configuration',
    basePrice: 'Base Price',
    trimPackage: 'Trim Package',
    premiumColor: 'Premium Color',
    upgradedWheels: 'Upgraded Wheels',
    totalPrice: 'Total Price',
    sendConfiguration: 'Send My Configuration',
    shareConfiguration: 'Share Configuration',
    downloadBrochure: 'Download Brochure',
    estimatedMonthly: 'Estimated Monthly Payment',
    financingDisclaimer: 'Based on 20% down, 5 years @ 13% APR',
    calculateFullFinancing: 'Calculate Full Financing',
  },
  
  dealers: {
    title: 'Dealers & Service Centers',
    subtitle: 'Visit our showrooms to explore Geely vehicles, book a test drive, or service your vehicle',
    findUs: 'Find Us Nationwide',
    searchPlaceholder: 'Search by name, address, or city...',
    allCities: 'All Cities',
    allTypes: 'All Types',
    showroomsOnly: 'Showrooms Only',
    serviceCentersOnly: 'Service Centers Only',
    fullService: 'Full Service',
    showing: 'Showing',
    of: 'of',
    locations: 'locations',
    noLocations: 'No locations found',
    adjustFilters: 'Try adjusting your search filters to find what you are looking for',
    services: 'Services',
    getDirections: 'Get Directions',
    hours: 'Hours',
    phone: 'Phone',
    email: 'Email',
  },
  
  financing: {
    title: 'Vehicle Financing',
    subtitle: 'Calculate your monthly payments and explore financing options',
    flexibleOptions: 'Flexible Payment Options',
    howItWorks: 'How Vehicle Financing Works',
    calculate: 'Calculate',
    apply: 'Apply',
    approval: 'Approval',
    driveAway: 'Drive Away',
    calculatePayment: 'Calculate Your Monthly Payment',
    selectVehicle: 'Select a Vehicle',
    ourBankingPartners: 'Our Banking Partners',
    interestRate: 'Interest Rate',
    loanTerm: 'Loan Term',
    minDownPayment: 'Min. Down Payment',
    requiredDocuments: 'Required Documents',
    benefits: 'Financing Benefits',
    competitiveRates: 'Competitive Rates',
    flexibleTerms: 'Flexible Terms',
    fastApproval: 'Fast Approval',
    expertGuidance: 'Expert Guidance',
  },
  
  testDrive: {
    title: 'Book a Test Drive',
    subtitle: 'Experience the vehicle firsthand at your nearest showroom',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    selectVehicle: 'Select Vehicle',
    preferredDate: 'Preferred Date',
    preferredTime: 'Preferred Time',
    location: 'Showroom Location',
    message: 'Additional Message',
    consent: 'I agree to be contacted by Geely Ethiopia regarding my test drive booking',
    submitting: 'Submitting to Zoho CRM...',
    bookNow: 'Book Test Drive',
    successTitle: 'Test Drive Booked Successfully!',
    successMessage: 'Thank you for booking a test drive with Geely Ethiopia. Our team will contact you within 24 hours.',
  },
  
  quote: {
    title: 'Request a Quote',
    subtitle: 'Get a detailed price quotation for your preferred vehicle',
    purchaseTimeframe: 'When do you plan to purchase?',
    financingNeeded: 'Do you need financing?',
    tradeIn: 'Do you have a vehicle to trade in?',
    tradeInDetails: 'Trade-in Vehicle Details',
    requestQuote: 'Request Quote',
    quoteDisclaimer: 'Your quote will be sent within 24-48 hours',
  },
  
  footer: {
    vehicles: 'Vehicles',
    services: 'Services',
    company: 'Company',
    support: 'Support',
    stayConnected: 'Stay Connected',
    newsletter: 'Get the latest updates on new models, offers, and Geely news',
    emailPlaceholder: 'Enter your email address',
    subscribe: 'Subscribe',
    followUs: 'Follow us',
    copyright: 'Geely Ethiopia - Kerchanshe Group. All rights reserved.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    cookiePolicy: 'Cookie Policy',
  },
};

// Amharic translations
export const am: Translations = {
  common: {
    home: 'ቤት',
    models: 'ሞዴሎች',
    electric: 'ኤሌክትሪክ',
    compare: 'አወዳድር',
    offers: 'ቅናሾች',
    dealers: 'ወኪሎች',
    financing: 'የገንዘብ ድጋፍ',
    news: 'ዜናዎች',
    about: 'ስለ እኛ',
    contact: 'አግኙን',
    getQuote: 'ዋጋ ጠይቅ',
    bookTestDrive: 'ሙከራ እንዲነዱ ያስይዙ',
    learnMore: 'የበለጠ ይወቁ',
    viewDetails: 'ዝርዝር ይመልከቱ',
    close: 'ዝጋ',
    search: 'ፈልግ',
    filter: 'አጣራ',
    clear: 'አጽዳ',
    submit: 'ላክ',
    cancel: 'ሰርዝ',
    save: 'አስቀምጥ',
    edit: 'አርትዕ',
    delete: 'ሰርዝ',
    yes: 'አዎ',
    no: 'አይ',
    loading: 'በመጫን ላይ...',
    error: 'ስህተት',
    success: 'ተሳክቷል',
  },
  
  header: {
    aKerchansheCompany: 'የከርችንሼ ግሩፕ ድርጅት',
    customerService: 'የደንበኞች አገልግሎት',
    language: 'ቋንቋ',
  },
  
  home: {
    hero: {
      title: 'እንኳን ወደ ጂሊ ኢትዮጵያ በደህና መጡ',
      subtitle: 'የዘንግዣንግ ጂሊ ሆልዲንግ ግሩፕ እና የከርችንሼ ግሩፕ አማኝነት በተሞላ አብሮ-አሰራር በኩል ዓለምአቀፍ የአውቶሞቲቭ ልቅንነትን ወደ ኢትዮጵያ በማምጣት ላይ።',
      exploreVehicles: 'ተሽከርካሪዎችን ይመልከቱ',
    },
    spotlight: {
      title: 'ሁሉንም ማዕዘኖች ይመልከቱ',
      subtitle: 'ተሽከርካሪዎቻችንን በ360° የመመልከቻ መሣሪያችን በመጠቀም እንደ ታሪክ አይመስል ይሞክሩ።',
    },
    featured: {
      title: 'የተመረጡ ሞዴሎች',
      subtitle: 'ለኢትዮጵያ መንገዶች እና የአኗኗር ዘይቤ የተነደፉ የተሽከርካሪ ክልላችንን ይወቁ።',
    },
  },
  
  models: {
    title: 'የእኛ ሞዴሎች',
    subtitle: 'ሙሉውን የጂሊ ተሽከርካሪ ክልል ይመልከቱ',
    allCategories: 'ሁሉም ምድቦች',
    suv: 'ኤስዩቪ',
    sedan: 'ሴዳን',
    hatchback: 'ሃችባክ',
    electric: 'ኤሌክትሪክ',
    from: 'ከ',
    specifications: 'ዝርዝሮች',
    features: 'ባህሪያት',
    colors: 'ቀለሞች',
    compare: 'አወዳድር',
    configure: 'አዘጋጅ',
  },
  
  compare: {
    title: 'ሞዴሎችን አወዳድር',
    subtitle: 'ለፍላጎትዎ ተስማሚ የሆነውን ለማግኘት እስከ 3 ጂሊ ተሽከርካሪዎችን ያወዳድሩ',
    selectVehicles: 'ለማወዳደር ተሽከርካሪዎችን ይምረጡ',
    highlightDifferences: 'ልዩነቶችን አጉላ',
    clearAll: 'ሁሉንም አጽዳ',
    performance: 'አፈጻጸም እና ኃይል ስርዓት',
    fuelEfficiency: 'ነዳጅ እና ቅልጥፍና',
    capacity: 'አቅም እና ልኬቶች',
    warranty: 'ዋስትና እና ድጋፍ',
    category: 'ምድብ',
    startingPrice: 'የመጀመሪያ ዋጋ',
    engine: 'ሞተር',
    power: 'የኃይል ውጤት',
    transmission: 'ማስተላለፊያ',
    drivetrain: 'የመንዳት ስርዓት',
    fuelType: 'የነዳጅ አይነት',
    fuelEconomy: 'የነዳጅ ቁጠባ / ርቀት',
    seating: 'የመቀመጫ አቅም',
    warrantyCoverage: 'የዋስትና ሽፋን',
  },
  
  configurator: {
    title: 'ጂሊዎን ያዋቅሩ',
    subtitle: 'ተሽከርካሪዎን በሚመርጡት ትሪም፣ ቀለም እና ጎማዎች ያበጁ',
    step1: 'ሞዴል ይምረጡ',
    step2: 'የትሪም ደረጃ ይምረጡ',
    step3: 'የውጭ ቀለም ይምረጡ',
    step4: 'ጎማዎችን ይምረጡ',
    yourConfiguration: 'የእርስዎ ውቅረት',
    basePrice: 'መሰረታዊ ዋጋ',
    trimPackage: 'የትሪም ፓኬጅ',
    premiumColor: 'ፕሪሚየም ቀለም',
    upgradedWheels: 'የተሻሻሉ ጎማዎች',
    totalPrice: 'ጠቅላላ ዋጋ',
    sendConfiguration: 'ውቅረቴን ላክ',
    shareConfiguration: 'ውቅረት አጋራ',
    downloadBrochure: 'ብሮሹር አውርድ',
    estimatedMonthly: 'የሚገመተው ወርሃዊ ክፍያ',
    financingDisclaimer: 'በ20% መጀመሪያ፣ 5 ዓመታት @ 13% APR ላይ የተመሰረተ',
    calculateFullFinancing: 'ሙሉ የገንዘብ ድጋፍ አስላ',
  },
  
  dealers: {
    title: 'ወኪሎች እና የአገልግሎት ማእከላት',
    subtitle: 'የጂሊ ተሽከርካሪዎችን ለማየት፣ የሙከራ መንዳት ለማስይዝ ወይም ተሽከርካሪዎን ለማስተካከል ወደ ማሳያ ክፍሎቻችን ይምጡ',
    findUs: 'በሀገር አቀፍ ደረጃ አግኙን',
    searchPlaceholder: 'በስም፣ አድራሻ ወይም ከተማ ይፈልጉ...',
    allCities: 'ሁሉም ከተሞች',
    allTypes: 'ሁሉም አይነቶች',
    showroomsOnly: 'ማሳያ ክፍሎች ብቻ',
    serviceCentersOnly: 'የአገልግሎት ማእከላት ብቻ',
    fullService: 'ሙሉ አገልግሎት',
    showing: 'በማሳየት ላይ',
    of: 'ከ',
    locations: 'ቦታዎች',
    noLocations: 'ምንም ቦታዎች አልተገኙም',
    adjustFilters: 'እየፈለጉትን ለማግኘት የፍለጋ ማጣሪያዎችዎን ማስተካከል ይሞክሩ',
    services: 'አገልግሎቶች',
    getDirections: 'አቅጣጫዎችን ያግኙ',
    hours: 'ሰዓቶች',
    phone: 'ስልክ',
    email: 'ኢሜይል',
  },
  
  financing: {
    title: 'የተሽከርካሪ የገንዘብ ድጋፍ',
    subtitle: 'ወርሃዊ ክፍያዎችዎን አስሉ እና የገንዘብ ድጋፍ አማራጮችን ይመልከቱ',
    flexibleOptions: 'ተለዋዋጭ የክፍያ አማራጮች',
    howItWorks: 'የተሽከርካሪ የገንዘብ ድጋፍ እንዴት ይሠራል',
    calculate: 'አስላ',
    apply: 'ተግብር',
    approval: 'ፈቃድ',
    driveAway: 'ነዱና ይጓዙ',
    calculatePayment: 'ወርሃዊ ክፍያዎን አስሉ',
    selectVehicle: 'ተሽከርካሪ ይምረጡ',
    ourBankingPartners: 'የባንክ አጋሮቻችን',
    interestRate: 'የወለድ መጠን',
    loanTerm: 'የብድር ጊዜ',
    minDownPayment: 'ዝቅተኛ የመጀመሪያ ክፍያ',
    requiredDocuments: 'የሚያስፈልጉ ሰነዶች',
    benefits: 'የገንዘብ ድጋፍ ጥቅሞች',
    competitiveRates: 'ተወዳዳሪ ተመኖች',
    flexibleTerms: 'ተለዋዋጭ ውሎች',
    fastApproval: 'ፈጣን ማጽደቅ',
    expertGuidance: 'ባለሙያ መመሪያ',
  },
  
  testDrive: {
    title: 'የሙከራ መንዳት ያስይዙ',
    subtitle: 'በአቅራቢያዎ ባለው ማሳያ ክፍል ተሽከርካሪውን በቀጥታ ይለማመዱ',
    firstName: 'ስም',
    lastName: 'የአባት ስም',
    email: 'የኢሜይል አድራሻ',
    phone: 'ስልክ ቁጥር',
    selectVehicle: 'ተሽከርካሪ ይምረጡ',
    preferredDate: 'የምርጫ ቀን',
    preferredTime: 'የምርጫ ሰዓት',
    location: 'የማሳያ ክፍል ቦታ',
    message: 'ተጨማሪ መልዕክት',
    consent: 'የሙከራ መንዳት ቦታ ስለያዝሁ ጂሊ ኢትዮጵያ እንዲያነጋግረኝ እስማማለሁ',
    submitting: 'ወደ Zoho CRM በመላክ ላይ...',
    bookNow: 'የሙከራ መንዳት ያስይዙ',
    successTitle: 'የሙከራ መንዳት በተሳካ ሁኔታ ተይዟል!',
    successMessage: 'ከጂሊ ኢትዮጵያ ጋር የሙከራ መንዳት ስላስያዙ እናመሰግናለን። ቡድናችን በ24 ሰዓታት ውስጥ ያነጋግርዎታል።',
  },
  
  quote: {
    title: 'ዋጋ ጠይቅ',
    subtitle: 'ለምርጫዎ ተሽከርካሪ ዝርዝር የዋጋ ግምት ያግኙ',
    purchaseTimeframe: 'መቼ መግዛት ያስባሉ?',
    financingNeeded: 'የገንዘብ ድጋፍ ይፈልጋሉ?',
    tradeIn: 'ለመለዋወጥ ተሽከርካሪ አለዎት?',
    tradeInDetails: 'የተለዋወጠ ተሽከርካሪ ዝርዝሮች',
    requestQuote: 'ዋጋ ጠይቅ',
    quoteDisclaimer: 'ዋጋዎ በ24-48 ሰዓታት ውስጥ ይላካል',
  },
  
  footer: {
    vehicles: 'ተሽከርካሪዎች',
    services: 'አገልግሎቶች',
    company: 'ድርጅት',
    support: 'ድጋፍ',
    stayConnected: 'ተገናኙ',
    newsletter: 'በአዳዲስ ሞዴሎች፣ ቅናሾች እና የጂሊ ዜናዎች ላይ የቅርብ ጊዜ መረጃዎችን ያግኙ',
    emailPlaceholder: 'የኢሜይል አድራሻዎን ያስገቡ',
    subscribe: 'ይመዝገቡ',
    followUs: 'ይከተሉን',
    copyright: 'ጂሊ ኢትዮጵያ - የከርችንሼ ግሩፕ። ሁሉም መብቶች የተጠበቁ ናቸው።',
    privacyPolicy: 'የግላዊነት ፖሊሲ',
    termsOfService: 'የአገልግሎት ውሎች',
    cookiePolicy: 'የኩኪ ፖሊሲ',
  },
};

// Translation helper function
export function t(key: string, lang: Language = 'en'): string {
  const translations = lang === 'am' ? am : en;
  const keys = key.split('.');
  
  let value: any = translations;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key} for language: ${lang}`);
      return key;
    }
  }
  
  return typeof value === 'string' ? value : key;
}

// Hook to use translations
export function useTranslation() {
  const { language } = useLanguage();

  // Rehydrate persisted language after the first client render. This keeps
  // the server HTML and initial browser HTML identical, preventing hydration
  // mismatches in the header and utility bar.
  useEffect(() => {
    void useLanguage.persist.rehydrate();
  }, []);
  
  return {
    t: (key: string) => t(key, language),
    language,
  };
}
