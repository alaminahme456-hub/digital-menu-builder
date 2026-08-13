import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.substring(7));
}

export async function POST(request: NextRequest) {
  try {
    const payload = await authenticate(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { businessId, imageData } = await request.json();
    if (!businessId || !imageData) {
      return NextResponse.json({ error: 'Business ID and image data required' }, { status: 400 });
    }

    // Verify ownership
    const business = await db.business.findFirst({ where: { id: businessId, ownerId: payload.userId } });
    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

    // Simulate AI OCR processing - in production, this would use a vision API
    // For demo purposes, we generate sample detected items
    const detectedItems = [
      { name: 'Chicken Burger', description: 'Crispy chicken patty with fresh vegetables', price: 4500, category: 'Main Meals' },
      { name: 'Fried Rice', description: 'Well-seasoned fried rice with vegetables', price: 3500, category: 'Rice' },
      { name: 'Jollof Rice', description: 'Classic Nigerian jollof rice', price: 3000, category: 'Rice' },
      { name: 'Pepper Soup', description: 'Spicy pepper soup with goat meat', price: 4000, category: 'Soups' },
      { name: 'Chicken & Chips', description: 'Crispy fried chicken served with golden fries', price: 5500, category: 'Chicken' },
      { name: 'Pounded Yam', description: 'Smooth pounded yam with egusi soup', price: 4500, category: 'Main Meals' },
      { name: 'Suya', description: 'Spicy grilled meat skewers', price: 2500, category: 'Grills' },
      { name: 'Chapman', description: 'Classic Nigerian cocktail', price: 1500, category: 'Drinks' },
      { name: 'Mojito', description: 'Refreshing lime and mint cocktail', price: 2000, category: 'Drinks' },
      { name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 3000, category: 'Desserts' },
      { name: 'Caesar Salad', description: 'Fresh salad with caesar dressing', price: 2500, category: 'Salads' },
      { name: 'Grilled Fish', description: 'Whole grilled fish with pepper sauce', price: 6000, category: 'Seafood' },
    ];

    await db.aIScanLog.create({
      data: {
        businessId,
        fileName: 'scanned-menu.jpg',
        itemsDetected: detectedItems.length,
        status: 'completed',
      },
    });

    return NextResponse.json({
      success: true,
      itemsDetected: detectedItems.length,
      items: detectedItems,
    });
  } catch (error) {
    console.error('AI scan error:', error);
    return NextResponse.json({ error: 'AI scan failed' }, { status: 500 });
  }
}
