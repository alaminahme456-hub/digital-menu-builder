import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamelList,
} from '@/lib/supabase';

// GET /api/marketplace/designers/application — get current user's application status
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    const { data, error } = await supabase
      .from('designer_applications')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch application' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ application: null });
    }

    return NextResponse.json({
      application: toCamelList([data])[0],
    });
  } catch (err) {
    console.error('GET /api/marketplace/designers/application error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
