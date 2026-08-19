// Test script to verify Electric menu API
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testElectricMenuAPI() {
  console.log('🧪 Testing Electric Menu API...');
  
  try {
    const response = await fetch(`${baseUrl}/api/public/electric/menu`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received');
    console.log(`📊 Found ${data.sections?.length || 0} sections`);
    
    data.sections?.forEach((section, i) => {
      console.log(`  ${i + 1}. ${section.title} (${section.items?.length || 0} items)`);
      section.items?.forEach((item, j) => {
        console.log(`     ${j + 1}. ${item.title} ${item.isFeatured ? '⭐' : ''}`);
      });
    });
    
    console.log('🎉 Electric menu API test successful!');
    
  } catch (error) {
    console.error('❌ Electric menu API test failed:', error.message);
    process.exit(1);
  }
}

testElectricMenuAPI();