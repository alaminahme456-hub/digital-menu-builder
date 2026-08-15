import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamel,
  toCamelList,
  toSnake,
} from '@/lib/supabase';

// GET /api/marketplace/templates — list published marketplace templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search')?.trim() || '';
    const featured = searchParams.get('featured') === 'true';
    const sort = searchParams.get('sort') || 'popular';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    );
    const offset = (page - 1) * limit;

    const supabase = createServerClient();

    let query = supabase
      .from('marketplace_templates')
      .select('*, designers!marketplace_templates_designer_id_fkey(id, display_name, username, avatar)')
      .eq('status', 'published');

    if (type) {
      query = query.eq('template_type', type);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (featured) {
      query = query.eq('featured', true);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`
      );
    }

    // Sorting
    switch (sort) {
      case 'new':
        query = query.order('created_at', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating_count', { ascending: false });
        break;
      case 'popular':
      default:
        query = query.order('total_uses', { ascending: false });
        break;
    }

    // Get total count
    const countQuery = supabase
      .from('marketplace_templates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    if (type) countQuery.eq('template_type', type);
    if (category) countQuery.eq('category', category);
    if (featured) countQuery.eq('featured', true);
    if (search) {
      countQuery.or(
        `name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`
      );
    }

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      console.error('Count error:', countError);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Fetch templates error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    const templates = toCamelList(data || []).map((t) => ({
      ...t,
      designer: t.designers ? toCamel(t.designers as Record<string, unknown>) : null,
      rating:
        t.ratingCount > 0
          ? Math.round(
              ((t.ratingSum as number) / (t.ratingCount as number)) * 100
            ) / 100
          : 0,
    }));

    return NextResponse.json({
      templates: templates.map(({ designers, ...rest }: Record<string, unknown>) => rest),
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil(((totalCount || 0) / limit)),
      },
    });
  } catch (err) {
    console.error('GET /api/marketplace/templates error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/templates — create new template (auth, must be approved designer)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    // Verify user is an approved designer
    const { data: designer, error: designerError } = await supabase
      .from('designers')
      .select('id')
      .eq('user_id', authUser.userId)
      .eq('status', 'approved')
      .single();

    if (designerError || !designer) {
      return NextResponse.json(
        { error: 'Only approved designers can create templates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      templateType,
      name,
      description,
      category,
      tags,
      previewImages,
      templateConfiguration,
      recommendedFor,
      designStyle,
    } = body;

    if (!templateType || !name || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: templateType, name, description' },
        { status: 400 }
      );
    }

    if (!['book_cover', 'menu'].includes(templateType)) {
      return NextResponse.json(
        { error: 'templateType must be book_cover or menu' },
        { status: 400 }
      );
    }

    const templateData = toSnake({
      designerId: designer.id,
      templateType,
      name,
      description,
      category: category || null,
      tags: tags || [],
      previewImages: previewImages || [],
      templateConfiguration: templateConfiguration || {},
      recommendedFor: recommendedFor || [],
      designStyle: designStyle || null,
      status: 'pending',
      featured: false,
      licenseType: 'standard',
      version: '1.0.0',
      totalViews: 0,
      totalPreviews: 0,
      totalApplications: 0,
      totalUses: 0,
      totalPremiumUses: 0,
      totalFavorites: 0,
      ratingSum: 0,
      ratingCount: 0,
    });

    const { data, error } = await supabase
      .from('marketplace_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Insert template error:', error);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Template created and pending review', template: toCamel(data) },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/marketplace/templates error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
