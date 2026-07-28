import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/contexts/AppStateProvider";
import { ToastProvider } from "@/components/overlays/Toast";

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
    default: "OntDekker — Guides & Expeditions",
    template: "%s | OntDekker",
  },
  description:
    "Plan expeditions and connect with verified local guides on OntDekker.",
  keywords: ["slow travel", "expedition", "guides", "adventure"],
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
        {/*
         * AppStateProvider — global state for guides, expeditions, and auth.
         * ToastProvider    — enables useToast() in any descendant component.
         */}
        <AppStateProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AppStateProvider>
      </body>
    </html>
  );
}
