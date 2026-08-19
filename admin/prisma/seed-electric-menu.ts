import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Electric menu...');

  // Clear existing electric menu data
  console.log('🗑️ Clearing existing electric data...');
  await prisma.electricMenuPage.deleteMany();
  await prisma.electricItem.deleteMany();
  await prisma.electricSection.deleteMany();
  console.log('✅ Existing data cleared');

  // Create Models section
  const modelsSection = await prisma.electricSection.create({
    data: {
      title: 'Models',
      slug: 'models',
      description: 'Electric vehicle models',
      icon: 'Car',
      displayOrder: 0,
      isActive: true,
    },
  });

  // Create Charging section
  const chargingSection = await prisma.electricSection.create({
    data: {
      title: 'Charging',
      slug: 'charging',
      description: 'Charging infrastructure and solutions',
      icon: 'Zap',
      displayOrder: 1,
      isActive: true,
    },
  });

  // Create Benefits section
  const benefitsSection = await prisma.electricSection.create({
    data: {
      title: 'Benefits',
      slug: 'benefits',
      description: 'Benefits of going electric',
      icon: 'Award',
      displayOrder: 2,
      isActive: true,
    },
  });

  console.log('✅ Sections created');

  // Charging items
  const chargingMapItem = await prisma.electricItem.create({
    data: {
      sectionId: chargingSection.id,
      title: 'Charging Map',
      description: 'Find charging stations across Ethiopia',
      icon: 'MapPin',
      url: '/electric/charging-map',
      displayOrder: 0,
      isActive: true,
      isFeatured: false,
    },
  });

  const homeChargingItem = await prisma.electricItem.create({
    data: {
      sectionId: chargingSection.id,
      title: 'Home Charging',
      description: 'Install home charging solutions',
      icon: 'Home',
      url: '/electric/home-charging',
      displayOrder: 1,
      isActive: true,
      isFeatured: false,
    },
  });

  const batteryItem = await prisma.electricItem.create({
    data: {
      sectionId: chargingSection.id,
      title: 'Battery & Warranty',
      description: 'Battery technology, lifespan & warranty coverage',
      icon: 'Battery',
      url: '/electric/battery',
      displayOrder: 2,
      isActive: true,
      isFeatured: false,
    },
  });

  const fastChargingItem = await prisma.electricItem.create({
    data: {
      sectionId: chargingSection.id,
      title: 'Fast Charging',
      description: 'DC fast charging network',
      icon: 'Zap',
      url: '/electric/fast-charging',
      displayOrder: 3,
      isActive: true,
      isFeatured: true,
    },
  });

  // Benefits items
  const calculatorItem = await prisma.electricItem.create({
    data: {
      sectionId: benefitsSection.id,
      title: 'Cost Calculator',
      description: 'Calculate fuel savings with electric',
      icon: 'Calculator',
      url: '/electric/calculator',
      displayOrder: 0,
      isActive: true,
      isFeatured: false,
    },
  });

  const incentivesItem = await prisma.electricItem.create({
    data: {
      sectionId: benefitsSection.id,
      title: 'Government Incentives',
      description: 'Tax benefits and subsidies',
      icon: 'Coins',
      url: '/electric/incentives',
      displayOrder: 1,
      isActive: true,
      isFeatured: false,
    },
  });

  const environmentItem = await prisma.electricItem.create({
    data: {
      sectionId: benefitsSection.id,
      title: 'Environmental Impact',
      description: 'Reduce your carbon footprint',
      icon: 'Leaf',
      url: '/electric/environment',
      displayOrder: 2,
      isActive: true,
      isFeatured: false,
    },
  });

  console.log('✅ Items created');

  // Create sample pages
  await prisma.electricMenuPage.create({
    data: {
      itemId: chargingMapItem.id,
      title: 'Electric Vehicle Charging Map',
      slug: 'charging-map',
      excerpt: 'Find charging stations across Ethiopia',
      content: `
        <h2>Find Charging Stations Near You</h2>
        <p>Discover the growing network of electric vehicle charging stations across Ethiopia.</p>
        
        <h3>Charging Network</h3>
        <ul>
          <li>DC Fast Charging stations in major cities</li>
          <li>Level 2 charging at shopping centers</li>
          <li>Home charging installation services</li>
        </ul>
        
        <h3>How to Use</h3>
        <ol>
          <li>Find the nearest charging station</li>
          <li>Check availability in real-time</li>
          <li>Start charging with your mobile app</li>
        </ol>
        
        <h3>Charging Station Locations</h3>
        <p>We have partnered with leading charging infrastructure providers to offer convenient charging across Addis Ababa and major highways.</p>
      `,
      heroImage: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200',
      metaTitle: 'EV Charging Map | Geely Ethiopia',
      metaDescription: 'Find electric vehicle charging stations across Ethiopia. View locations, availability, and pricing.',
      isPublished: true,
    },
  });

  await prisma.electricMenuPage.create({
    data: {
      itemId: homeChargingItem.id,
      title: 'Home Charging Solutions',
      slug: 'home-charging',
      excerpt: 'Install your own EV charging station at home',
      content: `
        <h2>Charge at Home, Conveniently</h2>
        <p>Install a home charging solution and wake up to a full battery every morning.</p>
        
        <h3>Benefits of Home Charging</h3>
        <ul>
          <li>Convenience - Charge overnight while you sleep</li>
          <li>Lower cost - Home electricity rates are cheaper</li>
          <li>Time-saving - No trips to charging stations</li>
          <li>Weatherproof - Charge in any condition</li>
        </ul>
        
        <h3>Installation Process</h3>
        <ol>
          <li>Contact our installation team</li>
          <li>Site inspection and assessment</li>
          <li>Professional installation (1-2 days)</li>
          <li>Testing and activation</li>
        </ol>
        
        <h3>Charger Options</h3>
        <p>We offer Level 2 chargers (240V) that can fully charge your Geometry EX5 in 6-8 hours.</p>
      `,
      heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      metaTitle: 'Home EV Charging Installation | Geely Ethiopia',
      metaDescription: 'Install a home charging station for your electric vehicle. Professional installation, weatherproof chargers.',
      isPublished: true,
    },
  });

  await prisma.electricMenuPage.create({
    data: {
      itemId: fastChargingItem.id,
      title: 'DC Fast Charging Network',
      slug: 'fast-charging',
      excerpt: 'Charge to 80% in just 30 minutes',
      content: `
        <h2>Fast Charging On The Go</h2>
        <p>Our DC fast charging network allows you to charge to 80% in just 30 minutes.</p>
        
        <h3>Fast Charging Locations</h3>
        <ul>
          <li>Bole International Airport</li>
          <li>Meskel Square Shopping Complex</li>
          <li>Addis Ababa Stadium</li>
          <li>Hawassa City Center</li>
        </ul>
        
        <h3>How Fast Charging Works</h3>
        <p>DC fast chargers deliver high-power direct current to your vehicle's battery, significantly reducing charging time compared to AC chargers.</p>
        
        <h3>Charging Speeds</h3>
        <ul>
          <li>50kW Charger: 0-80% in 60 minutes</li>
          <li>100kW Charger: 0-80% in 35 minutes</li>
          <li>150kW Charger: 0-80% in 25 minutes</li>
        </ul>
        
        <h3>Payment Options</h3>
        <p>Pay via mobile app, RFID card, or contactless payment at the charging station.</p>
      `,
      heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      metaTitle: 'DC Fast Charging Network | Geely Ethiopia',
      metaDescription: 'Fast charge your electric vehicle in 30 minutes. Find DC fast charging stations across Ethiopia.',
      isPublished: true,
    },
  });

  await prisma.electricMenuPage.create({
    data: {
      itemId: calculatorItem.id,
      title: 'Electric Vehicle Cost Calculator',
      slug: 'calculator',
      excerpt: 'Calculate your savings with an electric vehicle',
      content: `
        <h2>See How Much You'll Save</h2>
        <p>Compare the total cost of ownership between electric and gasoline vehicles.</p>
        
        <h3>Cost Comparison (5 Years)</h3>
        <table>
          <tr>
            <th>Category</th>
            <th>Gasoline Vehicle</th>
            <th>Electric Vehicle</th>
            <th>Savings</th>
          </tr>
          <tr>
            <td>Fuel/Electricity</td>
            <td>ETB 450,000</td>
            <td>ETB 90,000</td>
            <td>ETB 360,000</td>
          </tr>
          <tr>
            <td>Maintenance</td>
            <td>ETB 180,000</td>
            <td>ETB 45,000</td>
            <td>ETB 135,000</td>
          </tr>
          <tr>
            <td>Insurance</td>
            <td>ETB 75,000</td>
            <td>ETB 60,000</td>
            <td>ETB 15,000</td>
          </tr>
          <tr>
            <td><strong>Total</strong></td>
            <td><strong>ETB 705,000</strong></td>
            <td><strong>ETB 195,000</strong></td>
            <td><strong>ETB 510,000</strong></td>
          </tr>
        </table>
        
        <h3>Additional Benefits</h3>
        <ul>
          <li>No oil changes required</li>
          <li>Regenerative braking reduces brake wear</li>
          <li>Fewer moving parts = less maintenance</li>
          <li>Lower insurance premiums</li>
        </ul>
      `,
      heroImage: 'https://images.unsplash.com/photo-1554672408-17e7c7fd5e10?w=1200',
      metaTitle: 'EV Cost Calculator | Geely Ethiopia',
      metaDescription: 'Calculate your savings with an electric vehicle. Compare fuel, maintenance, and total ownership costs.',
      isPublished: true,
    },
  });

  await prisma.electricMenuPage.create({
    data: {
      itemId: incentivesItem.id,
      title: 'Government Incentives for Electric Vehicles',
      slug: 'incentives',
      excerpt: 'Tax benefits and subsidies for EV buyers',
      content: `
        <h2>Government Support for Electric Vehicles</h2>
        <p>The Ethiopian government offers various incentives to encourage electric vehicle adoption.</p>
        
        <h3>Available Incentives</h3>
        <ul>
          <li><strong>Import Tax Exemption:</strong> 0% import duty on electric vehicles</li>
          <li><strong>VAT Reduction:</strong> Reduced VAT rate of 5% (vs 15% for gasoline)</li>
          <li><strong>Excise Tax Waiver:</strong> No excise tax on EVs</li>
          <li><strong>Charging Infrastructure:</strong> Subsidized home charger installation</li>
        </ul>
        
        <h3>How Much You Save</h3>
        <p>On a typical ETB 6,000,000 electric vehicle, you save approximately:</p>
        <ul>
          <li>Import duty: ETB 900,000</li>
          <li>VAT difference: ETB 600,000</li>
          <li>Excise tax: ETB 1,200,000</li>
          <li><strong>Total savings: ETB 2,700,000!</strong></li>
        </ul>
        
        <h3>How to Apply</h3>
        <p>Our dealer team will assist you with all paperwork and applications for government incentives.</p>
      `,
      heroImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200',
      metaTitle: 'EV Government Incentives | Geely Ethiopia',
      metaDescription: 'Learn about tax benefits and subsidies for electric vehicle buyers in Ethiopia. Save up to ETB 2.7M.',
      isPublished: true,
    },
  });

  await prisma.electricMenuPage.create({
    data: {
      itemId: environmentItem.id,
      title: 'Environmental Impact of Electric Vehicles',
      slug: 'environment',
      excerpt: 'Reduce your carbon footprint with electric vehicles',
      content: `
        <h2>Drive Clean, Drive Electric</h2>
        <p>Electric vehicles produce zero tailpipe emissions, helping combat air pollution and climate change.</p>
        
        <h3>Environmental Benefits</h3>
        <ul>
          <li><strong>Zero Emissions:</strong> No CO2, NO<sub>x</sub>, or particulate emissions while driving</li>
          <li><strong>Cleaner Air:</strong> Reduces urban air pollution and smog</li>
          <li><strong>Lower Carbon Footprint:</strong> Even with electricity from grid</li>
          <li><strong>Renewable Energy:</strong> Can be charged with solar or wind power</li>
        </ul>
        
        <h3>Impact Comparison (Per Year)</h3>
        <table>
          <tr>
            <th>Metric</th>
            <th>Gasoline Vehicle</th>
            <th>Electric Vehicle</th>
          </tr>
          <tr>
            <td>CO2 Emissions</td>
            <td>4.6 tons</td>
            <td>1.2 tons</td>
          </tr>
          <tr>
            <td>Air Pollutants</td>
            <td>High</td>
            <td>Zero</td>
          </tr>
          <tr>
            <td>Noise Pollution</td>
            <td>Significant</td>
            <td>Minimal</td>
          </tr>
        </table>
        
        <h3>Your Contribution</h3>
        <p>By driving electric, you're helping Ethiopia meet its climate goals and creating a cleaner future for the next generation.</p>
      `,
      heroImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200',
      metaTitle: 'EV Environmental Impact | Geely Ethiopia',
      metaDescription: 'Learn how electric vehicles reduce carbon emissions and help combat climate change in Ethiopia.',
      isPublished: true,
    },
  });

  console.log('✅ Sample pages created');
  console.log('🎉 Electric menu seed complete!');
  console.log('');
  console.log('Created:');
  console.log('- 3 sections (Models, Charging, Benefits)');
  console.log('- 6 menu items');
  console.log('- 6 full content pages');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
