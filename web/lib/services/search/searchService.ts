import { searchRepository } from '@/repositories/searchRepository';

const STATIC_SERVICES = [
  { name: 'Maintenance', description: 'Regular vehicle maintenance and servicing', url: '/service#maintenance' },
  { name: 'Repairs', description: 'Professional repair services', url: '/service#repairs' },
  { name: 'Warranty', description: 'Comprehensive warranty coverage', url: '/service#warranty' },
];

export async function search(query: string, category: string) {
  if (query.length < 2) {
    return [];
  }

  const results: any[] = [];

  if (category === 'all' || category === 'vehicles') {
    const vehicles = await searchRepository.searchVehicles(query);
    vehicles.forEach((vehicle) => {
      results.push({
        type: 'vehicle',
        title: `${vehicle.name} ${vehicle.model}`,
        description: vehicle.description,
        url: `/models/${vehicle.id}`,
      });
    });
  }

  if (category === 'all' || category === 'news') {
    const news = await searchRepository.searchNews(query);
    news.forEach((article) => {
      results.push({
        type: 'news',
        title: article.title,
        description: article.content.substring(0, 150) + '...',
        url: `/news/${article.id}`,
      });
    });
  }

  if (category === 'all' || category === 'dealers') {
    const dealers = await searchRepository.searchDealers(query);
    dealers.forEach((dealer) => {
      results.push({
        type: 'dealer',
        title: dealer.name,
        description: `${dealer.city} - ${JSON.stringify(dealer.address)}`,
        url: `/dealers#${dealer.id}`,
      });
    });
  }

  if (category === 'all' || category === 'services') {
    STATIC_SERVICES
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

  return results.slice(0, 10);
}
