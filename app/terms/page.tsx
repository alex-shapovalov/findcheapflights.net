import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal'
import {
  CONTACT_EMAIL,
  FREE_SEARCH_LIMIT,
  PLANS,
  SUBSCRIBER_MONTHLY_LIMIT,
} from '@/lib/constants'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description:
    'These terms govern your use of Find Cheap Flights, including plan limits, billing, acceptable use, and fare accuracy on findcheapflights.ai.',
  path: '/terms',
})

function usd(amount: number) {
  return `$${amount.toFixed(2)}`
}

export default function TermsPage() {
  const freeSearchLabel =
    FREE_SEARCH_LIMIT === 1 ? 'free live search' : 'free live searches'

  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms are a plain-language agreement between you and findcheapflights.ai. By using the site you agree to them. If you do not agree, please do not use the site."
    >
      <LegalSection heading="What the service does">
        <p>
          Find Cheap Flights is a fare research tool. You describe a trip
          (airports, a date window, a price ceiling) and a language model with
          web search reads publicly available fare pages and reports what it
          finds. We are not a travel agency, an airline, or a booking platform.
          We do not sell tickets, take payment for travel, or book through
          airline reservation systems.
        </p>
        <p>
          Every result is a research summary that points you to where a fare was
          listed. You book directly with the airline or online travel agency and
          their terms apply to that booking.
        </p>
      </LegalSection>

      <LegalSection heading="Fares are estimates, not offers">
        <p>
          Airfare changes constantly and model-generated results can be
          incomplete, out of date, or simply wrong. Nothing on this site is an
          offer, a quote, a reservation, or a guarantee of availability or
          price. <strong>Always verify a fare with the seller</strong> before
          booking, and do not make non-refundable plans based only on what we
          report.
        </p>
      </LegalSection>

      <LegalSection heading="Accounts">
        <p>
          Some features require an account, which is handled by our
          authentication provider. You are responsible for the accuracy of the
          information you provide, for activity under your account, and for
          keeping access to your email and login credentials secure. You must be
          at least 18 and able to form a binding contract where you live.
        </p>
      </LegalSection>

      <LegalSection heading="Free searches, plans, and billing">
        <ul className="flex flex-col gap-2">
          <li>
            Each visitor gets {FREE_SEARCH_LIMIT} {freeSearchLabel}. Free usage
            is also limited per IP address per day to prevent abuse.
          </li>
          <li>
            Pro is {usd(PLANS.monthly.amountUsd)} per month or{' '}
            {usd(PLANS.yearly.amountUsd)} per year and includes up to{' '}
            {SUBSCRIBER_MONTHLY_LIMIT} live searches per month. Monthly limits
            reset at 00:00 UTC on the first of each month and unused searches do
            not roll over. Listed prices may not include taxes that Stripe
            collects.
          </li>
          <li>
            Subscriptions are processed by Stripe and renew automatically until
            you cancel. You authorize the recurring charge when you subscribe.
            If a renewal payment fails, Pro access may pause until payment
            succeeds.
          </li>
          <li>
            You can cancel at any time. Cancellation stops future renewals and
            your Pro access continues to the end of the period you already paid
            for.
          </li>
          <li>
            Payments are generally non-refundable except where required by law,
            including any cooling-off or withdrawal rights that apply where you
            live. If we cause a material failure of the service, email us and we
            will refund or extend access.
          </li>
          <li>
            Prices and limits can change. We will give notice of changes that
            affect an active subscription before they apply to your next
            renewal.
          </li>
          <li>
            If we discontinue the service, your Pro access continues through the
            period you already paid for, or we refund the unused portion.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to:</p>
        <ul className="flex flex-col gap-2">
          <li>
            scrape, resell, or redistribute search results as your own product;
          </li>
          <li>
            share, automate, or pool an account to exceed the limits of your
            plan;
          </li>
          <li>
            create multiple accounts or manipulate cookies, IP addresses, or
            headers to obtain extra free searches;
          </li>
          <li>
            probe, overload, or interfere with the site, our rate limits, or our
            providers;
          </li>
          <li>
            use the site for anything unlawful or in violation of any law.
          </li>
        </ul>
        <p>
          We may rate limit, suspend, or terminate access for any of the above.
        </p>
      </LegalSection>

      <LegalSection heading="Your content and our content">
        <p>
          You keep ownership of the trip criteria you enter. You grant us the
          limited right to process it in order to run your search, store your
          history, and improve the product. The site itself (its name, design,
          copy, and code) belongs to us, and search reports are for your own
          personal or internal use.
        </p>
      </LegalSection>

      <LegalSection heading="Third parties">
        <p>
          We rely on providers for hosting, authentication, database, rate
          limiting, payments, analytics, and model inference, and results link
          to airline and travel agency sites we do not control. We are not
          responsible for third-party content, availability, pricing, or
          conduct.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimers and limits on liability">
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as
          available,&rdquo; without warranties of any kind, express or implied,
          including merchantability, fitness for a particular purpose, and
          non-infringement. We do not warrant that results are accurate,
          complete, or that the service will be uninterrupted or error free.
        </p>
        <p>
          To the fullest extent permitted by law, we are not liable for
          indirect, incidental, special, consequential, or punitive damages, or
          for lost trips, missed fares, price differences, or travel costs. Our
          total liability for any claim relating to the service is limited to
          the greater of the amount you paid us in the twelve months before the
          claim or $50. Some jurisdictions do not allow these limits, in which
          case they apply to the extent permitted.
        </p>
      </LegalSection>

      <LegalSection heading="Your responsibility">
        <p>
          You agree to cover losses we reasonably incur because you misused the
          service, broke these terms, or violated the law, including claims from
          third parties that arise from that conduct.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          We may update these terms as the product changes. The &ldquo;last
          updated&rdquo; date above always reflects the current version. For
          material changes we will email account holders when we can. Price and
          limit changes for an active subscription follow the
          notice-before-renewal rule above. Continuing to use the site after a
          change means you accept it.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          Find Cheap Flights is operated by an individual, not a registered
          company. Until an entity is formed and this section is updated,
          disputes should be raised first by emailing{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. No
          jurisdiction is named here yet, and this is not a choice of a specific
          court or country&apos;s law.
        </p>
      </LegalSection>

      <LegalSection heading="Other terms">
        <p>
          These terms, together with the Privacy Policy, are the whole agreement
          between you and us for the service. If a court finds a part
          unenforceable, the rest still applies. You may not transfer your
          account without our consent; we may transfer the service if the
          product changes hands. Sections that by their nature should survive
          (including disclaimers, liability limits, and this section) remain in
          effect after the service or your account ends.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms? Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
