import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/legal'
import { CONTACT_EMAIL } from '@/lib/constants'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata({
  title: 'Find Cheap Flights: Privacy Policy',
  description:
    'What findcheapflights.ai collects, why, which providers process it, and how to get your data deleted.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="We collect as little as the product needs to work: search criteria, enough signal to stop abuse, and an account if you sign in. You can run one free search without creating an account. We do not sell your data and we do not run advertising trackers."
    >
      <LegalSection heading="What we collect">
        <ul className="flex flex-col gap-2">
          <li>
            <strong>Account data.</strong> Your email address and login
            identifiers, created when you sign in. If you use a social login, we
            receive the basic profile your provider shares.
          </li>
          <li>
            <strong>Search data.</strong> The criteria you submit (airports,
            continent, trip type, date window, stay length, price bounds, theme)
            plus the report we generate and its status, so you can revisit it
            in your history. Signed-in searches are stored in our database.
            Guest searches are sent to the model to run and are not saved to
            your history.
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
            free and daily search limits. This is collected whether or not you
            have an account.
          </li>
          <li>
            <strong>Analytics data.</strong> Page views, the referring site, and
            coarse device and browser information, collected by Vercel Analytics
            so we can see which pages are used.
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
            : a random identifier, valid for 90 days, that tracks whether your
            free search has been used. It is not a name or email, but it is a
            persistent ID and can be combined with your IP address for quota
            enforcement.
          </li>
          <li>
            <strong>
              <code>theme</code>
            </strong>{' '}
            : remembers light or dark mode so the first paint matches your
            choice. It lasts one year. The same preference is also stored in
            your browser&apos;s local storage.
          </li>
        </ul>
        <p>
          These are functional cookies, not advertising cookies. Clerk, Stripe,
          Cloudflare (bot checks), and Vercel Analytics may also set their own
          functional cookies or similar identifiers. We do not use third-party
          ad networks or cross-site tracking pixels.
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
            to fix bugs, monitor reliability, and see which pages are used;
          </li>
          <li>to send transactional messages about your account or billing.</li>
        </ul>
        <p>
          We do not sell your personal information, and we do not share it for
          behavioral advertising. We do not send marketing or fare-alert email
          unless we update this policy first.
        </p>
      </LegalSection>

      <LegalSection heading="Who processes your data">
        <p>
          We use a small number of providers, each handling only what its job
          requires:
        </p>
        <ul className="flex flex-col gap-2">
          <li>
            <strong>Clerk</strong>: accounts, sign-in, and session management.
          </li>
          <li>
            <strong>Convex</strong>: the database that stores your user record,
            search criteria, and reports.
          </li>
          <li>
            <strong>Upstash Redis</strong>: short-lived counters keyed to your
            guest identifier or IP address for rate limiting.
          </li>
          <li>
            <strong>Stripe</strong>: checkout, card processing, and
            subscription management.
          </li>
          <li>
            <strong>OpenRouter</strong> and the underlying model provider: they
            receive your trip criteria in order to run the search. We do not
            use your prompts to train a model of our own. We cannot control
            whether those providers log requests or use them under their own
            terms. Do not put sensitive personal details into free-text fields.
          </li>
          <li>
            <strong>Vercel</strong>: hosting, edge routing, request logs, and
            Vercel Analytics page-view data.
          </li>
        </ul>
        <p>
          These providers may process data outside your country, including in
          the United States.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Account records and signed-in search history stay until you ask us to
          delete them. They do not expire on their own. Rate-limit counters
          expire automatically: daily counters within about 36 hours and guest
          counters within 90 days. After a deletion request we remove your
          Clerk login, Convex user record, and search history. Stripe and other
          providers may keep billing or log records as long as their own rules
          and tax law require. Provider logs follow each provider&apos;s
          retention schedule.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices and rights">
        <p>
          You can update your account details from the account menu. To delete
          your account and personal data, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the
          address on the account. We will verify the request, then delete your
          Clerk login, Convex user record, and search history, and ask Stripe
          to close the customer record where that is allowed. Copies held by
          providers for tax, fraud, or legal reasons may remain.
        </p>
        <p>
          Depending on where you live, you may also have the right to access,
          correct, export, or delete your personal data, or to object to
          certain processing. Email the same address and we will handle the
          request. You can also block cookies in your browser, though sign-in
          and quota tracking will stop working.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Traffic is served over HTTPS, the guest cookie is HTTP-only, and
          access to production data is limited. No system is perfectly secure,
          so we cannot guarantee absolute protection. Please use a strong,
          unique login.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          You must be at least 18 to use the service or subscribe. The service
          is not intended for children under 13, and we do not knowingly
          collect their data. If you believe a child has given us information,
          email us and we will delete it.
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
