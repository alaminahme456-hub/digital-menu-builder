import { createClient } from '@supabase/supabase-js';

const URL = 'https://nounygvgafoawcbgubuh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdW55Z3ZnYWZvYXdjYmd1YnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjMxMzEsImV4cCI6MjEwMjE5OTEzMX0.Qe7a6JDC88khOtLWOLV9NUlpAEWkq5kNtsdC-lccCdE';

const supabase = createClient(URL, KEY);

async function check() {
  // 1. Check if any profiles exist at all
  const { count: profCount, error: profErr } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Profiles count: ${profCount}, error: ${profErr?.message || 'none'}`);

  // 2. List all profiles
  const { data: profiles, error: listErr } = await supabase
    .from('profiles')
    .select('id, email, role, created_at')
    .limit(5);
  
  if (listErr) {
    console.log(`List profiles error: ${listErr.message}`);
  } else if (profiles && profiles.length > 0) {
    console.log(`Found ${profiles.length} profiles:`);
    profiles.forEach(p => console.log(`  - ${p.email} (role=${p.role})`));
    
    // 3. Try to sign in with first profile to test full auth flow
    console.log('\n--- Testing sign-in with existing user ---');
    // We don't know passwords, so skip actual sign-in
  } else {
    console.log('No profiles found. Trigger may not be creating profiles.');
    console.log('This needs to be fixed for the app to work.');
  }

  // 4. Check if the trigger function exists by trying to call it
  // (This tests if the function itself is valid)
  console.log('\n--- Checking policies ---');
  const { data: polData, error: polErr } = await supabase
    .rpc('is_admin');
  
  if (polErr) {
    if (polErr.message.includes('does not exist') || polErr.message.includes('Could not find')) {
      console.log('❌ is_admin() function NOT FOUND - fix SQL may not have run');
    } else {
      console.log(`is_admin() exists: ${polErr.message} (expected - no auth context)`);
    }
  } else {
    console.log(`is_admin() returned: ${polData} (expected false)`);
  }

  // 5. Check templates with full data
  const { data: templates, error: tmplErr } = await supabase
    .from('templates')
    .select('name, label, is_active')
    .order('sort_order', { ascending: true });
  
  if (tmplErr) console.log(`Templates error: ${tmplErr.message}`);
  else console.log(`✅ Templates: ${templates.map(t => t.label).join(', ')}`);
}

check();
