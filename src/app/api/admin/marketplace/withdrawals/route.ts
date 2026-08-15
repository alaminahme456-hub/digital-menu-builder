import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toCamelList } from '@/lib/supabase';

// GET /api/admin/marketplace/withdrawals — list all withdrawals with pagination (admin)
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

    // Build query — admin sees ALL withdrawals across all designers
    let query = supabase
      .from('designer_withdrawals')
      .select('*, designers(id, display_name, username, avatar, user_id)')
      .order('created_at', { ascending: false });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Build matching count query
    let countQuery = supabase
      .from('designer_withdrawals')
      .select('id', { count: 'exact', head: true })
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      console.error('Admin withdrawals count error:', countError);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Admin withdrawals fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      );
    }

    // Transform: flatten designer info
    const withdrawals = (data || []).map((w) => {
      const camel = toCamel(w);
      const designer = w.designers ? toCamel(w.designers as Record<string, unknown>) : null;
      return { ...camel, designer };
    });

    return NextResponse.json({
      withdrawals,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
    });
  } catch (err) {
    console.error('GET /api/admin/marketplace/withdrawals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/marketplace/withdrawals — process withdrawal (approve, reject, mark_paid)
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { withdrawalId, action, notes } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: withdrawalId, action' },
        { status: 400 }
      );
    }

    const validActions = ['approve', 'reject', 'mark_paid'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createServerClient(authUser.token);

    // Fetch the withdrawal with designer info
    const { data: withdrawal, error: fetchError } = await supabase
      .from('designer_withdrawals')
      .select('*, designers(id, user_id, available_balance)')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    // Validate state transitions
    switch (action) {
      case 'approve':
        if (withdrawal.status !== 'pending') {
          return NextResponse.json(
            { error: `Cannot approve a withdrawal with status: ${withdrawal.status}` },
            { status: 409 }
          );
        }
        break;

      case 'reject':
        if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
          return NextResponse.json(
            { error: `Cannot reject a withdrawal with status: ${withdrawal.status}` },
            { status: 409 }
          );
        }
        break;

      case 'mark_paid':
        if (withdrawal.status !== 'processing') {
          return NextResponse.json(
            { error: `Cannot mark paid — withdrawal must be in 'processing' status, current: ${withdrawal.status}` },
            { status: 409 }
          );
        }
        break;
    }

    // Build update payload
    const updateData: Record<string, unknown> = {
      processed_by: authUser.userId,
      processed_at: new Date().toISOString(),
      admin_notes: notes || null,
    };

    switch (action) {
      case 'approve':
        updateData.status = 'processing';
        break;

      case 'reject':
        updateData.status = 'rejected';
        updateData.rejection_reason = notes || null;
        break;

      case 'mark_paid':
        updateData.status = 'paid';
        break;
    }

    // Apply update within a transaction-like sequence
    const { error: updateError } = await supabase
      .from('designer_withdrawals')
      .update(updateData)
      .eq('id', withdrawalId);

    if (updateError) {
      console.error('Admin update withdrawal error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update withdrawal' },
        { status: 500 }
      );
    }

    // On rejection, refund the designer's available_balance
    if (action === 'reject') {
      const designer = withdrawal.designers as Record<string, unknown> | null;
      if (designer) {
        const currentBalance = (designer.available_balance as number) || 0;
        const refundAmount = (withdrawal.amount as number) || 0;

        const { error: balanceError } = await supabase
          .from('designers')
          .update({
            available_balance: currentBalance + refundAmount,
          })
          .eq('id', designer.id);

        if (balanceError) {
          console.error('Admin refund balance error:', balanceError);
          // Note: the withdrawal was already updated, but balance refund failed
          // Admin should be notified to handle manually
          return NextResponse.json(
            {
              error: 'Withdrawal rejected but failed to refund designer balance. Please manually refund.',
              withdrawalId,
              designerId: designer.id,
              refundAmount,
            },
            { status: 500 }
          );
        }
      }
    }

    // Fetch the updated withdrawal to return
    const { data: updatedWithdrawal } = await supabase
      .from('designer_withdrawals')
      .select('*, designers(id, display_name, username, avatar)')
      .eq('id', withdrawalId)
      .single();

    const result = updatedWithdrawal
      ? {
          ...toCamel(updatedWithdrawal),
          designer: updatedWithdrawal.designers
            ? toCamel(updatedWithdrawal.designers as Record<string, unknown>)
            : null,
        }
      : null;

    return NextResponse.json({
      message: `Withdrawal ${action === 'mark_paid' ? 'marked as paid' : `${action}d`} successfully`,
      withdrawal: result,
    });
  } catch (err) {
    console.error('PUT /api/admin/marketplace/withdrawals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
