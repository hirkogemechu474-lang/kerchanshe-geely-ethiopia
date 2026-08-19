// Test services API
const baseUrl = 'http://localhost:3000';

async function testServicesAPI() {
  console.log('🧪 Testing Services API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/public/services/menu`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log('Raw response:', JSON.stringify(data, null, 2));
    
    if (data.sections && data.sections.length > 0) {
      console.log(`📊 Found ${data.sections.length} sections`);
      data.sections.forEach((section, i) => {
        console.log(`  ${i + 1}. ${section.title} (${section.items?.length || 0} items)`);
        section.items?.forEach((item, j) => {
          console.log(`     ${j + 1}. ${item.title} ${item.isFeatured ? '⭐' : ''}`);
        });
      });
      console.log('🎉 Services menu should now work in navigation!');
    } else {
      console.log('❌ No sections found - menu will still show "No services available"');
    }
    
  } catch (error) {
    console.error('❌ Services API test failed:', error.message);
  }
}

testServicesAPI();