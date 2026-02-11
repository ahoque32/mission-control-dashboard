import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import MobileNav from "../components/MobileNav";
import SearchShortcut from "../components/SearchShortcut";
import ConvexClientProvider from "../components/ConvexClientProvider";
import { AuthProvider } from "../lib/auth-context";
import AuthGate from "../components/AuthGate";
import { ThemeProvider } from "../lib/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script to prevent theme flash (FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light' || theme === 'dark') {
                    document.documentElement.classList.add(theme);
                  } else {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
                  }
                } catch (e) {
                  // Fallback to dark theme if localStorage fails
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AuthGate>
              <ConvexClientProvider>
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
                    <main className="flex-1 overflow-auto bg-background">
                      {children}
                    </main>
                  </div>
                </div>
              </ConvexClientProvider>
            </AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
