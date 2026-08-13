import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toCamelList, toSnake } from '@/lib/supabase';
import { generateSlug } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServerClient(authUser.userId);

    const { data: rows, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', authUser.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get businesses error:', error);
      return NextResponse.json({ error: 'Failed to get businesses' }, { status: 500 });
    }

    const businesses = await Promise.all(
      (rows ?? []).map(async (row) => {
        const [catCount, itemCount, analyticsCount] = await Promise.all([
          supabase.from('menu_categories').select('*', { count: 'exact', head: true }).eq('business_id', row.id),
          supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('business_id', row.id),
          supabase.from('analytics').select('*', { count: 'exact', head: true }).eq('business_id', row.id),
        ]);
        return {
          ...toCamel(row),
          _count: {
            categories: catCount.count ?? 0,
            menuItems: itemCount.count ?? 0,
            analytics: analyticsCount.count ?? 0,
          },
        };
      })
    );

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Get businesses error:', error);
    return NextResponse.json({ error: 'Failed to get businesses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, category, phone, whatsapp, address, openingHours, description, logo, primaryColor, secondaryColor } = body;

    if (!name) return NextResponse.json({ error: 'Business name is required' }, { status: 400 });

    const slug = generateSlug(name);

    const supabase = createServerClient(authUser.userId);

    const { data, error } = await supabase
      .from('businesses')
      .insert(toSnake({
        slug,
        name, category, phone, whatsapp, address, openingHours, description,
        primaryColor: primaryColor || '#10b981',
        secondaryColor: secondaryColor || '#059669',
        ownerId: authUser.userId,
      }))
      .select()
      .single();

    if (error) {
      console.error('Create business error:', error);
      return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
    }

    return NextResponse.json({ business: toCamel(data) }, { status: 201 });
  } catch (error) {
    console.error('Create business error:', error);
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }
}
