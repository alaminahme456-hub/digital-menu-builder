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

    const totalUsers = await db.user.count();
    const totalBusinesses = await db.business.count();
    const publishedMenus = await db.business.count({ where: { status: 'published' } });
    const totalMenuItems = await db.menuItem.count();
    const totalScans = await db.analytics.count({ where: { eventType: 'qr_scan' } });

    const recentUsers = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const recentBusinesses = await db.business.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { owner: { select: { email: true, name: true } } },
    });

    return NextResponse.json({
      stats: { totalUsers, totalBusinesses, publishedMenus, totalMenuItems, totalScans },
      recentUsers,
      recentBusinesses,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to get admin stats' }, { status: 500 });
  }
}
