const BASE = 'http://localhost:3000';
const errors = [];
const results = [];

async function test(name, fn) {
  try {
    const result = await fn();
    if (result === false) errors.push(name);
    results.push(`✅ ${name}`);
  } catch (e) {
    errors.push(`${name}: ${e.message}`);
    results.push(`❌ ${name}: ${e.message}`);
  }
}

async function run() {
  const ts = Date.now();
  const testEmail = `apitest_${ts}@menuqr.com`;

  // 1. REGISTER
  await test('POST /api/auth/register', async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'TestPass123!', name: 'API Test' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (!data.token) throw new Error('No token returned');
    if (!data.user?.id) throw new Error('No user id returned');
    globalThis.__token = data.token;
    globalThis.__userId = data.user.id;
    console.log(`     → user=${data.user.id.substring(0,8)}... token_len=${data.token.length}`);
  });

  // 2. GET /api/auth/me
  await test('GET /api/auth/me', async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (!data.user?.id) throw new Error('No user returned');
    if (!data.user?.email) throw new Error('No email in user');
    console.log(`     → email=${data.user.email}, role=${data.user.role}`);
  });

  // 3. PUT /api/auth/me (update profile)
  await test('PUT /api/auth/me (update name/phone)', async () => {
    const res = await fetch(`${BASE}/api/auth/me`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User Updated', phone: '+1234567890' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (data.user.name !== 'Test User Updated') throw new Error('Name not updated');
    if (data.user.phone !== '+1234567890') throw new Error('Phone not updated');
    console.log(`     → name=${data.user.name}, phone=${data.user.phone}`);
  });

  // 4. LOGIN with same credentials
  await test('POST /api/auth/login', async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'TestPass123!' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (!data.token) throw new Error('No token');
    console.log(`     → login OK, token_len=${data.token.length}`);
  });

  // 5. GET /api/businesses (should be empty for new user)
  await test('GET /api/businesses (empty)', async () => {
    const res = await fetch(`${BASE}/api/businesses`, {
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (!Array.isArray(data.businesses)) throw new Error('No businesses array');
    console.log(`     → ${data.businesses.length} businesses`);
  });

  // 6. POST /api/businesses (create one)
  await test('POST /api/businesses (create)', async () => {
    const res = await fetch(`${BASE}/api/businesses`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Restaurant',
        category: 'Restaurant',
        phone: '+1234567890',
        whatsapp: '+1234567890',
        address: '123 Test Street',
        description: 'A test restaurant',
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (!data.business?.id) throw new Error('No business id');
    globalThis.__bizId = data.business.id;
    globalThis.__bizSlug = data.business.slug;
    console.log(`     → id=${data.business.id.substring(0,8)}..., slug=${data.business.slug}`);
  });

  // 7. GET /api/businesses (should have 1)
  await test('GET /api/businesses (1 biz)', async () => {
    const res = await fetch(`${BASE}/api/businesses`, {
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (data.businesses.length !== 1) throw new Error(`Expected 1, got ${data.businesses.length}`);
    console.log(`     → ${data.businesses.length} business(es)`);
  });

  // 8. GET /api/businesses/[id] by ID
  await test('GET /api/businesses/[id]', async () => {
    const res = await fetch(`${BASE}/api/businesses/${globalThis.__bizId}`, {
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (data.business.name !== 'Test Restaurant') throw new Error('Wrong business name');
    console.log(`     → name=${data.business.name}, _count=${JSON.stringify(data.business._count)}`);
  });

  // 9. PUT /api/businesses/[id] (update)
  await test('PUT /api/businesses/[id] (update)', async () => {
    const res = await fetch(`${BASE}/api/businesses/${globalThis.__bizId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Restaurant', phone: '+9876543210' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (data.business.name !== 'Updated Restaurant') throw new Error('Name not updated');
    console.log(`     → name=${data.business.name}`);
  });

  // 10. POST /api/menu/categories
  await test('POST /api/menu/categories', async () => {
    const res = await fetch(`${BASE}/api/menu/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: globalThis.__bizId, name: 'Appetizers' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    globalThis.__catId = data.category.id;
    console.log(`     → id=${data.category.id.substring(0,8)}..., name=${data.category.name}`);
  });

  // 11. POST /api/menu/categories (second)
  await test('POST /api/menu/categories (2nd)', async () => {
    const res = await fetch(`${BASE}/api/menu/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: globalThis.__bizId, name: 'Main Courses' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    globalThis.__cat2Id = data.category.id;
    console.log(`     → id=${data.category.id.substring(0,8)}...`);
  });

  // 12. GET /api/menu/categories
  await test('GET /api/menu/categories', async () => {
    const res = await fetch(`${BASE}/api/menu/categories?businessId=${globalThis.__bizId}`, {
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (data.categories.length < 2) throw new Error(`Expected 2+ categories, got ${data.categories.length}`);
    console.log(`     → ${data.categories.length} categories`);
  });

  // 13. POST /api/menu/items
  await test('POST /api/menu/items', async () => {
    const res = await fetch(`${BASE}/api/menu/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: globalThis.__bizId,
        categoryId: globalThis.__catId,
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with croutons',
        price: 1500,
        image: null
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    globalThis.__itemId = data.item.id;
    console.log(`     → id=${data.item.id.substring(0,8)}..., price=${data.item.price}`);
  });

  // 14. POST /api/menu/items (2nd)
  await test('POST /api/menu/items (2nd)', async () => {
    const res = await fetch(`${BASE}/api/menu/items`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId: globalThis.__bizId,
        categoryId: globalThis.__catId,
        name: 'Grilled Chicken',
        description: 'Tender grilled chicken breast',
        price: 3500,
        image: null
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    globalThis.__item2Id = data.item.id;
    console.log(`     → id=${data.item.id.substring(0,8)}...`);
  });

  // 15. GET /api/menu/items
  await test('GET /api/menu/items', async () => {
    const res = await fetch(`${BASE}/api/menu/items?businessId=${globalThis.__bizId}`, {
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (data.items.length < 2) throw new Error(`Expected 2+ items, got ${data.items.length}`);
    console.log(`     → ${data.items.length} items`);
  });

  // 16. PUT /api/menu/items (update)
  await test('PUT /api/menu/items (update price)', async () => {
    const res = await fetch(`${BASE}/api/menu/items`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: globalThis.__itemId, price: 2000, available: true })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (Number(data.item.price) !== 2000) throw new Error('Price not updated');
    console.log(`     → price updated to ${data.item.price}`);
  });

  // 17. PUT /api/menu/categories (rename)
  await test('PUT /api/menu/categories (rename)', async () => {
    const res = await fetch(`${BASE}/api/menu/categories/${globalThis.__catId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Starters' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    console.log(`     → name=${data.category.name}`);
  });

  // 18. POST /api/analytics (track view)
  await test('POST /api/analytics (track)', async () => {
    const res = await fetch(`${BASE}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: globalThis.__bizId, eventType: 'view' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    console.log(`     → tracked`);
  });

  // 19. POST /api/analytics (track QR scan)
  await test('POST /api/analytics (qr_scan)', async () => {
    const res = await fetch(`${BASE}/api/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: globalThis.__bizId, eventType: 'qr_scan' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    console.log(`     → tracked`);
  });

  // 20. GET /api/analytics
  await test('GET /api/analytics', async () => {
    const res = await fetch(`${BASE}/api/analytics?businessId=${globalThis.__bizId}`, {
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (data.totalViews < 1) throw new Error('Expected views >= 1');
    console.log(`     → views=${data.totalViews}, qr=${data.qrScans}`);
  });

  // 21. Publish business (for public menu test)
  await test('PUT /api/businesses/[id] (publish)', async () => {
    const res = await fetch(`${BASE}/api/businesses/${globalThis.__bizId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    console.log(`     → status=${data.business.status}`);
  });

  // 22. GET /api/menu/categories?slug=X (public)
  await test('GET /api/menu/categories?slug=X (public)', async () => {
    const res = await fetch(`${BASE}/api/menu/categories?slug=${globalThis.__bizSlug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (!data.business) throw new Error('No business in response');
    if (!Array.isArray(data.business.categories)) throw new Error('No categories array');
    console.log(`     → ${data.business.categories.length} categories (public)`);
  });

  // 23. GET /api/businesses/[slug] (public by slug)
  await test('GET /api/businesses/[slug] (public)', async () => {
    const res = await fetch(`${BASE}/api/businesses/${globalThis.__bizSlug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (data.business.name !== 'Updated Restaurant') throw new Error('Wrong name');
    console.log(`     → name=${data.business.name} (public access)`);
  });

  // 24. POST /api/menu/scan (AI scan)
  await test('POST /api/menu/scan (AI scan)', async () => {
    const res = await fetch(`${BASE}/api/menu/scan`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${globalThis.__token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: globalThis.__bizId, imageData: 'base64data' })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    if (data.itemsDetected < 1) throw new Error('Expected items detected');
    console.log(`     → ${data.itemsDetected} items detected`);
  });

  // 25. DELETE /api/menu/items
  await test('DELETE /api/menu/items', async () => {
    const res = await fetch(`${BASE}/api/menu/items?id=${globalThis.__item2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    console.log(`     → deleted`);
  });

  // 26. DELETE /api/menu/categories
  await test('DELETE /api/menu/categories', async () => {
    const res = await fetch(`${BASE}/api/menu/categories/${globalThis.__cat2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    console.log(`     → deleted`);
  });

  // 27. Unauthorized access test
  await test('GET /api/businesses (no token → 401)', async () => {
    const res = await fetch(`${BASE}/api/businesses`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    console.log(`     → correctly rejected (401)`);
  });

  // 28. DELETE /api/businesses (cleanup)
  await test('DELETE /api/businesses (cleanup)', async () => {
    const res = await fetch(`${BASE}/api/businesses/${globalThis.__bizId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${globalThis.__token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Status ${res.status}`);
    console.log(`     → business deleted`);
  });

  // Print results
  console.log('\n========================================');
  console.log('         FULL TEST RESULTS');
  console.log('========================================');
  results.forEach(r => console.log(r));
  console.log('----------------------------------------');
  if (errors.length === 0) {
    console.log('✅ ALL 28 TESTS PASSED — NO BUGS FOUND');
  } else {
    console.log(`❌ ${errors.length} FAILURES:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log('========================================');

  // Kill the server
  process.exit(0);
}

run();
