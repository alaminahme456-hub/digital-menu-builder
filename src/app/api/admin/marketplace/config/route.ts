import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser, toCamelList } from '@/lib/supabase';

// GET /api/admin/marketplace/config — get all marketplace config values
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = createServerClient(authUser.token);

    const { data, error } = await supabase
      .from('marketplace_config')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      console.error('Admin marketplace config fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch marketplace config' },
        { status: 500 }
      );
    }

    // Transform to a flat key-value map for easier consumption
    const configMap: Record<string, unknown> = {};
    for (const row of toCamelList(data || [])) {
      configMap[row.key as string] = row.value;
    }

    return NextResponse.json({
      config: configMap,
      // Also return raw rows for cases where the consumer needs metadata
      configRows: toCamelList(data || []),
    });
  } catch (err) {
    console.error('GET /api/admin/marketplace/config error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/marketplace/config — update a single marketplace config value
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined || value === null) {
      return NextResponse.json(
        { error: 'Missing required fields: key, value' },
        { status: 400 }
      );
    }

    // Validate key format (alphanumeric + underscores only)
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      return NextResponse.json(
        { error: 'Config key must start with a letter and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    const supabase = createServerClient(authUser.token);

    // Check if the config key already exists
    const { data: existing } = await supabase
      .from('marketplace_config')
      .select('id, key')
      .eq('key', key)
      .maybeSingle();

    if (existing) {
      // Update existing config
      const { error: updateError } = await supabase
        .from('marketplace_config')
        .update({
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          updated_at: new Date().toISOString(),
          updated_by: authUser.userId,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Admin update config error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update config' },
          { status: 500 }
        );
      }
    } else {
      // Insert new config entry
      const { error: insertError } = await supabase
        .from('marketplace_config')
        .insert({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          updated_by: authUser.userId,
        });

      if (insertError) {
        console.error('Admin insert config error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create config entry' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Config updated successfully',
      key,
      value,
    });
  } catch (err) {
    console.error('PUT /api/admin/marketplace/config error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
