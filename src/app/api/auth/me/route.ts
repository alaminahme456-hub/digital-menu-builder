import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, toCamel } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = toCamel(profile as Record<string, unknown>) as Record<string, unknown>;
    userData.id = user.id;
    userData.email = user.email;

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ name, phone })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    const userData = toCamel(profile as Record<string, unknown>) as Record<string, unknown>;
    userData.id = user.id;
    userData.email = user.email;

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
