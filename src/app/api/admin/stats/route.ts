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

    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: totalBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    const { count: publishedMenus } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: totalMenuItems } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true });

    const { count: totalScans } = await supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'qr_scan');

    const { data: recentUsersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (usersError) {
      console.error('Admin stats error:', usersError);
      return NextResponse.json({ error: 'Failed to get admin stats' }, { status: 500 });
    }

    const recentUsers = toCamelList(recentUsersData || []);

    const { data: recentBusinessesData, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (bizError) {
      console.error('Admin stats error:', bizError);
      return NextResponse.json({ error: 'Failed to get admin stats' }, { status: 500 });
    }

    // Fetch owner profiles for recent businesses
    const ownerIds = [...new Set((recentBusinessesData || []).map(b => b.owner_id).filter(Boolean))];
    let ownerMap: Record<string, { email: string; name: string | null }> = {};
    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('id', ownerIds);
      for (const o of owners || []) {
        ownerMap[o.id] = { email: o.email, name: o.name };
      }
    }

    const recentBusinesses = (recentBusinessesData || []).map(b => ({
      ...toCamel(b),
      owner: ownerMap[b.owner_id] || { email: '', name: null },
    }));

    return NextResponse.json({
      stats: {
        totalUsers: totalUsers ?? 0,
        totalBusinesses: totalBusinesses ?? 0,
        publishedMenus: publishedMenus ?? 0,
        totalMenuItems: totalMenuItems ?? 0,
        totalScans: totalScans ?? 0,
      },
      recentUsers,
      recentBusinesses,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to get admin stats' }, { status: 500 });
  }
}
