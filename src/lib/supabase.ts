import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return { url, anonKey };
}

/* ------------------------------------------------------------------ */
/*  Server-side Supabase client with user context (RLS applied)        */
/* ------------------------------------------------------------------ */
export function createServerClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  return createClient(url, anonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Server-side Supabase client using SERVICE ROLE KEY (bypasses RLS)   */
/*  Use for server components that need to read data without auth,    */
/*  e.g. the public menu page served to anonymous QR-code scanners.    */
/* ------------------------------------------------------------------ */
export function createServiceClient(): SupabaseClient {
  const { url } = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Prefer service role key (bypasses RLS entirely)
  if (serviceKey) {
    return createClient(url, serviceKey, {
      global: {
        headers: { Authorization: `Bearer ${serviceKey}` },
      },
    });
  }

  // Fallback: if no service role key, use anon key (RLS still applies —
  // public-read policies must exist on the tables)
  const { anonKey } = getSupabaseConfig();
  return createClient(url, anonKey);
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
