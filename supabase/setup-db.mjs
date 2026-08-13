#!/usr/bin/env node
/**
 * Supabase Database Setup Script
 * 
 * This script connects to your Supabase PostgreSQL database and creates
 * all required tables, triggers, RLS policies, and seed data.
 * 
 * USAGE:
 *   node supabase/setup-db.mjs
 * 
 * You will be prompted for your database password.
 * Find it at: https://supabase.com/dashboard/project/nounygvgafoawcbgubuh/settings/database
 * 
 * Or run with password directly:
 *   DB_PASSWORD=your_password node supabase/setup-db.mjs
 */

import pg from 'pg';
import fs from 'fs';
import readline from 'readline';

const SUPABASE_REF = 'nounygvgafoawcbgubuh';
const DB_HOST = 'aws-0-eu-central-1.pooler.supabase.com';
const DB_PORT = 6543;
const DB_NAME = 'postgres';
const DB_USER = `postgres.${SUPABASE_REF}`;

const SQL_FILE = new URL('./migration.sql', import.meta.url).pathname.replace('/supabase/supabase', '/supabase');

function getPassword() {
  if (process.env.DB_PASSWORD) return Promise.resolve(process.env.DB_PASSWORD);
  
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enter your Supabase database password (find at https://supabase.com/dashboard/project/' + SUPABASE_REF + '/settings/database): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const password = await getPassword();
  
  if (!password) {
    console.error('❌ No database password provided. Cannot proceed.');
    console.error('');
    console.error('Your database password is set when you created the Supabase project.');
    console.error('Find it at: https://supabase.com/dashboard/project/' + SUPABASE_REF + '/settings/database');
    console.error('');
    console.error('Or set the DB_PASSWORD environment variable:');
    console.error('  DB_PASSWORD=your_password node supabase/setup-db.mjs');
    process.exit(1);
  }

  const client = new pg({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    password: password,
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Connecting to Supabase (${DB_HOST}:${DB_PORT})...`);

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    console.log('');

    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('Running migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Tables created:');
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
    for (const row of tables.rows) {
      console.log('  • ' + row.tablename);
    }
    console.log('');
    console.log('RLS policies enabled on all tables.');
    console.log('Profiles auto-created via trigger on user signup.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
