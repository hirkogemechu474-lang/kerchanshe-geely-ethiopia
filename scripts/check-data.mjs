import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const models = [
  'user','vehicle','vehicleCategory','vehicleBrand','testDrive','quotation',
  'dealer','serviceBooking','sparePart','partCategory','promotion','review',
  'newsArticle','message','heroSection','vehicleShowcase','fAQ','electricPage',
  'chargingStation','setting','mediaAsset','serviceSection','electricSection',
  'megaMenuSection','partRequest',
];
for (const m of models) {
  try {
    const count = await prisma[m].count();
    console.log(`${m}: ${count}`);
  } catch(e) { console.log(`${m}: ERROR - ${e.message.split('\n')[0]}`); }
}
await prisma.$disconnect();
