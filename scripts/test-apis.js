// Simple test script to verify our APIs are working
const baseUrl = 'http://localhost:3000';

async function testAPI(endpoint, name) {
  console.log(`Testing ${name}: ${endpoint}`);
  try {
    const response = await fetch(`${baseUrl}${endpoint}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name} - OK`, JSON.stringify(data, null, 2).slice(0, 200) + '...');
      return true;
    } else {
      console.log(`❌ ${name} - Error: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Frontend APIs');
  console.log('========================\n');

  const results = await Promise.all([
    testAPI('/api/public/showcase', 'Showcase API'),
    testAPI('/api/public/services/menu', 'Services Menu API'),
    testAPI('/api/public/electric/menu', 'Electric Menu API'),
    testAPI('/api/reviews?featured=true&limit=3', 'Reviews API'),
  ]);

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`\n📊 Results: ${passed}/${total} APIs working`);
  
  if (passed === total) {
    console.log('🎉 All APIs are working correctly!');
  } else {
    console.log('⚠️  Some APIs need attention. Make sure the development server is running.');
  }
}

main().catch(console.error);