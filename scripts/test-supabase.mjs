import { createClient } from '@supabase/supabase-js';

const URL = 'https://nounygvgafoawcbgubuh.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vdW55Z3ZnYWZvYXdjYmd1YnVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MjMxMzEsImV4cCI6MjEwMjE5OTEzMX0.Qe7a6JDC88khOtLWOLV9NUlpAEWkq5kNtsdC-lccCdE';

const supabase = createClient(URL, KEY);

async function check() {
  const errors = [];
  const warnings = [];

  // 1-8. Check all tables exist and are readable
  const tables = ['profiles', 'businesses', 'menu_categories', 'menu_items', 'menu_uploads', 'analytics', 'ai_scan_logs', 'templates'];
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) errors.push(`${table}: ${error.message}`);
      else console.log(`✅ ${table} table: OK`);
    } catch (e) { errors.push(`${table}: ${e.message}`); }
  }

  // 9. Check templates seed data
  try {
    const { count, error } = await supabase.from('templates').select('*', { count: 'exact', head: true });
    if (count === 0) warnings.push('templates table has no seed data');
    else console.log(`  → templates has ${count} seed rows`);
  } catch (e) { errors.push(`templates count: ${e.message}`); }

  // 10. RLS check: anonymous cannot insert into businesses
  try {
    const { error } = await supabase.from('businesses').insert({
      name: 'test', slug: `test-rls-${Date.now()}`,
      owner_id: '00000000-0000-0000-0000-000000000000'
    }).select();
    if (!error) errors.push('RLS BROKEN: anonymous can insert businesses!');
    else console.log('✅ RLS blocks anonymous business insert');
  } catch (e) { errors.push(`RLS check: ${e.message}`); }

  // 11. RLS check: anonymous cannot insert into menu_items
  try {
    const { error } = await supabase.from('menu_items').insert({
      name: 'test', price: 0, business_id: '00000000-0000-0000-0000-000000000000',
      category_id: '00000000-0000-0000-0000-000000000000'
    }).select();
    if (!error) errors.push('RLS BROKEN: anonymous can insert menu_items!');
    else console.log('✅ RLS blocks anonymous menu_item insert');
  } catch (e) { errors.push(`RLS menu_items check: ${e.message}`); }

  // 12. Templates are publicly readable
  try {
    const { data, error } = await supabase.from('templates').select('name').limit(3);
    if (error) errors.push(`templates public read: ${error.message}`);
    else console.log(`✅ templates public read: OK`);
  } catch (e) { errors.push(`templates public: ${e.message}`); }

  // 13. Auth signup + profile auto-creation
  try {
    const testEmail = `dbcheck_${Date.now()}@menuqr.com`;
    const { data, error } = await supabase.auth.signUp({ email: testEmail, password: 'TestPass123!' });
    if (error) errors.push(`auth signup: ${error.message}`);
    else {
      console.log(`✅ auth signup: OK (id=${data.user?.id?.substring(0,8)}...)`);
      const { data: profile, error: profErr } = await supabase.from('profiles').select('id,email,role').eq('id', data.user.id).single();
      if (profErr || !profile) errors.push(`profile auto-create: ${profErr?.message || 'not found'}`);
      else console.log(`✅ profile auto-creation: OK (role=${profile.role})`);
      // Cleanup profile
      await supabase.from('profiles').delete().eq('id', data.user.id);
      console.log('  → cleaned up test profile');
    }
  } catch (e) { errors.push(`auth test: ${e.message}`); }

  // 14. Check analytics can be inserted publicly (for event tracking)
  try {
    const { error } = await supabase.from('analytics').insert({
      business_id: '00000000-0000-0000-nonexist',
      event_type: 'view'
    });
    // This should work (public insert policy with CHECK true)
    // but will fail FK constraint — that's expected and fine
    if (error && error.message.includes('violates foreign key')) {
      console.log('✅ analytics public insert: OK (FK enforced)');
    } else if (error) {
      warnings.push(`analytics insert: ${error.message}`);
    } else {
      console.log('✅ analytics public insert: OK');
    }
  } catch (e) { errors.push(`analytics insert: ${e.message}`); }

  console.log('\n========== RESULTS ==========');
  if (errors.length === 0) console.log('✅ NO DATABASE/AUTH ERRORS');
  else { console.log(`❌ ${errors.length} ERRORS:`); errors.forEach(e => console.log(`  - ${e}`)); }
  if (warnings.length > 0) { console.log(`⚠️  ${warnings.length} WARNINGS:`); warnings.forEach(w => console.log(`  - ${w}`)); }
  console.log('==============================');
}

check();
