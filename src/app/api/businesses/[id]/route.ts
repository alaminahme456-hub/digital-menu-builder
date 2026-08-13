import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toSnake } from '@/lib/supabase';

async function getCounts(supabase: ReturnType<typeof createServerClient>, businessId: string) {
  const [catCount, itemCount, analyticsCount] = await Promise.all([
    supabase.from('menu_categories').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('analytics').select('*', { count: 'exact', head: true }).eq('business_id', businessId),
  ]);
  return {
    categories: catCount.count ?? 0,
    menuItems: itemCount.count ?? 0,
    analytics: analyticsCount.count ?? 0,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Public access by slug (no auth required)
    const publicClient = createServerClient();
    const { data: slugRow, error: slugError } = await publicClient
      .from('businesses')
      .select('*')
      .eq('slug', id)
      .single();

    if (!slugError && slugRow) {
      const counts = await getCounts(publicClient, slugRow.id);
      return NextResponse.json({ business: { ...toCamel(slugRow), _count: counts } });
    }

    // Authenticated access by ID
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServerClient(authUser.userId);
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .eq('owner_id', authUser.userId)
      .limit(1)
      .single();

    if (error || !data) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const counts = await getCounts(supabase, data.id);
    return NextResponse.json({ business: { ...toCamel(data), _count: counts } });
  } catch (error) {
    console.error('Get business error:', error);
    return NextResponse.json({ error: 'Failed to get business' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const supabase = createServerClient(authUser.userId);
    const { data, error } = await supabase
      .from('businesses')
      .update(toSnake(body))
      .eq('id', id)
      .eq('owner_id', authUser.userId)
      .select()
      .single();

    if (error) {
      console.error('Update business error:', error);
      return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
    }

    return NextResponse.json({ business: toCamel(data) });
  } catch (error) {
    console.error('Update business error:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabase = createServerClient(authUser.userId);

    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id)
      .eq('owner_id', authUser.userId);

    if (error) {
      console.error('Delete business error:', error);
      return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete business error:', error);
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}
