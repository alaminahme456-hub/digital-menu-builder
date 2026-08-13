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
  title: "MenuQR - Digital Menu Builder",
  description: "Create beautiful QR code digital menus, track analytics, and delight customers with a seamless dining experience.",
  keywords: ["MenuQR", "Digital Menu", "QR Code Menu", "Restaurant Menu", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "MenuQR" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MenuQR - Digital Menu Builder",
    description: "Create beautiful QR code digital menus for your restaurant",
    siteName: "MenuQR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MenuQR - Digital Menu Builder",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
