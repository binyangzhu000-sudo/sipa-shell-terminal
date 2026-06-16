import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { Link } from 'react-router-dom';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: '1',
    question: 'What is SIPA Shell?',
    answer:
      'SIPA Shell is a browser-based SSH terminal that connects to remote servers via a WebSocket-to-SSH proxy. It requires no installation — open the app, enter your server credentials, and get a full terminal session in your browser. It also includes an AI assistant that understands your terminal context.',
  },
  {
    id: '2',
    question: 'How does the SSH connection work?',
    answer:
      'When you connect, the browser opens a WebSocket connection to wss://ws.soulinpsy.info. The WS proxy (ws-pty-proxy) runs on the SIPA server and translates that WebSocket stream into a real SSH session to your target host. Your credentials travel over TLS — they are never stored on any server.',
  },
  {
    id: '3',
    question: 'Does SIPA Shell store my passwords or SSH keys?',
    answer:
      'No. Passwords and private keys are only held in memory for the duration of the session. They are never written to a database or sent anywhere other than the SSH server you specified. Saved connection profiles (host, port, username) are stored only in your browser\'s localStorage.',
  },
  {
    id: '4',
    question: 'How do I set up SSH key authentication?',
    answer:
      'Generate a key pair locally: `ssh-keygen -t ed25519`. Copy the public key to your server: `ssh-copy-id user@host` or manually append it to `~/.ssh/authorized_keys`. Then in the Connect page, select "SSH Key" as the auth type and paste your private key content.',
  },
  {
    id: '5',
    question: 'What is the Find Devices page?',
    answer:
      'Find Devices lets you maintain a personal list of SSH targets. Each device entry stores a display name, host, port, and username in your browser\'s localStorage. Clicking "Connect" on a device pre-fills the terminal connection and opens the Shell page automatically.',
  },
  {
    id: '6',
    question: 'How does the AI Assistant work?',
    answer:
      'The AI Assistant sends your question along with the last 20 lines of terminal output as context to an LLM backend (configured via VITE_API_URL). This lets the AI explain errors, suggest fixes, or generate commands based on what you actually see on screen. On the Shell page, press Ctrl+Shift+A to toggle the inline AI panel.',
  },
  {
    id: '7',
    question: 'What does VITE_API_URL do?',
    answer:
      'VITE_API_URL points the frontend to your backend API. The backend handles AI chat requests (POST /ai/chat) and optionally device-lookup endpoints. If it is not set, the AI Assistant falls back to a built-in demo mode with mock responses.',
  },
  {
    id: '8',
    question: 'What are the pricing tiers?',
    answer:
      'The Free tier includes 1 saved device, basic terminal access, and 50 AI queries per month. Pro ($9/mo) adds unlimited devices and unlimited AI. Enterprise ($29/mo) adds team features, API access, and an SLA. Paid tiers are currently in development — see the Subscription page for details.',
  },
  {
    id: '9',
    question: 'Can I install SIPA Shell as a PWA?',
    answer:
      'Yes. SIPA Shell is a Progressive Web App. In Chrome/Edge, look for the install icon in the address bar. On iOS Safari, use "Add to Home Screen" from the share menu. Once installed, the app runs in standalone mode with the dark hacker theme intact.',
  },
  {
    id: '10',
    question: 'Who built SIPA Shell and how do I get support?',
    answer:
      'SIPA Shell is built by SIPA OS (Soul In PsyAbstract LLC). For support, email sipa-core@sipa-os.org or reach us on Telegram at @messycketch. You can also browse common issues on the Support page.',
  },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border glass-panel overflow-hidden">
      <button
        className="w-full flex items-start justify-between px-4 py-3.5 font-mono-terminal text-sm text-foreground hover:text-primary transition-colors text-left gap-3"
        onClick={() => setOpen(v => !v)}
      >
        <span className="font-medium">{item.question}</span>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <p className="font-mono-terminal text-xs text-muted-foreground leading-relaxed">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <AppLayout title="FAQ">
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare size={20} className="text-primary" />
          <h1 className="font-mono-terminal text-lg font-bold text-primary text-glow-green">
            Frequently Asked Questions
          </h1>
        </div>
        <p className="font-mono-terminal text-sm text-muted-foreground -mt-4">
          Everything you need to know about SIPA Shell.
        </p>

        <div className="space-y-2">
          {FAQ_ITEMS.map(item => (
            <FaqAccordion key={item.id} item={item} />
          ))}
        </div>

        <div className="glass-panel border border-border p-5 text-center">
          <p className="font-mono-terminal text-sm text-foreground mb-2">
            Still have questions?
          </p>
          <p className="font-mono-terminal text-xs text-muted-foreground">
            Visit our{' '}
            <Link to="/support" className="text-primary hover:underline">
              Support page
            </Link>
            {' '}or email{' '}
            <a href="mailto:sipa-core@sipa-os.org" className="text-primary hover:underline">
              sipa-core@sipa-os.org
            </a>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
