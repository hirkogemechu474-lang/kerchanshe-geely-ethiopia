import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'about_content';
const SETTING_TYPE = 'cms';

interface HighlightItem {
  value: string;
  label: string;
}

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

interface SectionHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
}

interface SectionPartnership {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  highlights: HighlightItem[];
  rightImage: string;
}

interface SectionGeely {
  title: string;
  subtitle: string;
  features: FeatureCard[];
}

interface SectionKerchanshe {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  sectors: string[];
  statsCards: { icon: string; title: string; description: string; gradient: string }[];
}

interface SectionWhyChoose {
  title: string;
  subtitle: string;
  features: FeatureCard[];
}

interface SectionCta {
  title: string;
  subtitle: string;
  primaryButton: { label: string; href: string };
  secondaryButton: { label: string; href: string };
}

export interface AboutContent {
  sectionHero: SectionHero;
  partnership: SectionPartnership;
  geelyGlobal: SectionGeely;
  kerchansheGroup: SectionKerchanshe;
  whyChoose: SectionWhyChoose;
  cta: SectionCta;
  homeAbout: {
    title: string;
    description: string;
    image: string;
    keyPoints: string[];
  };
  homeFeatures: { icon: string; title: string; description: string; image?: string }[];
  homeStats: { label: string; value: string }[];
}

export const DEFAULT_ABOUT: AboutContent = {
  sectionHero: {
    eyebrow: 'ABOUT US',
    title: 'About Geely Ethiopia',
    subtitle:
      'Bringing global automotive excellence to Ethiopia through the trusted partnership of Zhejiang Geely Holding Group and Kerchanshe Group.',
    backgroundImage: '',
  },
  partnership: {
    eyebrow: 'A HISTORIC PARTNERSHIP',
    title: 'Global Engineering Meets Local Excellence',
    paragraphs: [
      'In April 2025, Kerchanshe Group announced a landmark agreement with Zhejiang Geely Holding Group (ZGH) to become the exclusive, official distributor of Geely vehicles in Ethiopia.',
      "This partnership brings together Geely's world-class automotive engineering, safety innovation, and design excellence with Kerchanshe Group's 20+ years of trusted local distribution, manufacturing infrastructure, and after-sales expertise.",
      'Operating through Kerchanshe Auto, the motor vehicles division of Kerchanshe Group, we are not just importing vehicles — we are building a complete automotive ecosystem with plans for local assembly, job creation, and technology transfer.',
    ],
    highlights: [
      { value: '2025', label: 'Exclusive Partnership Announced' },
      { value: '100%', label: 'Manufacturer Warranty & Support' },
      { value: 'Local', label: 'Assembly Plans in Progress' },
      { value: '25K+', label: 'Kerchanshe Group Employees' },
    ],
    rightImage: '',
  },
  geelyGlobal: {
    title: 'Zhejiang Geely Holding Group',
    subtitle:
      "One of the world's leading automotive groups, with a portfolio spanning multiple brands and innovative technologies.",
    features: [
      {
        icon: 'Globe',
        title: 'Global Reach',
        description:
          'Operations in over 40 countries worldwide with production facilities across Asia, Europe, and beyond.',
      },
      {
        icon: 'Award',
        title: 'Premium Brands',
        description:
          'Owns Volvo Cars, Polestar, Lynk & Co, Zeekr, Geometry, and Lotus — recognized for excellence.',
      },
      {
        icon: 'Zap',
        title: 'Innovation Leader',
        description:
          'Pioneering electric and new energy vehicles with advanced battery and autonomous driving technology.',
      },
      {
        icon: 'Shield',
        title: 'Safety First',
        description:
          'Multiple 5-star safety ratings globally, with C-NCAP and Euro NCAP recognition for engineering excellence.',
      },
    ],
  },
  kerchansheGroup: {
    eyebrow: 'SINCE 2003',
    title: "Kerchanshe Group: Ethiopia's Most Diversified Conglomerate",
    paragraphs: [
      'Founded in 2003, Kerchanshe Group is Ethiopia\'s largest coffee exporter and one of its most diversified conglomerates, with an annual coffee turnover exceeding US$100 million.',
      'The Group operates across 10+ business sectors:',
    ],
    sectors: [
      'Coffee export and agro-industry',
      'Manufacturing (Buna Plate, Buna Pen)',
      'Construction (AMAM Construction)',
      'Heavy equipment (Exclusive Caterpillar dealer)',
      'Logistics, hospitality, and automotive',
    ],
    statsCards: [
      { icon: 'Factory', title: 'Manufacturing', description: 'Buna Plate, Buna Pen production facilities', gradient: 'from-amber-500 to-amber-600' },
      { icon: 'Globe', title: 'Coffee Export', description: '$100M+ annual turnover, largest in Ethiopia', gradient: 'from-slate-700 to-blue-700' },
      { icon: 'TrendingUp', title: 'Heavy Equipment', description: 'Exclusive Caterpillar dealer in Ethiopia', gradient: 'from-blue-600 to-slate-800' },
      { icon: 'Users', title: '25,000+ Jobs', description: 'Major employer across multiple sectors', gradient: 'from-amber-600 to-yellow-500' },
    ],
  },
  whyChoose: {
    title: 'Why Choose Geely Ethiopia',
    subtitle: 'The perfect combination of global automotive excellence and trusted local service.',
    features: [
      { icon: 'Shield', title: 'Genuine Warranty', description: 'Full manufacturer warranty and technical support backed by Zhejiang Geely Holding Group on every vehicle sold.' },
      { icon: 'Factory', title: 'Local Assembly', description: 'Plans for local assembly of Geely vehicles in Ethiopia, contributing to job creation and industrial growth.' },
      { icon: 'Users', title: 'Trusted Service', description: '20+ years of Kerchanshe Group expertise in distribution, after-sales, and customer service across Ethiopia.' },
      { icon: 'Award', title: 'World-Class Quality', description: "Geely's global standards of engineering, safety, and design, proven across 40+ countries worldwide." },
      { icon: 'Zap', title: 'Future-Ready', description: 'Access to cutting-edge electric and new energy vehicle technology as Ethiopia transitions to sustainable mobility.' },
      { icon: 'Heart', title: 'Community Impact', description: "Commitment to Ethiopia's economic development through technology transfer and local capacity building." },
    ],
  },
  cta: {
    title: 'Ready to Experience Geely?',
    subtitle:
      'Visit our showroom in Sarbet, Addis Ababa, or book a test drive to experience the perfect combination of global excellence and local trust.',
    primaryButton: { label: 'Book a Test Drive', href: '/test-drive' },
    secondaryButton: { label: 'Find Our Showroom', href: '/dealers' },
  },
  homeAbout: {
    title: 'About Geely Ethiopia',
    description:
      'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia, bringing world-class automotive excellence to the Ethiopian market.',
    image: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern%20geely%20car%20showroom%20in%20addis%20ababa%20with%20suv%20vehicles%20on%20display%20professional%20lighting&image_size=landscape_4_3',
    keyPoints: [
      'Official authorized distributor with comprehensive warranty coverage',
      'Nationwide service network with certified technicians',
      'Commitment to bringing global automotive excellence to Ethiopian roads',
    ],
  },
  homeFeatures: [
    {
      icon: 'Shield',
      title: 'Advanced Safety',
      description:
        '5-star safety rating with advanced driver assistance systems including collision avoidance, lane departure warning, and automatic emergency braking.',
      image: '',
    },
    {
      icon: 'Cpu',
      title: 'Cutting-Edge Technology',
      description:
        'Smart connectivity features with integrated infotainment, smartphone integration, and intelligent driving assistance systems.',
      image: '',
    },
    {
      icon: 'Star',
      title: 'Exceptional Comfort',
      description:
        'Premium interiors with ergonomic design, quality materials, and advanced climate control for ultimate driving comfort.',
      image: '',
    },
    {
      icon: 'DollarSign',
      title: 'Competitive Pricing',
      description:
        'Best value for money with transparent pricing, flexible financing options, and comprehensive after-sales support.',
      image: '',
    },
  ],
  homeStats: [
    { label: 'Vehicles Sold', value: '10,000+' },
    { label: 'Happy Customers', value: '8,500+' },
    { label: 'Service Centers', value: '15+' },
    { label: 'Years of Excellence', value: '5+' },
  ],
};

async function getStoredOrDefault(): Promise<AboutContent> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!row) return DEFAULT_ABOUT;
    const parsed = JSON.parse(row.value);
    return { ...DEFAULT_ABOUT, ...parsed };
  } catch {
    return DEFAULT_ABOUT;
  }
}

export async function GET() {
  try {
    return NextResponse.json(await getStoredOrDefault());
  } catch (error) {
    console.error('[about GET]', error);
    return NextResponse.json(DEFAULT_ABOUT);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const value = typeof body === 'string' ? body : JSON.stringify(body);

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value, type: SETTING_TYPE, updatedAt: new Date() },
      create: { key: SETTING_KEY, value, type: SETTING_TYPE },
    });

    return NextResponse.json({ success: true, data: JSON.parse(value) });
  } catch (error) {
    console.error('[about POST]', error);
    return NextResponse.json(
      { error: 'Failed to save about content', details: (error as Error).message },
      { status: 500 }
    );
  }
}
