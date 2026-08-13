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
    const businessId = request.nextUrl.searchParams.get('businessId');
    const categoryId = request.nextUrl.searchParams.get('categoryId');

    const where: Record<string, unknown> = {};
    if (businessId) where.businessId = businessId;
    if (categoryId) where.categoryId = categoryId;

    const items = await db.menuItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { businessId, categoryId, name, description, price, image } = await request.json();
    if (!businessId || !categoryId || !name || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const business = await db.business.findFirst({ where: { id: businessId, ownerId: payload.userId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    const maxSort = await db.menuItem.findFirst({
      where: { categoryId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const item = await db.menuItem.create({
      data: {
        name, description, price: Number(price), image, categoryId, businessId,
        sortOrder: (maxSort?.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    const item = await db.menuItem.update({
      where: { id },
      data: {
        ...data,
        price: data.price !== undefined ? Number(data.price) : undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Item ID required' }, { status: 400 });

    await db.menuItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
