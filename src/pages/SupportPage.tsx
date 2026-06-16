import React, { useState } from 'react';
import { Mail, MessageCircle, CheckCircle, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { cn } from '@/lib/utils';

interface IssueItem {
  id: string;
  title: string;
  body: string;
}

const COMMON_ISSUES: IssueItem[] = [
  {
    id: '1',
    title: 'Terminal shows "WebSocket connection failed"',
    body: 'This usually means the WS proxy at wss://ws.soulinpsy.info is unreachable. Check that the ws-pty-proxy service is running on the server: `systemctl status ws-pty-proxy`. Also verify your network can reach the Cloudflare tunnel endpoint.',
  },
  {
    id: '2',
    title: 'SSH authentication fails with correct credentials',
    body: 'Double-check the username, host, and port. If using a non-standard port make sure the SSH server is listening on it. For key-based auth, ensure the public key is in `~/.ssh/authorized_keys` on the server and permissions are `chmod 600`.',
  },
  {
    id: '3',
    title: 'Terminal renders with garbled characters',
    body: 'This is typically a locale or encoding mismatch. Run `export LANG=en_US.UTF-8` in your shell or add it to `~/.bashrc`. Also ensure the TERM environment variable is set to `xterm-256color`.',
  },
  {
    id: '4',
    title: 'AI Assistant returns "API not configured"',
    body: 'Set the VITE_API_URL environment variable in your `.env` file to point to your backend. Example: `VITE_API_URL=https://api.yourdomain.com`. Rebuild the app after changing env variables.',
  },
  {
    id: '5',
    title: 'Find Devices page shows no devices',
    body: 'Devices are stored in your browser\'s localStorage under the key `sipa_devices`. They are user-specific and never synced to a server. Click "Add Device" to create your first entry. Make sure your browser allows localStorage (not in a private/incognito mode that blocks it).',
  },
  {
    id: '6',
    title: 'Copy-paste does not work in the terminal',
    body: 'Use Ctrl+Shift+C to copy and Ctrl+Shift+V to paste inside the xterm.js terminal. Right-click context menu may also work depending on your browser. On macOS, Cmd+C / Cmd+V work as usual.',
  },
];

function IssueAccordion({ issue }: { issue: IssueItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border glass-panel overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 font-mono-terminal text-sm text-foreground hover:text-primary transition-colors text-left gap-3"
        onClick={() => setOpen(v => !v)}
      >
        <span>{issue.title}</span>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3">
          <p className="font-mono-terminal text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {issue.body}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <AppLayout title="Support">
      <div className="p-4 md:p-6 space-y-8 max-w-3xl">
        {/* Hero */}
        <div className="glass-panel border border-primary/30 p-6 text-center">
          <HelpCircle size={32} className="text-primary mx-auto mb-3" />
          <h1 className="font-mono-terminal text-xl font-bold text-primary text-glow-green mb-2">
            Need help?
          </h1>
          <p className="font-mono-terminal text-sm text-muted-foreground max-w-md mx-auto">
            We're here for you. Reach out via email or Telegram and we'll respond as soon as
            possible.
          </p>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="mailto:sipa-core@sipa-os.org"
            className="glass-panel border border-border p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
          >
            <div className="w-10 h-10 flex items-center justify-center border border-primary/20 bg-primary/5 shrink-0">
              <Mail size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-mono-terminal text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="font-mono-terminal text-sm text-primary group-hover:text-glow-green transition-colors">
                sipa-core@sipa-os.org
              </p>
            </div>
          </a>
          <a
            href="https://t.me/messycketch"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-panel border border-border p-5 flex items-center gap-4 hover:border-primary/40 transition-colors group"
          >
            <div className="w-10 h-10 flex items-center justify-center border border-primary/20 bg-primary/5 shrink-0">
              <MessageCircle size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-mono-terminal text-xs text-muted-foreground mb-0.5">Telegram</p>
              <p className="font-mono-terminal text-sm text-primary group-hover:text-glow-green transition-colors">
                @messycketch
              </p>
            </div>
          </a>
        </div>

        {/* Status */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-3">
            <CheckCircle size={18} className="text-primary shrink-0" />
            <div>
              <p className="font-mono-terminal text-sm text-foreground font-medium">
                All systems operational
              </p>
              <p className="font-mono-terminal text-xs text-muted-foreground mt-0.5">
                WS proxy · SSH tunnel · AI endpoint · shell.sipa-os.org
              </p>
            </div>
            <span className="ml-auto status-pulse inline-block w-2 h-2 rounded-full bg-primary shrink-0" />
          </div>
        </div>

        {/* Common issues */}
        <div>
          <h2 className="font-mono-terminal text-sm text-primary text-glow-green mb-4">
            // Common Issues
          </h2>
          <div className="space-y-2">
            {COMMON_ISSUES.map(issue => (
              <IssueAccordion key={issue.id} issue={issue} />
            ))}
          </div>
        </div>

        <p className="font-mono-terminal text-xs text-muted-foreground text-center">
          Still stuck? Email us at{' '}
          <a
            href="mailto:sipa-core@sipa-os.org"
            className="text-primary hover:underline"
          >
            sipa-core@sipa-os.org
          </a>
          {' '}and include your browser, OS, and a description of the issue.
        </p>
      </div>
    </AppLayout>
  );
}
