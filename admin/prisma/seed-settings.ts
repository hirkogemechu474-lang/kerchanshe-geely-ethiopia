import { PrismaClient } from '@prisma/client';

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

Welcome to Geely Ethiopia, operated by Kerchanshe Group Geely. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights.

2. THE DATA WE COLLECT ABOUT YOU

We may collect, use, store and transfer different kinds of personal data about you:

• Identity Data: First name, last name, title
• Contact Data: Email address, telephone number, billing address
• Technical Data: IP address, browser type, time zone, device information
• Usage Data: Information about how you use our website and services
• Marketing Data: Your preferences in receiving marketing from us

3. HOW WE USE YOUR PERSONAL DATA

We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:

• To register you as a new customer
• To process and deliver your vehicle order or service booking
• To manage our relationship with you
• To send you test drive reminders and quotations
• To improve our website, products, and services
• To send you marketing communications (with your consent)

4. DATA SECURITY

We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.

5. DATA RETENTION

We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.

6. YOUR LEGAL RIGHTS

Under Ethiopian data protection laws, you have rights including:

• Right to access your personal data
• Right to correct inaccurate data
• Right to erase your data
• Right to object to processing of your data
• Right to restrict processing
• Right to data portability
• Right to withdraw consent

7. COOKIES

Our website uses cookies to distinguish you from other users. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site. For detailed information on the cookies we use, please see our Cookie Policy.

8. THIRD-PARTY LINKS

Our website may include links to third-party websites, plug-ins, and applications. Clicking on those links or enabling those connections may allow third parties to collect or share data about you. We do not control these third-party websites and are not responsible for their privacy statements.

9. CONTACT US

If you have any questions about this privacy policy or our privacy practices, please contact us:

Geely Ethiopia - Kerchanshe Group Geely
Email: info@geelyethiopia.com
Phone: +251 11 000 0000
Address: Sarbet, Addis Ababa, Ethiopia

10. CHANGES TO THIS PRIVACY POLICY

We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date.

By using our website and services, you acknowledge that you have read and understood this Privacy Policy.`
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

Welcome to Geely Ethiopia. By accessing and using this website, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use this service.

2. USE OF SERVICE

2.1 Eligibility
You must be at least 18 years old to use our services, particularly for test drives and vehicle purchases.

2.2 Account Registration
You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account information.

2.3 Prohibited Activities
You agree not to:
• Use the website for any illegal purpose
• Attempt to gain unauthorized access to our systems
• Interfere with or disrupt the website
• Transmit any viruses, malware, or harmful code
• Impersonate any person or entity
• Collect data about other users without consent

3. VEHICLE INFORMATION AND PRICING

3.1 Accuracy
We strive to provide accurate information about our vehicles, including specifications, features, and pricing. However, we reserve the right to correct any errors, inaccuracies, or omissions.

3.2 Pricing
All prices are in Ethiopian Birr (ETB) and are subject to change without notice. Prices do not include taxes, registration fees, insurance, or other government charges unless specifically stated.

3.3 Availability
Vehicle availability is subject to change. We reserve the right to limit quantities and discontinue any model without notice.

4. TEST DRIVES

4.1 Requirements
Test drives require:
• Valid Ethiopian driver's license
• Minimum age of 23 years
• Advance booking through our website or dealership
• Compliance with all traffic laws

4.2 Liability
You agree to assume all responsibility for damage to the vehicle during the test drive period, except for normal wear and tear.

5. QUOTATIONS AND ORDERS

5.1 Quotation Validity
All quotations are valid for 30 days from the date of issue unless otherwise stated.

5.2 Binding Agreement
A quotation does not constitute a binding agreement until a formal purchase order is accepted by Geely Ethiopia.

5.3 Deposits
Vehicle deposits are non-refundable except in cases where we cannot fulfill the order.

6. SERVICE AND MAINTENANCE

6.1 Warranty
All vehicles come with a manufacturer's warranty. Terms and conditions are provided at the time of purchase.

6.2 Service Bookings
Service appointments can be made through our website or by contacting our service center directly.

7. INTELLECTUAL PROPERTY

All content on this website, including text, graphics, logos, images, and software, is the property of Geely Ethiopia or Kerchanshe Group and is protected by Ethiopian and international copyright laws.

8. LIMITATION OF LIABILITY

Geely Ethiopia shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of this website.

9. INDEMNIFICATION

You agree to indemnify and hold harmless Geely Ethiopia, Kerchanshe Group, and their affiliates from any claims, damages, or expenses arising from your violation of these terms.

10. MODIFICATIONS

We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use constitutes acceptance of the modified terms.

11. GOVERNING LAW

These terms shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia.

12. DISPUTE RESOLUTION

Any disputes arising from these terms shall be resolved through:
1. Good faith negotiation between the parties
2. Mediation by a mutually agreed mediator
3. Ethiopian courts if necessary

13. CONTACT INFORMATION

For questions about these Terms of Service:

Geely Ethiopia - Kerchanshe Group Geely
Email: info@geelyethiopia.com
Phone: +251 11 000 0000
Address: Sarbet, Addis Ababa, Ethiopia

14. SEVERABILITY

If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect.

15. ENTIRE AGREEMENT

These terms constitute the entire agreement between you and Geely Ethiopia regarding the use of this website.

BY USING THIS WEBSITE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.`
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

Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.

2. HOW WE USE COOKIES

Geely Ethiopia uses cookies to:
• Remember your preferences and settings
• Understand how you use our website
• Improve your browsing experience
• Provide personalized content and advertisements
• Analyze website traffic and performance

3. TYPES OF COOKIES WE USE

3.1 Essential Cookies
These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas. The website cannot function properly without these cookies.

Examples:
• Session management
• Authentication
• Security features

3.2 Analytics Cookies
These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.

We use:
• Google Analytics - to analyze website traffic
• Performance monitoring tools

3.3 Functionality Cookies
These cookies enable the website to provide enhanced functionality and personalization based on your interactions.

Examples:
• Language preferences
• Region selection
• User interface customization

3.4 Marketing/Advertising Cookies
These cookies track your browsing activity to display relevant advertisements and measure the effectiveness of our marketing campaigns.

We may use:
• Facebook Pixel
• Google Ads
• LinkedIn Insight Tag

4. THIRD-PARTY COOKIES

Some cookies on our website are placed by third-party services:

• Google Analytics - Web analytics
• Google Maps - Location services
• YouTube - Video content
• Social Media Platforms - Social sharing buttons

These third parties may use cookies to track your online activity across different websites.

5. HOW TO MANAGE COOKIES

You can control and manage cookies in various ways:

5.1 Browser Settings

All modern browsers allow you to:
• View cookies stored on your device
• Delete existing cookies
• Block new cookies
• Set preferences for specific websites

5.2 Browser-Specific Instructions:

Google Chrome:
Settings → Privacy and Security → Cookies and other site data

Mozilla Firefox:
Options → Privacy & Security → Cookies and Site Data

Safari:
Preferences → Privacy → Manage Website Data

Microsoft Edge:
Settings → Privacy, search, and services → Cookies

5.3 Opt-Out Tools

You can opt out of analytics cookies:
• Google Analytics Opt-out: https://tools.google.com/dlpage/gaoptout

6. IMPACT OF DISABLING COOKIES

If you disable or block cookies:
• Some features may not work properly
• You may need to manually adjust preferences each visit
• Personalized content will not be available
• We cannot remember your preferences

7. COOKIE CONSENT

When you first visit our website, you will see a cookie consent banner. You can:
• Accept all cookies
• Reject non-essential cookies
• Customize your cookie preferences

You can change your preferences at any time by:
• Clicking the cookie settings link in the footer
• Adjusting your browser settings
• Clearing existing cookies

8. COOKIES WE USE - DETAILED LIST

Essential Cookies:
• session_id - Duration: Session - Manages user session
• csrf_token - Duration: Session - Security protection
• cookie_consent - Duration: 1 year - Remembers your choice

Analytics Cookies:
• _ga - Duration: 2 years - Google Analytics visitor ID
• _gid - Duration: 24 hours - Google Analytics session
• _gat - Duration: 1 minute - Google Analytics rate limiting

Functionality Cookies:
• language - Duration: 1 year - Preferred language
• region - Duration: 1 year - Geographic preferences

Marketing Cookies:
• _fbp - Duration: 3 months - Facebook Pixel
• _gcl_au - Duration: 3 months - Google Ads conversion

9. UPDATES TO THIS COOKIE POLICY

We may update this Cookie Policy from time to time to reflect changes in:
• Technology
• Legislation
• Our business operations
• Cookie usage

Please review this policy regularly. The "Last Updated" date at the top indicates when the policy was last revised.

10. MORE INFORMATION

For more information about cookies:
• All About Cookies: www.allaboutcookies.org
• Your Online Choices: www.youronlinechoices.eu

11. CONTACT US

If you have questions about our use of cookies:

Geely Ethiopia - Kerchanshe Group Geely
Email: info@geelyethiopia.com
Phone: +251 11 000 0000
Address: Sarbet, Addis Ababa, Ethiopia

12. YOUR CONSENT

By continuing to use our website, you consent to our use of cookies as described in this Cookie Policy.

You can withdraw your consent at any time by:
• Changing your browser settings
• Using the cookie preference center
• Contacting us directly`
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

  // Vehicle Settings
  const vehicleSettings = {
  categories: [
    {
      id: '1',
      name: 'Sedans',
      description: 'Comfortable and fuel-efficient sedans for daily commuting and family use.',
      displayOrder: 1,
      active: true,
    },
    {
      id: '2',
      name: 'SUVs',
      description: 'Spacious and rugged SUVs for families and adventurous driving.',
      displayOrder: 2,
      active: true,
    },
    {
      id: '3',
      name: 'Electric Vehicles',
      description: 'Zero-emission electric vehicles with advanced technology and impressive range.',
      displayOrder: 3,
      active: true,
    },
    {
      id: '4',
      name: 'Hatchbacks',
      description: 'Compact and practical hatchbacks perfect for city driving.',
      displayOrder: 4,
      active: true,
    },
  ],
  features: {
    safety: [
      'ABS (Anti-lock Braking System)',
      'EBD (Electronic Brakeforce Distribution)',
      'ESP (Electronic Stability Program)',
      'TCS (Traction Control System)',
      'Dual Front Airbags',
      'Side & Curtain Airbags',
      'Tire Pressure Monitoring System (TPMS)',
      'Reverse Camera with Parking Sensors',
      'Hill Start Assist (HSA)',
      'Hill Descent Control (HDC)',
      'Blind Spot Detection (BSD)',
      'Lane Departure Warning (LDW)',
      'Forward Collision Warning (FCW)',
      'Automatic Emergency Braking (AEB)',
      'ISOFIX Child Seat Anchors',
      'High-Strength Steel Safety Cage',
    ],
    comfort: [
      'Automatic Climate Control / Dual-Zone AC',
      'Leather Upholstery',
      'Heated Front Seats',
      'Ventilated Front Seats',
      'Power-Adjustable Driver Seat with Memory',
      '60/40 Split-Folding Rear Seats',
      'Ambient Interior Lighting',
      'Panoramic Sunroof',
      'Push-Button Start / Stop',
      'Smart Key Entry',
      'Cruise Control / Adaptive Cruise Control',
      'Tilt & Telescopic Steering Adjustment',
      'Steering Wheel-Mounted Controls',
      'Front & Rear Power Windows',
      'Power-Folding Side Mirrors',
      'Auto-Dimming Rearview Mirror',
      'Wireless Charging Pad',
      'Center Armrest with Storage',
    ],
    technology: [
      '10.25" / 12.3" Touchscreen Infotainment Display',
      'Apple CarPlay & Android Auto Integration',
      'Bluetooth Hands-Free Calling & Audio Streaming',
      'Voice Command Recognition',
      'GPS Navigation System',
      'USB / Type-C Charging Ports',
      'Premium Sound System (8-12 Speakers)',
      'Subwoofer & Amplifier (Premium)',
      'Digital Instrument Cluster',
      'Head-Up Display (HUD)',
      '360° Surround View Camera',
      'Remote Engine Start',
      'App-Based Vehicle Controls',
      'OTA Software Updates',
      'Drive Mode Selector (Eco / Normal / Sport)',
      'Electronic Parking Brake with Auto Hold',
    ],
    performance: [
      'Turbocharged Engine Options',
      '7-Speed DCT Automatic Transmission',
      'CVT Transmission (for efficiency)',
      'Front-Wheel Drive (FWD)',
      'All-Wheel Drive (AWD) - Select Models',
      'Front Suspension: MacPherson Strut',
      'Rear Suspension: Multi-Link / Torsion Beam',
      'Electric Power Steering (EPS)',
      'Disc Brakes on All Wheels',
      'Regenerative Braking (EV models)',
      'Selectable Drive Modes',
      'High Energy-Density Battery (EV models)',
      'Fast Charging Capability (EV models)',
    ],
  },
  specifications: {
    engine: [
      '1.5T Turbocharged Petrol - 173 HP',
      '1.5L Naturally Aspirated Petrol - 114 HP',
      '2.0T Turbocharged Petrol - 238 HP',
      '1.0T Turbocharged Petrol - 140 HP',
      'Electric Motor - 150 kW (201 HP)',
      'Electric Motor - 200 kW (268 HP)',
    ],
    transmission: [
      '7-Speed Dual-Clutch Transmission (DCT)',
      'Continuously Variable Transmission (CVT)',
      '6-Speed Automatic',
      '6-Speed Manual',
      'Single-Speed Reduction Gear (EV)',
    ],
    fuelType: [
      'Petrol (Gasoline)',
      'Battery Electric Vehicle (BEV)',
      'Plug-In Hybrid (PHEV)',
    ],
    driveType: [
      'Front-Wheel Drive (FWD)',
      'All-Wheel Drive (AWD)',
      'Rear-Wheel Drive (RWD)',
    ],
  },
  warranty: {
    vehicle: '5 Years or 150,000 km (whichever comes first)',
    battery: '8 Years or 160,000 km (for EV battery packs)',
    paintwork: '3 Years or 100,000 km against perforation',
    corrosion: '12 Years Against Perforation Corrosion',
  },
  serviceIntervals: {
    standard: 'Every 10,000 km or 6 months',
    electric: 'Every 20,000 km or 12 months',
  },
  brochure: {
    url: '',
    fileName: '',
    fileSize: null,
    uploadedAt: null,
  },
};

  await prisma.setting.upsert({
    where: { key: 'vehicle_settings' },
    update: {},
    create: {
      key: 'vehicle_settings',
      type: 'cms',
      value: JSON.stringify(vehicleSettings),
    },
  });
  console.log('✅ Vehicle Settings created');

  // Warranty Page Content Settings
  const warrantyPageSettings = {
    hero: {
      eyebrow: 'VEHICLE WARRANTY',
      title: 'Comprehensive Warranty Coverage',
      subtitle:
        'Drive with confidence knowing your Geely is protected by our comprehensive warranty program. Quality, reliability, and peace of mind guaranteed.',
    },
    whatsCovered: [
      { title: 'Powertrain Components', description: 'Engine, transmission, drive axle, and all internal parts' },
      { title: 'Electrical Systems', description: 'All factory-installed electrical and electronic components' },
      { title: 'Safety Systems', description: 'Airbags, ABS, stability control, and all safety features' },
      { title: 'Climate Control', description: 'Air conditioning and heating systems' },
      { title: 'Steering & Suspension', description: 'Steering mechanism and suspension components' },
      { title: 'Body & Paint', description: '3-year coverage against manufacturing defects and corrosion perforation' },
    ],
    whatsNotCovered: [
      { title: 'Normal Wear & Tear', description: 'Brake pads, wiper blades, tires, filters, and bulbs' },
      { title: 'Misuse & Neglect', description: 'Damage from accidents, abuse, or lack of maintenance' },
      { title: 'Unauthorized Modifications', description: 'Aftermarket parts or modifications not approved by Geely' },
      { title: 'Environmental Damage', description: 'Damage from natural disasters, fire, or vandalism' },
      { title: 'Commercial Use', description: 'Vehicles used for taxi, rental, or commercial purposes' },
      { title: 'Cosmetic Issues', description: 'Minor scratches, dents, or stone chips not affecting function' },
    ],
    cta: {
      title: 'Need to File a Warranty Claim?',
      description:
        "If you're experiencing issues with your Geely vehicle covered under warranty, submit a claim online or contact our service team.",
    },
    documents: [] as Array<{ id: string; title: string; description: string; url: string; fileName: string; fileSize: number | null; uploadedAt: string | null }>,
  };

  await prisma.setting.upsert({
    where: { key: 'warranty_page' },
    update: {},
    create: {
      key: 'warranty_page',
      type: 'cms',
      value: JSON.stringify(warrantyPageSettings),
    },
  });
  console.log('✅ Warranty Page Settings created');

  // Contact Information Settings
  const contactSettings = [
    { key: 'contact.phone.primary', value: '+251 11 000 0000' },
    { key: 'contact.phone.sales', value: '+251 11 000 0001' },
    { key: 'contact.phone.service', value: '+251 11 000 0002' },
    { key: 'contact.phone.parts', value: '+251 11 000 0003' },
    { key: 'contact.phone.emergency', value: '+251 911 000 000' },
    { key: 'contact.email.general', value: 'info@geelyethiopia.com' },
    { key: 'contact.email.sales', value: 'sales@geelyethiopia.com' },
    { key: 'contact.email.service', value: 'service@geelyethiopia.com' },
    { key: 'contact.email.support', value: 'support@geelyethiopia.com' },
    { key: 'contact.email.careers', value: 'careers@geelyethiopia.com' },
    { key: 'contact.whatsapp', value: '+251 911 000 000' },
    { key: 'contact.website', value: 'https://geelyethiopia.com' },
    { key: 'contact.headquarters.name', value: 'Geely Ethiopia — Kerchanshe Group Geely HQ' },
    { 
      key: 'contact.headquarters.address', 
      value: JSON.stringify({
        street: 'Sarbet Area',
        area: 'Bole Sub-city',
        city: 'Addis Ababa',
        region: 'Addis Ababa',
        country: 'Ethiopia',
        postalCode: '1000',
      })
    },
    { key: 'contact.hours.workdays', value: 'Mon–Fri · 08:30 AM – 06:00 PM' },
    { key: 'contact.hours.saturday', value: 'Saturday · 09:00 AM – 01:00 PM' },
    { key: 'contact.hours.sunday', value: 'Sunday · Closed' },
    { key: 'contact.hours.note', value: 'Public holidays: Closed or by appointment' },
  ];

  for (const setting of contactSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: {
        key: setting.key,
        type: 'general',
        value: setting.value,
      },
    });
  }
  console.log('✅ Contact Information Settings created');

  console.log('');
  console.log('✅ Seeding complete!');
  console.log('');
  console.log('📋 What was created:');
  console.log('  • Privacy Policy');
  console.log('  • Terms of Service');
  console.log('  • Cookie Policy');
  console.log('  • Social Media Links (6 platforms)');
  console.log('  • Vehicle Settings (categories, features, etc.)');
  console.log('  • Contact Information (phones, emails, address, hours)');
  console.log('');
  console.log('🌐 Test the results:');
  console.log('  Public Pages:');
  console.log('    → http://localhost:7501/privacy');
  console.log('    → http://localhost:7501/terms');
  console.log('    → http://localhost:7501/cookies');
  console.log('  Admin Pages:');
  console.log('    → http://localhost:7500/admin/settings/policies');
  console.log('    → http://localhost:7500/admin/settings/social-media');
  console.log('    → http://localhost:7500/admin/settings/contact-information');
  console.log('    → http://localhost:7500/admin/vehicles/settings');
  console.log('');
  console.log('🎉 Ready to test!');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
