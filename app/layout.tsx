import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import SearchShortcut from "../components/SearchShortcut";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Mission Control",
  description: "Real-time agent monitoring and control dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mission Control",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SearchShortcut />
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar - Hidden on mobile */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Navigation - Hidden on desktop */}
            <MobileNav />

            {/* Page Content */}
            <main className="flex-1 overflow-auto bg-[#0a0a0a]">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
