import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamel,
  toCamelList,
  toSnake,
} from '@/lib/supabase';

// GET /api/marketplace/favorites — get current user's favorites
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(authUser.token);

    const { data, error } = await supabase
      .from('template_favorites')
      .select(
        'created_at, marketplace_templates(*, designers!marketplace_templates_designer_id_fkey(id, display_name, username, avatar))'
      )
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch favorites error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    const favorites = toCamelList(data || []).map((f: Record<string, unknown>) => {
      const template = f.marketplaceTemplates as Record<string, unknown> | null;
      return {
        ...toCamel(template || {}),
        designer: template?.designers
          ? toCamel(template.designers as Record<string, unknown>)
          : null,
        favoritedAt: f.createdAt,
        rating:
          template && (template.ratingCount as number) > 0
            ? Math.round(
                (((template.ratingSum as number) /
                  (template.ratingCount as number)) *
                  100)
              ) / 100
            : 0,
      };
    });

    return NextResponse.json({ favorites });
  } catch (err) {
    console.error('GET /api/marketplace/favorites error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/favorites — toggle favorite
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing required field: templateId' },
        { status: 400 }
      );
    }

    const supabase = createServerClient(authUser.token);

    // Check if template exists
    const { data: template, error: templateError } = await supabase
      .from('marketplace_templates')
      .select('id, total_favorites')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('template_favorites')
      .select('user_id, template_id')
      .eq('user_id', authUser.userId)
      .eq('template_id', templateId)
      .maybeSingle();

    if (existing) {
      // Unfavorite
      const { error: deleteError } = await supabase
        .from('template_favorites')
        .delete()
        .eq('user_id', authUser.userId)
        .eq('template_id', templateId);

      if (deleteError) {
        console.error('Unfavorite error:', deleteError);
        return NextResponse.json(
          { error: 'Failed to unfavorite' },
          { status: 500 }
        );
      }

      // Decrement total_favorites
      await supabase
        .from('marketplace_templates')
        .update({
          total_favorites: Math.max(0, (template.total_favorites || 1) - 1),
        })
        .eq('id', templateId);

      return NextResponse.json({ favorited: false });
    } else {
      // Favorite
      const { error: insertError } = await supabase
        .from('template_favorites')
        .insert({
          user_id: authUser.userId,
          template_id: templateId,
        });

      if (insertError) {
        console.error('Favorite error:', insertError);
        return NextResponse.json(
          { error: 'Failed to favorite' },
          { status: 500 }
        );
      }

      // Increment total_favorites
      await supabase
        .from('marketplace_templates')
        .update({
          total_favorites: (template.total_favorites || 0) + 1,
        })
        .eq('id', templateId);

      return NextResponse.json({ favorited: true });
    }
  } catch (err) {
    console.error('POST /api/marketplace/favorites error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
