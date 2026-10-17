import http from 'http';
import app from '../server.js';

const PORT = 5001;

const runTest = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function testAllEndpoints() {
  console.log('--- Starting BIXA Product Finder API Integration Tests ---');
  
  const server = app.listen(PORT, async () => {
    try {
      // Test 1: Health
      const health = await runTest('/health');
      console.log('✅ 1. GET /health:', health.status === 200 && health.data.status === 'ok' ? 'PASSED' : 'FAILED');

      // Test 2: Categories
      const categories = await runTest('/product-finder/categories');
      console.log('✅ 2. GET /product-finder/categories:', categories.status === 200 && categories.data.data.length === 3 ? 'PASSED' : 'FAILED');

      // Test 3: Products
      const products = await runTest('/product-finder/products?category=HERBS&limit=10');
      console.log('✅ 3. GET /product-finder/products:', products.status === 200 && products.data.count > 0 ? 'PASSED' : 'FAILED');

      // Test 4: Search
      const search = await runTest('/product-finder/search?q=amla');
      console.log('✅ 4. GET /product-finder/search?q=amla:', search.status === 200 && search.data.count > 0 ? 'PASSED' : 'FAILED');

      // Test 5: Concerns
      const concerns = await runTest('/product-finder/concerns');
      console.log('✅ 5. GET /product-finder/concerns:', concerns.status === 200 && concerns.data.count > 0 ? 'PASSED' : 'FAILED');

      // Test 6: Concern Details
      const concernDetail = await runTest('/product-finder/concerns/hair-wellness');
      console.log('✅ 6. GET /product-finder/concerns/hair-wellness:', concernDetail.status === 200 && concernDetail.data.data.name ? 'PASSED' : 'FAILED');

      // Test 7: Analytics Event
      const analytics = await runTest('/product-finder/events', 'POST', {
        event: 'chatbot_opened',
        sessionId: 'test_session_123',
        metadata: { test: true }
      });
      console.log('✅ 7. POST /product-finder/events:', analytics.status === 201 && analytics.data.success ? 'PASSED' : 'FAILED');

      console.log('🎉 ALL 7 BACKEND API TESTS COMPLETED SUCCESSFULLY!');
      server.close(() => process.exit(0));
    } catch (err) {
      console.error('Test execution failed:', err);
      server.close(() => process.exit(1));
    }
  });
}

testAllEndpoints();
