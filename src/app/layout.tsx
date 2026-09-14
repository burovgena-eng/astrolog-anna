import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Preloader } from "@/components/mystical/preloader";
import { ScrollProgress } from "@/components/mystical/scroll-progress";
import { CursorGlow } from "@/components/mystical/cursor-glow";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, OG_IMAGE } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const OG_IMAGE_ALT =
  "Анна — астролог, таролог, рунолог. Консультации в Новосибирске и онлайн";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s | Астролог Анна",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "астрология",
    "таро",
    "руны",
    "натальная карта",
    "нумерология",
    "гороскоп",
    "гадание",
    "консультация астролога",
    "расклад таро",
    "астролог новосибирск",
    "таролог онлайн",
  ],
  authors: [{ name: "Анна" }],
  creator: "Анна",
  publisher: "Анна",
  category: "эзотерика",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    locale: "ru_RU",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a1a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased bg-mystic-deep text-mystic-text`}
      >
        <Preloader />
        <ScrollProgress />
        {/* Task 29: плёночное зерно поверх всего — печатная фактура люкс-бумаги */}
        <div className="lux-grain" aria-hidden="true" />
        {children}
        <CursorGlow />
        <SonnerToaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
