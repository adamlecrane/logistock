import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { PWARegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  metadataBase: new URL("https://logistock.app"),
  title: "LogiStock — Gestion commandes & stock",
  description: "Plateforme LogiStock : commandes, stock, suivi colis et finances.",
  applicationName: "LogiStock",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LogiStock",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "LogiStock — Gestion commandes & stock",
    description: "Plateforme de gestion : commandes, stock, suivi colis et factures.",
    url: "https://logistock.app",
    siteName: "LogiStock",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "LogiStock" }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "LogiStock",
    description: "Plateforme de gestion : commandes, stock, suivi colis et factures.",
    images: ["/icons/icon-512.png"],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#E10600",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <PWARegister />
      </body>
    </html>
  );
}
