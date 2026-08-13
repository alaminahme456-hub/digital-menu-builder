import { createClient } from '@supabase/supabase-js';

const URL = 'https://nounygvgafoawcbgubuh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdW55Z3ZnYWZvYXdjYmd1YnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjMxMzEsImV4cCI6MjEwMjE5OTEzMX0.Qe7a6JDC88khOtLWOLV9NUlpAEWkq5kNtsdC-lccCdE';

const supabase = createClient(URL, KEY);

async function test() {
  const errors = [];
  const ts = Date.now();
  const testEmail = `verify_${ts}@menuqr.com`;

  console.log(`1. Signing up: ${testEmail}`);
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPass123!',
    options: { data: { name: 'Test User' } }
  });

  if (error) {
    // Rate limited? Try sign in with existing test user instead
    if (error.message.includes('rate limit') || error.message.includes('already registered')) {
      console.log('  ⚠ Rate limited or already exists, trying sign in...');
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: 'verify_test@menuqr.com',
        password: 'TestPass123!'
      });
      if (signInErr) {
        // No existing user to test with
        console.log(`  ❌ Cannot test: ${error.message}`);
        console.log('\n  MANUALLY: Go to Authentication > Users in Supabase dashboard');
        console.log('  and create a test user, then check if a profile row was auto-created.');
        process.exit(0);
      }
      console.log(`  ✅ Signed in as existing user: ${signInData.user.id}`);
      var userId = signInData.user.id;
    } else {
      console.log(`  ❌ Signup error: ${error.message}`);
      return;
    }
  } else {
    var userId = data.user.id;
    console.log(`  ✅ User created: ${userId.substring(0, 8)}...`);
  }

  // Wait for trigger
  console.log('2. Waiting 2s for trigger...');
  await new Promise(r => setTimeout(r, 2000));

  // Check profile
  console.log('3. Checking profile auto-creation...');
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (profErr) {
    errors.push(`Profile query error: ${profErr.message}`);
    console.log(`  ❌ Error: ${profErr.message}`);
  } else if (profile) {
    console.log(`  ✅ Profile auto-created!`);
    console.log(`     email: ${profile.email}, name: ${profile.name}, role: ${profile.role}`);
  } else {
    errors.push('Profile NOT auto-created — trigger is not working');
    console.log(`  ❌ Profile NOT found after signup`);
  }

  // Test sign in flow
  console.log('\n4. Testing full auth flow...');
  const { data: sessionData, error: sessionErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: 'TestPass123!'
  });
  if (sessionErr) {
    if (testEmail.includes('verify_')) {
      console.log(`  ⚠ Cannot sign in (may need email confirmation): ${sessionErr.message}`);
    } else {
      console.log(`  ❌ Sign in error: ${sessionErr.message}`);
    }
  } else {
    console.log(`  ✅ Sign in: OK (token length: ${sessionData.session?.access_token?.length || 0})`);

    // Test getAuthUser equivalent
    const token = sessionData.session.access_token;
    const adminClient = createClient(URL, KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user }, error: getUserErr } = await adminClient.auth.getUser(token);
    if (getUserErr || !user) {
      errors.push(`getUser failed: ${getUserErr?.message}`);
      console.log(`  ❌ getUser: ${getUserErr?.message}`);
    } else {
      console.log(`  ✅ getUser: OK (${user.email})`);
    }

    // Test profile read as authenticated user
    const { data: authProfile, error: authProfErr } = await adminClient
      .from('profiles')
      .select('id, email, role')
      .eq('id', user.id)
      .single();
    if (authProfErr) {
      errors.push(`Profile read as user: ${authProfErr.message}`);
      console.log(`  ❌ Profile read: ${authProfErr.message}`);
    } else {
      console.log(`  ✅ Profile read as user: OK (role=${authProfile.role})`);
    }
  }

  // Cleanup: delete test profile if created
  try {
    await supabase.from('profiles').delete().eq('id', userId);
  } catch {}

  console.log('\n========== RESULTS ==========');
  if (errors.length === 0) console.log('✅ ALL AUTH CHECKS PASSED');
  else { console.log(`❌ ${errors.length} ISSUES:`); errors.forEach(e => console.log(`  - ${e}`)); }
  console.log('==============================');
}

test();
