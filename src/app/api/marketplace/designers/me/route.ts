import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamel,
  toCamelList,
} from '@/lib/supabase';

// GET /api/marketplace/designers/me — designer dashboard data
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    // Fetch designer profile
    const { data: designer, error: designerError } = await supabase
      .from('designers')
      .select('*')
      .eq('user_id', authUser.userId)
      .single();

    if (designerError || !designer) {
      return NextResponse.json(
        { error: 'Designer profile not found. You may not be an approved designer yet.' },
        { status: 404 }
      );
    }

    // Fetch recent earnings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentEarnings, error: earningsError } = await supabase
      .from('designer_earnings')
      .select('*, marketplace_templates(name, template_type)')
      .eq('designer_id', designer.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (earningsError) {
      console.error('Fetch earnings error:', earningsError);
    }

    // Fetch recent templates
    const { data: recentTemplates, error: templatesError } = await supabase
      .from('marketplace_templates')
      .select('*')
      .eq('designer_id', designer.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (templatesError) {
      console.error('Fetch templates error:', templatesError);
    }

    // Fetch template status summary
    const { data: statusSummary, error: statusError } = await supabase
      .from('marketplace_templates')
      .select('status')
      .eq('designer_id', designer.id);

    const templateStatusCounts: Record<string, number> = {};
    if (statusSummary && !statusError) {
      for (const row of statusSummary) {
        const key = row.status as string;
        templateStatusCounts[key] = (templateStatusCounts[key] || 0) + 1;
      }
    }

    const designerProfile = toCamel(designer);

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
      stats: {
        totalTemplates: designer.total_templates || 0,
        totalUses: designer.total_uses || 0,
        totalEarnings: designer.total_earnings || 0,
        availableBalance: designer.available_balance || 0,
        pendingEarnings: designer.pending_earnings || 0,
        templateStatusCounts,
      },
      recentEarnings: toCamelList(recentEarnings || []),
      recentTemplates: toCamelList(recentTemplates || []).map((t) => ({
        ...t,
        rating:
          t.ratingCount > 0
            ? Math.round(
                (((t.ratingSum as number) / (t.ratingCount as number)) * 100)
              ) / 100
            : 0,
      })),
    });
  } catch (err) {
    console.error('GET /api/marketplace/designers/me error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
