import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Suspense } from "react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap", // Optimize font loading
});

// Enhanced metadata for better SEO
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "Dead Man's Switch - Secure, Decentralized Message Service",
    template: "%s | Dead Man's Switch",
  },
  description:
    "Send important messages to loved ones when you can't. Secure, encrypted, and decentralized using Nostr technology. Built for privacy and trust.",
  keywords: [
    "dead man's switch",
    "secure messaging",
    "nostr",
    "encrypted",
    "decentralized",
    "privacy",
    "emergency messages",
    "digital legacy",
  ],
  authors: [{ name: "Dead Man's Switch", url: "https://deadmansswitch.com" }],
  creator: "Dead Man's Switch",
  publisher: "Dead Man's Switch",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Dead Man's Switch",
    title: "Dead Man's Switch - Secure, Decentralized Message Service",
    description:
      "Send important messages to loved ones when you can't. Secure, encrypted, and decentralized using Nostr technology.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dead Man's Switch - Secure, Decentralized Message Service",
    description:
      "Send important messages to loved ones when you can't. Secure, encrypted, and decentralized using Nostr technology.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add verification tokens when you have them
    // google: "your-google-verification-token",
    // yandex: "your-yandex-verification-token",
  },
};

// Enhanced viewport for better mobile experience
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/api/stats"
          as="fetch"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />

        {/* Critical CSS inline for faster rendering */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            .animate-spin { animation: spin 1s linear infinite; }
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-900`}>
        {/* Providers with SSR support */}
        <Providers>
          {/* Error boundary for runtime errors */}
          <Suspense
            fallback={
              <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading application...</p>
                </div>
              </div>
            }
          >
            {children}
          </Suspense>
        </Providers>

        {/* Analytics script placeholder */}
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Analytics initialization would go here
                console.log('Analytics loaded');
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
