import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch homepage content for public website
export async function GET(request: NextRequest) {
  try {
    // Fetch content from database
    const settings = await prisma.setting.findMany({
      where: {
        OR: [
          { key: { startsWith: 'homepage_' } },
          { key: { startsWith: 'content_' } }
        ]
      }
    });

    // Parse and organize content
    const content: any = {
      hero: {
        title: 'Welcome to Geely Ethiopia',
        subtitle: 'Experience the Future of Automotive Excellence',
        description: 'Discover world-class vehicles with cutting-edge technology, superior safety, and exceptional comfort.',
        backgroundImage: '',
        ctaText: 'Explore Vehicles',
        ctaLink: '/models'
      },
      about: {
        title: 'About Geely Ethiopia',
        description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia.',
        image: ''
      },
      features: [],
      stats: [],
      gallery: []
    };

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

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching public content:', error);
    
    // Return default content on error
    return NextResponse.json({
      hero: {
        title: 'Welcome to Geely Ethiopia',
        subtitle: 'Experience the Future of Automotive Excellence',
        description: 'Discover world-class vehicles with cutting-edge technology.',
        backgroundImage: '',
        ctaText: 'Explore Vehicles',
        ctaLink: '/models'
      },
      about: {
        title: 'About Geely Ethiopia',
        description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia.',
        image: ''
      },
      features: [],
      stats: [],
      gallery: []
    });
  }
}
