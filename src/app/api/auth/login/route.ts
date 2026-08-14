import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = data.user;
    const token = data.session?.access_token;

    if (!user || !token) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Fetch profile for name/role — use the session token for RLS
    const authClient = createServerClient(token);
    const { data: profile } = await authClient
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || null,
        role: profile?.role || 'user',
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    const isConfigError = message.includes('Supabase is not configured');

    return NextResponse.json(
      { error: isConfigError ? message : 'Login failed' },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
