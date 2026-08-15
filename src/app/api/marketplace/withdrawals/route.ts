import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamelList,
  toSnake,
} from '@/lib/supabase';

// GET /api/marketplace/withdrawals — get designer withdrawals
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    // Verify user is a designer
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '20', 10))
    );
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || '';

    let query = supabase
      .from('designer_withdrawals')
      .select('*')
      .eq('designer_id', designer.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    // Get total count
    let countQuery = supabase
      .from('designer_withdrawals')
      .select('id', { count: 'exact', head: true })
      .eq('designer_id', designer.id);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    const { count: totalCount, error: countError } = await countQuery;
    if (countError) {
      console.error('Count withdrawals error:', countError);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Fetch withdrawals error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch withdrawals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      withdrawals: toCamelList(data || []),
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil(((totalCount || 0) / limit)),
      },
    });
  } catch (err) {
    console.error('GET /api/marketplace/withdrawals error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/withdrawals — create withdrawal request
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, bankName, accountName, accountNumber } = body;

    if (!amount || !bankName || !accountName || !accountNumber) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: amount, bankName, accountName, accountNumber',
        },
        { status: 400 }
      );
    }

    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const supabase = createServerClient(authUser.token);

    // Verify user is a designer and get balance
    const { data: designer, error: designerError } = await supabase
      .from('designers')
      .select('id, available_balance, pending_earnings')
      .eq('user_id', authUser.userId)
      .single();

    if (designerError || !designer) {
      return NextResponse.json(
        { error: 'Designer profile not found' },
        { status: 403 }
      );
    }

    // Validate amount against available balance
    if (withdrawalAmount > (designer.available_balance || 0)) {
      return NextResponse.json(
        {
          error: `Insufficient available balance. Available: ${designer.available_balance}`,
        },
        { status: 400 }
      );
    }

    // Check for minimum withdrawal (using config if available, default to 10)
    const { data: minWithdrawalConfig } = await supabase
      .from('marketplace_config')
      .select('value')
      .eq('key', 'min_withdrawal_amount')
      .maybeSingle();

    const minWithdrawal = minWithdrawalConfig
      ? Number(minWithdrawalConfig.value)
      : 10;

    if (withdrawalAmount < minWithdrawal) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal amount is ${minWithdrawal}`,
        },
        { status: 400 }
      );
    }

    const withdrawalData = toSnake({
      designerId: designer.id,
      amount: withdrawalAmount,
      bankName,
      accountName,
      accountNumber,
      status: 'pending',
    });

    const { data, error } = await supabase
      .from('designer_withdrawals')
      .insert(withdrawalData)
      .select()
      .single();

    if (error) {
      console.error('Insert withdrawal error:', error);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    // Deduct from available balance
    await supabase
      .from('designers')
      .update({
        available_balance: (designer.available_balance || 0) - withdrawalAmount,
      })
      .eq('id', designer.id);

    return NextResponse.json(
      {
        message: 'Withdrawal request submitted successfully',
        withdrawal: toCamelList([data])[0],
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/marketplace/withdrawals error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
