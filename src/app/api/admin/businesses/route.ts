import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.substring(7));
}

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const businesses = await db.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { email: true, name: true } },
        _count: { select: { categories: true, menuItems: true, analytics: true } },
      },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Admin businesses error:', error);
    return NextResponse.json({ error: 'Failed to get businesses' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: 'ID and status required' }, { status: 400 });

    await db.business.update({ where: { id }, data: { status } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin update business error:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Business ID required' }, { status: 400 });

    await db.business.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete business error:', error);
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}
