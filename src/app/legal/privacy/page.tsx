import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - OpenBio',
  description:
    'What information OpenBio collects, how it is used, and who processes it.',
  alternates: { canonical: '/legal/privacy' },
};

export default function Page() {
  return (
    <div>
      <h1>Privacy Policy</h1>

      <p>Last updated: November 23, 2026</p>

      <p>
        This Privacy Policy describes Our policies and procedures on the
        collection, use and disclosure of Your information when You use the
        Service and tells You about Your privacy rights and how the law protects
        You.
      </p>

      <p>
        We use Your Personal data to provide and improve the Service. By using
        the Service, You agree to the collection and use of information in
        accordance with this Privacy Policy.
      </p>

      <h2>To Whom Does This Policy Apply</h2>

      <p>
        This Privacy Policy applies to all visitors, users, and others who wish
        to access or use the Service.
      </p>

      <h2>What Information Do We Collect</h2>

      <p>We collect information directly from you on our Site.</p>

      <ul>
        <li>
          <strong>Account information.</strong> Your name and email address, and
          either a password (stored only in hashed form) or the identity
          provided by GitHub or Google if you sign in with them.
        </li>
        <li>
          <strong>Profile content.</strong> The name, bio, images, links and
          other cards you add to a profile page. Profile pages are public.
        </li>
        <li>
          <strong>Visits to profile pages.</strong> When someone views a profile
          or clicks a link on it, we record the IP address, browser and device
          information, the referring page, the approximate country and the time.
          Profile owners see this only as aggregated analytics.
        </li>
        <li>
          <strong>Email sign-ups on profiles.</strong> If you enter your email
          address into a sign-up form on someone&apos;s profile page, that
          address is shared with the owner of that profile.
        </li>
        <li>
          <strong>Billing.</strong> Payments are handled by our payment
          provider. We store your plan and subscription status, not your card
          details.
        </li>
        <li>
          <strong>AI features.</strong> Text you submit to the AI writing tools
          is sent to an AI model provider to generate a response.
        </li>
      </ul>

      <h2>Who Processes Your Information</h2>

      <p>
        We rely on service providers to run the Service, and they process
        information on our behalf: Vercel (hosting, file storage, site analytics
        and access to AI models), Neon (database), Upstash (caching and rate
        limiting), Resend (email delivery) and Polar (payments and
        subscriptions).
      </p>

      <h2>Emails We Send</h2>

      <p>
        We send emails needed to operate your account, such as verification and
        password reset messages. We also send a weekly analytics digest, which
        you can turn off from your dashboard settings or with the unsubscribe
        link in each digest.
      </p>

      <h2>What Cookies Data Do We Collect</h2>

      <p>
        We use cookies and similar tracking technologies to track the activity
        on Our Service and store certain information. Tracking technologies used
        are beacons, tags, and scripts to collect and track information and to
        improve and analyze Our Service.
      </p>

      <h2>What We Use Your Information For</h2>

      <p>
        We use the information we collect to provide our products to you and
        make them better, develop new products, and protect our users.
      </p>

      <h2>Changes To This Privacy Policy</h2>

      <p>
        We may update Our Privacy Policy from time to time. We will notify You
        of any changes by posting the new Privacy Policy on this page.
      </p>

      <h2>How To Contact Us</h2>

      <p>
        If you have any questions about this Privacy Policy, You can contact us:{' '}
        <Link href="mailto:vanxh@openbio.app">vanxh@openbio.app</Link>
      </p>
    </div>
  );
}
