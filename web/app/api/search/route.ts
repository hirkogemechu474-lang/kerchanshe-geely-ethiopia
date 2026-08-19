import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category') || 'all';

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: any[] = [];

    // Search Vehicles
    if (category === 'all' || category === 'vehicles') {
      const vehicles = await prisma.vehicle.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { model: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: 5,
      });

      vehicles.forEach((vehicle) => {
        results.push({
          type: 'vehicle',
          title: `${vehicle.name} ${vehicle.model}`,
          description: vehicle.description,
          url: `/models/${vehicle.id}`,
        });
      });
    }

    // Search News
    if (category === 'all' || category === 'news') {
      const news = await prisma.newsArticle.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
          status: 'published',
        },
        take: 5,
      });

      news.forEach((article) => {
        results.push({
          type: 'news',
          title: article.title,
          description: article.content.substring(0, 150) + '...',
          url: `/news/${article.id}`,
        });
      });
    }

    // Search Dealers
    if (category === 'all' || category === 'dealers') {
      const dealers = await prisma.dealer.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
          active: true,
        },
        take: 5,
      });

      dealers.forEach((dealer) => {
        results.push({
          type: 'dealer',
          title: dealer.name,
          description: `${dealer.city} - ${JSON.stringify(dealer.address)}`,
          url: `/dealers#${dealer.id}`,
        });
      });
    }

    // Search Services (static for now)
    if (category === 'all' || category === 'services') {
      const services = [
        { name: 'Maintenance', description: 'Regular vehicle maintenance and servicing', url: '/service#maintenance' },
        { name: 'Repairs', description: 'Professional repair services', url: '/service#repairs' },
        { name: 'Warranty', description: 'Comprehensive warranty coverage', url: '/service#warranty' },
      ];

      services
        .filter((service) =>
          service.name.toLowerCase().includes(query.toLowerCase()) ||
          service.description.toLowerCase().includes(query.toLowerCase())
        )
        .forEach((service) => {
          results.push({
            type: 'service',
            title: service.name,
            description: service.description,
            url: service.url,
          });
        });
    }

    return NextResponse.json({ results: results.slice(0, 10) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
