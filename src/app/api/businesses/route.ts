import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, generateSlug } from '@/lib/auth';

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.substring(7));
}

export async function GET(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businesses = await db.business.findMany({
      where: { ownerId: payload.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { categories: true, menuItems: true, analytics: true } },
      },
    });

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Get businesses error:', error);
    return NextResponse.json({ error: 'Failed to get businesses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, category, phone, whatsapp, address, openingHours, description, logo, primaryColor, secondaryColor } = body;

    if (!name) return NextResponse.json({ error: 'Business name is required' }, { status: 400 });

    const slug = generateSlug(name);

    const business = await db.business.create({
      data: {
        slug,
        name, category, phone, whatsapp, address, openingHours, description,
        primaryColor: primaryColor || '#10b981',
        secondaryColor: secondaryColor || '#059669',
        ownerId: payload.userId,
      },
    });

    return NextResponse.json({ business }, { status: 201 });
  } catch (error) {
    console.error('Create business error:', error);
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }
}
