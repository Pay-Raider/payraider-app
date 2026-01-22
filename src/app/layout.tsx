import React from "react"
import type { Metadata } from 'next'
// import { Analytics } from '@vercel/analytics/next'
import { WalletProvider } from '../components/lib/wallet-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stellar Insights - Payment Network Intelligence',
  description: 'Deep insights into Stellar payment network performance. Predict success, optimize routing, quantify reliability, and identify liquidity bottlenecks.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    userScalable: false,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <WalletProvider>
          {children}
        </WalletProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
