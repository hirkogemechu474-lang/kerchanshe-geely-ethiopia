import { settingRepository } from '@/repositories/settingRepository';

const DEFAULT_CONTENT = {
  hero: {
    title: 'Welcome to Geely Ethiopia',
    subtitle: 'Experience the Future of Automotive Excellence',
    description: 'Discover world-class vehicles with cutting-edge technology, superior safety, and exceptional comfort.',
    backgroundImage: '',
    ctaText: 'Explore Vehicles',
    ctaLink: '/models',
  },
  about: {
    title: 'About Geely Ethiopia',
    description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia.',
    image: '',
  },
  features: [] as unknown[],
  stats: [] as unknown[],
  gallery: [] as unknown[],
};

const FALLBACK_CONTENT = {
  hero: {
    title: 'Welcome to Geely Ethiopia',
    subtitle: 'Experience the Future of Automotive Excellence',
    description: 'Discover world-class vehicles with cutting-edge technology.',
    backgroundImage: '',
    ctaText: 'Explore Vehicles',
    ctaLink: '/models',
  },
  about: {
    title: 'About Geely Ethiopia',
    description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia.',
    image: '',
  },
  features: [] as unknown[],
  stats: [] as unknown[],
  gallery: [] as unknown[],
};

// GET - Fetch homepage content for public website
export async function getPublicContent() {
  try {
    const settings = await settingRepository.findManyByKeyPrefixes(['homepage_', 'content_']);

    const content: any = JSON.parse(JSON.stringify(DEFAULT_CONTENT));

    settings.forEach((setting: any) => {
      try {
        const value = JSON.parse(setting.value);

        if (setting.key === 'homepage_hero') {
          content.hero = { ...content.hero, ...value };
        } else if (setting.key === 'homepage_about') {
          content.about = { ...content.about, ...value };
        } else if (setting.key === 'homepage_features') {
          content.features = value;
        } else if (setting.key === 'homepage_stats') {
          content.stats = value;
        } else if (setting.key === 'homepage_gallery') {
          content.gallery = value;
        }
      } catch (e) {
        console.error('Error parsing setting:', setting.key, e);
      }
    });

    return content;
  } catch (error) {
    console.error('Error fetching public content:', error);
    return FALLBACK_CONTENT;
  }
}
