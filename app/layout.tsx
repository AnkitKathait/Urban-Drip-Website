import type { Metadata, Viewport } from 'next'
import {
  Bebas_Neue,
  Oswald,
  DM_Sans,
  Plus_Jakarta_Sans,
  Space_Mono,
} from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

// ─── Google Fonts ─────────────────────────────────────────────────────────────

const bebasNeue = Bebas_Neue({
  weight:   '400',
  subsets:  ['latin'],
  variable: '--font-bebas-neue',
  display:  'swap',
})

const oswald = Oswald({
  weight:   ['400', '500', '600', '700'],
  subsets:  ['latin'],
  variable: '--font-oswald',
  display:  'swap',
})

const dmSans = DM_Sans({
  weight:   ['400', '500', '600'],
  subsets:  ['latin'],
  variable: '--font-dm-sans',
  display:  'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  weight:   ['400', '500', '600', '700'],
  subsets:  ['latin'],
  variable: '--font-jakarta',
  display:  'swap',
})

const spaceMono = Space_Mono({
  weight:   ['400', '700'],
  subsets:  ['latin'],
  variable: '--font-space-mono',
  display:  'swap',
})

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://urbandrip.net'),
  title: {
    default:  'Urban Drip — Wear the legend. Live the drip.',
    template: '%s | Urban Drip',
  },
  description:
    'India\'s premium streetwear brand — anime, sports, gaming, AI, music, and streetwear T-shirts. Shop oversized and regular fit tees with original graphic prints. Free shipping above ₹999.',
  keywords: [
    'anime tshirt india',
    'anime streetwear',
    'oversized anime tshirt',
    'gaming tshirt india',
    'AI tshirt',
    'sports tshirt india',
    'streetwear india',
    'naruto tshirt',
    'itachi tshirt',
    'urban drip',
    'graphic tshirt india',
    'oversized tshirt india',
  ],
  authors:  [{ name: 'Urban Drip', url: 'https://urbandrip.net' }],
  creator:  'Urban Drip',
  openGraph: {
    type:      'website',
    locale:    'en_IN',
    url:       'https://urbandrip.net',
    siteName:  'Urban Drip',
    title:     'Urban Drip — Wear the legend. Live the drip.',
    description:
      'Premium streetwear — anime, gaming, AI, sports, music & streetwear tees. Made for India\'s Gen Z.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Urban Drip' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Urban Drip — Wear the legend. Live the drip.',
    description: 'Premium streetwear — anime, gaming, AI, sports & more. Made for India\'s Gen Z.',
    images:      ['/og-image.jpg'],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon:  '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       5,
  themeColor:         '#0A0A0A',
  colorScheme:        'dark',
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    bebasNeue.variable,
    oswald.variable,
    dmSans.variable,
    plusJakartaSans.variable,
    spaceMono.variable,
  ].join(' ')

  return (
    <html lang="en" className={`${fontVars} dark`} suppressHydrationWarning>
      <body className="bg-ud-black text-ud-white font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
