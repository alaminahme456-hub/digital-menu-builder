const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Try to verify connection by fetching templates
async function verifyConnection() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/templates?select=id&limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (res.ok) {
    console.log('✅ Connected to Supabase project successfully');
    const data = await res.json();
    console.log(`   Templates table exists: ${data.length > 0 ? 'yes' : 'no (needs migration)'}`);
    return true;
  }
  // Table might not exist yet
  if (res.status === 404) {
    console.log('⚠️  Connected but tables not created yet — run migration.sql in Supabase SQL Editor');
    return true;
  }
  console.error('❌ Connection failed:', res.status, await res.text());
  return false;
}

async function tryDirectMigration() {
  // Attempt to use pg module to connect directly
  try {
    const { Client } = await import('pg');
    // Extract project ref from URL
    const ref = SUPABASE_URL.replace('https://', '').split('.')[0];
    console.log(`Project ref: ${ref}`);
    console.log('');
    console.log('To run the migration, go to:');
    console.log(`  https://supabase.com/dashboard/project/${ref}/sql`);
    console.log('');
    console.log('Then paste the contents of supabase/migration.sql and click "Run"');
  } catch {
    console.log('');
    console.log('To set up the database:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Paste the contents of supabase/migration.sql');
    console.log('4. Click Run');
  }
}

(async () => {
  console.log('=== Supabase Setup ===');
  console.log(`URL: ${SUPABASE_URL}`);
  console.log('');
  const ok = await verifyConnection();
  if (ok) await tryDirectMigration();
})();
