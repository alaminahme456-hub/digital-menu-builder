import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  toCamel,
  toCamelList,
} from '@/lib/supabase';

// GET /api/marketplace/designers/[username] — public designer profile + templates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const supabase = createServerClient();

    // Fetch designer profile
    const { data: designer, error: designerError } = await supabase
      .from('designers')
      .select('*')
      .eq('username', username)
      .eq('status', 'approved')
      .single();

    if (designerError || !designer) {
      return NextResponse.json(
        { error: 'Designer not found' },
        { status: 404 }
      );
    }

    // Fetch designer's published templates
    const { data: templates, error: templatesError } = await supabase
      .from('marketplace_templates')
      .select('*')
      .eq('designer_id', designer.id)
      .eq('status', 'published')
      .order('total_uses', { ascending: false });

    if (templatesError) {
      console.error('Fetch templates error:', templatesError);
    }

    const designerProfile = toCamel(designer);
    const templatesList = toCamelList(templates || []).map((t) => ({
      ...t,
      rating:
        t.ratingCount > 0
          ? Math.round(
              ((t.ratingSum as number) / (t.ratingCount as number)) * 100
            ) / 100
          : 0,
    }));

    return NextResponse.json({
      designer: {
        ...designerProfile,
        rating:
          (designerProfile.ratingCount as number) > 0
            ? Math.round(
                (((designerProfile.ratingSum as number) /
                  (designerProfile.ratingCount as number)) *
                  100)
              ) / 100
            : 0,
      },
      templates: templatesList,
    });
  } catch (err) {
    console.error(
      'GET /api/marketplace/designers/[username] error:',
      err
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
