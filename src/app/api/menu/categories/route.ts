import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toCamelList, toSnake } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId');
    const publicSlug = request.nextUrl.searchParams.get('slug');

    if (publicSlug) {
      // Public access by business slug — fetch business, then categories + available items
      const supabase = createServerClient();

      const { data: bizRow, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', publicSlug)
        .single();

      if (bizError || !bizRow) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const { data: catRows, error: catError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('business_id', bizRow.id)
        .order('sort_order', { ascending: true });

      if (catError) {
        console.error('Get categories error:', catError);
        return NextResponse.json({ error: 'Failed to get categories' }, { status: 500 });
      }

      const categories = toCamelList(catRows ?? []);

      // Fetch all available items for this business, ordered by sort_order
      const { data: itemRows, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('business_id', bizRow.id)
        .eq('available', true)
        .order('sort_order', { ascending: true });

      if (itemError) {
        console.error('Get items error:', itemError);
        return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
      }

      const allItems = toCamelList(itemRows ?? []);

      // Group items by categoryId
      const itemsByCategory: Record<string, unknown[]> = {};
      for (const item of allItems) {
        const catId = item.categoryId as string;
        if (!itemsByCategory[catId]) itemsByCategory[catId] = [];
        itemsByCategory[catId].push(item);
      }

      // Assemble nested structure
      const assembledCategories = (categories as Record<string, unknown>[]).map((cat: Record<string, unknown>) => ({
        ...cat,
        items: itemsByCategory[cat.id as string] ?? [],
      }));

      const business = {
        ...toCamel(bizRow),
        categories: assembledCategories,
      };

      return NextResponse.json({ business });
    }

    // Authenticated route — requires businessId
    const authUser = await getAuthUser(request);
    if (!authUser || !businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    const { data: catRows, error: catError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true });

    if (catError) {
      console.error('Get categories error:', catError);
      return NextResponse.json({ error: 'Failed to get categories' }, { status: 500 });
    }

    const categories = toCamelList(catRows ?? []);

    // Fetch all items for this business (including unavailable for auth view)
    const { data: itemRows, error: itemError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true });

    if (itemError) {
      console.error('Get items error:', itemError);
      return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
    }

    const allItems = toCamelList(itemRows ?? []);

    const itemsByCategory: Record<string, unknown[]> = {};
    for (const item of allItems) {
      const catId = item.categoryId as string;
      if (!itemsByCategory[catId]) itemsByCategory[catId] = [];
      itemsByCategory[catId].push(item);
    }

    const assembledCategories = (categories as Record<string, unknown>[]).map((cat: Record<string, unknown>) => ({
      ...cat,
      items: itemsByCategory[cat.id as string] ?? [],
    }));

    return NextResponse.json({ categories: assembledCategories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to get categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { businessId, name } = await request.json();
    if (!businessId || !name) {
      return NextResponse.json({ error: 'Business ID and name are required' }, { status: 400 });
    }

    const supabase = createServerClient(authUser.token);

    // Verify ownership
    const { data: bizRow, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('owner_id', authUser.userId)
      .single();

    if (bizError || !bizRow) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Find max sort_order
    const { data: maxRows } = await supabase
      .from('menu_categories')
      .select('sort_order')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSort = ((maxRows?.[0]?.sort_order as number) || 0) + 1;

    const { data, error } = await supabase
      .from('menu_categories')
      .insert(toSnake({ name, businessId, sortOrder: nextSort }))
      .select()
      .single();

    if (error) {
      console.error('Create category error:', error);
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json({ category: toCamel(data) }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
