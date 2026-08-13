import { createClient } from '@supabase/supabase-js';

const URL = 'https://nounygvgafoawcbgubuh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdW55Z3ZnYWZvYXdjYmd1YnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjMxMzEsImV4cCI6MjEwMjE5OTEzMX0.Qe7a6JDC88khOtLWOLV9NUlpAEWkq5kNtsdC-lccCdE';

const supabase = createClient(URL, KEY);

async function test() {
  // 1. Try to sign in as a previously created test user
  console.log('Attempting sign in with existing test user...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'verify_test@menuqr.com',
    password: 'TestPass123!'
  });

  if (!error) {
    console.log(`✅ Signed in: ${data.user.email} (${data.user.id.substring(0,8)}...)`);
    console.log(`   Token length: ${data.session.access_token.length}`);
    
    // Check profile
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    
    if (profErr) console.log(`❌ Profile error: ${profErr.message}`);
    else if (profile) {
      console.log(`✅ Profile exists: role=${profile.role}, name=${profile.name}`);
    } else {
      console.log(`❌ Profile NOT FOUND — trigger didn't create it`);
    }
  } else {
    console.log(`❌ Sign in failed: ${error.message}`);
    console.log('   → Need to create user manually in Supabase Dashboard');
    console.log('   → Or wait for rate limit to clear');
  }
}

test();
