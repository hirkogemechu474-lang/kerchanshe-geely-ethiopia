import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

// GET - Fetch homepage content
export async function GET(request: NextRequest) {
  try {
    // Try to get content from database first
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ['homepage_about', 'homepage_features', 'homepage_stats'] }
      }
    });

    let content = {
      about: {
        title: 'About Geely Ethiopia',
        description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia, bringing world-class automotive excellence to the Ethiopian market with comprehensive warranty coverage, nationwide service network, and commitment to customer satisfaction.',
        image: 'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&h=600&fit=crop'
      },
      features: [
        {
          title: 'Advanced Safety',
          description: '5-star safety rating with advanced driver assistance systems including collision avoidance, lane departure warning, and automatic emergency braking.',
          icon: 'shield',
          image: ''
        },
        {
          title: 'Cutting-Edge Technology',
          description: 'Smart connectivity features with integrated infotainment, smartphone integration, and intelligent driving assistance systems.',
          icon: 'cpu',
          image: ''
        },
        {
          title: 'Exceptional Comfort',
          description: 'Premium interiors with ergonomic design, quality materials, and advanced climate control for ultimate driving comfort.',
          icon: 'star',
          image: ''
        },
        {
          title: 'Competitive Pricing',
          description: 'Best value for money with transparent pricing, flexible financing options, and comprehensive after-sales support.',
          icon: 'dollar',
          image: ''
        }
      ],
      stats: [
        { label: 'Vehicles Sold', value: '10,000+' },
        { label: 'Happy Customers', value: '8,500+' },
        { label: 'Service Centers', value: '15+' },
        { label: 'Years of Excellence', value: '5+' }
      ]
    };

    // Parse database content if available
    settings.forEach(setting => {
      try {
        const data = JSON.parse(setting.value);
        if (setting.key === 'homepage_about') content.about = data;
        if (setting.key === 'homepage_features') content.features = data;
        if (setting.key === 'homepage_stats') content.stats = data;
      } catch (e) {
        console.error('Error parsing setting:', setting.key);
      }
    });

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    // Return default content on error
    return NextResponse.json({
      about: {
        title: 'About Geely Ethiopia',
        description: 'Kerchanshe Auto is the exclusive distributor of Geely vehicles in Ethiopia, bringing world-class automotive excellence to the Ethiopian market.',
        image: 'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&h=600&fit=crop'
      },
      features: [
        { title: 'Advanced Safety', description: '5-star safety rating with advanced driver assistance systems', icon: 'shield', image: '' },
        { title: 'Cutting-Edge Technology', description: 'Smart connectivity and intelligent driving features', icon: 'cpu', image: '' },
        { title: 'Exceptional Comfort', description: 'Premium interiors designed for ultimate comfort', icon: 'star', image: '' },
        { title: 'Competitive Pricing', description: 'Best value for money with flexible financing options', icon: 'dollar', image: '' }
      ],
      stats: [
        { label: 'Vehicles Sold', value: '10,000+' },
        { label: 'Happy Customers', value: '8,500+' },
        { label: 'Service Centers', value: '15+' },
        { label: 'Years of Excellence', value: '5+' }
      ]
    });
  }
}

// POST - Save homepage content (admin only)
export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const { about, features, stats } = body;

    // Save each section to database
    if (about) {
      await prisma.setting.upsert({
        where: { key: 'homepage_about' },
        update: { value: JSON.stringify(about) },
        create: {
          key: 'homepage_about',
          value: JSON.stringify(about),
          type: 'general'
        }
      });
    }

    if (features) {
      await prisma.setting.upsert({
        where: { key: 'homepage_features' },
        update: { value: JSON.stringify(features) },
        create: {
          key: 'homepage_features',
          value: JSON.stringify(features),
          type: 'general'
        }
      });
    }

    if (stats) {
      await prisma.setting.upsert({
        where: { key: 'homepage_stats' },
        update: { value: JSON.stringify(stats) },
        create: {
          key: 'homepage_stats',
          value: JSON.stringify(stats),
          type: 'general'
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving homepage content:', error);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}