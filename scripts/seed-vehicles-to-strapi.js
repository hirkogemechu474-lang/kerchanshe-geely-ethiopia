/**
 * Seed Vehicle Data to Strapi
 * 
 * This script imports vehicles from vehicleData.ts into Strapi CMS
 * Run with: node scripts/seed-vehicles-to-strapi.js
 */

const vehicles = [
  {
    name: "Geely Coolray",
    slug: "coolray",
    category: "SUV",
    type: "suv",
    price: 3450000,
    priceFormatted: "ETB 3,450,000",
    availability: "available",
    description: "Stylish and efficient compact SUV perfect for urban driving",
    features: [
      "10.25-inch HD Touchscreen",
      "Panoramic Sunroof",
      "LED Headlights & DRLs",
      "Automatic Climate Control",
      "Keyless Entry & Start",
      "Cruise Control",
      "Rear Parking Camera",
      "Apple CarPlay & Android Auto",
    ],
    specifications: {
      engine: "1.5L Turbocharged",
      power: "177 HP @ 5500 rpm",
      transmission: "7-Speed DCT",
      fuelType: "Petrol",
      seating: 5,
      drivetrain: "Front-Wheel Drive",
      fuelEconomy: "6.8L/100km",
      acceleration: "7.9 seconds (0-100 km/h)",
      topSpeed: "190 km/h",
    },
    dimensions: {
      length: "4330 mm",
      width: "1800 mm",
      height: "1609 mm",
      wheelbase: "2600 mm",
      groundClearance: "190 mm",
    },
    safety: [
      "6 Airbags",
      "ABS with EBD",
      "Electronic Stability Control (ESC)",
      "Hill Start Assist",
      "Tire Pressure Monitoring System (TPMS)",
      "ISOFIX Child Seat Anchors",
    ],
    warranty: "5 years or 150,000 km",
    colors: ["White", "Black", "Silver", "Blue", "Red"],
    isPopular: true,
    isNew: false,
    fuelType: "Petrol",
    order: 1
  },
  {
    name: "Geely Emgrand",
    slug: "emgrand",
    category: "Sedan",
    type: "sedan",
    price: 2980000,
    priceFormatted: "ETB 2,980,000",
    availability: "available",
    description: "Elegant sedan combining comfort, efficiency, and value",
    features: [
      "8-inch Touchscreen Infotainment",
      "Leather Seats",
      "Automatic Headlights",
      "Multi-Function Steering Wheel",
      "Bluetooth Connectivity",
      "USB Charging Ports",
      "Rear Parking Sensors",
      "Digital Climate Control",
    ],
    specifications: {
      engine: "1.5L DVVT",
      power: "109 HP @ 6000 rpm",
      transmission: "5-Speed Manual / CVT",
      fuelType: "Petrol",
      seating: 5,
      drivetrain: "Front-Wheel Drive",
      fuelEconomy: "5.9L/100km",
      acceleration: "11.2 seconds (0-100 km/h)",
      topSpeed: "180 km/h",
    },
    dimensions: {
      length: "4631 mm",
      width: "1789 mm",
      height: "1470 mm",
      wheelbase: "2650 mm",
      groundClearance: "150 mm",
    },
    safety: [
      "4 Airbags",
      "ABS with EBD",
      "Electronic Stability Control",
      "Hill Hold Control",
      "Rear View Camera",
      "ISOFIX Anchors",
    ],
    warranty: "5 years or 150,000 km",
    colors: ["White", "Black", "Silver", "Grey", "Blue"],
    isPopular: false,
    isNew: false,
    fuelType: "Petrol",
    order: 2
  },
  {
    name: "Geely Monjaro",
    slug: "monjaro",
    category: "SUV",
    type: "suv",
    price: 5650000,
    priceFormatted: "ETB 5,650,000",
    availability: "available",
    description: "Premium flagship SUV offering luxury features and performance",
    features: [
      "12.3-inch Digital Instrument Cluster",
      "12.3-inch Central Touchscreen",
      "Premium Leather Interior",
      "Panoramic Sunroof",
      "360° Camera System",
      "Adaptive Cruise Control",
      "Wireless Phone Charging",
      "Premium Sound System",
      "Powered Tailgate",
      "Ambient Lighting",
    ],
    specifications: {
      engine: "2.0L Turbocharged",
      power: "238 HP @ 5500 rpm",
      transmission: "8-Speed Automatic",
      fuelType: "Petrol",
      seating: 7,
      drivetrain: "All-Wheel Drive",
      fuelEconomy: "8.2L/100km",
      acceleration: "7.7 seconds (0-100 km/h)",
      topSpeed: "210 km/h",
    },
    dimensions: {
      length: "4770 mm",
      width: "1895 mm",
      height: "1689 mm",
      wheelbase: "2845 mm",
      groundClearance: "206 mm",
    },
    safety: [
      "8 Airbags",
      "ABS with EBD",
      "Electronic Stability Control",
      "Blind Spot Monitoring",
      "Lane Departure Warning",
      "Forward Collision Warning",
      "Automatic Emergency Braking",
      "TPMS",
    ],
    warranty: "5 years or 150,000 km",
    colors: ["White", "Black", "Silver", "Grey", "Blue", "Red"],
    isPopular: true,
    isNew: false,
    fuelType: "Petrol",
    order: 3
  },
  {
    name: "Geely Azkarra",
    slug: "azkarra",
    category: "SUV",
    type: "suv",
    price: 4200000,
    priceFormatted: "ETB 4,200,000",
    availability: "limited",
    description: "Perfect balance of style, comfort, and capability for families",
    features: [
      "10.25-inch Touchscreen",
      "Leather Upholstery",
      "Sunroof",
      "LED Headlights",
      "Smart Key System",
      "Auto Climate Control",
      "Rear Camera",
      "6-Speaker Audio",
    ],
    specifications: {
      engine: "1.5L Turbocharged",
      power: "177 HP @ 5500 rpm",
      transmission: "6-Speed Automatic",
      fuelType: "Petrol",
      seating: 5,
      drivetrain: "Front-Wheel Drive",
      fuelEconomy: "7.4L/100km",
      acceleration: "9.1 seconds (0-100 km/h)",
      topSpeed: "195 km/h",
    },
    dimensions: {
      length: "4544 mm",
      width: "1831 mm",
      height: "1713 mm",
      wheelbase: "2670 mm",
      groundClearance: "200 mm",
    },
    safety: [
      "6 Airbags",
      "ABS with EBD",
      "ESC",
      "Hill Start Assist",
      "TPMS",
      "ISOFIX",
    ],
    warranty: "5 years or 150,000 km",
    colors: ["White", "Black", "Silver", "Grey"],
    isPopular: false,
    isNew: false,
    fuelType: "Petrol",
    order: 4
  },
  {
    name: "Geely Okavango",
    slug: "okavango",
    category: "SUV",
    type: "suv",
    price: 4800000,
    priceFormatted: "ETB 4,800,000",
    availability: "available",
    description: "Spacious 7-seater SUV designed for large families",
    features: [
      "10.25-inch Infotainment System",
      "3-Row Seating (7 seats)",
      "Panoramic Sunroof",
      "LED Lighting Package",
      "Keyless Entry",
      "Dual-Zone Climate Control",
      "360° Camera",
      "Smart Connectivity",
    ],
    specifications: {
      engine: "1.8L Turbocharged",
      power: "184 HP @ 5500 rpm",
      transmission: "7-Speed DCT",
      fuelType: "Petrol",
      seating: 7,
      drivetrain: "Front-Wheel Drive",
      fuelEconomy: "7.9L/100km",
      acceleration: "10.2 seconds (0-100 km/h)",
      topSpeed: "190 km/h",
    },
    dimensions: {
      length: "4795 mm",
      width: "1895 mm",
      height: "1780 mm",
      wheelbase: "2845 mm",
      groundClearance: "195 mm",
    },
    safety: [
      "6 Airbags",
      "ABS with EBD",
      "ESC",
      "Hill Descent Control",
      "Blind Spot Detection",
      "TPMS",
    ],
    warranty: "5 years or 150,000 km",
    colors: ["White", "Black", "Silver", "Blue", "Grey"],
    isPopular: false,
    isNew: false,
    fuelType: "Petrol",
    order: 5
  },
  {
    name: "Geometry EX5",
    slug: "geometry-ex5",
    category: "Electric",
    type: "electric",
    price: 6100000,
    priceFormatted: "ETB 6,100,000",
    availability: "pre-order",
    description: "All-electric SUV combining zero emissions with cutting-edge technology",
    features: [
      "12.3-inch Digital Cockpit",
      "Wireless Charging",
      "Premium EV Interior",
      "Smart Regenerative Braking",
      "OTA Updates",
      "Voice Control",
      "Premium Sound System",
      "Heat Pump Climate System",
    ],
    specifications: {
      engine: "Electric Motor",
      power: "204 HP",
      transmission: "Single-Speed Automatic",
      fuelType: "Electric",
      seating: 5,
      drivetrain: "Front-Wheel Drive",
      range: "530 km (NEDC)",
      batteryCapacity: "70 kWh",
      acceleration: "7.5 seconds (0-100 km/h)",
      topSpeed: "165 km/h",
    },
    dimensions: {
      length: "4615 mm",
      width: "1901 mm",
      height: "1670 mm",
      wheelbase: "2750 mm",
      groundClearance: "180 mm",
    },
    safety: [
      "6 Airbags",
      "ABS with EBD",
      "ESC",
      "Lane Keeping Assist",
      "Adaptive Cruise Control",
      "Automatic Emergency Braking",
      "Battery Safety System",
    ],
    warranty: "5 years or 150,000 km (8 years battery)",
    colors: ["White", "Black", "Silver", "Blue"],
    isPopular: false,
    isNew: true,
    fuelType: "Electric",
    order: 6
  },
];

const STRAPI_URL = 'http://localhost:1337';

async function seedVehicles() {
  console.log('🚀 Starting vehicle data seeding to Strapi...\n');
  
  for (const vehicle of vehicles) {
    try {
      console.log(`📝 Creating ${vehicle.name}...`);
      
      const response = await fetch(`${STRAPI_URL}/api/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: vehicle
        }),
      });

      if (response.ok) {
        console.log(`✅ ${vehicle.name} created successfully\n`);
      } else {
        const error = await response.json();
        console.error(`❌ Failed to create ${vehicle.name}:`, error.error?.message || 'Unknown error');
      }
    } catch (error) {
      console.error(`❌ Error creating ${vehicle.name}:`, error.message);
    }
  }
  
  console.log('\n✨ Seeding completed!');
  console.log(`📊 Total vehicles: ${vehicles.length}`);
  console.log('\n💡 Next steps:');
  console.log('1. Open Strapi admin at http://localhost:1337/admin');
  console.log('2. Upload vehicle images to each vehicle entry');
  console.log('3. Publish the vehicles');
  console.log('4. Test the frontend at http://localhost:3000/models');
}

seedVehicles();
