import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal'
import { CONTACT_EMAIL } from '@/lib/constants'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'What findcheapflights.ai collects, why, which providers process it, and how to get your data deleted.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We collect as little as the product needs to work: an account, your search criteria, and enough signal to stop abuse. We do not sell your data and we do not run advertising trackers."
    >
      <LegalSection heading="What we collect">
        <ul className="flex flex-col gap-2">
          <li>
            <strong>Account data.</strong> Your email address and login
            identifiers, created when you sign in. If you use a social login, we
            receive the basic profile your provider shares.
          </li>
          <li>
            <strong>Search data.</strong> The criteria you submit — airports,
            trip type, date window, stay length, price bounds, theme — plus the
            report we generate and its status, so you can revisit it in your
            history.
          </li>
          <li>
            <strong>Billing data.</strong> Your subscription status, plan
            interval, renewal date, and provider customer and subscription
            identifiers. Card numbers go directly to Stripe; we never see or
            store them.
          </li>
          <li>
            <strong>Abuse-prevention data.</strong> Your IP address and a random
            guest identifier stored in a cookie, used as counters to enforce
            free and daily search limits.
          </li>
          <li>
            <strong>Technical data.</strong> Standard request logs kept by our
            hosting and infrastructure providers, such as IP address, user
            agent, and timestamps.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Cookies we set">
        <ul className="flex flex-col gap-2">
          <li>
            <strong>Session cookies</strong> from our authentication provider,
            required to keep you signed in.
          </li>
          <li>
            <strong>
              <code>fcf_guest</code>
            </strong>{' '}
            — a random identifier, valid for 90 days, that tracks whether your
            free search has been used. It contains no personal information.
          </li>
          <li>
            <strong>
              <code>theme</code>
            </strong>{' '}
            — remembers light or dark mode so the first paint matches your
            choice.
          </li>
        </ul>
        <p>
          These are functional cookies, not advertising cookies. We do not use
          third-party ad networks or cross-site tracking pixels.
        </p>
      </LegalSection>

      <LegalSection heading="How we use it">
        <ul className="flex flex-col gap-2">
          <li>to run your searches and show you the results;</li>
          <li>to keep your search history available to you;</li>
          <li>to create your account and keep it secure;</li>
          <li>to process subscriptions and honor plan limits;</li>
          <li>
            to detect and prevent abuse, fraud, and cost attacks through rate
            limiting;
          </li>
          <li>
            to fix bugs, monitor reliability, and improve the quality of
            results;
          </li>
          <li>to send transactional messages about your account or billing.</li>
        </ul>
        <p>
          We do not sell your personal information, and we do not share it for
          behavioral advertising.
        </p>
      </LegalSection>

      <LegalSection heading="Who processes your data">
        <p>
          We use a small number of providers, each handling only what its job
          requires:
        </p>
        <ul className="flex flex-col gap-2">
          <li>
            <strong>Clerk</strong> — accounts, sign-in, and session management.
          </li>
          <li>
            <strong>Convex</strong> — the database that stores your user record,
            search criteria, and reports.
          </li>
          <li>
            <strong>Upstash Redis</strong> — short-lived counters keyed to your
            guest identifier or IP address for rate limiting.
          </li>
          <li>
            <strong>Stripe</strong> — checkout, card processing, and
            subscription management.
          </li>
          <li>
            <strong>OpenRouter</strong> and the underlying model provider — they
            receive your trip criteria in order to run the search. Do not put
            sensitive personal details into free-text fields.
          </li>
          <li>
            <strong>Vercel</strong> — hosting, edge routing, and request logs.
          </li>
        </ul>
        <p>
          These providers may process data outside your country, including in
          the United States.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Account records and search history are kept while your account is
          active. Rate-limit counters expire automatically — daily counters
          within about 36 hours and guest counters within 90 days. Billing
          records are retained as long as required for tax and accounting
          purposes. Provider logs follow each provider&apos;s own retention
          schedule.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices and rights">
        <p>
          You can update your account details or delete your account at any time
          from the account menu, which removes your login credentials. Depending
          on where you live, you may also have the right to access, correct,
          export, or delete your personal data, or to object to certain
          processing. Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will
          handle the request. You can also block cookies in your browser, though
          sign-in will stop working.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Traffic is served over HTTPS, the guest cookie is HTTP-only, and
          access to production data is limited. No system is perfectly secure,
          so we cannot guarantee absolute protection — please use a strong,
          unique login.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          The service is not intended for children under 13, and we do not
          knowingly collect their data. If you believe a child has given us
          information, email us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and contact">
        <p>
          We will update this page when our practices change and revise the
          &ldquo;last updated&rdquo; date above. Questions, deletion requests,
          or privacy concerns:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{' '}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
