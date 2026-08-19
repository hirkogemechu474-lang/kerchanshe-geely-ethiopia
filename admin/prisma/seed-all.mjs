// Master seed script — covers every model, safe to re-run (skips existing data)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting master seed...\n');

  // ─── 1. ADMIN USER ────────────────────────────────────────────────────────
  console.log('👤 Users...');
  const existing = await prisma.user.findUnique({ where: { email: 'admin@geelyethiopia.com' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: 'admin@geelyethiopia.com',
        name: 'System Administrator',
        passwordHash: await bcrypt.hash('Admin@2024!', 12),
        role: 'admin',
        isActive: true,
      },
    });
    console.log('  ✅ Admin user created');
  } else {
    console.log('  ⏭  Admin user exists');
  }

  // ─── 2. SETTINGS ─────────────────────────────────────────────────────────
  console.log('\n⚙️  Settings...');
  const settingsData = [
    { key: 'social_media_links', type: 'social', value: JSON.stringify({ facebook:'https://facebook.com/geelyethiopia', instagram:'https://instagram.com/geelyethiopia', twitter:'https://twitter.com/geelyethiopia', youtube:'https://youtube.com/@geelyethiopia', linkedin:'https://linkedin.com/company/geely-ethiopia', tiktok:'https://tiktok.com/@geelyethiopia' }) },
    { key: 'privacy_policy', type: 'policy', value: 'PRIVACY POLICY — Geely Ethiopia\n\nLast Updated: January 2026\n\nGeely Ethiopia (Kerchanshe Auto) is committed to protecting your privacy. We collect name, email, phone, and vehicle preference data solely to process your requests, book test drives, send quotations, and improve our services. Data is stored securely and never sold to third parties. You may request access, correction, or deletion of your data at any time by contacting info@geelyethiopia.com.' },
    { key: 'terms_of_service', type: 'policy', value: 'TERMS OF SERVICE — Geely Ethiopia\n\nLast Updated: January 2026\n\nBy using this website you agree to these terms. Vehicle prices are in ETB and subject to change. Test drives require a valid driver\'s licence and minimum age of 23. Quotations are valid for 30 days. Deposits are non-refundable. Geely Ethiopia is not liable for indirect or consequential damages. Contact: info@geelyethiopia.com | +251 11 000 0000' },
    { key: 'cookie_policy', type: 'policy', value: 'COOKIE POLICY — Geely Ethiopia\n\nWe use cookies to remember your preferences, analyse site traffic, and improve your experience. You may disable cookies in your browser settings, though some features may not function correctly. Essential cookies cannot be disabled as they are required for basic site operation.' },
  ];
  for (const s of settingsData) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }
  console.log(`  ✅ ${settingsData.length} settings upserted`);

  // ─── 3. HERO SECTIONS ────────────────────────────────────────────────────
  console.log('\n🎬 Hero sections...');
  if (await prisma.heroSection.count() === 0) {
    await prisma.heroSection.createMany({ data: [
      { title:'Experience the Future of Driving', subtitle:'Discover Innovation', description:'Explore Geely\'s cutting-edge technology, premium design, and unmatched safety that make every journey extraordinary.', mediaType:'IMAGE', imageUrl:'/uploads/homepage/1785751690296-Screenshot_2026-06-0...', buttonText:'Explore Models', buttonLink:'/models', status:'active', sortOrder:1, isActive:true },
      { title:'Go Electric with Geely', subtitle:'Sustainable Mobility', description:'Join the electric revolution with Geely\'s advanced EV technology. Zero emissions, maximum performance, incredible range.', mediaType:'IMAGE', imageUrl:'/images/vehicles/ex5/ex5-hero.jpg', buttonText:'Discover EVs', buttonLink:'/electric', status:'active', sortOrder:2, isActive:true },
      { title:'Limited Time Offers', subtitle:'New Year Sale', description:'Save up to 20% on select models. Special 0% financing for 12 months.', mediaType:'IMAGE', imageUrl:'/uploads/homepage/1785761259240-images.jpg', buttonText:'View Offers', buttonLink:'/offers', status:'active', sortOrder:3, isActive:true },
    ]});
    console.log('  ✅ 3 hero sections created');
  } else { console.log('  ⏭  Hero sections exist'); }

  // ─── 4. VEHICLE BRAND ────────────────────────────────────────────────────
  console.log('\n🏷️  Vehicle brand...');
  let brand = await prisma.vehicleBrand.findUnique({ where: { slug:'geely' } });
  if (!brand) {
    brand = await prisma.vehicleBrand.create({ data: { name:'Geely', slug:'geely', description:'Geely Auto Group — innovative design, advanced technology, exceptional value.', isActive:true, displayOrder:1 } });
    console.log('  ✅ Geely brand created');
  } else { console.log('  ⏭  Brand exists'); }

  // ─── 5. VEHICLE CATEGORIES ───────────────────────────────────────────────
  console.log('\n📁 Vehicle categories...');
  const catData = [
    { name:'SUVs', slug:'suvs', description:'Spacious and versatile sport utility vehicles.', metaTitle:'Geely SUVs', metaDescription:'Explore Geely SUVs — Coolray, Azkarra, Atlas.', displayOrder:1 },
    { name:'Sedans', slug:'sedans', description:'Elegant and efficient family sedans.', metaTitle:'Geely Sedans', metaDescription:'Discover Geely sedans — Emgrand, Preface.', displayOrder:2 },
    { name:'Electric', slug:'electric', description:'Zero-emission electric vehicles with cutting-edge technology.', metaTitle:'Geely Electric Vehicles', metaDescription:'Experience the future with Geely EVs.', displayOrder:3 },
  ];
  const cats = {};
  for (const c of catData) {
    let cat = await prisma.vehicleCategory.findUnique({ where: { slug: c.slug } });
    if (!cat) { cat = await prisma.vehicleCategory.create({ data: { ...c, brandId: brand.id, isActive:true } }); console.log(`  ✅ Category: ${c.name}`); }
    else { console.log(`  ⏭  Category: ${c.name}`); }
    cats[c.slug] = cat;
  }

  // ─── 6. VEHICLES ─────────────────────────────────────────────────────────
  console.log('\n🚗 Vehicles...');
  const vehicles = [
    { name:'Geely Coolray', slug:'coolray', model:'Coolray Sport', year:2024, category:'SUV', catSlug:'suvs', sku:'GEELY-COOLRAY-2024', basePrice:1250000, finalPrice:1200000, discountAmount:50000, discountType:'flat', badge:'Best Seller', stock:15, isFeatured:true, heroImageUrl:'/images/vehicles/ex5/ex5-hero.jpg', specs:{ engine:{ type:'1.5L Turbo', power:'177 HP', torque:'255 Nm', transmission:'7-Speed DCT', fuelType:'Gasoline' }, performance:{ topSpeed:'190 km/h', acceleration:'7.9s 0-100', fuelConsumption:'6.8L/100km' }, features:['Panoramic Sunroof','10.25" Touchscreen','Apple CarPlay & Android Auto','360° Camera','Adaptive Cruise Control','Lane Keep Assist','Auto Emergency Braking','Leather Seats'], safety:['6 Airbags','ABS+EBD','Traction Control','Hill Start Assist','ISOFIX','TPMS'], warranty:{ basic:'3yr/100,000km', powertrain:'5yr/150,000km' } } },
    { name:'Geely Azkarra', slug:'azkarra', model:'Azkarra Premium', year:2024, category:'SUV', catSlug:'suvs', sku:'GEELY-AZKARRA-2024', basePrice:1650000, finalPrice:1650000, stock:10, isFeatured:true, heroImageUrl:'/images/vehicles/ex5/ex5-hero.jpg', specs:{ engine:{ type:'1.8L Turbo', power:'184 HP', torque:'300 Nm', transmission:'7-Speed DCT', fuelType:'Gasoline' }, performance:{ topSpeed:'195 km/h', acceleration:'8.8s 0-100', fuelConsumption:'7.2L/100km' }, features:['Panoramic Sunroof','12.3" Cluster','12.3" Infotainment','Wireless Charging','360° Camera','Adaptive Cruise Control','Premium Leather'], safety:['6 Airbags','ESC','Hill Descent','Blind Spot','Rear Cross Traffic Alert'], warranty:{ basic:'3yr/100,000km', powertrain:'5yr/150,000km' } } },
    { name:'Geely Atlas', slug:'atlas', model:'Atlas Luxury', year:2024, category:'SUV', catSlug:'suvs', sku:'GEELY-ATLAS-2024', basePrice:2150000, finalPrice:2150000, badge:'Premium', stock:8, isFeatured:false, heroImageUrl:'/images/vehicles/ex5/ex5-hero.jpg', specs:{ engine:{ type:'2.0L Turbo', power:'238 HP', torque:'350 Nm', transmission:'8-Speed Auto', fuelType:'Gasoline' }, performance:{ topSpeed:'200 km/h', acceleration:'9.2s 0-100', fuelConsumption:'8.5L/100km' }, features:['7-Seat 3-Row','Dual Panoramic Sunroof','12.3" Cluster','12.3" Screen','Heated+Ventilated Seats','Power Tailgate','Adaptive LED'], safety:['8 Airbags','ESP','AEB','360° View'], warranty:{ basic:'3yr/100,000km', powertrain:'5yr/150,000km' } } },
    { name:'Geely Emgrand', slug:'emgrand', model:'Emgrand GL', year:2024, category:'Sedan', catSlug:'sedans', sku:'GEELY-EMGRAND-2024', basePrice:950000, finalPrice:920000, discountAmount:30000, discountType:'flat', badge:'Value Pick', stock:20, isFeatured:true, heroImageUrl:'/images/vehicles/ex5/ex5-hero.jpg', specs:{ engine:{ type:'1.5L NA', power:'109 HP', torque:'142 Nm', transmission:'CVT', fuelType:'Gasoline' }, performance:{ topSpeed:'185 km/h', acceleration:'11.3s 0-100', fuelConsumption:'5.9L/100km' }, features:['10.25" Touchscreen','Apple CarPlay','Cruise Control','Rear Sensors','Auto Climate'], safety:['4 Airbags','ABS+EBD','ESC','Reverse Camera','ISOFIX'], warranty:{ basic:'3yr/100,000km', powertrain:'5yr/150,000km' } } },
    { name:'Geely Preface', slug:'preface', model:'Preface Executive', year:2024, category:'Sedan', catSlug:'sedans', sku:'GEELY-PREFACE-2024', basePrice:1850000, finalPrice:1850000, badge:'Executive', stock:7, isFeatured:false, heroImageUrl:'/images/vehicles/ex5/ex5-hero.jpg', specs:{ engine:{ type:'2.0L Turbo', power:'190 HP', torque:'300 Nm', transmission:'7-Speed DCT', fuelType:'Gasoline' }, performance:{ topSpeed:'210 km/h', acceleration:'7.9s 0-100', fuelConsumption:'6.7L/100km' }, features:['12.3" Cluster','12.3" Screen','Premium Sound','Wireless Charging','Heated+Ventilated Seats','Ambient Lighting','Power Seat'], safety:['6 Airbags','Adaptive Cruise','Lane Keep','Blind Spot','AEB'], warranty:{ basic:'3yr/100,000km', powertrain:'5yr/150,000km' } } },
    { name:'Geely Geometry C', slug:'geometry-c', model:'Geometry C Pro', year:2024, category:'Electric', catSlug:'electric', sku:'GEELY-GEOMETRY-C-2024', basePrice:2250000, finalPrice:2150000, discountAmount:100000, discountType:'flat', badge:'EV Incentive', stock:5, isFeatured:true, heroImageUrl:'/images/vehicles/ex5/ex5-hero.jpg', specs:{ engine:{ type:'Electric Motor', power:'204 HP (150kW)', torque:'310 Nm', transmission:'Single-Speed', fuelType:'Electric' }, battery:{ capacity:'70 kWh', range:'550 km (NEDC)', charging:'DC Fast: 30min (30-80%)' }, performance:{ topSpeed:'150 km/h', acceleration:'6.9s 0-100', energyConsumption:'14.7 kWh/100km' }, features:['OTA Updates','Smart Voice','Panoramic Sunroof','Heat Pump','Regen Braking','App Control'], safety:['6 Airbags','AEB','Lane Centering','360° Camera'], warranty:{ basic:'3yr/100,000km', battery:'8yr/150,000km', powertrain:'5yr/150,000km' } } },
    { name:'Geely EX5', slug:'ex5', model:'EX5 Elite', year:2024, category:'Electric', catSlug:'electric', sku:'GEELY-EX5-2024', basePrice:1950000, finalPrice:1950000, badge:'New Arrival', stock:6, isFeatured:true, heroImageUrl:'/images/vehicles/ex5/ex5-hero.jpg', specs:{ engine:{ type:'Electric Motor', power:'218 HP (160kW)', torque:'343 Nm', transmission:'Single-Speed', fuelType:'Electric' }, battery:{ capacity:'65 kWh', range:'480 km (CLTC)', charging:'DC Fast: 28min (30-80%)' }, performance:{ topSpeed:'155 km/h', acceleration:'5.9s 0-100', energyConsumption:'13.8 kWh/100km' }, features:['15.4" Central Screen','Smart Cockpit','OTA Updates','V2L Technology','Regen Braking','App Control'], safety:['6 Airbags','AEB','Lane Keep','Blind Spot','360° Camera'], warranty:{ basic:'3yr/100,000km', battery:'8yr/150,000km', powertrain:'5yr/150,000km' } } },
  ];
  let vCreated = 0;
  for (const v of vehicles) {
    const exists = await prisma.vehicle.findUnique({ where: { slug: v.slug } });
    if (!exists) {
      await prisma.vehicle.create({ data: { name:v.name, slug:v.slug, model:v.model, year:v.year, category:v.category, brandId:brand.id, categoryId:cats[v.catSlug]?.id, description:`${v.name} — a world-class vehicle engineered for Ethiopian roads.`, images:[v.heroImageUrl], specifications:v.specs, basePrice:v.basePrice, finalPrice:v.finalPrice, discountAmount:v.discountAmount||null, discountType:v.discountType||null, badge:v.badge||null, taxRate:15, stock:v.stock, sku:v.sku, reorderPoint:3, isFeatured:v.isFeatured, isActive:true, status:'published', displayOrder:vehicles.indexOf(v)+1, heroImageUrl:v.heroImageUrl } });
      vCreated++;
    }
  }
  console.log(vCreated ? `  ✅ ${vCreated} vehicles created` : '  ⏭  Vehicles exist');
