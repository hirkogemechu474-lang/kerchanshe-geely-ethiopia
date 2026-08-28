import { settingRepository } from '@/repositories/settingRepository';

const DEFAULT_CONTENT = {
  about: {
    title: 'About Geely Ethiopia',
    description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia, bringing world-class automotive excellence to the Ethiopian market with comprehensive warranty coverage, nationwide service network, and commitment to customer satisfaction.',
    image: 'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&h=600&fit=crop',
  },
  features: [
    {
      title: 'Advanced Safety',
      description: '5-star safety rating with advanced driver assistance systems including collision avoidance, lane departure warning, and automatic emergency braking.',
      icon: 'shield',
      image: '',
    },
    {
      title: 'Cutting-Edge Technology',
      description: 'Smart connectivity features with integrated infotainment, smartphone integration, and intelligent driving assistance systems.',
      icon: 'cpu',
      image: '',
    },
    {
      title: 'Exceptional Comfort',
      description: 'Premium interiors with ergonomic design, quality materials, and advanced climate control for ultimate driving comfort.',
      icon: 'star',
      image: '',
    },
    {
      title: 'Competitive Pricing',
      description: 'Best value for money with transparent pricing, flexible financing options, and comprehensive after-sales support.',
      icon: 'dollar',
      image: '',
    },
  ],
  stats: [
    { label: 'Vehicles Sold', value: '10,000+' },
    { label: 'Happy Customers', value: '8,500+' },
    { label: 'Service Centers', value: '15+' },
    { label: 'Years of Excellence', value: '5+' },
  ],
};

const FALLBACK_CONTENT = {
  about: {
    title: 'About Geely Ethiopia',
    description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia, bringing world-class automotive excellence to the Ethiopian market.',
    image: 'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&h=600&fit=crop',
  },
  features: [
    { title: 'Advanced Safety', description: '5-star safety rating with advanced driver assistance systems', icon: 'shield', image: '' },
    { title: 'Cutting-Edge Technology', description: 'Smart connectivity and intelligent driving features', icon: 'cpu', image: '' },
    { title: 'Exceptional Comfort', description: 'Premium interiors designed for ultimate comfort', icon: 'star', image: '' },
    { title: 'Competitive Pricing', description: 'Best value for money with flexible financing options', icon: 'dollar', image: '' },
  ],
  stats: [
    { label: 'Vehicles Sold', value: '10,000+' },
    { label: 'Happy Customers', value: '8,500+' },
    { label: 'Service Centers', value: '15+' },
    { label: 'Years of Excellence', value: '5+' },
  ],
};

export async function getHomepageContent() {
  try {
    const settings = await settingRepository.findManyByKeys(['homepage_about', 'homepage_features', 'homepage_stats']);

    const content: any = { ...DEFAULT_CONTENT };

    settings.forEach((setting) => {
      try {
        const data = JSON.parse(setting.value);
        if (setting.key === 'homepage_about') content.about = data;
        if (setting.key === 'homepage_features') content.features = data;
        if (setting.key === 'homepage_stats') content.stats = data;
      } catch (e) {
        console.error('Error parsing setting:', setting.key);
      }
    });

    return content;
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return FALLBACK_CONTENT;
  }
}

export async function saveHomepageContent(body: { about?: unknown; features?: unknown; stats?: unknown }) {
  const { about, features, stats } = body;

  if (about) {
    await settingRepository.upsert('homepage_about', JSON.stringify(about), 'general');
  }
  if (features) {
    await settingRepository.upsert('homepage_features', JSON.stringify(features), 'general');
  }
  if (stats) {
    await settingRepository.upsert('homepage_stats', JSON.stringify(stats), 'general');
  }
}
