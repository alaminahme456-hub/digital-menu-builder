import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toSnake } from '@/lib/supabase';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
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

    // Log template application
    const { error: logError } = await supabase
      .from('template_applications')
      .insert(toSnake({
        businessId: id,
        templateId,
        appliedAt: new Date().toISOString(),
      }));

    if (logError) {
      // If the table doesn't exist yet, return gracefully — non-critical
      console.error('Template log error (non-critical):', logError);
      return NextResponse.json({ success: true, logged: false });
    }

    return NextResponse.json({ success: true, logged: true });
  } catch (error) {
    console.error('Template log error:', error);
    // Non-critical endpoint — return success to not block template application
    return NextResponse.json({ success: true, logged: false });
  }
}
