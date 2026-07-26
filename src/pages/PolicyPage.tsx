import React from 'react';
import { Shield } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Link } from 'react-router-dom';

interface Section {
  title: string;
  content: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Overview',
    content:
      'Soul In PsyAbstract LLC ("SIPA OS", "we", "us") operates SIPA Shell at shell.sipa-os.org. This Privacy Policy explains what information we collect, how we use it, and your rights. We are committed to a minimal-data approach: we do not build user profiles, sell data, or track you across the web.',
  },
  {
    title: '2. Authentication & Account Data',
    content:
      'We use Auth0 for authentication. When you sign in, Auth0 collects your email address and creates a secure session. We do not store your password — Auth0 handles credential management on your behalf. Your email address may be stored in our database solely to associate your saved preferences and device entries with your account. We do not collect your name or any other personally identifying information beyond what Auth0 provides. SSH credentials (passwords and private keys) are never stored on our servers — they exist only in browser memory for the duration of your session.',
  },
  {
    title: '3. Local Storage',
    content:
      'Device entries you save on the Find Devices page are stored in your browser\'s localStorage under the key `sipa_devices`. Saved SSH connection profiles (on the Connect page) are stored under `sipa_shell_connections`. This data never leaves your device unless you explicitly export it. You can clear it at any time by clearing your browser\'s site data for shell.sipa-os.org.',
  },
  {
    title: '4. Session Data',
    content:
      'Quick-connect parameters passed between the Find Devices / Connect pages and the Shell page are stored in sessionStorage for the duration of your browser session. They are automatically discarded when you close the tab or browser.',
  },
  {
    title: '5. WebSocket Proxy Logs',
    content:
      'The WS proxy server (ws-pty-proxy at wss://ws.soulinpsy.info) may log connection metadata such as connection timestamps and client IP addresses for operational and security purposes. These logs are retained for a maximum of 7 days and are not shared with third parties. SSH traffic content is not logged.',
  },
  {
    title: '6. AI Assistant',
    content:
      'When you use the AI Assistant, your messages and the last 20 lines of terminal output are sent to a language model API backend configured via VITE_API_URL. Do not send sensitive credentials or private personal data to the AI chat. The AI backend may be a third-party service subject to its own privacy policy.',
  },
  {
    title: '7. No Third-Party Analytics',
    content:
      'We do not use Google Analytics, Mixpanel, Segment, or any other behavioural tracking service. We do not use fingerprinting, session recording, or heatmap tools.',
  },
  {
    title: '8. Cookies',
    content:
      'SIPA Shell uses a minimal set of cookies. Essential cookies: Auth0 sets secure, HTTP-only session cookies (e.g. auth0, auth0_compat) required to maintain your authenticated session; without these the Service cannot function. Analytics cookies: we use PostHog for product analytics, which may set a first-party cookie to distinguish unique sessions and measure feature usage. No advertising cookies: we do not use any cookies for advertising, retargeting, or cross-site tracking. You can clear all cookies for shell.sipa-os.org at any time via your browser settings; doing so will sign you out.',
  },
  {
    title: '9. Children',
    content:
      'SIPA Shell is not directed at children under the age of 13. We do not knowingly collect any information from children.',
  },
  {
    title: '10. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. We will indicate the "Last updated" date at the top of this page. Continued use of the Service after any changes constitutes acceptance of the revised policy.',
  },
  {
    title: '11. Contact',
    content:
      'For any privacy-related questions or data deletion requests, contact us at sipa-core@sipa-os.org. Soul In PsyAbstract LLC, 131 Continental Dr Suite 305, Newark, DE 19713, USA.',
  },
];

export default function PolicyPage() {
  return (
    <AppLayout title="Privacy Policy">
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-primary" />
          <h1 className="font-mono-terminal text-lg font-bold text-primary text-glow-green">
            Privacy Policy
          </h1>
        </div>

        <div className="glass-panel border border-border p-4">
          <p className="font-mono-terminal text-xs text-muted-foreground">
            Last updated: June 27, 2026 &nbsp;·&nbsp; Effective immediately
          </p>
        </div>

        <div className="glass-panel border border-primary/20 bg-primary/5 p-4">
          <p className="font-mono-terminal text-xs text-primary">
            TL;DR — Authentication via Auth0. Minimal server-side data. No advertising trackers.
            Device lists live in your browser only.
          </p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map(section => (
            <div key={section.title} className="glass-panel border border-border p-5 space-y-2">
              <h2 className="font-mono-terminal text-sm font-semibold text-primary">
                {section.title}
              </h2>
              <p className="font-mono-terminal text-xs text-muted-foreground leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <p className="font-mono-terminal text-xs text-muted-foreground text-center">
          See also:{' '}
          <Link to="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
          {' '}·{' '}
          <Link to="/support" className="text-primary hover:underline">
            Support
          </Link>
          {' '}·{' '}
          <Link to="/mission" className="text-primary hover:underline">
            Mission
          </Link>
        </p>
      </div>
    </AppLayout>
  );
}
