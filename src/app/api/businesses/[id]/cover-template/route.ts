import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toSnake } from '@/lib/supabase';

// GET - Retrieve current cover template for a business
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Allow public read for published businesses (customers need to see the cover)
    const publicClient = createServerClient();

    // First check if business exists by slug
    const { data: business } = await publicClient
      .from('businesses')
      .select('id, status')
      .eq('slug', id)
      .single();

    const businessId = business?.id || id;

    const { data: coverApp, error: coverError } = await publicClient
      .from('cover_template_applications')
      .select('*')
      .eq('business_id', businessId)
      .order('applied_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (coverError || !coverApp) {
      return NextResponse.json({ coverTemplate: null });
    }

    return NextResponse.json({ coverTemplate: toCamel(coverApp) });
  } catch (error) {
    console.error('Get cover template error:', error);
    return NextResponse.json({ error: 'Failed to get cover template' }, { status: 500 });
  }
}

// PUT - Apply/update cover template for a business
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { coverTemplateId, coverImage, coverTagline, coverAccent } = body;

    if (!coverTemplateId) {
      return NextResponse.json({ error: 'cover_template_id is required' }, { status: 400 });
    }

    const supabase = createServerClient(authUser.token);

    // Verify ownership
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, owner_id')
      .eq('id', id)
      .eq('owner_id', authUser.userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Upsert cover template application (one per business)
    const { data: existing } = await supabase
      .from('cover_template_applications')
      .select('id')
      .eq('business_id', id)
      .maybeSingle();

    if (!existing) {
      // Table might not exist yet — try insert, fail gracefully
      const { error } = await supabase
        .from('cover_template_applications')
        .insert({
          business_id: id,
          cover_template_id: coverTemplateId,
          cover_image: coverImage || null,
          cover_tagline: coverTagline || '',
          cover_accent: coverAccent || '#C9A84C',
        });

      if (error) {
        console.error('Cover template insert error (non-critical):', error);
        return NextResponse.json({ success: true, saved: false });
      }
    } else {
      const { error } = await supabase
        .from('cover_template_applications')
        .update({
          cover_template_id: coverTemplateId,
          cover_image: coverImage || null,
          cover_tagline: coverTagline || '',
          cover_accent: coverAccent || '#C9A84C',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Cover template update error (non-critical):', error);
        return NextResponse.json({ success: true, saved: false });
      }
    }

    // Also update the business table with cover_template_id for easy access
    await supabase
      .from('businesses')
      .update({ cover_template_id: coverTemplateId })
      .eq('id', id);

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error('Save cover template error:', error);
    return NextResponse.json({ success: true, saved: false });
  }
}
