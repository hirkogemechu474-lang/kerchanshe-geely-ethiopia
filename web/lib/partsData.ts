export interface Part {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  vehicle: string[];
  price: number;
  priceFormatted: string;
  availability: "in-stock" | "limited" | "out-of-stock" | "special-order";
  description: string;
  image: string;
  genuine: boolean;
  warranty: string;
}

export const partCategories = [
  "Engine Parts",
  "Brake System",
  "Suspension",
  "Electrical",
  "Body Parts",
  "Interior",
  "Filters",
  "Fluids & Oil",
  "Lighting",
  "Tires & Wheels",
];

export const parts: Part[] = [
  {
    id: "part-001",
    name: "Brake Pad Set (Front)",
    partNumber: "GE-BRK-001-F",
    category: "Brake System",
    vehicle: ["Coolray", "Emgrand", "Azkarra"],
    price: 2500,
    priceFormatted: "ETB 2,500",
    availability: "in-stock",
    description: "Genuine Geely front brake pads with superior stopping power and durability. Includes wear indicators for safety.",
    image: "/parts/brake-pads.jpg",
    genuine: true,
    warranty: "12 months or 20,000 km",
  },
  {
    id: "part-002",
    name: "Air Filter",
    partNumber: "GE-AF-002",
    category: "Filters",
    vehicle: ["Coolray", "Emgrand", "Monjaro", "Azkarra"],
    price: 1200,
    priceFormatted: "ETB 1,200",
    availability: "in-stock",
    description: "High-efficiency air filter that protects your engine and improves performance. Replace every 15,000 km.",
    image: "/parts/air-filter.jpg",
    genuine: true,
    warranty: "6 months",
  },
  {
    id: "part-003",
    name: "Oil Filter",
    partNumber: "GE-OF-003",
    category: "Filters",
    vehicle: ["Coolray", "Emgrand", "Monjaro", "Azkarra", "Okavango"],
    price: 850,
    priceFormatted: "ETB 850",
    availability: "in-stock",
    description: "Premium oil filter designed to keep your engine oil clean and extend engine life.",
    image: "/parts/oil-filter.jpg",
    genuine: true,
    warranty: "6 months",
  },
  {
    id: "part-004",
    name: "Headlight Assembly (LED)",
    partNumber: "GE-HL-004-L",
    category: "Lighting",
    vehicle: ["Coolray", "Monjaro"],
    price: 8900,
    priceFormatted: "ETB 8,900",
    availability: "special-order",
    description: "Complete LED headlight assembly with daytime running lights. Professional installation recommended.",
    image: "/parts/headlight.jpg",
    genuine: true,
    warranty: "24 months",
  },
  {
    id: "part-005",
    name: "Engine Oil (5W-30)",
    partNumber: "GE-EO-005",
    category: "Fluids & Oil",
    vehicle: ["Coolray", "Emgrand", "Monjaro", "Azkarra", "Okavango"],
    price: 3200,
    priceFormatted: "ETB 3,200",
    availability: "in-stock",
    description: "Fully synthetic engine oil (4L) specially formulated for Geely engines. Provides excellent protection in all climates.",
    image: "/parts/engine-oil.jpg",
    genuine: true,
    warranty: "N/A",
  },
  {
    id: "part-006",
    name: "Windshield Wipers (Set)",
    partNumber: "GE-WW-006",
    category: "Body Parts",
    vehicle: ["Coolray", "Emgrand", "Azkarra"],
    price: 1800,
    priceFormatted: "ETB 1,800",
    availability: "in-stock",
    description: "Premium windshield wiper blades designed for Ethiopian weather conditions. Set includes driver and passenger side.",
    image: "/parts/wipers.jpg",
    genuine: true,
    warranty: "6 months",
  },
  {
    id: "part-007",
    name: "Cabin Air Filter",
    partNumber: "GE-CAF-007",
    category: "Filters",
    vehicle: ["Coolray", "Emgrand", "Monjaro", "Azkarra"],
    price: 950,
    priceFormatted: "ETB 950",
    availability: "in-stock",
    description: "High-performance cabin air filter that removes dust, pollen, and odors for cleaner interior air.",
    image: "/parts/cabin-filter.jpg",
    genuine: true,
    warranty: "6 months",
  },
  {
    id: "part-008",
    name: "Spark Plugs (Set of 4)",
    partNumber: "GE-SP-008",
    category: "Engine Parts",
    vehicle: ["Coolray", "Emgrand", "Azkarra"],
    price: 2100,
    priceFormatted: "ETB 2,100",
    availability: "in-stock",
    description: "Iridium spark plugs for optimal engine performance and fuel efficiency. Set of 4 for 4-cylinder engines.",
    image: "/parts/spark-plugs.jpg",
    genuine: true,
    warranty: "12 months or 30,000 km",
  },
  {
    id: "part-009",
    name: "Battery (12V 60Ah)",
    partNumber: "GE-BAT-009",
    category: "Electrical",
    vehicle: ["Coolray", "Emgrand", "Azkarra"],
    price: 4500,
    priceFormatted: "ETB 4,500",
    availability: "limited",
    description: "Maintenance-free 12V battery with 60Ah capacity. Includes 2-year warranty and free installation.",
    image: "/parts/battery.jpg",
    genuine: true,
    warranty: "24 months",
  },
  {
    id: "part-010",
    name: "Brake Fluid (DOT 4)",
    partNumber: "GE-BF-010",
    category: "Fluids & Oil",
    vehicle: ["Coolray", "Emgrand", "Monjaro", "Azkarra", "Okavango"],
    price: 680,
    priceFormatted: "ETB 680",
    availability: "in-stock",
    description: "High-performance DOT 4 brake fluid (500ml) for reliable braking performance in all conditions.",
    image: "/parts/brake-fluid.jpg",
    genuine: true,
    warranty: "N/A",
  },
];

export const getPartsByCategory = (category: string): Part[] => {
  return parts.filter((p) => p.category === category);
};

export const getPartsByVehicle = (vehicle: string): Part[] => {
  return parts.filter((p) => 
    p.vehicle.some(v => v.toLowerCase().includes(vehicle.toLowerCase()))
  );
};

export const getPartsByAvailability = (availability: Part["availability"]): Part[] => {
  return parts.filter((p) => p.availability === availability);
};

export const searchParts = (query: string): Part[] => {
  const searchTerm = query.toLowerCase();
  return parts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.partNumber.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm) ||
      p.vehicle.some(v => v.toLowerCase().includes(searchTerm))
  );
};

export const getAvailabilityBadge = (availability: Part["availability"]) => {
  const badges = {
    "in-stock": { label: "In Stock", color: "bg-green-500", textColor: "text-green-700", bgColor: "bg-green-100" },
    "limited": { label: "Limited Stock", color: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-100" },
    "out-of-stock": { label: "Out of Stock", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-100" },
    "special-order": { label: "Special Order", color: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-100" },
  };
  return badges[availability];
};