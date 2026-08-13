import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.substring(7));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Public access by slug (no auth required)
    const businessBySlug = await db.business.findUnique({
      where: { slug: id },
      include: {
        _count: { select: { categories: true, menuItems: true, analytics: true } },
      },
    });
    if (businessBySlug) return NextResponse.json({ business: businessBySlug });

    // Authenticated access by ID
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const business = await db.business.findFirst({
      where: { id, ownerId: payload.userId },
      include: {
        _count: { select: { categories: true, menuItems: true, analytics: true } },
      },
    });

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    return NextResponse.json({ business });
  } catch (error) {
    console.error('Get business error:', error);
    return NextResponse.json({ error: 'Failed to get business' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const business = await db.business.update({
      where: { id, ownerId: payload.userId },
      data: body,
    });

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Update business error:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await db.business.delete({ where: { id, ownerId: payload.userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete business error:', error);
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}
