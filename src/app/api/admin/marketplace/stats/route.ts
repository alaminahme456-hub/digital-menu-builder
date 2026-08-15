import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel } from '@/lib/supabase';

// GET /api/admin/marketplace/stats — comprehensive marketplace statistics
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServerClient(authUser.token);

    // Run all independent queries in parallel for performance
    const [
      { data: allDesigners, error: allDesignersErr },
      { data: pendingDesigners, error: pendingDesignersErr },
      { data: allTemplates, error: allTemplatesErr },
      { data: pendingTemplates, error: pendingTemplatesErr },
      { data: publishedTemplates, error: publishedTemplatesErr },
      { data: templateUses, error: templateUsesErr },
      { data: premiumUses, error: premiumUsesErr },
      { data: totalPayouts, error: totalPayoutsErr },
      { data: marketplaceRevenue, error: revenueErr },
      { data: topDesigners, error: topDesignersErr },
      { data: topTemplates, error: topTemplatesErr },
    ] = await Promise.all([
      // Total designers (approved)
      supabase
        .from('designers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),

      // Pending designer applications
      supabase
        .from('designer_applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Total templates (all statuses)
      supabase
        .from('marketplace_templates')
        .select('id', { count: 'exact', head: true }),

      // Pending templates
      supabase
        .from('marketplace_templates')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Published templates
      supabase
        .from('marketplace_templates')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),

      // Total template uses (sum across all templates)
      supabase
        .from('marketplace_templates')
        .select('total_uses')
        .eq('status', 'published'),

      // Total premium uses (sum across all templates)
      supabase
        .from('marketplace_templates')
        .select('total_premium_uses')
        .eq('status', 'published'),

      // Total designer payouts (paid withdrawals)
      supabase
        .from('designer_withdrawals')
        .select('amount')
        .eq('status', 'paid'),

      // Marketplace revenue (estimated: sum of premium uses × platform commission)
      supabase
        .from('designer_earnings')
        .select('amount, commission')
        .eq('status', 'settled'),

      // Top 5 designers by total earnings / template count
      supabase
        .from('designers')
        .select('id, display_name, username, avatar, total_earnings, total_templates, rating_sum, rating_count')
        .eq('status', 'approved')
        .order('total_earnings', { ascending: false })
        .limit(5),

      // Top 5 templates by total uses
      supabase
        .from('marketplace_templates')
        .select('id, name, template_type, total_uses, total_premium_uses, rating_sum, rating_count, featured, designers!marketplace_templates_designer_id_fkey(display_name, username)')
        .eq('status', 'published')
        .order('total_uses', { ascending: false })
        .limit(5),
    ]);

    // Log any count query errors (non-critical, we'll default to 0)
    if (allDesignersErr) console.error('Stats — allDesigners error:', allDesignersErr);
    if (pendingDesignersErr) console.error('Stats — pendingDesigners error:', pendingDesignersErr);
    if (allTemplatesErr) console.error('Stats — allTemplates error:', allTemplatesErr);
    if (pendingTemplatesErr) console.error('Stats — pendingTemplates error:', pendingTemplatesErr);
    if (publishedTemplatesErr) console.error('Stats — publishedTemplates error:', publishedTemplatesErr);
    if (templateUsesErr) console.error('Stats — templateUses error:', templateUsesErr);
    if (premiumUsesErr) console.error('Stats — premiumUses error:', premiumUsesErr);
    if (totalPayoutsErr) console.error('Stats — totalPayouts error:', totalPayoutsErr);
    if (revenueErr) console.error('Stats — revenue error:', revenueErr);

    // Aggregate template uses
    const totalTemplateUses = (templateUses || []).reduce(
      (sum, t) => sum + ((t.total_uses as number) || 0),
      0
    );

    // Aggregate premium uses
    const totalPremiumUses = (premiumUses || []).reduce(
      (sum, t) => sum + ((t.total_premium_uses as number) || 0),
      0
    );

    // Aggregate total payouts
    const totalDesignerPayouts = (totalPayouts || []).reduce(
      (sum, w) => sum + ((w.amount as number) || 0),
      0
    );

    // Aggregate marketplace revenue from commission
    const platformRevenue = (marketplaceRevenue || []).reduce(
      (sum, e) => sum + ((e.commission as number) || 0),
      0
    );

    // Format top designers
    const formattedTopDesigners = (topDesigners || []).map((d) => ({
      ...toCamel(d),
      rating:
        (d.rating_count as number) > 0
          ? Math.round(((d.rating_sum as number) / (d.rating_count as number)) * 100) / 100
          : 0,
    }));

    // Format top templates with nested designer info
    const formattedTopTemplates = (topTemplates || []).map((t) => ({
      id: t.id,
      name: t.name,
      templateType: t.template_type,
      totalUses: t.total_uses || 0,
      totalPremiumUses: t.total_premium_uses || 0,
      featured: t.featured || false,
      rating:
        (t.rating_count as number) > 0
          ? Math.round(((t.rating_sum as number) / (t.rating_count as number)) * 100) / 100
          : 0,
      designer: t.designers
        ? toCamel(t.designers as Record<string, unknown>)
        : null,
    }));

    return NextResponse.json({
      totalDesigners: allDesigners || 0,
      pendingDesigners: pendingDesigners || 0,
      totalTemplates: allTemplates || 0,
      pendingTemplates: pendingTemplates || 0,
      publishedTemplates: publishedTemplates || 0,
      totalTemplateUses,
      premiumUses: totalPremiumUses,
      totalDesignerPayouts: Math.round(totalDesignerPayouts * 100) / 100,
      marketplaceRevenue: Math.round(platformRevenue * 100) / 100,
      topDesigners: formattedTopDesigners,
      topTemplates: formattedTopTemplates,
    });
  } catch (err) {
    console.error('GET /api/admin/marketplace/stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
