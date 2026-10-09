import React from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Self-hosted by next/font at build time, so they load under font-src 'self'.
const heading = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  axes: ["SOFT", "opsz"],
});
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const code = JetBrains_Mono({ subsets: ["latin"], variable: "--font-code", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2c1b10",
};

export const metadata: Metadata = {
  title: "PayRaider - Payment Network Intelligence",
  description:
    "Institutional-grade insights into Stellar payment network performance. Predict success, optimize routing, and monitor liquidity.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PayRaider",
  },
  formatDetection: { telephone: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-next-intl-locale") ?? "en";

  return (
    <html
      lang={locale}
      className={`dark ${heading.variable} ${body.variable} ${code.variable}`}
      suppressHydrationWarning
    >
      <body
        className="font-sans antialiased text-foreground selection:bg-accent/30"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
