// Strapi CMS integration utility for Geely Ethiopia Platform

import { env } from './env';

// Base Strapi client configuration
const strapiConfig = {
  baseURL: env.api.strapi,
  token: env.api.token,
  timeout: 10000,
};

// Generic API request function
async function strapiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${strapiConfig.baseURL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Add authorization token if available
  if (strapiConfig.token) {
    headers['Authorization'] = `Bearer ${strapiConfig.token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`Strapi API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (env.app.isDev) {
      console.error('Strapi Request Error:', {
        url,
        error: error instanceof Error ? error.message : error,
        endpoint,
        options
      });
    }
    throw error;
  }
}

// Vehicle API functions
export const vehicleAPI = {
  // Get all vehicles with optional filtering
  async getVehicles(params?: {
    category?: string;
    fuelType?: string;
    populate?: string[];
    sort?: string;
    filters?: Record<string, any>;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.category) {
      searchParams.append('filters[category][$eq]', params.category);
    }
    
    if (params?.fuelType) {
      searchParams.append('filters[fuelType][$eq]', params.fuelType);
    }
    
    if (params?.populate) {
      params.populate.forEach(field => {
        searchParams.append('populate', field);
      });
    }
    
    if (params?.sort) {
      searchParams.append('sort', params.sort);
    }
    
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        searchParams.append(`filters[${key}]`, value);
      });
    }

    searchParams.append('populate', '*');

    const endpoint = `${env.strapi.vehicles}?${searchParams.toString()}`;
    return strapiRequest(endpoint);
  },

  // Get single vehicle by slug
  async getVehicle(slug: string) {
    const endpoint = `${env.strapi.vehicles}?filters[slug][$eq]=${slug}&populate=*`;
    return strapiRequest(endpoint);
  },

  // Get popular vehicles
  async getPopularVehicles() {
    const endpoint = `${env.strapi.vehicles}?filters[isPopular][$eq]=true&populate=*&sort=sortOrder:asc`;
    return strapiRequest(endpoint);
  },

  // Get electric vehicles
  async getElectricVehicles() {
    const endpoint = `${env.strapi.vehicles}?filters[isElectric][$eq]=true&populate=*&sort=sortOrder:asc`;
    return strapiRequest(endpoint);
  }
};

// News API functions
export const newsAPI = {
  // Get all news articles
  async getArticles(params?: {
    category?: string;
    featured?: boolean;
    limit?: number;
    sort?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.category) {
      searchParams.append('filters[category][$eq]', params.category);
    }
    
    if (params?.featured !== undefined) {
      searchParams.append('filters[featured][$eq]', String(params.featured));
    }
    
    if (params?.limit) {
      searchParams.append('pagination[limit]', String(params.limit));
    }
    
    if (params?.sort) {
      searchParams.append('sort', params.sort);
    } else {
      searchParams.append('sort', 'publishedDate:desc');
    }

    searchParams.append('populate', '*');

    const endpoint = `${env.strapi.news}?${searchParams.toString()}`;
    return strapiRequest(endpoint);
  },

  // Get single article by slug
  async getArticle(slug: string) {
    const endpoint = `${env.strapi.news}?filters[slug][$eq]=${slug}&populate=*`;
    return strapiRequest(endpoint);
  },

  // Get featured articles
  async getFeaturedArticles() {
    const endpoint = `${env.strapi.news}?filters[featured][$eq]=true&populate=*&sort=publishedDate:desc&pagination[limit]=3`;
    return strapiRequest(endpoint);
  }
};

// Testimonials API functions
export const testimonialsAPI = {
  // Get all testimonials
  async getTestimonials(params?: {
    featured?: boolean;
    verified?: boolean;
    rating?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.featured !== undefined) {
      searchParams.append('filters[featured][$eq]', String(params.featured));
    }
    
    if (params?.verified !== undefined) {
      searchParams.append('filters[verified][$eq]', String(params.verified));
    }
    
    if (params?.rating) {
      searchParams.append('filters[rating][$gte]', String(params.rating));
    }
    
    if (params?.limit) {
      searchParams.append('pagination[limit]', String(params.limit));
    }

    searchParams.append('populate', '*');
    searchParams.append('sort', 'createdAt:desc');

    const endpoint = `${env.strapi.testimonials}?${searchParams.toString()}`;
    return strapiRequest(endpoint);
  },

  // Get testimonials for specific vehicle
  async getVehicleTestimonials(vehicleId: string) {
    const endpoint = `${env.strapi.testimonials}?filters[vehiclePurchased][id][$eq]=${vehicleId}&populate=*`;
    return strapiRequest(endpoint);
  }
};

// Dealers API functions
export const dealersAPI = {
  // Get all dealers
  async getDealers(params?: {
    type?: string;
    city?: string;
    active?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.type) {
      searchParams.append('filters[type][$eq]', params.type);
    }
    
    if (params?.city) {
      searchParams.append('filters[city][$eq]', params.city);
    }
    
    if (params?.active !== undefined) {
      searchParams.append('filters[active][$eq]', String(params.active));
    }

    searchParams.append('populate', '*');
    searchParams.append('sort', 'sortOrder:asc');

    const endpoint = `${env.strapi.dealers}?${searchParams.toString()}`;
    return strapiRequest(endpoint);
  },

  // Get dealer by slug
  async getDealer(slug: string) {
    const endpoint = `${env.strapi.dealers}?filters[slug][$eq]=${slug}&populate=*`;
    return strapiRequest(endpoint);
  }
};

// Promotions API functions
export const promotionsAPI = {
  // Get active promotions
  async getPromotions(params?: {
    active?: boolean;
    featured?: boolean;
    type?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.active !== undefined) {
      searchParams.append('filters[active][$eq]', String(params.active));
    }
    
    if (params?.featured !== undefined) {
      searchParams.append('filters[featured][$eq]', String(params.featured));
    }
    
    if (params?.type) {
      searchParams.append('filters[type][$eq]', params.type);
    }

    // Only show current promotions (not expired)
    const now = new Date().toISOString();
    searchParams.append('filters[startDate][$lte]', now);
    searchParams.append('filters[endDate][$gte]', now);

    searchParams.append('populate', '*');
    searchParams.append('sort', 'priority:desc,createdAt:desc');

    const endpoint = `${env.strapi.promotions}?${searchParams.toString()}`;
    return strapiRequest(endpoint);
  },

  // Get promotion by slug
  async getPromotion(slug: string) {
    const endpoint = `${env.strapi.promotions}?filters[slug][$eq]=${slug}&populate=*`;
    return strapiRequest(endpoint);
  }
};

// Spare Parts API functions
export const partsAPI = {
  // Get spare parts
  async getParts(params?: {
    category?: string;
    vehicleId?: string;
    popular?: boolean;
    inStock?: boolean;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    
    if (params?.category) {
      searchParams.append('filters[category][$eq]', params.category);
    }
    
    if (params?.vehicleId) {
      searchParams.append('filters[compatibleVehicles][id][$eq]', params.vehicleId);
    }
    
    if (params?.popular !== undefined) {
      searchParams.append('filters[popular][$eq]', String(params.popular));
    }
    
    if (params?.inStock) {
      searchParams.append('filters[stockStatus][$eq]', 'In Stock');
    }
    
    if (params?.search) {
      searchParams.append('filters[$or][0][name][$containsi]', params.search);
      searchParams.append('filters[$or][1][partNumber][$containsi]', params.search);
    }

    searchParams.append('populate', '*');
    searchParams.append('sort', 'popular:desc,name:asc');

    const endpoint = `${env.strapi.parts}?${searchParams.toString()}`;
    return strapiRequest(endpoint);
  },

  // Get part by part number
  async getPart(partNumber: string) {
    const endpoint = `${env.strapi.parts}?filters[partNumber][$eq]=${partNumber}&populate=*`;
    return strapiRequest(endpoint);
  }
};

// Lead generation functions (POST requests)
export const leadsAPI = {
  // Submit test drive request
  async submitTestDriveRequest(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    vehicleInterest: string;
    dealerPreference: string;
    preferredDate: string;
    preferredTime: string;
    message?: string;
  }) {
    const endpoint = '/api/test-drive-requests';
    return strapiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ data })
    });
  },

  // Submit quote request
  async submitQuoteRequest(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    vehicleInterest: string;
    intendedUse: string;
    timeline: string;
    tradeIn?: boolean;
    tradeInDetails?: string;
    financingNeeded?: boolean;
    message?: string;
  }) {
    const endpoint = '/api/quote-requests';
    return strapiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ data })
    });
  },

  // Submit service appointment
  async submitServiceAppointment(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    vehicleModel: string;
    vin?: string;
    serviceType: string;
    dealerLocation: string;
    preferredDate: string;
    preferredTime: string;
    description: string;
  }) {
    const endpoint = '/api/service-appointments';
    return strapiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ data })
    });
  }
};

// Health check function
export async function checkStrapiConnection() {
  try {
    const response = await fetch(`${strapiConfig.baseURL}/api/vehicles?pagination[limit]=1`);
    return response.ok;
  } catch {
    return false;
  }
}

// Export all APIs
export const strapiAPI = {
  vehicles: vehicleAPI,
  news: newsAPI,
  testimonials: testimonialsAPI,
  dealers: dealersAPI,
  promotions: promotionsAPI,
  parts: partsAPI,
  leads: leadsAPI,
  checkConnection: checkStrapiConnection,
};
