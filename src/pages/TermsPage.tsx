import React from 'react';
import { FileText } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Link } from 'react-router-dom';

interface Section {
  title: string;
  content: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Service Description',
    content:
      'SIPA Shell ("the Service") is a browser-based SSH terminal and AI assistant provided by Soul In PsyAbstract LLC ("SIPA OS", "we", "us"). The Service connects to remote servers via a WebSocket-to-SSH proxy and provides an AI command assistant powered by third-party language model APIs.',
  },
  {
    title: '2. Acceptance of Terms',
    content:
      'By accessing or using SIPA Shell at shell.sipa-os.org or any related domain, you agree to these Terms of Service. If you do not agree, do not use the Service. We may update these Terms at any time; continued use constitutes acceptance of the updated Terms.',
  },
  {
    title: '3. User Responsibilities',
    content:
      'You are solely responsible for the SSH credentials you enter, the servers you connect to, and all actions performed through the terminal. You must not use the Service to access systems without authorization, conduct illegal activities, or transmit malware. You agree to comply with all applicable laws and the terms of any server or network you access through the Service.',
  },
  {
    title: '4. Credential Security',
    content:
      'SIPA Shell transmits SSH credentials over TLS to a WebSocket proxy server. Credentials are held only in memory for the duration of your session and are never stored in any database by SIPA OS. You are responsible for the security of your own SSH keys and passwords. We strongly recommend using SSH key authentication instead of passwords.',
  },
  {
    title: '5. AI Assistant',
    content:
      'The AI Assistant feature sends your messages and terminal context to third-party language model APIs. Do not input sensitive credentials, personal data, or proprietary information into the AI chat. SIPA OS is not responsible for the accuracy of AI-generated responses. AI output is provided for informational purposes only.',
  },
  {
    title: '6. Availability and Modifications',
    content:
      'We strive to maintain service availability but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue the Service or any part of it at any time without prior notice. We are not liable for any resulting loss or inconvenience.',
  },
  {
    title: '7. Disclaimer of Warranties',
    content:
      'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. USE OF THE SERVICE IS AT YOUR OWN RISK.',
  },
  {
    title: '8. Limitation of Liability',
    content:
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, SIPA OS AND ITS OFFICERS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.',
  },
  {
    title: '9. Governing Law',
    content:
      'These Terms are governed by the laws of the State of Delaware, USA, without regard to its conflict-of-law provisions. Any disputes shall be resolved in the courts of Delaware.',
  },
  {
    title: '10. Contact',
    content:
      'Questions about these Terms should be directed to sipa-core@sipa-os.org. Soul In PsyAbstract LLC, 131 Continental Dr Suite 305, Newark, DE 19713, USA.',
  },
];

export default function TermsPage() {
  return (
    <AppLayout title="Terms of Service">
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-primary" />
          <h1 className="font-mono-terminal text-lg font-bold text-primary text-glow-green">
            Terms of Service
          </h1>
        </div>

        <div className="glass-panel border border-border p-4">
          <p className="font-mono-terminal text-xs text-muted-foreground">
            Last updated: June 27, 2026 &nbsp;·&nbsp; Effective immediately
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
          <Link to="/policy" className="text-primary hover:underline">
            Privacy Policy
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
