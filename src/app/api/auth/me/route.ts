import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, toCamel } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = toCamel(profile as Record<string, unknown>) as Record<string, unknown>;
    userData.id = user.id;
    userData.email = user.email;

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin — prevent self-deletion of last admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (count !== null && count <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last admin account' }, { status: 403 });
      }
    }

    // Delete all businesses owned by this user first
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id);

    if (businesses && businesses.length > 0) {
      const businessIds = businesses.map((b: { id: string }) => b.id);
      // Categories will cascade delete items
      const { error: catErr } = await supabase
        .from('menu_categories')
        .delete()
        .in('business_id', businessIds);
      if (catErr) console.error('Error deleting categories:', catErr.message);

      // Delete uploads
      const { error: upErr } = await supabase
        .from('menu_uploads')
        .delete()
        .in('business_id', businessIds);
      if (upErr) console.error('Error deleting uploads:', upErr.message);

      // Delete cover template applications
      const { error: ctaErr } = await supabase
        .from('cover_template_applications')
        .delete()
        .in('business_id', businessIds);
      if (ctaErr) console.error('Error deleting cover template apps:', ctaErr.message);

      // Delete analytics
      const { error: anErr } = await supabase
        .from('analytics')
        .delete()
        .in('business_id', businessIds);
      if (anErr) console.error('Error deleting analytics:', anErr.message);

      // Delete template applications
      const { error: taErr } = await supabase
        .from('template_applications')
        .delete()
        .in('business_id', businessIds);
      if (taErr) console.error('Error deleting template apps:', taErr.message);

      // Delete marketplace template applications
      const { error: mtaErr } = await supabase
        .from('marketplace_template_applications')
        .delete()
        .in('business_id', businessIds);
      if (mtaErr) console.error('Error deleting marketplace template apps:', mtaErr.message);

      // Delete usage events for this user
      const { error: ueErr } = await supabase
        .from('template_usage_events')
        .delete()
        .eq('user_id', user.id);
      if (ueErr) console.error('Error deleting usage events:', ueErr.message);

      // Delete businesses
      const { error: bizErr } = await supabase
        .from('businesses')
        .delete()
        .in('id', businessIds);
      if (bizErr) console.error('Error deleting businesses:', bizErr.message);
    }

    // Delete designer-related data
    await supabase.from('designer_applications').delete().eq('user_id', user.id);
    const { data: designer } = await supabase
      .from('designers')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (designer) {
      await supabase.from('designer_withdrawals').delete().eq('designer_id', designer.id);
      await supabase.from('designer_earnings').delete().eq('designer_id', designer.id);
      await supabase.from('marketplace_templates').delete().eq('designer_id', designer.id);
      await supabase.from('designers').delete().eq('id', designer.id);
    }

    // Delete favorites, ratings, reports
    await supabase.from('template_favorites').delete().eq('user_id', user.id);
    await supabase.from('template_ratings').delete().eq('user_id', user.id);
    await supabase.from('template_reports').delete().eq('reporter_id', user.id);

    // Delete AI scan logs
    await supabase.from('ai_scan_logs').delete().eq('business_id', user.id);

    // Delete analytics for user
    await supabase.from('analytics').delete().eq('user_id', user.id);

    // Delete profile
    const { error: profileErr } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);
    if (profileErr) {
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
    }

    // Delete auth user
    const { error: deleteErr } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteErr) {
      console.error('Error deleting auth user:', deleteErr.message);
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone } = body;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ name, phone })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    const userData = toCamel(profile as Record<string, unknown>) as Record<string, unknown>;
    userData.id = user.id;
    userData.email = user.email;

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
