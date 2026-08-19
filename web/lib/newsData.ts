export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishDate: string;
  category: string;
  tags: string[];
  image: string;
  featured: boolean;
  readTime: number;
}

export const newsCategories = [
  "Product Launch",
  "Company News", 
  "Industry News",
  "Technology",
  "Events",
  "Press Release",
];

export const newsArticles: NewsArticle[] = [
  {
    id: "news-001",
    title: "Geely Monjaro Officially Launches in Ethiopia",
    slug: "geely-monjaro-launches-ethiopia",
    excerpt: "The flagship Geely Monjaro SUV is now available at showrooms across Ethiopia, bringing premium features and advanced safety technology to Ethiopian families.",
    content: `
The highly anticipated Geely Monjaro has officially launched in Ethiopia, marking a significant milestone in the country's automotive landscape. This flagship SUV represents Geely's commitment to bringing world-class vehicles to Ethiopian customers.

## Key Features

The Monjaro comes equipped with:
- 2.0L Turbocharged Engine (238 HP)
- 8-Speed Automatic Transmission
- All-Wheel Drive System
- 12.3-inch Digital Cockpit
- 360-Degree Camera System
- Advanced Driver Assistance Systems

## Availability

The Monjaro is now available at all Geely showrooms across Ethiopia, with special launch financing offers available through our partner banks.

## Customer Response

"The response has been overwhelming," said Sales Director Ahmed Hassan. "Ethiopian customers appreciate the combination of luxury, safety, and value that the Monjaro offers."

The vehicle starts at ETB 5,650,000 and comes with Geely's comprehensive 5-year warranty coverage.
    `,
    author: "Geely Ethiopia Communications Team",
    publishDate: "2026-07-20",
    category: "Product Launch", 
    tags: ["Monjaro", "SUV", "Launch", "Ethiopia"],
    image: "/news/monjaro-launch.jpg",
    featured: true,
    readTime: 3,
  },
  {
    id: "news-002",
    title: "Choosing the Right SUV for Ethiopian Roads",
    slug: "choosing-suv-ethiopian-roads",
    excerpt: "A comprehensive guide to selecting the perfect SUV for Ethiopia's diverse terrain and driving conditions, from city streets to highland adventures.",
    content: `
Ethiopia's diverse landscape demands vehicles that can handle everything from Addis Ababa's busy streets to the highland roads of Lalibela. Here's your guide to choosing the right SUV.

## Key Considerations

### Ground Clearance
Ethiopian roads often require higher ground clearance. The Geely Coolray offers 190mm, while the Monjaro provides 206mm for more challenging terrain.

### Fuel Efficiency
With fluctuating fuel prices, efficiency matters. The Coolray achieves 6.8L/100km, making it ideal for daily commuting.

### Safety Features
Modern safety is non-negotiable. All Geely SUVs come with:
- Multiple airbags
- ABS with EBD
- Electronic Stability Control
- Hill Start Assist

### Comfort & Technology
Long journeys require comfort. Features like climate control, infotainment systems, and spacious interiors enhance the driving experience.

## Our Recommendations

- **City Driving**: Geely Coolray - Compact, efficient, feature-rich
- **Family Use**: Geely Azkarra - Perfect balance of size and features
- **Luxury**: Geely Monjaro - Premium features and capability
- **Large Families**: Geely Okavango - 7-seater with ample space

Visit our showrooms for test drives and expert consultation.
    `,
    author: "Technical Team",
    publishDate: "2026-06-28",
    category: "Technology",
    tags: ["SUV", "Buying Guide", "Ethiopian Roads"],
    image: "/news/suv-guide.jpg",
    featured: false,
    readTime: 5,
  },
  {
    id: "news-003", 
    title: "Geely Ethiopia Expands Service Network",
    slug: "geely-ethiopia-expands-service-network",
    excerpt: "New service centers opening in regional cities, bringing professional Geely maintenance and genuine parts closer to customers nationwide.",
    content: `
Geely Ethiopia is proud to announce the expansion of our service network with new facilities in Bahir Dar, Hawassa, and Mekelle, bringing our total service points to six locations nationwide.

## New Service Centers

### Bahir Dar Service Center
- Fully equipped workshop
- Genuine parts inventory
- Certified technicians
- Customer waiting area with amenities

### Enhanced Hawassa Operations
- Expanded service bays
- Express service lane
- Parts warehouse
- Training facility

### Mekelle Full-Service Center
- Sales and service under one roof
- Comprehensive parts stock
- Regional parts distribution hub

## Service Excellence

All centers feature:
- Factory-trained technicians
- Genuine Geely parts only
- Advanced diagnostic equipment
- Customer-friendly facilities
- Transparent pricing

## Customer Benefits

This expansion means:
- Reduced waiting times
- Faster parts availability
- Consistent service quality
- Convenient locations

"We're committed to supporting our customers throughout their ownership experience," said Service Manager Sara Tekle.

Book your next service appointment at our expanded network and experience the difference professional Geely care makes.
    `,
    author: "Service Operations Team", 
    publishDate: "2026-05-15",
    category: "Company News",
    tags: ["Service", "Expansion", "Customer Care"],
    image: "/news/service-expansion.jpg", 
    featured: false,
    readTime: 4,
  },
  {
    id: "news-004",
    title: "Electric Future: Geometry EX5 in Ethiopian Market",
    slug: "electric-future-geometry-ex5-ethiopian-market",
    excerpt: "Exploring the potential of electric vehicles in Ethiopia with the arrival of the Geometry EX5, and the infrastructure developments supporting EV adoption.", 
    content: `
The automotive future is electric, and Ethiopia is ready to embrace this transformation with the introduction of the Geometry EX5, Geely's advanced electric SUV.

## The EV Advantage in Ethiopia

### Environmental Impact
With growing environmental consciousness in Ethiopian cities, the zero-emission Geometry EX5 offers a sustainable transportation solution.

### Economic Benefits
- 70% lower running costs compared to petrol vehicles
- Reduced dependence on fuel imports
- Lower maintenance requirements

### Technology Leadership
The EX5 showcases cutting-edge technology:
- 530km driving range (NEDC)
- 70kWh battery capacity
- Advanced regenerative braking
- Over-the-air updates

## Charging Infrastructure

Ethiopia's charging network is developing:
- Home charging solutions available
- Public charging at shopping centers
- Fast charging at select locations
- Solar-powered charging stations planned

## Government Support

The Ethiopian government supports EV adoption through:
- Reduced import duties
- Tax incentives
- Infrastructure development programs

## Customer Education

Geely Ethiopia is committed to EV education:
- Showroom demonstrations
- Test drive programs
- Charging workshops
- Maintenance training

## Market Reception

Early customer feedback has been overwhelmingly positive, with particular praise for:
- Silent operation
- Instant acceleration
- Advanced features
- Environmental benefits

The Geometry EX5 represents more than just a vehicle – it's a step toward a sustainable automotive future for Ethiopia.
    `,
    author: "EV Specialist Team",
    publishDate: "2026-04-10", 
    category: "Technology",
    tags: ["Electric Vehicle", "Geometry EX5", "Sustainability", "Future"],
    image: "/news/ev-future.jpg",
    featured: true,
    readTime: 6,
  },
];

export const getFeaturedNews = (): NewsArticle[] => {
  return newsArticles.filter(article => article.featured);
};

export const getNewsByCategory = (category: string): NewsArticle[] => {
  return newsArticles.filter(article => article.category === category);
};

export const getLatestNews = (limit?: number): NewsArticle[] => {
  const sorted = [...newsArticles].sort((a, b) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
};

export const getNewsById = (id: string): NewsArticle | undefined => {
  return newsArticles.find(article => article.id === id);
};

export const getNewsBySlug = (slug: string): NewsArticle | undefined => {
  return newsArticles.find(article => article.slug === slug);
};