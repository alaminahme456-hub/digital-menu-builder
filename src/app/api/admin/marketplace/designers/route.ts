import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toCamelList } from '@/lib/supabase';

// GET /api/admin/marketplace/designers — list all designer applications with pagination
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServerClient(authUser.token);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabase
      .from('designer_applications')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Build matching count query
    let countQuery = supabase
      .from('designer_applications')
      .select('id', { count: 'exact', head: true })
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      console.error('Admin designer applications count error:', countError);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Admin designer applications fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch designer applications' },
        { status: 500 }
      );
    }

    // For approved applications, fetch the corresponding designer profile
    const applications = data || [];
    const applicationsWithProfile = await Promise.all(
      applications.map(async (app) => {
        const camel = toCamel(app);
        if (app.status === 'approved') {
          const { data: designer } = await supabase
            .from('designers')
            .select('id, display_name, username, avatar, status, available_balance, total_templates, created_at')
            .eq('user_id', app.user_id)
            .maybeSingle();
          return {
            ...camel,
            designerProfile: designer ? toCamel(designer) : null,
          };
        }
        return { ...camel, designerProfile: null };
      })
    );

    return NextResponse.json({
      applications: applicationsWithProfile,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (err) {
    console.error('GET /api/admin/marketplace/designers error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/marketplace/designers — review designer application (approve/reject)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { applicationId, action, reason } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, action' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServerClient(authUser.token);

    // Fetch the application
    const { data: application, error: fetchError } = await supabase
      .from('designer_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Designer application not found' },
        { status: 404 }
      );
    }

    // Prevent re-reviewing already processed applications
    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: `Application already ${application.status}. Cannot review again.` },
        { status: 409 }
      );
    }

    // Update the application status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const updateData: Record<string, unknown> = {
      status: newStatus,
      reviewed_by: authUser.userId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    };

    const { error: updateError } = await supabase
      .from('designer_applications')
      .update(updateData)
      .eq('id', applicationId);

    if (updateError) {
      console.error('Admin update application error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application status' },
        { status: 500 }
      );
    }

    // If approved, create the designer record (trigger handles this, but we do it explicitly for safety)
    if (action === 'approve') {
      // Check if designer already exists
      const { data: existingDesigner } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', application.user_id)
        .maybeSingle();

      if (!existingDesigner) {
        const designerData = {
          user_id: application.user_id,
          display_name: application.display_name,
          username: application.username,
          avatar: application.profile_image,
          bio: application.bio,
          country: application.country,
          specialties: application.specialties || [],
          portfolio_link: application.portfolio_link,
          social_links: application.social_links || {},
          status: 'approved',
          available_balance: 0,
          pending_earnings: 0,
          total_earnings: 0,
          total_templates: 0,
          rating_sum: 0,
          rating_count: 0,
        };

        const { error: insertError } = await supabase
          .from('designers')
          .insert(designerData);

        if (insertError) {
          console.error('Admin create designer error:', insertError);
          // Rollback the application status
          await supabase
            .from('designer_applications')
            .update({ status: 'pending', reviewed_by: null, reviewed_at: null })
            .eq('id', applicationId);
          return NextResponse.json(
            { error: 'Failed to create designer profile. Application reverted to pending.' },
            { status: 500 }
          );
        }
      }

      // Update the user profile role to 'designer'
      await supabase
        .from('profiles')
        .update({ role: 'designer' })
        .eq('id', application.user_id);
    }

    // Fetch the updated application to return
    const { data: updatedApp } = await supabase
      .from('designer_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    return NextResponse.json({
      message: `Application ${newStatus} successfully`,
      application: updatedApp ? toCamel(updatedApp) : null,
    });
  } catch (err) {
    console.error('POST /api/admin/marketplace/designers error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
