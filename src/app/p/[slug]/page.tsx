import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase';
import { toCamel } from '@/lib/supabase';
import PublicMenuClient from './public-menu-client';
import { notFound } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Force dynamic rendering — never serve stale cached pages            */
/* ------------------------------------------------------------------ */
export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ */
/*  Static params (ISR) — used by Next.js for pre-generation          */
/* ------------------------------------------------------------------ */
export async function generateStaticParams() {
  try {
    const supabase = createServerClient();
    const { data: businesses } = await supabase
      .from('businesses')
      .select('slug')
      .eq('status', 'published');
    return (businesses ?? []).map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Dynamic metadata for SEO + Open Graph                               */
/* ------------------------------------------------------------------ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digital-menu-builder-gamma.vercel.app';
  const publicUrl = `${appUrl}/p/${slug}`;

  try {
    const supabase = createServerClient();
    const { data: business } = await supabase
      .from('businesses')
      .select('name, description, logo, status, seo_enabled')
      .eq('slug', slug)
      .single();

    if (!business) {
      return { title: 'Not Found', description: 'This business does not exist.' };
    }

    if (business.status !== 'published') {
      return {
        title: `${business.name} | BizFlip`,
        description: 'This digital experience is currently unavailable.',
        robots: { index: false, follow: false },
      };
    }

    const title = `${business.name} | BizFlip`;
    const description = business.description || `Explore ${business.name}'s digital catalog, products and services.`;

    const meta: Metadata = {
      title,
      description,
      metadataBase: new URL(appUrl),
      alternates: { canonical: publicUrl },
      openGraph: {
        title,
        description,
        url: publicUrl,
        siteName: 'BizFlip',
        type: 'website',
        ...(business.logo ? { images: [{ url: business.logo, width: 1200, height: 630, alt: business.name }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(business.logo ? { images: [business.logo] } : {}),
      },
    };

    if (business.seo_enabled === false) {
      meta.robots = { index: false, follow: true };
    }

    return meta;
  } catch {
    return { title: 'BizFlip', description: 'Digital Menu Builder' };
  }
}

/* ------------------------------------------------------------------ */
/*  Page component — server component that fetches data               */
/*                                                                     */
/*  Uses supabase.rpc('get_public_menu') which calls a SECURITY       */
/*  DEFINER function — this bypasses RLS so anonymous QR code          */
/*  scanners can always read published menu data.                      */
/*                                                                     */
/*  Falls back to direct queries if the RPC function doesn't exist     */
/*  (in which case RLS policies must allow anon reads).               */
/* ------------------------------------------------------------------ */
export default async function PublicBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createServerClient();

  let business: Record<string, unknown> | null = null;
  let categories: Record<string, unknown>[] = [];
  let items: Record<string, unknown>[] = [];
  let uploads: Record<string, unknown>[] = [];

  // Strategy 1: Use the SECURITY DEFINER RPC function (bypasses RLS)
  try {
    const { data, error } = await supabase.rpc('get_public_menu', { p_slug: slug });

    if (!error && data && !data.error) {
      business = typeof data.business === 'object' ? toCamel(data.business as Record<string, unknown>) : null;
      categories = Array.isArray(data.categories) ? (data.categories as Record<string, unknown>[]).map(toCamel) : [];
      items = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]).map(toCamel) : [];
      uploads = Array.isArray(data.uploads) ? (data.uploads as Record<string, unknown>[]).map(toCamel) : [];
    }
  } catch {
    // RPC function may not exist — fall through to Strategy 2
  }

  // Strategy 2: Direct queries (requires RLS policies that allow anon reads)
  if (!business) {
    const { data: bizRow, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', slug)
      .single();

    if (bizError || !bizRow) {
      notFound();
    }

    business = toCamel(bizRow);

    const { data: catRows } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('business_id', bizRow.id)
      .order('sort_order', { ascending: true });
    categories = (catRows ?? []).map(toCamel);

    const { data: itemRows } = await supabase
      .from('menu_items')
      .select('*')
      .eq('business_id', bizRow.id)
      .order('sort_order', { ascending: true });
    items = (itemRows ?? []).map(toCamel);

    const { data: uploadRows } = await supabase
      .from('menu_uploads')
      .select('*')
      .eq('business_id', bizRow.id)
      .eq('published', true)
      .order('created_at', { ascending: false });
    uploads = (uploadRows ?? []).map(toCamel);
  }

  return (
    <PublicMenuClient
      business={business}
      categories={categories}
      items={items}
      uploads={uploads}
      slug={slug}
    />
  );
}
