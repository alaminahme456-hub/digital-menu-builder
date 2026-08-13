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
    const authHeader = request.headers.get('Authorization');
    const businessId = request.nextUrl.searchParams.get('businessId');
    const publicSlug = request.nextUrl.searchParams.get('slug');

    if (publicSlug) {
      const business = await db.business.findUnique({
        where: { slug: publicSlug },
        include: {
          categories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              items: {
                where: { available: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });
      if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ business });
    }

    const payload = await authenticate(request);
    if (!payload || !businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await db.menuCategory.findMany({
      where: { businessId },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to get categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { businessId, name } = await request.json();
    if (!businessId || !name) {
      return NextResponse.json({ error: 'Business ID and name are required' }, { status: 400 });
    }

    // Verify ownership
    const business = await db.business.findFirst({ where: { id: businessId, ownerId: payload.userId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const maxSort = await db.menuCategory.findFirst({
      where: { businessId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const category = await db.menuCategory.create({
      data: {
        name,
        businessId,
        sortOrder: (maxSort?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
