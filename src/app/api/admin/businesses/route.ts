import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toCamelList, toSnake } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { data: businessesData, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Admin businesses error:', error);
      return NextResponse.json({ error: 'Failed to get businesses' }, { status: 500 });
    }

    // Fetch owner profiles for all businesses
    const ownerIds = [...new Set((businessesData || []).map(b => b.owner_id).filter(Boolean))];
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

    // Fetch counts per business for categories, menu_items, and analytics
    const businessIds = (businessesData || []).map(b => b.id);
    let catCountMap: Record<string, number> = {};
    let itemCountMap: Record<string, number> = {};
    let analyticsCountMap: Record<string, number> = {};

    if (businessIds.length > 0) {
      const [catResult, itemResult, analyticsResult] = await Promise.all([
        supabase.from('menu_categories').select('business_id').in('business_id', businessIds),
        supabase.from('menu_items').select('business_id').in('business_id', businessIds),
        supabase.from('analytics').select('business_id').in('business_id', businessIds),
      ]);

      for (const r of catResult.data || []) {
        catCountMap[r.business_id] = (catCountMap[r.business_id] || 0) + 1;
      }
      for (const r of itemResult.data || []) {
        itemCountMap[r.business_id] = (itemCountMap[r.business_id] || 0) + 1;
      }
      for (const r of analyticsResult.data || []) {
        analyticsCountMap[r.business_id] = (analyticsCountMap[r.business_id] || 0) + 1;
      }
    }

    const businesses = (businessesData || []).map(b => ({
      ...toCamel(b),
      owner: ownerMap[b.owner_id] || { email: '', name: null },
      _count: {
        categories: catCountMap[b.id] || 0,
        menuItems: itemCountMap[b.id] || 0,
        analytics: analyticsCountMap[b.id] || 0,
      },
    }));

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Admin businesses error:', error);
    return NextResponse.json({ error: 'Failed to get businesses' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 });

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { error } = await supabase
      .from('businesses')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Admin update business error:', error);
      return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin update business error:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: 'Business ID required' }, { status: 400 });

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Admin delete business error:', error);
      return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete business error:', error);
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}
