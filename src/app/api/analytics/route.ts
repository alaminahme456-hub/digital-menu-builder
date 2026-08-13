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
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'Business ID required' }, { status: 400 });

    const totalViews = await db.analytics.count({
      where: { businessId, eventType: 'view' },
    });

    const qrScans = await db.analytics.count({
      where: { businessId, eventType: 'qr_scan' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const viewsToday = await db.analytics.count({
      where: { businessId, eventType: 'view', createdAt: { gte: today } },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const viewsWeek = await db.analytics.count({
      where: { businessId, eventType: 'view', createdAt: { gte: weekAgo } },
    });

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const viewsMonth = await db.analytics.count({
      where: { businessId, eventType: 'view', createdAt: { gte: monthAgo } },
    });

    // Generate daily views for last 14 days
    const dailyViews = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const count = await db.analytics.count({
        where: { businessId, eventType: 'view', createdAt: { gte: date, lt: nextDate } },
      });
      dailyViews.push({ date: date.toISOString().split('T')[0], views: count });
    }

    return NextResponse.json({
      totalViews, qrScans, viewsToday, viewsWeek, viewsMonth,
      mostViewedCategories: [],
      mostViewedItems: [],
      dailyViews,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, eventType, menuItemId } = await request.json();

    await db.analytics.create({
      data: {
        eventType: eventType || 'view',
        menuItemId,
        businessId,
        referrer: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track analytics error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
