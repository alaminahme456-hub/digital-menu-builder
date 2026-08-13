import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BizFlip - Digital Menu Builder",
  description: "Create beautiful QR code digital menus, track analytics, and delight customers with a seamless dining experience.",
  keywords: ["BizFlip", "Digital Menu", "QR Code Menu", "Restaurant Menu", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "BizFlip" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BizFlip - Digital Menu Builder",
    description: "Create beautiful QR code digital menus for your restaurant",
    siteName: "BizFlip",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BizFlip - Digital Menu Builder",
    description: "Create beautiful QR code digital menus for your restaurant",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ClerkProvider appearance={{ theme: shadcn }}>
          {children}
          <Toaster />
        </ClerkProvider>
      </body>
    </html>
  );
}
