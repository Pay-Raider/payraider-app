import React from "react";
import type { Metadata, Viewport } from "next";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { MonitoringProvider } from "../components/MonitoringProvider";
import { WalletProvider } from "../components/lib/wallet-context";
import { NotificationProvider } from "../components/lib/notification-context";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Stellar Insights - Payment Network Intelligence",
  description:
    "Institutional-grade insights into Stellar payment network performance. Predict success, optimize routing, and monitor liquidity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <WalletProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </WalletProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
