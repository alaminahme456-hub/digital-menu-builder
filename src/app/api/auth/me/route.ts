import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabase = createServerClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = toCamel(profile) as Record<string, unknown>;
    // Ensure id and email are present
    user.id = authUser.userId;
    user.email = authUser.email;

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    const supabase = createServerClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ name, phone })
      .eq('id', authUser.userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    const user = toCamel(profile as Record<string, unknown>) as Record<string, unknown>;
    user.id = authUser.userId;
    user.email = authUser.email;

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
