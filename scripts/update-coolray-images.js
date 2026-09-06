const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateVehicle() {
  const vehicleId = 'e3c05fbc-5112-4b7a-a103-f47691f5463d';
  const images = [
    'https://www.datocms-assets.com/166198/1774252528-202515740-cover.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776093282-ex2-23.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776093405-e2-23.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776093503-ex2-23.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776093609-ex2-23.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776093711-ex2-23.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774268781-e2-12.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774272953-front-45-45.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774275467-rgb.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774280005-front-trunk.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776085517-trunk.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774354754-202514579.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774354999-202514579.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774355287-202514843.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774355358-2025144881.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776082843-front-passenger-space-black.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776083174-full-interior-view-black.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776084098-rear-passenger-space-black.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776026586-e-drive.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776026772-battery-pack-underbody-protection-beam.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776026923-geely-battery-safety-system.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776027081-g-tcs-all-weather-traction-control-system.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774358863-acc.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774359054-aeb-00597.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774359190-rcta.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774359230-dow.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776020221-rcw.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776020263-ldw.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776020331-rcw.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776015500-ex2-20.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776015546-e2-20.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776024765-e2-23.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1776025102-ex2-14.png?auto=format%2Ccompress%2Cenhance&q=45&w=1440',
    'https://www.datocms-assets.com/166198/1774360483-e2-15.jpg?auto=format%2Ccompress%2Cenhance&q=45&w=1440'
  ];

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        images: images,
        heroImageUrl: images[0],
        name: 'Geely Coolray',
        description: 'Modern compact SUV with advanced technology, premium interior, intelligent safety features, and efficient performance.'
      }
    });
    console.log('Vehicle updated successfully!');
    console.log('Name:', vehicle.name);
    console.log('New images count:', vehicle.images.length);
    console.log('Hero image:', vehicle.heroImageUrl);
  } catch (error) {
    console.error('Error updating vehicle:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVehicle();
