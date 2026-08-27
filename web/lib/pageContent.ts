import type { Language } from './i18n';

export type IconName =
  | 'Award' | 'Users' | 'Globe' | 'TrendingUp' | 'Factory'
  | 'Shield' | 'Zap' | 'Heart' | 'Battery' | 'Leaf'
  | 'DollarSign' | 'Wrench' | 'MapPin' | 'HelpCircle'
  | 'Clock' | 'Home' | 'Calculator' | 'Gift' | 'TreePine'
  | 'Check' | 'CreditCard' | 'FileText' | 'ShieldCheck'
  | 'CheckCircle' | 'Phone' | 'Mail' | 'Car' | 'TrendingUp'
  | 'AlertTriangle' | 'Truck' | 'Fuel' | 'Battery' | 'Key'
  | 'ArrowRight' | 'Star' | 'ThumbsUp' | 'MessageSquare'
  | 'Cpu' | 'Radio' | 'Camera' | 'Gauge' | 'Truck'
  | 'Hands' | 'Lightbulb' | 'Microscope' | 'Rocket'
  | 'Coffee' | 'Gift' | 'BadgeCheck' | 'Building2'
  | 'GraduationCap' | 'Briefcase' | 'Handshake'
  | 'LifeBuoy' | 'HeadphonesIcon' | 'RefreshCw' | 'Eye'
  | 'Lock' | 'ShieldAlert' | 'FileQuestion';

export interface HighlightItem { value: string; label: string; }
export interface FeatureCard { icon: IconName; title: string; description: string; }
export interface StatsCard { icon: IconName; title: string; description: string; gradient: string; }

export interface AboutPageContent {
  sectionHero: { eyebrow: string; title: string; subtitle: string };
  partnership: {
    eyebrow: string; title: string; paragraphs: string[];
    highlights: HighlightItem[];
  };
  geelyGlobal: { title: string; subtitle: string; features: FeatureCard[] };
  kerchansheGroup: {
    eyebrow: string; title: string; paragraphs: string[];
    sectors: string[]; statsCards: StatsCard[];
  };
  whyChoose: { title: string; subtitle: string; features: FeatureCard[] };
  cta: {
    title: string; subtitle: string;
    primaryButton: { label: string; href: string };
    secondaryButton: { label: string; href: string };
  };
}

export interface ServicePageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  benefits: FeatureCard[];
  success: { title: string; message: string; whatToBringLabel: string; whatToBring: string[]; bookAnother: string; orderParts: string; };
  types: { title: string; subtitle: string; };
  form: { title: string; steps: string[]; };
}

export interface WarrantyPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  benefits: FeatureCard[];
  coverage: { title: string; subtitle: string; items: { title: string; detail: string }[]; };
  exclusions: { title: string; items: string[]; };
  success: { title: string; message: string; nextStepsLabel: string; nextSteps: string[]; submitAnother: string; bookService: string; };
  claimCTA: { title: string; subtitle: string; button: string; };
}

export interface FinancingPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  howItWorks: { title: string; steps: FeatureCard[]; };
  calculator: { title: string; selectVehicle: string; };
  partners: { title: string; subtitle: string; };
  documents: { title: string; subtitle: string; items: string[]; };
  benefits: { title: string; subtitle: string; items: FeatureCard[]; };
}

export interface TradeInPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  benefits: FeatureCard[];
  howItWorks: { title: string; subtitle: string; steps: { icon: IconName; title: string; description: string }[]; };
  success: { title: string; message: string; nextStepsLabel: string; nextSteps: string[]; submitAnother: string; browseModels: string; };
  form: { title: string; };
}

export interface RoadsidePageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  emergencyBar: { label: string; cta: string; ctaNumber: string; };
  services: { title: string; subtitle: string; items: FeatureCard[]; };
  membership: { title: string; subtitle: string; tiers: { name: string; price: string; features: string[]; highlight?: boolean }[]; };
  success: { title: string; message: string; waitLabel: string; waitTips: string[]; emergency: string; emergencyPhone: string; newRequest: string; backHome: string; };
}

export interface TechnologyPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  pillars: { title: string; subtitle: string; items: FeatureCard[]; };
  safety: { eyebrow: string; title: string; subtitle: string; features: FeatureCard[]; };
  connectivity: { eyebrow: string; title: string; subtitle: string; features: FeatureCard[]; };
  cta: { title: string; subtitle: string; primaryLabel: string; secondaryLabel: string; };
}

export interface TestimonialsPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  stats: HighlightItem[];
  reviews: { title: string; subtitle: string; };
  submitCTA: { eyebrow: string; title: string; subtitle: string; button: string; };
}

export interface OffersPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  current: { title: string; subtitle: string; };
  seasonal: { title: string; subtitle: string; };
  newsletter: { title: string; subtitle: string; placeholder: string; button: string; };
}

export interface PartsPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  why: { title: string; subtitle: string; features: FeatureCard[]; };
  categories: { title: string; subtitle: string; };
  request: { title: string; subtitle: string; };
  cta: { title: string; subtitle: string; primaryLabel: string; secondaryLabel: string; };
}

export interface FAQPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; };
  categories: string[];
  stillNeed: { title: string; subtitle: string; primaryLabel: string; secondaryLabel: string; secondaryPhone: string; };
}

export interface PrivacyPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; lastUpdated: string; };
  sections: { heading: string; content: string; subsections?: { heading: string; content: string }[] }[];
}

export interface TermsPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; lastUpdated: string; };
  sections: { heading: string; content: string; subsections?: { heading: string; content: string }[] }[];
}

export interface CookiesPageContent {
  hero: { eyebrow: string; title: string; subtitle: string; lastUpdated: string; };
  table: { name: string; purpose: string; duration: string; category: string }[];
  sections: { heading: string; content: string }[];
  manage: { title: string; subtitle: string; };
}

const aboutContent: Record<Language, AboutPageContent> = {
  en: {
    sectionHero: {
      eyebrow: 'ABOUT US',
      title: 'About Geely Ethiopia',
      subtitle:
        'Bringing global automotive excellence to Ethiopia through the trusted partnership of Zhejiang Geely Holding Group and Kerchanshe Group.',
    },
    partnership: {
      eyebrow: 'A HISTORIC PARTNERSHIP',
      title: 'Global Engineering Meets Local Excellence',
      paragraphs: [
        'In April 2025, Kerchanshe Group announced a landmark agreement with Zhejiang Geely Holding Group (ZGH) to become the exclusive, official distributor of Geely vehicles in Ethiopia.',
        'This partnership brings together Geely\'s world-class automotive engineering, safety innovation, and design excellence with Kerchanshe Group\'s 20+ years of trusted local distribution, manufacturing infrastructure, and after-sales expertise.',
        'Operating through Kerchanshe Auto, the motor vehicles division of Kerchanshe Group, we are not just importing vehicles — we are building a complete automotive ecosystem with plans for local assembly, job creation, and technology transfer.',
      ],
      highlights: [
        { value: '2025', label: 'Exclusive Partnership Announced' },
        { value: '100%', label: 'Manufacturer Warranty & Support' },
        { value: 'Local', label: 'Assembly Plans in Progress' },
        { value: '25K+', label: 'Kerchanshe Group Employees' },
      ],
    },
    geelyGlobal: {
      title: 'Zhejiang Geely Holding Group',
      subtitle:
        'One of the world\'s leading automotive groups, with a portfolio spanning multiple brands and innovative technologies.',
      features: [
        { icon: 'Globe', title: 'Global Reach', description: 'Operations in over 40 countries worldwide with production facilities across Asia, Europe, and beyond.' },
        { icon: 'Award', title: 'Premium Brands', description: 'Owns Volvo Cars, Polestar, Lynk & Co, Zeekr, Geometry, and Lotus — globally recognized for engineering excellence.' },
        { icon: 'Zap', title: 'Innovation Leader', description: 'Pioneering electric and new energy vehicles with advanced battery and autonomous driving technology.' },
        { icon: 'Shield', title: 'Safety First', description: 'Multiple 5-star safety ratings globally, with C-NCAP and Euro NCAP recognition for engineering excellence.' },
      ],
    },
    kerchansheGroup: {
      eyebrow: 'SINCE 2003',
      title: 'Kerchanshe Group: Ethiopia\'s Most Diversified Conglomerate',
      paragraphs: [
        'Founded in 2003, Kerchanshe Group is Ethiopia\'s largest coffee exporter and one of its most diversified conglomerates, with an annual coffee turnover exceeding US$100 million.',
        'The Group operates across 10+ business sectors, bringing world-class brands and know-how to the Ethiopian market through exclusive distribution partnerships.',
      ],
      sectors: [
        'Coffee export and agro-industry',
        'Manufacturing (Buna Plate, Buna Pen)',
        'Construction (AMAM Construction)',
        'Heavy equipment (Exclusive Caterpillar dealer)',
        'Logistics, hospitality, and automotive',
      ],
      statsCards: [
        { icon: 'Factory', title: 'Manufacturing', description: 'Buna Plate, Buna Pen production facilities creating local jobs', gradient: 'from-amber-500 to-amber-600' },
        { icon: 'Globe', title: 'Coffee Export', description: '$100M+ annual turnover, largest Ethiopian coffee exporter', gradient: 'from-slate-700 to-blue-700' },
        { icon: 'TrendingUp', title: 'Heavy Equipment', description: 'Exclusive Caterpillar dealer for Ethiopia and region', gradient: 'from-blue-600 to-slate-800' },
        { icon: 'Users', title: '25,000+ Jobs', description: 'Major Ethiopian employer across multiple sectors', gradient: 'from-amber-600 to-yellow-500' },
      ],
    },
    whyChoose: {
      title: 'Why Choose Geely Ethiopia',
      subtitle: 'The perfect combination of global automotive excellence and trusted local service.',
      features: [
        { icon: 'Shield', title: 'Genuine Warranty', description: 'Full manufacturer warranty and technical support backed by Zhejiang Geely Holding Group on every vehicle sold.' },
        { icon: 'Factory', title: 'Local Assembly Roadmap', description: 'Plans for local assembly of Geely vehicles in Ethiopia, contributing to job creation and national industrial growth.' },
        { icon: 'Users', title: 'Trusted Service Network', description: '20+ years of Kerchanshe Group expertise in distribution, after-sales, and customer service across Ethiopia.' },
        { icon: 'Award', title: 'World-Class Quality', description: 'Geely\'s global standards of engineering, safety, and design, proven across 40+ countries worldwide.' },
        { icon: 'Zap', title: 'Future-Ready EV', description: 'Access to cutting-edge electric and new energy vehicle technology as Ethiopia transitions to sustainable mobility.' },
        { icon: 'Heart', title: 'Community Impact', description: 'Commitment to Ethiopia\'s economic development through technology transfer, training, and local capacity building.' },
      ],
      // End of English whyChoose features.
    },
    cta: {
      title: 'Ready to Experience Geely?',
      subtitle:
        'Visit our flagship showroom in Sarbet, Addis Ababa, or book a test drive to experience the perfect combination of global excellence and local trust.',
      primaryButton: { label: 'Book a Test Drive', href: '/test-drive' },
      secondaryButton: { label: 'Find Our Showroom', href: '/dealers' },
    },
  },
  am: {
    sectionHero: {
      eyebrow: 'ስለ እኛ',
      title: 'ስለ ጂሊ ኢትዮጵያ',
      subtitle:
        'የዘንግዣንግ ጂሊ ሆልዲንግ ግሩፕ እና የከርችንሼ ግሩፕ አማኝነት በተሞላ አብሮ አሰራር በኩል ዓለምአቀፍ የአውቶሞቲቭ ልቅንነትን ወደ ኢትዮጵያ በማምጣት ላይ።',
    },
    partnership: {
      eyebrow: 'ታሪካዊ አብሮ አሰራር',
      title: 'ዓለምአቀፍ ምህንድስና ከአከባቢ ልቅንነት ጋር ተገናኝቷል',
      paragraphs: [
        'በአፕሪል 2025 ዓ.ም የከርችንሼ ግሩፕ ከዘንግዣንግ ጂሊ ሆልዲንግ ግሩፕ (ZGH) ጋር በኢትዮጵያ የጂሊ መኪናዎች የብሙሽ ወኪል እና ኦፊሻል ዲስትሪቢውተር መሆኑን የሚያመለክት ታሪካዊ ስምምነት አስታውቋል።',
        'ይህ አብሮ አሰራር የጂሊ ዓለም ደረጃ የአውቶሞቲቭ ምህንድስና፣ የደህንነት ፈጠራ እና የሴት ልቅንነትን ከከርችንሼ ግሩፕ ከ20 ዓመት በላይ ያለው የተሰማህ አከባቢ ስርጭት፣ የማምረቻ መሰረታዊ ቅርጽ እና የሽያጭ ድጋፍ ባለሙያነት ጋር ያሰላስላል።',
        'በከርችንሼ ግሩፕ የተሽከርካሪ ክፍል በመሆን የከርችንሼ አውቶ በኩል እየሰራን — ተሽከርካሪዎችን ብቻ ሳንጫወት — የአከባቢ ስብሰባ፣ የሥራ መፍጠር እና የቴክኖሎጂ ልዋጋት እንዲሆኑ የሚያስችል ሙሉ የአውቶሞቲቭ ሥርዓት እየገነባን ነው።',
      ],
      highlights: [
        { value: '2017 ዓ.ም', label: 'ብሙሽ አብሮ አሰራር የተሳተፈበት' },
        { value: '100%', label: 'የአምራች ዋስትና እና ድጋፍ' },
        { value: 'የአከባቢ', label: 'የስብሰባ እቅዶች ላይ ናቸው' },
        { value: '25 ሺህ+', label: 'የከርችንሼ ግሩፕ ተጠሪዎች' },
      ],
    },
    geelyGlobal: {
      title: 'ዘንግዣንግ ጂሊ ሆልዲንግ ግሩፕ',
      subtitle:
        'በበርካታ ብራንዶች እና ፈጠራ ቴክኖሎጂዎች የተሞላ ክፍሎችን ያቀ፣ የዓለም ልዩ የአውቶሞቲቭ ግሩፖች አንዱ።',
      features: [
        { icon: 'Globe', title: 'የዓለም መርህ', description: 'በእስያ፣ በአውሮፓ እና በሌሎች ቦታዎች የተከፈቱ የምርት ተቋማት በ40 በላይ አገሮች ውስጥ ኢኮኖሚያዊ ግንኙነት።' },
        { icon: 'Award', title: 'ፕሪሚየም ብራንዶች', description: 'Volvo Cars፣ Polestar፣ Lynk & Co፣ Zeekr፣ Geometry እና Lotusን ይይዛል — ለምህንድስና ልቅንነት በዓለም ደረጃ የተታወቁ።' },
        { icon: 'Zap', title: 'የፈጠራ አመራር', description: 'ከላቀ ባትሪ እና በራስ የሚነዳ የመኪና ቴክኖሎጂ ጋር ኤሌክትሪክ እና አዲስ ሃይል ተሽከርካሪዎችን በመፍጠር ቅድሚያ።' },
        { icon: 'Shield', title: 'ደህንነት ቅድሚያ', description: 'በC-NCAP እና Euro NCAP ለምህንድስና ልቅንነት የተያዙ በብዛት 5 ኮከብ ያላቸው የደህንነት ደረጃዎች በዓለም ደረጃ።' },
      ],
    },
    kerchansheGroup: {
      eyebrow: 'ከ2003 ዓ.ም ጀምሮ',
      title: 'የከርችንሼ ግሩፕ፡ በኢትዮጵያ በጣም የተለየ የንግድ ግጭት',
      paragraphs: [
        'በ2003 የተመሰረተው የከርችንሼ ግሩፕ በኢትዮጵያ ትልቁ የቡና ማጓጓዣ ነው እና በዓመት በ100 ሚሊዮን ዶላር በላይ የቡና ገቢ ያለው በጣም የተለየ ኮንግሎሜረት ነው።',
        'ግሩፑ በ10 በላይ የንግድ ምድቦች ውስጥ እየሰራ ሲሆን በብሙሽ የስርጭት አጋርነት በኩል ዓለም ደረጃ ብራንዶች እና ባለሙያነትን ወደ ኢትዮጵያ ገበያ ይመጣል።',
      ],
      sectors: [
        'የቡና ማጓጓዣ እና ግብርና-ኢንዱስትሪ',
        'ማምረቻ (ቡና ፕሌት፣ ቡና ጥልፍ)',
        'ግንባታ (አማም ግንባታ)',
        'ከባድ መሳሪያዎች (የCaterpillar ብቸኛ ወኪል)',
        'ሎጂስቲክስ፣ እንቅስቃሴ እና አውቶሞቲቭ',
      ],
      statsCards: [
        { icon: 'Factory', title: 'ማምረቻ', description: 'የቡና ፕሌት፣ የቡና ጥልፍ ማምረቻ ተቋማት አከባቢ ሥራዎችን የሚፈጥሩ', gradient: 'from-amber-500 to-amber-600' },
        { icon: 'Globe', title: 'የቡና ማጓጓዣ', description: 'በዓመት $100M በላይ ገቢ፣ ትልቁ የኢትዮጵያ የቡና ማጓጓዣ', gradient: 'from-slate-700 to-blue-700' },
        { icon: 'TrendingUp', title: 'ከባድ መሳሪያዎች', description: 'ለኢትዮጵያ እና ክልሉ የCaterpillar ብቸኛ ወኪል', gradient: 'from-blue-600 to-slate-800' },
        { icon: 'Users', title: '25,000+ ስራ', description: 'በበርካታ ምድቦች ውስጥ ታዋቂ የኢትዮጵያ ተጠሪ', gradient: 'from-amber-600 to-yellow-500' },
      ],
    },
    whyChoose: {
      title: 'ለምን ጂሊ ኢትዮጵያ ይምረጡ?',
      subtitle: 'የዓለም ደረጃ የአውቶሞቲቭ ልቅንነት እና የተሰማህ አከባቢ አገልግሎት ፍጹም ውህደት።',
      features: [
        { icon: 'Shield', title: 'ትክክለኛ ዋስትና', description: 'በእያንዳንዱ የተሽጠ መኪና ላይ የዘንግዣንግ ጂሊ ሆልዲንግ ግሩፕ የደገፈው ሙሉ የአምራች ዋስትና እና ቴክኒካል ድጋፍ።' },
        { icon: 'Factory', title: 'የአከባቢ ስብሰባ የመንገድ ስዕል', description: 'የጂሊ መኪናዎች በኢትዮጵያ አከባቢ እንዲሰበሰቡ ያላቸው እቅዶች፣ ለሥራ መፍጠር እና ለብሔራዊ ኢንዱስትሪያዊ እድገት አበረታታሊያል።' },
        { icon: 'Users', title: 'የተሰማህ የአገልግሎት አውታር', description: 'በ20 ዓመት በላይ የከርችንሼ ግሩፕ ባለሙያነት በኢትዮጵያ ዙሪያ ስርጭት፣ የሽያጭ ድጋፍ እና የደንበኞች አገልግሎት።' },
        { icon: 'Award', title: 'ዓለም ደረጃ ጥራት', description: 'በ40 በላይ አገሮች ውስጥ የተረጋገጠ የጂሊ ዓለምአቀፍ የምህንድስና፣ ደህንነት እና ሴት ደረጃዎች።' },
        { icon: 'Zap', title: 'ወደፊት የተዘጋጀ EV', description: 'ኢትዮጵያ ወደ ደረጃ የሚጓዝ በሆነ ተለዋጭ የንቅለጥ ጊዜ የላቀ ኤሌክትሪክ እና አዲስ ሃይል ተሽከርካሪ ቴክኖሎጂ መድረሻ።' },
        { icon: 'Heart', title: 'የማህበረሰብ ተጽእኖ', description: 'በቴክኖሎጂ ልዋጋት፣ ስልጠና እና አከባቢ አቅም ግንባታ በኩል ለኢትዮጵያ ኢኮኖሚያዊ እድገት ቁርጠኝነት።',
        },
      ],
    },
    cta: {
      title: 'ጂሊን ለመለማመድ ዝግጁ ነዎት?',
      subtitle:
        'የሌሊት ማሳያ ክፍላችንን በሳርቤት፣ በአዲስ አበባ ይጎብኙ፣ ወይም ዓለምአቀፍ ልቅንነት እና አከባቢ እምነትን ፍጹም ውህደት ለመለማመድ የሙከራ መንዳት ይያዙ።',
      primaryButton: { label: 'የሙከራ መንዳት ያስይዙ', href: '/test-drive' },
      secondaryButton: { label: 'ማሳያ ክፍላችንን ይፈልጉ', href: '/dealers' },
    },
  },
};

const serviceContent: Record<Language, ServicePageContent> = {
  en: {
    hero: { eyebrow: 'PROFESSIONAL SERVICE', title: 'Schedule Service Appointment', subtitle: 'Keep your Geely running smoothly with professional service from our certified technicians. Book your appointment today.' },
    benefits: [
      { icon: 'Wrench', title: 'Certified Technicians', description: 'Factory-trained experts with specialized Geely diagnostic tools and ongoing training.' },
      { icon: 'Shield', title: 'Genuine Geely Parts', description: 'Only authentic OEM parts used for every repair to protect your warranty and resale value.' },
      { icon: 'Clock', title: 'Express Service Lane', description: '90-minute turnaround for routine maintenance (oil & filter, tire rotation, multi-point inspection).' },
      { icon: 'CheckCircle', title: 'Warranty-Compliant', description: 'Every service logged and stamped to keep your 5-year / 150,000 km warranty fully valid.' },
    ],
    success: {
      title: 'Service Appointment Confirmed!',
      message: 'Thank you for scheduling your service with Geely Ethiopia. We have received your appointment request and will send you a confirmation email with the exact time slot and service advisor details shortly.',
      whatToBringLabel: 'What to bring to your service appointment:',
      whatToBring: [
        'Vehicle registration and ownership documents',
        'Service history booklet (if available)',
        'Warranty card (for warranty-covered repairs)',
        'Valid government-issued ID',
        'Insurance documents (if applicable)',
      ],
      bookAnother: 'Book Another Service',
      orderParts: 'Order Genuine Parts',
    },
    types: { title: 'Service Categories', subtitle: 'From a simple oil change to major transmission repair, our authorized service centers handle every Geely need.' },
    form: { title: 'Book Your Service Appointment', steps: ['Tell us about your vehicle', 'Choose a service type', 'Pick your preferred date & time', 'Confirm your details'] },
  },
  am: {
    hero: { eyebrow: 'ባለሙያ አገልግሎት', title: 'የአገልግሎት ቀጠሮ ይያዙ', subtitle: 'የእርስዎን ጂሊ ከተረጋጋ ባለሙያ ቴክኒሻናችን የሚቀበለውን ባለሙያ አገልግሎት በመጠቀም በደንብ እንዲሰራ ያደርጉ። የእርስዎን ቀጠሮ ዛሬ ይያዙ።' },
    benefits: [
      { icon: 'Wrench', title: 'የተረጋጉ ቴክኒሻኖች', description: 'በተለይ ለጂሊ የታሰሩ የምርት ቤት የተሰለጠኑ ባለሙያዎች የላቀ ምርመራ መሳሪያዎች እና ቀጣይነት ያለው ስልጠና።' },
      { icon: 'Shield', title: 'ትክክለኛ የጂሊ ክፍሎች', description: 'ዋስትናዎን እና የድጋሚ ግዢ ዋጋዎን ለመጠበቅ በእያንዳንዱ ጥገና ውስጥ የሚያገለግሉት ትክክለኛ OEM ክፍሎች ብቻ።' },
      { icon: 'Clock', title: 'ፈጣን የአገልግሎት መንገድ', description: 'ለተለመደው ጥገና (ዘይት እና ማጣሪያ፣ የጎማ ማሽከርከር፣ ባለብዙ ነጥድ ምርመራ) በ90 ደቂቃዎች ውስጥ የሚጠናቀቅ።' },
      { icon: 'CheckCircle', title: 'ከዋስትና ጋር የሚጣጣም', description: 'አምስት ዓመት / 150,000 ኪሎ ዋስትናዎ በሙሉ ልክ እንዲኖር የተመዘገበ እና የተታመረ እያንዳንዱ አገልግሎት።' },
    ],
    success: {
      title: 'የአገልግሎት ቀጠሮው ተረጋግጧል!',
      message: 'ስለ ጂሊ ኢትዮጵያ የአገልግሎት ቀጠሮዎን ስላስያዙ እናመሰግናለን። የእርስዎ የቀጠሮ ጥያቄ ደርሶብናል፣ ቅርብ ጊዜ ትክክለኛውን የሰዓት ጊዜ እና የአገልግሎት ምክትል ልኡክ ዝርዝሮችን የያዘ ማረጋገጫ ኢሜይል እናልክዎታለን።',
      whatToBringLabel: 'ወደ የአገልግሎት ቀጠሮዎ ምን መወሰድ አለብዎት:',
      whatToBring: [
        'የተሽከርካሪ ምዝገባ እና የባለቤትነት ሰነዶች',
        'የአገልግሎት ታሪክ መጽሐፍ (ካለዎት)',
        'የዋስትና ካርድ (ለዋስትና የተሸፈነ ጥገና)',
        'ተረጋጋ የመንግስት ማረጋገጫ ማውጫ',
        'የኢንሹራንስ ሰነዶች (ከተገለጠ)',
      ],
      bookAnother: 'ሌላ አገልግሎት ይያዙ',
      orderParts: 'ትክክለኛ ክፍሎች ይዘዙ',
    },
    types: { title: 'የአገልግሎት ምድቦች', subtitle: 'ከቀላል የዘይት ልወጣ እስከ ከፍተኛ የገልባ ጥገና፣ የእኛ የተፈቀዱ የአገልግሎት ማእከላት እያንዳንዱን የጂሊ ፍላጎት ይያዛሉ።' },
    form: { title: 'የአገልግሎት ቀጠሮዎን ይያዙ', steps: ['ስለ ተሽከርካሪዎ ይገልፁን', 'የአገልግሎት አይነት ይምረጡ', 'የምርጫዎ ቀን እና ሰዓት ይምረጡ', 'ዝርዝርዎን ያረጋግጡ'] },
  },
};

export const pageContent = {
  about: aboutContent,
  service: serviceContent,
};

export function getAboutContent(lang: Language): AboutPageContent {
  return pageContent.about[lang];
}

export function getServiceContent(lang: Language): ServicePageContent {
  return pageContent.service[lang];
}
