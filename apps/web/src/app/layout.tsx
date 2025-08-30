import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dead Man's Switch - Secure, Decentralized Message Service",
  description:
    "Send important messages to loved ones when you can't. Secure, encrypted, and decentralized using Nostr technology.",
  keywords: [
    "dead man's switch",
    "secure messaging",
    "nostr",
    "encrypted",
    "decentralized",
  ],
  authors: [{ name: "Dead Man's Switch" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
