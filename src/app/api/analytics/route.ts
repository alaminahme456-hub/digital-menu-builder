import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'Business ID required' }, { status: 400 });

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { count: totalViews } = await supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('event_type', 'view');

    const { count: qrScans } = await supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('event_type', 'qr_scan');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: viewsToday } = await supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('event_type', 'view')
      .gte('created_at', today.toISOString());

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: viewsWeek } = await supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('event_type', 'view')
      .gte('created_at', weekAgo.toISOString());

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const { count: viewsMonth } = await supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('event_type', 'view')
      .gte('created_at', monthAgo.toISOString());

    // Generate daily views for last 14 days
    const dailyViews: { date: string; views: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const { count } = await supabase
        .from('analytics')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('event_type', 'view')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString());
      dailyViews.push({ date: date.toISOString().split('T')[0], views: count ?? 0 });
    }

    return NextResponse.json({
      totalViews: totalViews ?? 0,
      qrScans: qrScans ?? 0,
      viewsToday: viewsToday ?? 0,
      viewsWeek: viewsWeek ?? 0,
      viewsMonth: viewsMonth ?? 0,
      mostViewedCategories: [],
      mostViewedItems: [],
      dailyViews,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, eventType, menuItemId } = await request.json();

    const supabase = createServerClient();

    const { error } = await supabase.from('analytics').insert({
      business_id: businessId,
      event_type: eventType || 'view',
      menu_item_id: menuItemId || null,
      referrer: null,
    });

    if (error) {
      console.error('Track analytics error:', error);
      return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
