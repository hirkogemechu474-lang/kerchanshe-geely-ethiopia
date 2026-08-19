export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: "discount" | "financing" | "trade-in" | "package" | "seasonal";
  value: string;
  validFrom: string;
  validUntil: string;
  vehicles: string[];
  terms: string[];
  image: string;
  featured: boolean;
  active: boolean;
}

export const promotions: Promotion[] = [
  {
    id: "promo-001",
    title: "New Year Special Offer",
    description: "Celebrate 2027 with special pricing on select Geely models. Limited time offer with attractive financing options.",
    type: "discount",
    value: "ETB 200,000 off",
    validFrom: "2027-01-01",
    validUntil: "2027-01-31",
    vehicles: ["Coolray", "Emgrand", "Azkarra"],
    terms: [
      "Offer valid on new vehicle purchases only",
      "Cannot be combined with other offers", 
      "Subject to credit approval",
      "Limited stock available"
    ],
    image: "/promotions/new-year-2027.jpg",
    featured: true,
    active: true,
  },
  {
    id: "promo-002", 
    title: "0% Financing for 12 Months",
    description: "Get 0% interest financing for the first 12 months on Geely Monjaro. Make your dream SUV more affordable.",
    type: "financing",
    value: "0% APR",
    validFrom: "2026-12-01",
    validUntil: "2027-02-28",
    vehicles: ["Monjaro"],
    terms: [
      "Minimum 30% down payment required",
      "Maximum loan term 60 months",
      "Standard rates apply after 12 months",
      "Subject to bank approval"
    ],
    image: "/promotions/zero-financing.jpg", 
    featured: true,
    active: true,
  },
  {
    id: "promo-003",
    title: "Trade-In Bonus Program",
    description: "Get an additional ETB 100,000 trade-in bonus when you upgrade to any new Geely vehicle.",
    type: "trade-in", 
    value: "ETB 100,000 bonus",
    validFrom: "2026-11-01",
    validUntil: "2027-03-31",
    vehicles: ["Coolray", "Emgrand", "Monjaro", "Azkarra", "Okavango"],
    terms: [
      "Trade-in vehicle must be 2015 or newer",
      "Vehicle must be in good condition",
      "Bonus applied to down payment", 
      "Professional appraisal required"
    ],
    image: "/promotions/trade-in-bonus.jpg",
    featured: false,
    active: true,
  },
  {
    id: "promo-004",
    title: "Electric Vehicle Incentive",
    description: "Special government incentive package for Geometry EX5 electric vehicle purchase.",
    type: "package",
    value: "Complete package",
    validFrom: "2026-10-01", 
    validUntil: "2027-12-31",
    vehicles: ["Geometry EX5"],
    terms: [
      "Includes home charging installation",
      "2 years free public charging",
      "Extended battery warranty",
      "Government tax incentive included"
    ],
    image: "/promotions/ev-incentive.jpg",
    featured: true,
    active: true,
  },
  {
    id: "promo-005",
    title: "Fleet Discount Program", 
    description: "Special pricing for corporate and fleet customers purchasing 3 or more vehicles.",
    type: "discount",
    value: "Up to 15% off",
    validFrom: "2026-08-01",
    validUntil: "2027-07-31", 
    vehicles: ["Coolray", "Emgrand", "Monjaro", "Azkarra", "Okavango"],
    terms: [
      "Minimum 3 vehicle purchase",
      "Corporate registration required",
      "Volume discounts available",
      "Dedicated fleet support"
    ],
    image: "/promotions/fleet-program.jpg",
    featured: false,
    active: true,
  },
  {
    id: "promo-006",
    title: "Timkat Festival Special",
    description: "Celebrate Timkat with exclusive offers on Geely vehicles. Limited time festival pricing.",
    type: "seasonal",
    value: "Festival pricing",
    validFrom: "2027-01-15",
    validUntil: "2027-01-25",
    vehicles: ["Coolray", "Emgrand"],
    terms: [
      "Festival period offer only",
      "Limited to 50 vehicles",
      "First come, first served",
      "Delivery within festival period"
    ],
    image: "/promotions/timkat-special.jpg", 
    featured: false,
    active: true,
  }
];

export const getActivePromotions = (): Promotion[] => {
  const now = new Date();
  return promotions.filter(p => {
    const validFrom = new Date(p.validFrom);
    const validUntil = new Date(p.validUntil);
    return p.active && now >= validFrom && now <= validUntil;
  });
};

export const getFeaturedPromotions = (): Promotion[] => {
  return getActivePromotions().filter(p => p.featured);
};

export const getPromotionsByVehicle = (vehicle: string): Promotion[] => {
  return getActivePromotions().filter(p => 
    p.vehicles.some(v => v.toLowerCase().includes(vehicle.toLowerCase()))
  );
};

export const getPromotionsByType = (type: Promotion["type"]): Promotion[] => {
  return getActivePromotions().filter(p => p.type === type);
};