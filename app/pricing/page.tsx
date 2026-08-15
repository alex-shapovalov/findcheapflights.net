import { JsonLd } from '@/components/json-ld'
import { PricingCards } from '@/components/pricing-cards'
import { pageMetadata, pricingJsonLd } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Find Cheap Flights — Pricing',
  description:
    'Free trial of Find Cheap Flights, then Pro for $11.99/month or $119.99/year. 100 live fare searches a month on findcheapflights.ai.',
  path: '/pricing',
})

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-16">
      <JsonLd data={pricingJsonLd()} />
      <PricingCards />
    </div>
  )
}
