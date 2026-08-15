import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, toCamel, toCamelList } from '@/lib/supabase';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// GET — List uploads for a business
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const { data: uploads, error } = await supabase
      .from('menu_uploads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
    }

    return NextResponse.json({ uploads: toCamelList(uploads || []) });
  } catch (error) {
    console.error('Fetch uploads error:', error);
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
  }
}

// POST — Upload a menu file
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const businessId = formData.get('businessId') as string | null;

    if (!file || !businessId) {
      return NextResponse.json({ error: 'File and business ID required' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload JPG, PNG, WEBP, GIF, or PDF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Determine bucket based on file type
    const bucket = file.type === 'application/pdf' ? 'menu-files' : 'menu-images';
    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${businessId}/${timestamp}_${sanitizedName}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);

    const publicUrl = urlData.publicUrl;

    // Save upload record to menu_uploads table
    const { data: uploadRecord, error: dbError } = await supabase
      .from('menu_uploads')
      .insert({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        url: publicUrl,
        published: false,
        business_id: businessId,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError.message);
      return NextResponse.json({ error: 'File uploaded but failed to save record' }, { status: 500 });
    }

    return NextResponse.json({
      upload: toCamel(uploadRecord as Record<string, unknown>),
      url: publicUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// PUT — Update upload (publish toggle, replace)
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Upload ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { published, url, fileName, fileSize, fileType } = body;

    const updateData: Record<string, unknown> = {};
    if (published !== undefined) updateData.published = published;
    if (url !== undefined) updateData.url = url;
    if (fileName !== undefined) updateData.file_name = fileName;
    if (fileSize !== undefined) updateData.file_size = fileSize;
    if (fileType !== undefined) updateData.file_type = fileType;

    const { data: upload, error } = await supabase
      .from('menu_uploads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update upload' }, { status: 500 });
    }

    return NextResponse.json({ upload: toCamel(upload as Record<string, unknown>) });
  } catch (error) {
    console.error('Update upload error:', error);
    return NextResponse.json({ error: 'Failed to update upload' }, { status: 500 });
  }
}

// DELETE — Remove an upload
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient(token);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Upload ID required' }, { status: 400 });
    }

    // Get upload record to find storage path
    const { data: upload } = await supabase
      .from('menu_uploads')
      .select('url')
      .eq('id', id)
      .single();

    // Delete from storage
    if (upload?.url) {
      try {
        const urlObj = new URL(upload.url);
        const storagePath = urlObj.pathname.split('/').slice(-2).join('/'); // bucket/path
        const bucket = storagePath.includes('/') ? 'menu-images' : 'menu-files';

        // Try to extract the path after bucket name
        const pathMatch = upload.url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
        if (pathMatch) {
          await supabase.storage.from(pathMatch[1]).remove([pathMatch[2]]);
        }
      } catch {
        // Non-critical: just log and continue with DB deletion
        console.error('Storage deletion failed, continuing with DB cleanup');
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('menu_uploads')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
  }
}
