import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// ---------------------------------------------------------------------------
// Fonts — loaded via next/font for zero layout shift and self-hosting
// ---------------------------------------------------------------------------

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: "OntDekker — Discover the World, Slowly",
    template: "%s | OntDekker",
  },
  description:
    "A premium slow-travel community platform connecting mindful explorers " +
    "with verified local guides through collaborative expedition planning " +
    "and authentic storytelling.",
  keywords: ["slow travel", "expedition", "guides", "community", "adventure"],
  openGraph: {
    siteName: "OntDekker",
    type: "website",
  },
};

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-canvas antialiased">
        {children}
      </body>
    </html>
  );
}
