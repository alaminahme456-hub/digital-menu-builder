import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamelList,
  toSnake,
} from '@/lib/supabase';

// GET /api/marketplace/designers — list published designers (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    const supabase = createServerClient();

    let query = supabase
      .from('designers')
      .select('*')
      .eq('status', 'approved')
      .order('rating', { ascending: false });

    if (search) {
      query = query.or(
        `display_name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch designers' },
        { status: 500 }
      );
    }

    const designers = toCamelList(data || []).map((d) => ({
      ...d,
      rating: d.ratingCount > 0
        ? Math.round(
            ((d.ratingSum as number) / (d.ratingCount as number)) * 100
          ) / 100
        : 0,
    }));

    return NextResponse.json({ designers });
  } catch (err) {
    console.error('GET /api/marketplace/designers error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/designers — submit designer application
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    // Check for existing pending or approved application
    const { data: existingApp, error: checkError } = await supabase
      .from('designer_applications')
      .select('id, status')
      .eq('user_id', authUser.userId)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: 'Failed to check existing application' },
        { status: 500 }
      );
    }

    if (existingApp) {
      return NextResponse.json(
        { error: `You already have an application with status: ${existingApp.status}` },
        { status: 409 }
      );
    }

    // Also check if user is already an approved designer
    const { data: existingDesigner } = await supabase
      .from('designers')
      .select('id')
      .eq('user_id', authUser.userId)
      .maybeSingle();

    if (existingDesigner) {
      return NextResponse.json(
        { error: 'You are already an approved designer' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      displayName,
      username,
      email,
      bio,
      country,
      specialties,
      portfolioLink,
      socialLinks,
      profileImage,
    } = body;

    if (!fullName || !displayName || !username || !email || !bio || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, displayName, username, email, bio, country' },
        { status: 400 }
      );
    }

    const applicationData = toSnake({
      userId: authUser.userId,
      fullName,
      displayName,
      username,
      email,
      bio,
      country,
      specialties: specialties || [],
      portfolioLink: portfolioLink || null,
      socialLinks: socialLinks || {},
      profileImage: profileImage || null,
      status: 'pending',
    });

    const { data, error } = await supabase
      .from('designer_applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      console.error('Insert application error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Application submitted successfully', application: toCamelList([data])[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/marketplace/designers error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
