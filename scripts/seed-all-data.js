const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete database seed...\n');

  // ===================================
  // 1. SETTINGS (Policies & Social Media)
  // ===================================
  console.log('📝 Seeding Settings...');
  
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
We collect and process the following types of personal data:
• Identity Data: First name, last name, title
• Contact Data: Email address, telephone number, physical address
• Technical Data: IP address, browser type and version, device information
• Usage Data: Information about how you use our website and services
• Marketing Data: Your preferences in receiving marketing communications

3. HOW WE USE YOUR DATA
We use your personal data for the following purposes:
• To register you as a new customer
• To process and deliver your vehicle orders or service bookings
• To manage our relationship with you
• To send you test drive reminders and quotations
• To improve our website, products, and services
• To send you marketing communications (with your consent)
• To comply with legal and regulatory requirements

4. DATA SECURITY
We have implemented appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to employees and third parties who have a legitimate business need to access it.

5. YOUR LEGAL RIGHTS
Under Ethiopian data protection laws, you have the following rights:
• Right to access your personal data
• Right to correct inaccurate data
• Right to erase your data
• Right to object to processing
• Right to restrict processing
• Right to data portability

6. CONTACT US
If you have any questions about this privacy policy:
Email: info@geelyethiopia.com
Phone: +251 11 000 0000
Address: Sarbet, Addis Ababa, Ethiopia`
    }
  });

  await prisma.setting.upsert({
    where: { key: 'terms_of_service' },
    update: {},
    create: {
      key: 'terms_of_service',
      type: 'policy',
      value: `TERMS OF SERVICE

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. ACCEPTANCE OF TERMS
By accessing and using this website, you accept and agree to be bound by these terms and conditions.

2. USE OF SERVICE
2.1 Eligibility: You must be at least 18 years old to use our services.
2.2 Account Security: You are responsible for maintaining the confidentiality of your account.
2.3 Prohibited Activities: You agree not to use the website for any illegal purpose.

3. VEHICLE INFORMATION AND PRICING
3.1 All prices are in Ethiopian Birr (ETB) and are subject to change without notice.
3.2 Vehicle availability is subject to change.
3.3 We reserve the right to correct any errors or inaccuracies.

4. TEST DRIVES
Test drives require:
• Valid Ethiopian driver's license
• Minimum age of 23 years
• Advance booking through our website
• Compliance with all traffic laws

5. QUOTATIONS AND ORDERS
All quotations are valid for 30 days from the date of issue. Vehicle deposits are non-refundable except when we cannot fulfill the order.

6. LIMITATION OF LIABILITY
Geely Ethiopia shall not be liable for any indirect, incidental, or consequential damages arising from your use of this website.

7. CONTACT INFORMATION
Email: info@geelyethiopia.com
Phone: +251 11 000 0000
Address: Sarbet, Addis Ababa, Ethiopia`
    }
  });

  await prisma.setting.upsert({
    where: { key: 'cookie_policy' },
    update: {},
    create: {
      key: 'cookie_policy',
      type: 'policy',
      value: `COOKIE POLICY

Last Updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. WHAT ARE COOKIES?
Cookies are small text files placed on your device when you visit our website.

2. HOW WE USE COOKIES
• Remember your preferences and settings
• Understand how you use our website
• Improve your browsing experience
• Provide personalized content

3. TYPES OF COOKIES WE USE
• Essential Cookies: Required for website functionality
• Analytics Cookies: Help us understand visitor behavior (Google Analytics)
• Functionality Cookies: Remember your preferences
• Marketing Cookies: Track browsing for relevant advertising

4. MANAGING COOKIES
You can control cookies through your browser settings:
• Google Chrome: Settings → Privacy and Security → Cookies
• Mozilla Firefox: Options → Privacy & Security → Cookies
• Safari: Preferences → Privacy → Manage Website Data
• Microsoft Edge: Settings → Privacy → Cookies

5. IMPACT OF DISABLING COOKIES
If you disable cookies, some features may not work properly.

6. CONTACT US
Email: info@geelyethiopia.com
Phone: +251 11 000 0000`
    }
  });

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

  console.log('✅ Settings created (Policies + Social Media)\n');

  // ===================================
  // SUMMARY
  // ===================================
  console.log('═══════════════════════════════════════');
  console.log('✅ DATABASE SEEDING COMPLETE!');
  console.log('═══════════════════════════════════════\n');

  console.log('📊 What was created:');
  console.log('  ✅ Privacy Policy');
  console.log('  ✅ Terms of Service');
  console.log('  ✅ Cookie Policy');
  console.log('  ✅ Social Media Links (6 platforms)\n');

  console.log('🌐 Test your website:');
  console.log('  Admin Dashboard:');
  console.log('    → http://localhost:3000/admin');
  console.log('    → Click "Edit Policies" or "Social Media" cards');
  console.log('');
  console.log('  Admin Settings:');
  console.log('    → http://localhost:3000/admin/settings/policies');
  console.log('    → http://localhost:3000/admin/settings/social-media');
  console.log('');
  console.log('  Public Pages:');
  console.log('    → http://localhost:3000/privacy');
  console.log('    → http://localhost:3000/terms');
  console.log('    → http://localhost:3000/cookies');
  console.log('');
  console.log('  Homepage Footer:');
  console.log('    → http://localhost:3000 (scroll to footer for social media)\n');

  console.log('👤 Login Credentials:');
  console.log('  Email: admin@geelyethiopia.com');
  console.log('  Password: Admin@2024!\n');

  console.log('═══════════════════════════════════════');
  console.log('🎉 Ready to test! Start your dev server:');
  console.log('   npm run dev');
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
