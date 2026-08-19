/**
 * Strapi Vehicle API Client
 * Fetches vehicle data from Strapi CMS
 */

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

interface StrapiImage {
  id: number;
  attributes: {
    name: string;
    alternativeText: string | null;
    caption: string | null;
    width: number;
    height: number;
    formats: any;
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string | null;
    provider: string;
    provider_metadata: any | null;
    createdAt: string;
    updatedAt: string;
  };
}

interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiVehicleData {
  id: number;
  attributes: {
    name: string;
    slug: string;
    category: string;
    type: string;
    price: number;
    priceFormatted: string;
    mainImage: {
      data: StrapiImage;
    };
    gallery: {
      data: StrapiImage[];
    };
    availability: string;
    description: string;
    features: string[];
    specifications: {
      id: number;
      engine: string;
      power: string;
      transmission: string;
      fuelType: string;
      seating: number;
      drivetrain: string;
      fuelEconomy?: string;
      acceleration?: string;
      topSpeed?: string;
      range?: string;
      batteryCapacity?: string;
    };
    dimensions: {
      id: number;
      length: string;
      width: string;
      height: string;
      wheelbase: string;
      groundClearance: string;
    };
    safety: string[];
    warranty: string;
    colors: string[];
    isPopular: boolean;
    isNew: boolean;
    fuelType: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
}

export interface Vehicle {
  id: string;
  name: string;
  slug: string;
  category: string;
  type: 'suv' | 'sedan' | 'electric' | 'hybrid';
  price: number;
  priceFormatted: string;
  image: string;
  gallery: string[];
  availability: 'available' | 'coming-soon' | 'pre-order' | 'limited' | 'out-of-stock';
  description: string;
  features: string[];
  specs: {
    engine: string;
    power: string;
    transmission: string;
    fuelType: string;
    seating: number;
    drivetrain: string;
    fuelEconomy?: string;
    acceleration?: string;
    topSpeed?: string;
    range?: string;
    batteryCapacity?: string;
  };
  dimensions: {
    length: string;
    width: string;
    height: string;
    wheelbase: string;
    groundClearance: string;
  };
  safety: string[];
  warranty: string;
  colors: string[];
  isPopular?: boolean;
  isNew?: boolean;
  fuelType: string;
}

/**
 * Helper function to get image URL
 */
function getImageUrl(imageData: StrapiImage | null): string {
  if (!imageData) return '/vehicles/placeholder.jpg';
  
  const url = imageData.attributes.url;
  
  // If URL is absolute, return as is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Otherwise, prepend Strapi base URL
  return `${STRAPI_API_URL}${url}`;
}

/**
 * Transform Strapi vehicle data to our Vehicle interface
 */
function transformVehicle(strapiVehicle: StrapiVehicleData): Vehicle {
  const { id, attributes } = strapiVehicle;
  
  return {
    id: attributes.slug,
    name: attributes.name,
    slug: attributes.slug,
    category: attributes.category,
    type: attributes.type as any,
    price: attributes.price,
    priceFormatted: attributes.priceFormatted,
    image: attributes.mainImage?.data 
      ? getImageUrl(attributes.mainImage.data)
      : '/vehicles/placeholder.jpg',
    gallery: attributes.gallery?.data 
      ? attributes.gallery.data.map(img => getImageUrl(img))
      : [],
    availability: attributes.availability as any,
    description: attributes.description,
    features: attributes.features || [],
    specs: {
      engine: attributes.specifications.engine,
      power: attributes.specifications.power,
      transmission: attributes.specifications.transmission,
      fuelType: attributes.specifications.fuelType,
      seating: attributes.specifications.seating,
      drivetrain: attributes.specifications.drivetrain,
      fuelEconomy: attributes.specifications.fuelEconomy,
      acceleration: attributes.specifications.acceleration,
      topSpeed: attributes.specifications.topSpeed,
      range: attributes.specifications.range,
      batteryCapacity: attributes.specifications.batteryCapacity,
    },
    dimensions: {
      length: attributes.dimensions.length,
      width: attributes.dimensions.width,
      height: attributes.dimensions.height,
      wheelbase: attributes.dimensions.wheelbase,
      groundClearance: attributes.dimensions.groundClearance,
    },
    safety: attributes.safety || [],
    warranty: attributes.warranty,
    colors: attributes.colors || [],
    isPopular: attributes.isPopular,
    isNew: attributes.isNew,
    fuelType: attributes.fuelType,
  };
}

/**
 * Fetch all vehicles from Strapi
 */
export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(
      `${STRAPI_API_URL}/api/vehicles?populate=*&sort=order:asc`,
      {
        headers,
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.status}`);
    }

    const json: StrapiResponse<StrapiVehicleData[]> = await response.json();
    
    return json.data.map(transformVehicle);
  } catch (error) {
    console.error('Error fetching vehicles from Strapi:', error);
    
    // Fallback to static data if Strapi is not available
    const { getVehicles: getLocalVehicles } = await import('./vehicleData');
    return getLocalVehicles() as unknown as Vehicle[];
  }
}

/**
 * Fetch a single vehicle by slug
 */
export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(
      `${STRAPI_API_URL}/api/vehicles?filters[slug][$eq]=${slug}&populate=*`,
      {
        headers,
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicle: ${response.status}`);
    }

    const json: StrapiResponse<StrapiVehicleData[]> = await response.json();
    
    if (json.data.length === 0) {
      return null;
    }

    return transformVehicle(json.data[0]);
  } catch (error) {
    console.error(`Error fetching vehicle ${slug} from Strapi:`, error);
    
    // Fallback to static data
    const { getVehicleById } = await import('./vehicleData');
    return (getVehicleById(slug) as unknown as Vehicle) || null;
  }
}

/**
 * Fetch vehicles by type
 */
export async function getVehiclesByType(type: string): Promise<Vehicle[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(
      `${STRAPI_API_URL}/api/vehicles?filters[type][$eq]=${type}&populate=*&sort=order:asc`,
      {
        headers,
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch vehicles: ${response.status}`);
    }

    const json: StrapiResponse<StrapiVehicleData[]> = await response.json();
    
    return json.data.map(transformVehicle);
  } catch (error) {
    console.error(`Error fetching ${type} vehicles from Strapi:`, error);
    
    // Fallback to static data
    const { getVehiclesByType } = await import('./vehicleData');
    return getVehiclesByType(type as any) as unknown as Vehicle[];
  }
}

// Export type for backward compatibility
export type { Vehicle as VehicleType };

// Legacy exports for compatibility
export const vehicles = getVehicles;
export const getVehicleById = getVehicleBySlug;

// Availability badge helper
export const getAvailabilityBadge = (status: string) => {
  const badges: Record<string, { label: string; color: string }> = {
    "available": { label: "In Stock", color: "bg-green-500" },
    "coming-soon": { label: "Coming Soon", color: "bg-yellow-500" },
    "pre-order": { label: "Pre-Order", color: "bg-blue-500" },
    "limited": { label: "Limited Stock", color: "bg-orange-500" },
    "out-of-stock": { label: "Out of Stock", color: "bg-red-500" },
  };
  return badges[status] || badges["available"];
};
