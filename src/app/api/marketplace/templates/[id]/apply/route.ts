import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamel,
  toSnake,
} from '@/lib/supabase';

// POST /api/marketplace/templates/[id]/apply — apply template to business
export async function POST(
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

    const body = await request.json();
    const { businessId, templateType } = body;

    if (!businessId || !templateType) {
      return NextResponse.json(
        { error: 'Missing required fields: businessId, templateType' },
        { status: 400 }
      );
    }

    if (!['book_cover', 'menu'].includes(templateType)) {
      return NextResponse.json(
        { error: 'templateType must be book_cover or menu' },
        { status: 400 }
      );
    }

    // Check template exists and is published
    const { data: template, error: templateError } = await supabase
      .from('marketplace_templates')
      .select('id, designer_id, total_applications')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or not available' },
        { status: 404 }
      );
    }

    // Check for duplicate application
    const { data: existingApp } = await supabase
      .from('marketplace_template_applications')
      .select('id')
      .eq('business_id', businessId)
      .eq('template_id', id)
      .eq('template_type', templateType)
      .maybeSingle();

    if (existingApp) {
      return NextResponse.json(
        { error: 'Template is already applied to this business' },
        { status: 409 }
      );
    }

    // Record the application
    const { data: application, error: appError } = await supabase
      .from('marketplace_template_applications')
      .insert(
        toSnake({
          businessId,
          templateId: id,
          templateType,
          appliedAt: new Date().toISOString(),
        })
      )
      .select()
      .single();

    if (appError) {
      console.error('Insert application error:', appError);
      return NextResponse.json(
        { error: 'Failed to apply template' },
        { status: 500 }
      );
    }

    // Record usage event
    const eventId = `${authUser.userId}-${id}-${businessId}-${Date.now()}`;
    const { error: eventError } = await supabase
      .from('template_usage_events')
      .insert(
        toSnake({
          templateId: id,
          designerId: template.designer_id,
          businessId,
          userId: authUser.userId,
          eventType: 'application',
          qualifiesForEarnings: true,
          eventId,
        })
      );

    if (eventError) {
      console.error('Insert usage event error:', eventError);
    }

    // Update template application count
    await supabase
      .from('marketplace_templates')
      .update({
        total_applications: (template.total_applications || 0) + 1,
      })
      .eq('id', id);

    return NextResponse.json(
      {
        message: 'Template applied successfully',
        application: toCamel(application),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(
      'POST /api/marketplace/templates/[id]/apply error:',
      err
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
