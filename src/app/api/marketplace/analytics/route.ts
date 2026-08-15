import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamelList,
} from '@/lib/supabase';

// GET /api/marketplace/analytics — marketplace analytics
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    const isAdmin = authUser.role === 'admin';

    if (isAdmin) {
      // Full platform analytics for admins
      const [
        { count: totalDesigners },
        { count: totalTemplates },
        { count: publishedTemplates },
        { count: pendingTemplates },
        { count: totalApplications },
        { count: totalUses },
        { count: totalReports },
        totalEarningsResult,
        recentTemplatesResult,
      ] = await Promise.all([
        supabase
          .from('designers')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('marketplace_templates')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('marketplace_templates')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'published'),
        supabase
          .from('marketplace_templates')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('marketplace_template_applications')
          .select('id', { count: 'exact', head: true }),
        supabase
          .from('template_usage_events')
          .select('id', { count: 'exact', head: true })
          .eq('event_type', 'use'),
        supabase
          .from('template_reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('designer_earnings')
          .select('amount')
          .eq('status', 'available'),
        supabase
          .from('marketplace_templates')
          .select('*, designers!marketplace_templates_designer_id_fkey(display_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const totalAvailableEarnings = (totalEarningsResult.data || []).reduce(
        (sum: number, e: Record<string, unknown>) =>
          sum + (Number(e.amount) || 0),
        0
      );

      return NextResponse.json({
        platform: {
          totalDesigners: totalDesigners || 0,
          totalTemplates: totalTemplates || 0,
          publishedTemplates: publishedTemplates || 0,
          pendingTemplates: pendingTemplates || 0,
          totalApplications: totalApplications || 0,
          totalUses: totalUses || 0,
          totalAvailableEarnings,
          totalPendingReports: totalReports || 0,
        },
        recentPendingTemplates: toCamelList(recentTemplatesResult.data || []),
      });
    } else {
      // Designer-specific analytics
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

      const [
        { count: totalTemplates },
        { count: publishedTemplates },
        { count: pendingTemplates },
        totalViewsResult,
        totalApplicationsResult,
        totalUsesResult,
        totalFavoritesResult,
        recentEventsResult,
        templateBreakdown,
      ] = await Promise.all([
        supabase
          .from('marketplace_templates')
          .select('id', { count: 'exact', head: true })
          .eq('designer_id', designer.id),
        supabase
          .from('marketplace_templates')
          .select('id', { count: 'exact', head: true })
          .eq('designer_id', designer.id)
          .eq('status', 'published'),
        supabase
          .from('marketplace_templates')
          .select('id', { count: 'exact', head: true })
          .eq('designer_id', designer.id)
          .eq('status', 'pending'),
        supabase
          .from('marketplace_templates')
          .select('total_views')
          .eq('designer_id', designer.id),
        supabase
          .from('marketplace_templates')
          .select('total_applications')
          .eq('designer_id', designer.id),
        supabase
          .from('marketplace_templates')
          .select('total_uses')
          .eq('designer_id', designer.id),
        supabase
          .from('marketplace_templates')
          .select('total_favorites')
          .eq('designer_id', designer.id),
        supabase
          .from('template_usage_events')
          .select('*, marketplace_templates(name)')
          .eq('designer_id', designer.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('marketplace_templates')
          .select('name, total_views, total_applications, total_uses, total_favorites, rating_sum, rating_count, status')
          .eq('designer_id', designer.id)
          .order('total_uses', { ascending: false }),
      ]);

      const sumField = (rows: Record<string, unknown>[], field: string) =>
        rows.reduce(
          (sum: number, r: Record<string, unknown>) =>
            sum + (Number(r[field]) || 0),
          0
        );

      return NextResponse.json({
        designer: {
          totalTemplates: totalTemplates || 0,
          publishedTemplates: publishedTemplates || 0,
          pendingTemplates: pendingTemplates || 0,
          totalViews: sumField(totalViewsResult.data || [], 'totalViews'),
          totalApplications: sumField(
            totalApplicationsResult.data || [],
            'totalApplications'
          ),
          totalUses: sumField(totalUsesResult.data || [], 'totalUses'),
          totalFavorites: sumField(
            totalFavoritesResult.data || [],
            'totalFavorites'
          ),
        },
        recentEvents: toCamelList(recentEventsResult.data || []),
        templateBreakdown: toCamelList(templateBreakdown.data || []).map(
          (t: Record<string, unknown>) => ({
            ...t,
            rating:
              (t.ratingCount as number) > 0
                ? Math.round(
                    (((t.ratingSum as number) / (t.ratingCount as number)) *
                      100)
                  ) / 100
                : 0,
          })
        ),
      });
    }
  } catch (err) {
    console.error('GET /api/marketplace/analytics error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
