import type { Metadata } from "next";
import "../globals.css";
import { Antonio, IBM_Plex_Mono, Manrope, Newsreader } from "next/font/google";
import { GoogleAnalytics } from "@/components/google-analytics";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans" });
const display = Antonio({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700"] });
const editorial = Newsreader({ subsets: ["latin"], variable: "--font-editorial", weight: ["500", "600", "700"] });
const utility = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-utility", weight: ["500", "600"] });

export const metadata: Metadata = {
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-game-theme="game" className={`${sans.variable} ${display.variable} ${editorial.variable} ${utility.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased"><GoogleAnalytics />{children}</body>
    </html>
  );
}
