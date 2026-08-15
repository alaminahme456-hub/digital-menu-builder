import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toCamelList, toSnake } from '@/lib/supabase';

// GET /api/admin/marketplace/templates — list all templates with filters (admin view)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServerClient(authUser.token);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Build query — admin sees ALL statuses (not just published)
    let query = supabase
      .from('marketplace_templates')
      .select('*, designers!marketplace_templates_designer_id_fkey(id, display_name, username, avatar)')
      .order('created_at', { ascending: false });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by type
    if (type) {
      query = query.eq('template_type', type);
    }

    // Build matching count query
    let countQuery = supabase
      .from('marketplace_templates')
      .select('id', { count: 'exact', head: true })
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (type) {
      countQuery = countQuery.eq('template_type', type);
    }

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      console.error('Admin templates count error:', countError);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Admin templates fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    // Transform: flatten designer info into the template object
    const templates = (data || []).map((t) => {
      const camel = toCamel(t);
      const designer = t.designers ? toCamel(t.designers as Record<string, unknown>) : null;
      return {
        ...camel,
        designer,
        rating:
          (t.rating_count as number) > 0
            ? Math.round(((t.rating_sum as number) / (t.rating_count as number)) * 100) / 100
            : 0,
      };
    });

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (err) {
    console.error('GET /api/admin/marketplace/templates error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/marketplace/templates — review/manage template (approve, reject, feature, etc.)
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { templateId, action, reason } = body;

    if (!templateId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, action' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'request_changes', 'feature', 'unfeature'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServerClient(authUser.token);

    // Fetch the template
    const { data: template, error: fetchError } = await supabase
      .from('marketplace_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Build update payload based on action
    const updateData: Record<string, unknown> = {
      reviewed_by: authUser.userId,
      reviewed_at: new Date().toISOString(),
    };

    switch (action) {
      case 'approve':
        if (template.status !== 'pending' && template.status !== 'rejected') {
          return NextResponse.json(
            { error: `Cannot approve a template with status: ${template.status}` },
            { status: 409 }
          );
        }
        updateData.status = 'published';
        break;

      case 'reject':
        if (template.status === 'published') {
          return NextResponse.json(
            { error: 'Unpublish the template first before rejecting' },
            { status: 409 }
          );
        }
        updateData.status = 'rejected';
        updateData.rejection_reason = reason || null;
        break;

      case 'request_changes':
        if (template.status !== 'pending') {
          return NextResponse.json(
            { error: `Cannot request changes for a template with status: ${template.status}` },
            { status: 409 }
          );
        }
        updateData.status = 'pending'; // keep as pending but add review notes
        updateData.review_notes = reason || null;
        updateData.review_requested_at = new Date().toISOString();
        break;

      case 'feature':
        if (template.status !== 'published') {
          return NextResponse.json(
            { error: 'Can only feature published templates' },
            { status: 409 }
          );
        }
        updateData.featured = true;
        break;

      case 'unfeature':
        updateData.featured = false;
        break;
    }

    // Apply update
    const { error: updateError } = await supabase
      .from('marketplace_templates')
      .update(updateData)
      .eq('id', templateId);

    if (updateError) {
      console.error('Admin update template error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    // Fetch the updated template to return
    const { data: updatedTemplate } = await supabase
      .from('marketplace_templates')
      .select('*, designers!marketplace_templates_designer_id_fkey(id, display_name, username, avatar)')
      .eq('id', templateId)
      .single();

    const result = updatedTemplate
      ? {
          ...toCamel(updatedTemplate),
          designer: updatedTemplate.designers
            ? toCamel(updatedTemplate.designers as Record<string, unknown>)
            : null,
        }
      : null;

    return NextResponse.json({
      message: `Template ${action}d successfully`,
      template: result,
    });
  } catch (err) {
    console.error('PUT /api/admin/marketplace/templates error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
