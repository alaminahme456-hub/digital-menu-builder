import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamelList,
} from '@/lib/supabase';

// GET /api/marketplace/earnings — get designer earnings ledger
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    // Verify user is a designer
    const { data: designer, error: designerError } = await supabase
      .from('designers')
      .select('id')
      .eq('user_id', authUser.userId)
      .single();

    if (designerError || !designer) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    );
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || '';

    let query = supabase
      .from('designer_earnings')
      .select('*, marketplace_templates(name, template_type)')
      .eq('designer_id', designer.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    // Get total count
    let countQuery = supabase
      .from('designer_earnings')
      .select('id', { count: 'exact', head: true })
      .eq('designer_id', designer.id);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      console.error('Count earnings error:', countError);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Fetch earnings error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch earnings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      earnings: toCamelList(data || []),
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil(((totalCount || 0) / limit)),
      },
    });
  } catch (err) {
    console.error('GET /api/marketplace/earnings error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
