import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Registration did not return a user. Please try again.' },
        { status: 502 }
      );
    }

    const token = data.session?.access_token || null;

    // If no session (email confirmation required), tell frontend
    if (!token) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: name || null,
          role: 'user',
        },
        token: null,
        requiresConfirmation: true,
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: name || null,
        role: 'user',
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    const isConfigError = message.includes('Supabase is not configured');

    return NextResponse.json(
      { error: isConfigError ? message : 'Registration failed' },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
