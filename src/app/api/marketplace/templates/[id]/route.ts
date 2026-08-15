import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamel,
  toCamelList,
  toSnake,
} from '@/lib/supabase';

// GET /api/marketplace/templates/[id] — get template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const supabase = createServerClient(authUser?.token);

    const { data: template, error } = await supabase
      .from('marketplace_templates')
      .select('*, designers!marketplace_templates_designer_id_fkey(id, display_name, username, avatar)')
      .eq('id', id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Access control: only published templates are publicly visible,
    // or the owner/admin can see pending/hidden/removed
    if (
      template.status !== 'published' &&
      authUser &&
      template.designer_id !== authUser.userId &&
      authUser.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (
      template.status !== 'published' &&
      !authUser
    ) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Increment total_views for published templates
    if (template.status === 'published') {
      await supabase.rpc('increment_template_views', {
        template_id: id,
      }).catch(() => {
        // Fallback: manual increment if RPC doesn't exist
        supabase
          .from('marketplace_templates')
          .update({ total_views: template.total_views + 1 })
          .eq('id', id);
      });
    }

    const result = toCamel(template);
    return NextResponse.json({
      template: {
        ...result,
        designer: result.designers
          ? toCamel(result.designers as Record<string, unknown>)
          : null,
        rating:
          (result.ratingCount as number) > 0
            ? Math.round(
                (((result.ratingSum as number) /
                  (result.ratingCount as number)) *
                  100)
              ) / 100
            : 0,
      },
    });
  } catch (err) {
    console.error('GET /api/marketplace/templates/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/marketplace/templates/[id] — update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerClient(authUser.token);

    // Check ownership or admin
    const { data: template, error: fetchError } = await supabase
      .from('marketplace_templates')
      .select('id, designer_id')
      .eq('id', id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.designer_id !== authUser.userId && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only update your own templates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = [
      'name',
      'description',
      'category',
      'tags',
      'previewImages',
      'templateConfiguration',
      'recommendedFor',
      'designStyle',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('marketplace_templates')
      .update(toSnake(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update template error:', error);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Template updated successfully',
      template: toCamel(data),
    });
  } catch (err) {
    console.error('PUT /api/marketplace/templates/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace/templates/[id] — soft-delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerClient(authUser.token);

    // Check ownership or admin
    const { data: template, error: fetchError } = await supabase
      .from('marketplace_templates')
      .select('id, designer_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.designer_id !== authUser.userId && authUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only delete your own templates' },
        { status: 403 }
      );
    }

    if (template.status === 'removed') {
      return NextResponse.json(
        { error: 'Template is already removed' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('marketplace_templates')
      .update({ status: 'removed' })
      .eq('id', id);

    if (error) {
      console.error('Delete template error:', error);
      return NextResponse.json(
        { error: 'Failed to remove template' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Template removed successfully' });
  } catch (err) {
    console.error('DELETE /api/marketplace/templates/[id] error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
