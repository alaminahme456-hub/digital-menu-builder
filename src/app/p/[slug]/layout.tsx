/**
 * Dedicated layout for the public menu page.
 * Overrides the root ivory background with white so the public URL
 * displays ONLY the menu — clean, no app chrome.
 *
 * Note: Cannot define <html>/<body> here because the root layout already
 * defines them. This wrapper overrides the background at the div level.
 */
export default function PublicMenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {children}
    </div>
  );
}
