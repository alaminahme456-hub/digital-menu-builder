import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toCamelList } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { data: usersData, error } = await supabase
      .from('profiles')
      .select('id, email, name, phone, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin users error:', error);
      return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
    }

    // Get business count per user
    const userIds = (usersData || []).map(u => u.id);
    let businessCounts: Record<string, number> = {};
    if (userIds.length > 0) {
      const { data: bizCountData } = await supabase
        .from('businesses')
        .select('owner_id');
      for (const b of bizCountData || []) {
        businessCounts[b.owner_id] = (businessCounts[b.owner_id] || 0) + 1;
      }
    }

    const users = (usersData || []).map(u => ({
      ...toCamel(u),
      _count: { businesses: businessCounts[u.id] || 0 },
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Admin delete user error:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
