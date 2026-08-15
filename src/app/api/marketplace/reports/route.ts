import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamel,
  toSnake,
} from '@/lib/supabase';

// POST /api/marketplace/reports — report a template
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, reason, description } = body;

    if (!templateId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, reason' },
        { status: 400 }
      );
    }

    const supabase = createServerClient(authUser.token);

    // Check if template exists
    const { data: template, error: templateError } = await supabase
      .from('marketplace_templates')
      .select('id')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if user already reported this template
    const { data: existingReport } = await supabase
      .from('template_reports')
      .select('id, status')
      .eq('template_id', templateId)
      .eq('reporter_id', authUser.userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You already have a pending report for this template' },
        { status: 409 }
      );
    }

    const reportData = toSnake({
      templateId,
      reporterId: authUser.userId,
      reason,
      description: description || null,
      status: 'pending',
    });

    const { data, error } = await supabase
      .from('template_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) {
      console.error('Insert report error:', error);
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Report submitted successfully',
        report: toCamel(data),
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/marketplace/reports error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
