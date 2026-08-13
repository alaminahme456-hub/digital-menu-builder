// Run: DB_PASSWORD=your_password node supabase/create-tables.mjs
// Find your DB password at: https://supabase.com/dashboard/project/nounygvgafoawcbgubuh/settings/database
import pg from 'pg';
import fs from 'fs';

const password = process.env.DB_PASSWORD;
const ref = 'nounygvgafoawcbgubuh';

if (!password) {
  console.log('Please provide your Supabase database password:');
  console.log('  DB_PASSWORD=your_password node supabase/create-tables.mjs');
  console.log('');
  console.log('Find it at: https://supabase.com/dashboard/project/' + ref + '/settings/database');
  process.exit(1);
}

const sql = fs.readFileSync('supabase/migration.sql', 'utf8');

const client = new pg({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.' + ref,
  password: password,
  ssl: { rejectUnauthorized: false },
});

console.log('Connecting to Supabase PostgreSQL...');
await client.connect();
console.log('Connected! Running migration...');

try {
  await client.query(sql);
  console.log('✅ Migration completed successfully!');
} catch (err) {
  console.error('Migration error:', err.message);
} finally {
  await client.end();
}
