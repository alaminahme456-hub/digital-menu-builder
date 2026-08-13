import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamel } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = request.nextUrl.searchParams.get('businessId');
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const supabase = createServerClient(authUser.token);

    const { data, error } = await supabase
      .from('menu_uploads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get uploads error:', error);
      return NextResponse.json({ error: 'Failed to get uploads' }, { status: 500 });
    }

    return NextResponse.json({ uploads: (data ?? []).map(toCamel) });
  } catch (error) {
    console.error('Get uploads error:', error);
    return NextResponse.json({ error: 'Failed to get uploads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = request.headers.get('content-type') || '';

    // JSON body = publish toggle
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { id, businessId, published } = body;

      if (!id || !businessId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const supabase = createServerClient(authUser.token);
      const { data, error } = await supabase
        .from('menu_uploads')
        .update({ published })
        .eq('id', id)
        .eq('business_id', businessId)
        .select()
        .single();

      if (error) {
        console.error('Update upload error:', error);
        return NextResponse.json({ error: 'Failed to update upload' }, { status: 500 });
      }

      return NextResponse.json({ upload: toCamel(data) });
    }

    // FormData = file upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const businessId = formData.get('businessId') as string | null;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload JPG, PNG, WEBP, or PDF.' }, { status: 400 });
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    const supabase = createServerClient(authUser.token);

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop() || 'jpg';
    const storagePath = `${businessId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('menu-files')
      .getPublicUrl(uploadData.path);

    const fileUrl = urlData.publicUrl;

    // Insert record into menu_uploads table
    const { data, error } = await supabase
      .from('menu_uploads')
      .insert({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        url: fileUrl,
        published: false,
        business_id: businessId,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert upload record error:', error);
      return NextResponse.json({ error: 'Failed to save upload record' }, { status: 500 });
    }

    return NextResponse.json({ upload: toCamel(data) }, { status: 201 });
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

    const supabase = createServerClient(authUser.token);

    // Get the upload record to find the storage path
    const { data: upload, error: fetchError } = await supabase
      .from('menu_uploads')
      .select('url')
      .eq('id', id)
      .single();

    if (fetchError || !upload) {
      return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
    }

    // Try to delete from storage (best effort)
    try {
      const urlPath = new URL(upload.url).pathname;
      const storagePath = urlPath.split('/menu-files/')[1];
      if (storagePath) {
        await supabase.storage.from('menu-files').remove([storagePath]);
      }
    } catch {
      // Don't fail if storage delete fails
    }

    // Delete the database record
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
