// Script to verify both Services and Electric menus are properly seeded
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testAPI(endpoint, name) {
  console.log(`\n🧪 Testing ${name}...`);
  
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ ${name} API Response received`);
    console.log(`📊 Found ${data.sections?.length || 0} sections`);
    
    data.sections?.forEach((section, i) => {
      console.log(`  ${i + 1}. ${section.title} (${section.items?.length || 0} items)`);
      section.items?.forEach((item, j) => {
        const featuredBadge = item.isFeatured ? ' ⭐' : '';
        console.log(`     ${j + 1}. ${item.title}${featuredBadge}`);
      });
    });
    
    return true;
    
  } catch (error) {
    console.error(`❌ ${name} test failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 VERIFYING MENU APIS');
  console.log('═════════════════════');
  
  const servicesOK = await testAPI('/api/public/services/menu', 'Services Menu');
  const electricOK = await testAPI('/api/public/electric/menu', 'Electric Menu');
  
  console.log('\n📊 SUMMARY');
  console.log('══════════');
  console.log(`Services Menu: ${servicesOK ? '✅ Working' : '❌ Failed'}`);
  console.log(`Electric Menu: ${electricOK ? '✅ Working' : '❌ Failed'}`);
  
  if (servicesOK && electricOK) {
    console.log('\n🎉 All menu systems are working correctly!');
    console.log('\n🔗 Admin Links:');
    console.log('  → http://localhost:3000/admin/services-menu');
    console.log('  → http://localhost:3000/admin/electric');
    console.log('\n🌐 Test Frontend:');
    console.log('  → Hover over "Services" in navigation');
    console.log('  → Hover over "Electric" in navigation');
  } else {
    console.log('\n❌ Some menu systems failed - check the errors above');
    process.exit(1);
  }
}

main().catch(console.error);