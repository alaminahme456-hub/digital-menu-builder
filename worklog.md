---
Task ID: 3
Agent: Main Agent
Task: Migrate auth and database from Prisma/SQLite to Supabase

Work Log:
- Installed @supabase/supabase-js and pg packages
- Created src/lib/supabase.ts with createServerClient, getAuthUser, toCamel/toCamelList/toSnake helpers
- Replaced Prisma auth (bcryptjs/jose) with Supabase Auth (signUp/signInWithPassword/getUser)
- Updated db.ts to re-export from supabase.ts (backward compatibility)
- Simplified auth.ts to keep only utility functions (generateSlug, formatPrice, formatFileSize, cn)
- Updated all 16 API routes from Prisma to Supabase client queries
- Created migration.sql with 8 tables, triggers, RLS policies, indexes, seed data
- Created setup-db.mjs script to run migration via pg connection
- Added .env with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Build passes cleanly, zero lint errors
- Pushed to GitHub

Stage Summary:
- 25 files changed, 14310 insertions, 447 deletions
- Auth: Supabase Auth (signUp/signInWithPassword) replaces custom JWT
- DB: PostgreSQL (Supabase) replaces SQLite (Prisma)
- RLS: Row Level Security ensures users can only access their own data
- Admin: is_admin() function in RLS allows admin users to access all data
- Public: menu_items SELECT policy set to true for public menu viewing
- Analytics: INSERT policy set to true for anonymous tracking
- Zero UI changes - same components, same response shapes
- Database tables must be created by running: DB_PASSWORD=xxx node supabase/setup-db.mjs
