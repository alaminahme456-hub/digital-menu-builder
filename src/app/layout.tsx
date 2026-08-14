import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BizFlip — Your Business, Beautifully Presented.",
  description: "Create stunning digital experiences for restaurants, hotels, fashion brands, salons, retail stores, and any business. Share instantly with one QR code.",
  keywords: ["BizFlip", "Digital Experience", "QR Code", "Menu Builder", "Product Catalog", "Portfolio", "Service List", "Business"],
  authors: [{ name: "BizFlip" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "BizFlip — Your Business, Beautifully Presented.",
    description: "Create stunning digital experiences and share them with one QR code.",
    siteName: "BizFlip",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BizFlip — Your Business, Beautifully Presented.",
    description: "Create stunning digital experiences and share them with one QR code.",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
