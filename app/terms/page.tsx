import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal'
import {
  CONTACT_EMAIL,
  FREE_SEARCH_LIMIT,
  SUBSCRIBER_DAILY_LIMIT,
} from '@/lib/constants'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Terms of Service',
  description:
    'The terms that govern your use of findcheapflights.ai, including plan limits, billing, acceptable use, and fare accuracy disclaimers.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms are a plain-language agreement between you and findcheapflights.ai. By using the site you agree to them. If you do not agree, please do not use the site."
    >
      <LegalSection heading="What the service does">
        <p>
          Find Cheap Flights is a fare research tool. You describe a trip —
          airports, a date window, a price ceiling — and a language model with
          web search reads publicly available fare pages and reports what it
          finds. We are not a travel agency, an airline, or a booking platform,
          and we do not use a GDS.
        </p>
        <p>
          We never sell tickets or take payment for travel. Every result is a
          research summary that points you to where a fare was listed. You book
          directly with the airline or online travel agency and their terms
          apply to that booking.
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
          old enough to form a binding contract where you live.
        </p>
      </LegalSection>

      <LegalSection heading="Free searches, plans, and billing">
        <ul className="flex flex-col gap-2">
          <li>
            Each visitor gets {FREE_SEARCH_LIMIT} free live search. Free usage
            is also limited per IP address per day to prevent abuse.
          </li>
          <li>
            Pro is $11.99 per month or $119.99 per year and includes up to{' '}
            {SUBSCRIBER_DAILY_LIMIT} live searches per day. Daily limits reset
            at 00:00 UTC and unused searches do not roll over.
          </li>
          <li>
            Subscriptions are processed by Stripe and renew automatically until
            you cancel. You authorize the recurring charge when you subscribe.
          </li>
          <li>
            You can cancel at any time. Cancellation stops future renewals and
            your Pro access continues to the end of the period you already paid
            for.
          </li>
          <li>
            Payments are generally non-refundable except where required by law,
            but if something goes wrong on our end, email us and we will make it
            right.
          </li>
          <li>
            Prices and limits can change. We will give notice of changes that
            affect an active subscription before they apply to your next
            renewal.
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
          We may rate limit, suspend, or terminate access for any of the above,
          and we may stop offering the service at any time.
        </p>
      </LegalSection>

      <LegalSection heading="Your content and our content">
        <p>
          You keep ownership of the trip criteria you enter. You grant us the
          limited right to process it in order to run your search, store your
          history, and improve the product. The site itself — its name, design,
          copy, and code — belongs to us, and search reports are for your own
          personal or internal use.
        </p>
      </LegalSection>

      <LegalSection heading="Third parties">
        <p>
          We rely on providers for hosting, authentication, database, rate
          limiting, payments, and model inference, and results link to airline
          and travel agency sites we do not control. We are not responsible for
          third-party content, availability, pricing, or conduct.
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

      <LegalSection heading="Changes to these terms">
        <p>
          We may update these terms as the product changes. The &ldquo;last
          updated&rdquo; date above always reflects the current version, and
          continuing to use the site after a change means you accept it.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          Find Cheap Flights is currently operated by an individual rather than
          a registered company, so no corporate entity or jurisdiction is named
          here yet. Any dispute will be governed by the law of the place where
          the operator resides, and this section will be updated once an entity
          is formed.
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
