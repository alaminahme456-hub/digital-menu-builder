import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase';
import { toCamel } from '@/lib/supabase';
import PublicMenuClient from './public-menu-client';
import { notFound } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  Static params (ISR)                                                */
/* ------------------------------------------------------------------ */
export async function generateStaticParams() {
  try {
    const supabase = createServiceClient();
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
    const supabase = createServiceClient();
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
/* ------------------------------------------------------------------ */
export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function PublicBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createServiceClient();

  // Fetch business data
  const { data: bizRow, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single();

  if (bizError || !bizRow) {
    notFound();
  }

  const business = toCamel(bizRow) as Record<string, unknown>;

  // Fetch categories
  const { data: catRows } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('business_id', bizRow.id)
    .order('sort_order', { ascending: true });

  const categories = (catRows ?? []).map(toCamel);

  // Fetch items
  const { data: itemRows } = await supabase
    .from('menu_items')
    .select('*')
    .eq('business_id', bizRow.id)
    .order('sort_order', { ascending: true });

  const items = (itemRows ?? []).map(toCamel);

  // Fetch published uploads
  const { data: uploadRows } = await supabase
    .from('menu_uploads')
    .select('*')
    .eq('business_id', bizRow.id)
    .eq('published', true)
    .order('created_at', { ascending: false });

  const uploads = (uploadRows ?? []).map(toCamel);

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
