import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import "./game.css";
import { AnalyticsInit } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const description =
  "A Gen Z digital wellness platform. Structured 30-day challenges — movement, skin, mindset, and one daily habit — done together in cohorts.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "The Glow Room — 30-Day Glow Up Challenge",
    template: "%s · The Glow Room",
  },
  description,
  openGraph: {
    title: "The Glow Room — 30-Day Glow Up Challenge",
    description,
    type: "website",
    siteName: "The Glow Room",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#123f39",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="game-bg font-sans antialiased">
        <AnalyticsInit />
        {children}
      </body>
    </html>
  );
}
