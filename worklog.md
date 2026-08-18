---
Task ID: 1
Agent: main
Task: Fix every user's public URL and make it display only menu

Work Log:
- Explored the full public URL system: `/p/[slug]/page.tsx` (SSR), `public-menu-client.tsx`, `public-menu-view.tsx` (hash-based), root layout, globals.css
- Identified issues: (1) Root layout applies ivory `bg-background` and Toaster to public pages, (2) Cover page (PublicCover) blocks menu display requiring user interaction, (3) API route for slug-based business lookup used anon client (RLS-dependent) instead of service client
- Created `/p/[slug]/layout.tsx` — dedicated layout with white background override, no app chrome
- Removed PublicCover import and cover overlay from `public-menu-client.tsx` — menu now displays immediately
- Fixed `/api/businesses/[id]/route.ts` to use `createServiceClient()` for slug-based public lookups (bypasses RLS entirely)
- Cleaned up unused imports (Store, Phone, AlertCircle, BookOpen, Skeleton, PublicCover)

Stage Summary:
- Public URL `/p/[slug]` now renders with clean white background, no ivory bleed, no Toaster
- Cover page removed — menu displays immediately when URL is opened
- All API routes serving public data use service client (RLS-bypassing) for reliability
- Every user's public URL will work as long as `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel env
