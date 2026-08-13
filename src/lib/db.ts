// Legacy re-export — all DB operations now go through Supabase.
// This file is kept for backwards compatibility with existing imports.
// New code should import from '@/lib/supabase' directly.
export { createServerClient, getAuthUser, toCamel, toCamelList, toSnake } from '@/lib/supabase';
