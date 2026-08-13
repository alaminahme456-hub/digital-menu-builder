import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel, toCamelList } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'Business ID required' }, { status: 400 });

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { data, error } = await supabase
      .from('menu_uploads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get uploads error:', error);
      return NextResponse.json({ error: 'Failed to get uploads' }, { status: 500 });
    }

    const uploads = toCamelList(data || []);
    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Get uploads error:', error);
    return NextResponse.json({ error: 'Failed to get uploads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const businessId = formData.get('businessId') as string;

    if (!file || !businessId) {
      return NextResponse.json({ error: 'File and business ID required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { data: upload, error } = await supabase
      .from('menu_uploads')
      .insert({
        file_name: file.name,
        file_size: buffer.length,
        file_type: file.type,
        url,
        business_id: businessId,
      })
      .select()
      .single();

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ upload: toCamel(upload) }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Upload ID required' }, { status: 400 });

    const token = request.headers.get('Authorization')?.substring(7) || '';
    const supabase = createServerClient(token);

    const { error } = await supabase
      .from('menu_uploads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete upload error:', error);
      return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
  }
}
