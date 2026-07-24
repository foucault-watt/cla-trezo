import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CLA - Trézo",
  description: "Suivi des soldes, subventions et notes de frais des associations pour les assos de Centrale Lille Associations",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
