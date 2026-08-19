import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNews() {
  console.log('🌱 Seeding news articles...');

  // Sample news articles with Unsplash images
  const articles = [
    {
      title: 'Geely Ethiopia Launches New Showroom in Addis Ababa',
      category: 'Company News',
      author: 'Geely Ethiopia Communications Team',
      content: `
<p>Geely Ethiopia proudly announces the opening of our newest flagship showroom in the heart of Addis Ababa, featuring our complete range of vehicles and enhanced customer experience facilities.</p>

<h2>State-of-the-Art Facility</h2>
<p>Our new showroom spans 2,000 square meters and includes:</p>
<ul>
  <li>Interactive vehicle displays showcasing our complete lineup</li>
  <li>Advanced customer consultation areas</li>
  <li>Dedicated test drive coordination center</li>
  <li>Comfortable customer waiting lounges</li>
  <li>Children's play area for families</li>
</ul>

<h2>Enhanced Customer Experience</h2>
<p>The showroom features cutting-edge technology including virtual reality experiences where customers can explore vehicle features and customization options before making their purchase decision.</p>

<p>"This new showroom represents our commitment to providing Ethiopian customers with world-class automotive retail experience," said Sales Director Ahmed Hassan.</p>

<h2>Grand Opening Offers</h2>
<p>To celebrate the opening, we're offering special financing packages and exclusive deals throughout this month. Visit us today to experience the future of automotive retail.</p>
      `,
      imageUrl: 'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?w=800&h=400&fit=crop',
      excerpt: 'Geely Ethiopia opens its newest flagship showroom in Addis Ababa with enhanced customer experience facilities and special opening offers.',
      status: 'published',
      publishDate: new Date('2024-02-15'),
    },
    {
      title: 'Electric Vehicle Revolution: Geometry EX5 in Ethiopia',
      category: 'Technology',
      author: 'Technical Team',
      content: `
<p>The automotive future is electric, and Ethiopia is embracing this transformation with the introduction of the Geometry EX5, bringing advanced electric mobility to Ethiopian roads.</p>

<h2>Leading Electric Technology</h2>
<p>The Geometry EX5 represents the latest in electric vehicle innovation:</p>
<ul>
  <li>400km+ range on single charge</li>
  <li>Fast charging capability (80% in 30 minutes)</li>
  <li>Advanced battery management system</li>
  <li>Regenerative braking technology</li>
  <li>Smart energy optimization</li>
</ul>

<h2>Perfect for Ethiopian Conditions</h2>
<p>Engineered to handle diverse terrain and climate conditions, the EX5 offers:</p>
<ul>
  <li>Enhanced ground clearance for rural roads</li>
  <li>Climate-optimized battery performance</li>
  <li>Robust construction for durability</li>
  <li>Efficient city and highway driving modes</li>
</ul>

<h2>Infrastructure Development</h2>
<p>Geely Ethiopia is partnering with local companies to expand charging infrastructure across major cities and highways, making electric vehicle ownership practical and convenient.</p>

<p>The EX5 represents more than just transportation – it's a step towards sustainable mobility for Ethiopia's future.</p>
      `,
      imageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=400&fit=crop',
      excerpt: 'Exploring the electric future with Geometry EX5 - advanced electric vehicle technology designed for Ethiopian roads and conditions.',
      status: 'published',
      publishDate: new Date('2024-02-10'),
    },
    {
      title: 'Customer Service Excellence: New Training Program Launched',
      category: 'Company News',
      author: 'HR Department',
      content: `
<p>Geely Ethiopia launches comprehensive customer service training program to ensure every customer interaction exceeds expectations and builds lasting relationships.</p>

<h2>Comprehensive Training Modules</h2>
<p>Our new program covers:</p>
<ul>
  <li>Product knowledge and technical expertise</li>
  <li>Customer communication and consultation skills</li>
  <li>Cultural sensitivity and local market understanding</li>
  <li>Digital tools and CRM systems</li>
  <li>Service excellence and problem resolution</li>
</ul>

<h2>Industry-Leading Standards</h2>
<p>The training follows international automotive retail best practices while incorporating local Ethiopian business culture and customer expectations.</p>

<p>All customer-facing staff participate in ongoing certification programs to maintain the highest service standards across our network.</p>

<h2>Customer Feedback Integration</h2>
<p>The program incorporates real customer feedback to continuously improve our service delivery and address specific needs of Ethiopian automotive customers.</p>

<p>"Our customers deserve nothing less than exceptional service at every touchpoint," said Customer Experience Manager Sara Tekle.</p>
      `,
      imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop',
      excerpt: 'New comprehensive training program ensures Geely Ethiopia staff deliver exceptional customer service experiences across all touchpoints.',
      status: 'published',
      publishDate: new Date('2024-02-05'),
    }
  ];

  // Create articles
  for (const article of articles) {
    const existing = await prisma.newsArticle.findFirst({
      where: { title: article.title }
    });
    
    if (!existing) {
      await prisma.newsArticle.create({
        data: article
      });
      console.log(`✅ Created news article: ${article.title}`);
    } else {
      console.log(`⏭️ Skipped existing article: ${article.title}`);
    }
  }

  console.log('🎉 News seeding complete!');
}

seedNews()
  .catch((e) => {
    console.error('❌ Error seeding news:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });