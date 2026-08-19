const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding settings...');

  // Privacy Policy
  await prisma.setting.upsert({
    where: { key: 'privacy_policy' },
    update: {},
    create: {
      key: 'privacy_policy',
      type: 'policy',
      value: `PRIVACY POLICY

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. INTRODUCTION
Welcome to Geely Ethiopia, operated by Kerchanshe Auto. We respect your privacy and are committed to protecting your personal data.

2. DATA WE COLLECT
• Identity Data: First name, last name, title
• Contact Data: Email address, telephone number
• Technical Data: IP address, browser type
• Usage Data: How you use our website

3. HOW WE USE YOUR DATA
• To register you as a customer
• To process vehicle orders
• To manage test drive bookings
• To send quotations
• To improve our services

4. DATA SECURITY
We have implemented appropriate security measures to protect your personal data from unauthorized access.

5. YOUR RIGHTS
• Right to access your data
• Right to correct inaccurate data
• Right to erase your data
• Right to object to processing

6. CONTACT US
Email: info@geelyethiopia.com
Phone: +251 11 000 0000
Address: Sarbet, Addis Ababa, Ethiopia`
    }
  });
  console.log('✅ Privacy Policy created');

  // Terms of Service
  await prisma.setting.upsert({
    where: { key: 'terms_of_service' },
    update: {},
    create: {
      key: 'terms_of_service',
      type: 'policy',
      value: `TERMS OF SERVICE

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. ACCEPTANCE OF TERMS
By accessing this website, you agree to be bound by these terms of service.

2. USE OF SERVICE
• You must be 18+ to use our services
• You are responsible for your account security
• You agree not to misuse our services

3. VEHICLE INFORMATION
• All prices are in Ethiopian Birr (ETB)
• Prices subject to change without notice
• Vehicle availability may vary

4. TEST DRIVES
• Valid driver's license required
• Minimum age 23 years
• Advance booking required

5. QUOTATIONS
• Valid for 30 days
• Not binding until formal order accepted
• Deposits are non-refundable

6. LIABILITY
Geely Ethiopia shall not be liable for indirect, incidental, or consequential damages.

7. CONTACT
Email: info@geelyethiopia.com
Phone: +251 11 000 0000`
    }
  });
  console.log('✅ Terms of Service created');

  // Cookie Policy
  await prisma.setting.upsert({
    where: { key: 'cookie_policy' },
    update: {},
    create: {
      key: 'cookie_policy',
      type: 'policy',
      value: `COOKIE POLICY

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. WHAT ARE COOKIES?
Cookies are small text files stored on your device when you visit our website.

2. HOW WE USE COOKIES
• Remember your preferences
• Understand how you use our site
• Improve your browsing experience
• Provide personalized content

3. TYPES OF COOKIES
• Essential Cookies: Required for website functionality
• Analytics Cookies: Help us understand visitor behavior
• Functionality Cookies: Remember your preferences
• Marketing Cookies: Track browsing for advertising

4. MANAGE COOKIES
You can control cookies through your browser settings:
• Chrome: Settings → Privacy → Cookies
• Firefox: Options → Privacy → Cookies
• Safari: Preferences → Privacy
• Edge: Settings → Privacy → Cookies

5. IMPACT OF DISABLING
If you disable cookies, some features may not work properly.

6. CONTACT
Email: info@geelyethiopia.com
Phone: +251 11 000 0000`
    }
  });
  console.log('✅ Cookie Policy created');

  // Social Media Links
  await prisma.setting.upsert({
    where: { key: 'social_media_links' },
    update: {},
    create: {
      key: 'social_media_links',
      type: 'social',
      value: JSON.stringify({
        facebook: 'https://facebook.com/geelyethiopia',
        instagram: 'https://instagram.com/geelyethiopia',
        twitter: 'https://twitter.com/geelyethiopia',
        youtube: 'https://youtube.com/@geelyethiopia',
        linkedin: 'https://linkedin.com/company/geely-ethiopia',
        tiktok: 'https://tiktok.com/@geelyethiopia'
      })
    }
  });
  console.log('✅ Social Media Links created');

  console.log('');
  console.log('✅ Seeding complete!');
  console.log('');
  console.log('📋 What was created:');
  console.log('  • Privacy Policy');
  console.log('  • Terms of Service');
  console.log('  • Cookie Policy');
  console.log('  • Social Media Links (6 platforms)');
  console.log('');
  console.log('🌐 Test the results:');
  console.log('  Public Pages:');
  console.log('    → http://localhost:3000/privacy');
  console.log('    → http://localhost:3000/terms');
  console.log('    → http://localhost:3000/cookies');
  console.log('  Admin Pages:');
  console.log('    → http://localhost:3000/admin/settings/policies');
  console.log('    → http://localhost:3000/admin/settings/social-media');
  console.log('  Footer:');
  console.log('    → Check homepage footer for social media icons');
  console.log('');
  console.log('🎉 Ready to test!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
