import { JsonLd } from '@/components/json-ld'
import { SearchForm } from '@/components/search-form'
import {
  DEFAULT_DESCRIPTION,
  faqJsonLd,
  HOME_FAQS,
  organizationJsonLd,
  pageMetadata,
  softwareJsonLd,
  websiteJsonLd,
} from '@/lib/seo'

export const metadata = pageMetadata({
  description: DEFAULT_DESCRIPTION,
  path: '/',
})

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
      <JsonLd
        data={[
          websiteJsonLd(),
          organizationJsonLd(),
          softwareJsonLd(),
          faqJsonLd(),
        ]}
      />
      <section className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">
          findcheapflights.net
        </p>
        <h1 className="mt-3 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          Find cheap flights.
          <span className="block text-gold">
            Pack if it&apos;s stupid cheap.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-mute">
          Hunt live cheap fares from nearby airports or to a destination you
          already want. Flexible dates, trip type, and a price ceiling — then an
          aggressive deal hunter reads public fare pages. One free search, then
          Pro.
        </p>
      </section>
      <SearchForm />
      <section className="mt-20 max-w-3xl">
        <h2 className="font-display text-3xl tracking-tight">How it works</h2>
        <ol className="mt-6 space-y-5 text-mute">
          <li>
            <p className="font-medium text-foam">1. Pick airports</p>
            <p className="mt-1">
              Start from airports near you and a continent — destination stays
              variable — or lock a city and let origins flex within about six
              hours of home.
            </p>
          </li>
          <li>
            <p className="font-medium text-foam">2. Set the hunt</p>
            <p className="mt-1">
              Round trip or one way, a date window, stay length, and optional
              min/max price. Add interests if you want the fare to match a trip
              you would actually take.
            </p>
          </li>
          <li>
            <p className="font-medium text-foam">3. Read live public fares</p>
            <p className="mt-1">
              We do not sit on a GDS. A deal-seeking model searches live public
              fare pages and writes a report you can book yourself.
            </p>
          </li>
        </ol>
      </section>
      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-3xl tracking-tight">
          Cheap flight hunting, answered
        </h2>
        <dl className="mt-6 space-y-6">
          {HOME_FAQS.map(item => (
            <div key={item.question}>
              <dt className="font-medium text-foam">{item.question}</dt>
              <dd className="mt-1 text-mute">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
