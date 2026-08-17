import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { Providers } from '@/components/providers'
import { SITE_URL } from '@/lib/constants'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  indexRobots,
  SITE_NAME,
  shareImage,
  TITLE_TEMPLATE,
} from '@/lib/seo'
import { THEME_COLORS, THEME_STORAGE_KEY } from '@/lib/theme'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'optional',
  preload: true,
  weight: ['400', '600'],
})

export const viewport: Viewport = {
  themeColor: THEME_COLORS.dark.ink,
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'travel',
  keywords: [
    'find cheap flights',
    'cheap flights',
    'findcheapflights.ai',
    'flexible date flights',
    'nearby airport deals',
    'fare hunter',
  ],
  robots: indexRobots,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [shareImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [shareImage],
  },
  appleWebApp: {
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">{`(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var t = stored === "light" || stored === "dark" ? stored : "dark";
    var r = document.documentElement;
    r.classList.remove("light", "dark");
    r.classList.add(t);
    r.style.colorScheme = t;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", t === "light" ? "${THEME_COLORS.light.ink}" : "${THEME_COLORS.dark.ink}");
    }
  } catch (e) {}
})();`}</Script>
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-gold focus:px-3 focus:py-2 focus:text-on-gold"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="min-w-0 flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
        <Analytics />
        <SpeedInsights />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DDHQMC2TKZ"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-DDHQMC2TKZ');
          `}
        </Script>
      </body>
    </html>
  )
}
