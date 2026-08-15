import { NextRequest, NextResponse } from 'next/server';
import {
  createServerClient,
  getAuthUser,
  toCamel,
  toSnake,
} from '@/lib/supabase';

// POST /api/marketplace/ratings — rate a template
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, rating, review } = body;

    if (!templateId || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: templateId, rating' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = createServerClient(authUser.token);

    // Check if template exists and is published
    const { data: template, error: templateError } = await supabase
      .from('marketplace_templates')
      .select('id, designer_id, rating_sum, rating_count')
      .eq('id', templateId)
      .eq('status', 'published')
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or not available for rating' },
        { status: 404 }
      );
    }

    // Check if user has applied this template
    const { data: application } = await supabase
      .from('marketplace_template_applications')
      .select('id')
      .eq('business_id', authUser.userId) // assuming user_id is business context
      .eq('template_id', templateId)
      .maybeSingle();

    // Also check via usage events
    const { data: usageEvent } = await supabase
      .from('template_usage_events')
      .select('id')
      .eq('template_id', templateId)
      .eq('user_id', authUser.userId)
      .in('event_type', ['application', 'use'])
      .maybeSingle();

    if (!application && !usageEvent) {
      return NextResponse.json(
        { error: 'You must have applied or used this template to rate it' },
        { status: 403 }
      );
    }

    // Check for existing rating
    const { data: existingRating } = await supabase
      .from('template_ratings')
      .select('rating')
      .eq('user_id', authUser.userId)
      .eq('template_id', templateId)
      .maybeSingle();

    const ratingData = toSnake({
      userId: authUser.userId,
      templateId,
      rating,
      review: review || null,
    });

    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating as number;
      const { error: updateError } = await supabase
        .from('template_ratings')
        .update(ratingData)
        .eq('user_id', authUser.userId)
        .eq('template_id', templateId);

      if (updateError) {
        console.error('Update rating error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update rating' },
          { status: 500 }
        );
      }

      // Update template rating sums
      const newSum =
        (template.rating_sum || 0) - oldRating + rating;
      await supabase
        .from('marketplace_templates')
        .update({ rating_sum: newSum })
        .eq('id', templateId);

      return NextResponse.json({
        message: 'Rating updated successfully',
        rating: { templateId, rating, review: review || null },
      });
    } else {
      // Insert new rating
      const { data, error: insertError } = await supabase
        .from('template_ratings')
        .insert(ratingData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert rating error:', insertError);
        return NextResponse.json(
          { error: 'Failed to submit rating' },
          { status: 500 }
        );
      }

      // Update template rating sums
      await supabase
        .from('marketplace_templates')
        .update({
          rating_sum: (template.rating_sum || 0) + rating,
          rating_count: (template.rating_count || 0) + 1,
        })
        .eq('id', templateId);

      return NextResponse.json(
        {
          message: 'Rating submitted successfully',
          rating: toCamel(data),
        },
        { status: 201 }
      );
    }
  } catch (err) {
    console.error('POST /api/marketplace/ratings error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
