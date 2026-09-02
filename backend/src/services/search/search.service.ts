import { searchRepository } from '../../repositories';

export const searchService = {
  async search(query: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      if (!query || query.trim().length < 2) {
        return { ok: true, data: { vehicles: [], news: [], dealers: [] } };
      }

      const [vehicles, news, dealers] = await Promise.all([
        searchRepository.searchVehicles(query),
        searchRepository.searchNews(query),
        searchRepository.searchDealers(query),
      ]);

      return {
        ok: true,
        data: {
          vehicles,
          news,
          dealers,
          total: vehicles.length + news.length + dealers.length,
        },
      };
    } catch (error: any) {
      console.error('[SEARCH ERROR]', error.message);
      return { ok: false, error: 'Search failed.' };
    }
  },

  async searchVehicles(query: string, limit = 5): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const vehicles = await searchRepository.searchVehicles(query, limit);
      return { ok: true, data: vehicles };
    } catch (error: any) {
      return { ok: false, error: 'Vehicle search failed.' };
    }
  },

  async searchNews(query: string, limit = 5): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const news = await searchRepository.searchNews(query, limit);
      return { ok: true, data: news };
    } catch (error: any) {
      return { ok: false, error: 'News search failed.' };
    }
  },

  async searchDealers(query: string, limit = 5): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const dealers = await searchRepository.searchDealers(query, limit);
      return { ok: true, data: dealers };
    } catch (error: any) {
      return { ok: false, error: 'Dealer search failed.' };
    }
  },
};
