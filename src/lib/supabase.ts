import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* ------------------------------------------------------------------ */
/*  Server-side Supabase client with user context (RLS applied)        */
/* ------------------------------------------------------------------ */
export function createServerClient(token?: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Verify user from request — returns user metadata + raw token       */
/* ------------------------------------------------------------------ */
export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  name?: string | null;
  phone?: string | null;
  token: string;
}

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const supabase = createServerClient(token);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    // Fetch profile for role/phone/name
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name, phone')
      .eq('id', user.id)
      .single();

    return {
      userId: user.id,
      email: user.email || '',
      role: profile?.role || 'user',
      name: profile?.name ?? user.user_metadata?.name ?? null,
      phone: profile?.phone ?? null,
      token,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Transform helpers: snake_case (DB) ↔ camelCase (JS)               */
/* ------------------------------------------------------------------ */
export function toCamel(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = value instanceof Date ? (value as Date).toISOString() : value;
  }
  return result;
}

export function toCamelList(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(toCamel);
}

export function toSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
    result[snake] = value;
  }
  return result;
}
