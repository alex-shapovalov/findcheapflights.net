import { JsonLd } from '@/components/json-ld'
import { PricingCards } from '@/components/pricing-cards'
import { pageMetadata, pricingJsonLd } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Pricing',
  description:
    'Find cheap flights with one free hunt, then Pro for $11.99/month or $199.99/year. 25 live fare searches a day on findcheapflights.ai.',
  path: '/pricing',
})

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
      <JsonLd data={pricingJsonLd()} />
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Pro</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        One free cheap-flight hunt. Then 25 a day.
      </h1>
      <p className="mt-4 max-w-2xl text-mute">
        Every findcheapflights.ai account gets a single live fare search.
        Subscribe for $11.99/month or $199.99/year to keep hunting — no GDS,
        just an aggressive model with web search against public fare pages.
      </p>
      <div className="mt-10">
        <PricingCards />
      </div>
    </div>
  )
}
