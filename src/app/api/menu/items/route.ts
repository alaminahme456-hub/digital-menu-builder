import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createServiceClient, getAuthUser, toCamel, toCamelList, toSnake } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId');
    const categoryId = request.nextUrl.searchParams.get('categoryId');
    const slug = request.nextUrl.searchParams.get('slug');

    let supabase: ReturnType<typeof createServerClient>;

    let resolvedBusinessId = businessId;

    if (businessId && !slug) {
      const authUser = await getAuthUser(request);
      if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      supabase = createServerClient(authUser.token);
    } else {
      supabase = createServiceClient();
    }

    if (slug) {
      const { data: bizRow, error: bizError } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .single();

      if (bizError || !bizRow) {
        return NextResponse.json({ items: [] });
      }
      resolvedBusinessId = bizRow.id;
    }

    // Require at least businessId or slug to prevent data leakage
    if (!resolvedBusinessId) {
      return NextResponse.json({ items: [] });
    }

    let query = supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', { ascending: true });

    if (resolvedBusinessId) {
      query = query.eq('business_id', resolvedBusinessId);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (slug) {
      query = query.eq('available', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get items error:', error);
      return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
    }

    return NextResponse.json({ items: toCamelList(data ?? []) });
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { businessId, categoryId, name, description, price, image } = await request.json();
    if (!businessId || !categoryId || !name || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerClient(authUser.token);

    // Verify ownership
    const { data: bizRow, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('owner_id', authUser.userId)
      .single();

    if (bizError || !bizRow) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Find max sort_order
    const { data: maxRows } = await supabase
      .from('menu_items')
      .select('sort_order')
      .eq('category_id', categoryId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSort = ((maxRows?.[0]?.sort_order as number) || 0) + 1;

    const { data, error } = await supabase
      .from('menu_items')
      .insert(toSnake({
        name,
        description,
        price: Number(price),
        image,
        categoryId,
        businessId,
        sortOrder: nextSort,
      }))
      .select()
      .single();

    if (error) {
      console.error('Create item error:', error);
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }

    return NextResponse.json({ item: toCamel(data) }, { status: 201 });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const supabase = createServerClient(authUser.token);

    const updateData: Record<string, unknown> = { ...data };
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }

    const { data: row, error } = await supabase
      .from('menu_items')
      .update(toSnake(updateData))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update item error:', error);
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }

    return NextResponse.json({ item: toCamel(row) });
  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const supabase = createServerClient(authUser.token);

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete item error:', error);
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
