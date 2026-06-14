import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Glow Room — 30-Day Glow Up Challenge",
  description:
    "A Gen Z digital wellness platform. Structured 30-day challenges — movement, skin, mindset, and one daily habit — done together in cohorts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
