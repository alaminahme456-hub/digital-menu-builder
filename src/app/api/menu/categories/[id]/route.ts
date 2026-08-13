import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toSnake } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { name, sortOrder } = body;

    if (!id) return NextResponse.json({ error: 'Category ID required' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const supabase = createServerClient(authUser.token);

    const { data: row, error } = await supabase
      .from('menu_categories')
      .update(toSnake(data))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update category error:', error);
      return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }

    return NextResponse.json({ category: toCamel(row) });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Category ID required' }, { status: 400 });

    const supabase = createServerClient(authUser.token);

    // Cascade delete handled by FK (menu_items.onDelete: Cascade)
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete category error:', error);
      return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
