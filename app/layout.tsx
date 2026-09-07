import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { themeInitScript } from "@/lib/theme";
import { SITE_URL } from "@/lib/site";
import { InlineScript } from "@/components/ui/inline-script";
import { ToastProvider } from "@/components/ui/toast";
import { ToastQueryFlag } from "@/components/ui/toast-query-flag";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Suivi des soldes, subventions et notes de frais des associations pour les assos de Centrale Lille Associations";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CLA - Trézo",
  description,
  keywords: [
    "Centrale Lille Associations",
    "CLA",
    "trésorerie associative",
    "notes de frais",
    "subventions",
    "clubs Centrale Lille",
  ],
  appleWebApp: {
    title: "CLA Trézo",
  },
  // Noindex par défaut : seule la landing page ("/") est destinée à être
  // référencée, le reste de l'app est derrière SSO. Voir app/page.tsx.
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "CLA Trézo",
    title: "CLA - Trézo",
    description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "CLA - Trézo",
    description,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    // daisyUI "light" / "dark" theme --color-base-100 values
    { media: "(prefers-color-scheme: light)", color: "oklch(100% 0 0)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(25.33% 0.016 252.42)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <InlineScript html={themeInitScript} />
        <ToastProvider>
          <Suspense fallback={null}>
            <ToastQueryFlag />
          </Suspense>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
