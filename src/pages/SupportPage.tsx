import React, { useState, useRef, useEffect } from 'react';
import { Mail, MessageCircle, CheckCircle, ChevronDown, ChevronUp, HelpCircle, Send, AlertTriangle } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { cn } from '@/lib/utils';

const SUPPORT_API = 'https://sipa-os.online/support';
const SUPPORT_KEY = 'Bearer sipa-support-2026-beta';

interface ChatMsg { role: 'user' | 'ai'; text: string; ticket?: string; }

function AiChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lang = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || loading) return;
    setMsgs(p => [...p, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(SUPPORT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: SUPPORT_KEY },
        body: JSON.stringify({ message: msg, lang }),
      });
      const data = await res.json();
      setMsgs(p => [...p, { role: 'ai', text: data.response, ticket: data.ticket_id }]);
      if (data.escalate) setCrisis(true);
    } catch {
      setMsgs(p => [...p, { role: 'ai', text: 'Error reaching support API. Email sipa-core@sipa-os.org' }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="glass-panel border border-primary/30 flex flex-col" style={{ height: '380px' }}>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="font-mono-terminal text-xs text-primary">// AI Support — 24/7</span>
      </div>
      {crisis && (
        <div className="flex items-center gap-2 bg-red-950/60 border-b border-red-800 px-4 py-2">
          <AlertTriangle size={13} className="text-red-400 shrink-0" />
          <span className="font-mono-terminal text-xs text-red-300">Crisis resources: Israel 112 / ERAN 1201 / US 988</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <p className="font-mono-terminal text-xs text-muted-foreground text-center mt-8">Describe your issue — AI answers instantly</p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={cn('max-w-[85%] px-3 py-2 rounded-lg font-mono-terminal text-xs leading-relaxed', m.role === 'user' ? 'bg-primary/20 text-primary border border-primary/20 rounded-br-none' : 'bg-muted/40 text-foreground border border-border rounded-bl-none')}>
              {m.text}
              {m.ticket && <div className="mt-1 text-[9px] opacity-40">#{m.ticket.slice(0, 8)}</div>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1 px-3 py-2">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-3 border-t border-border">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Describe your issue..."
          disabled={loading}
          className="flex-1 bg-muted/30 border border-border rounded px-3 py-1.5 font-mono-terminal text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="px-3 py-1.5 bg-primary/20 border border-primary/30 text-primary rounded font-mono-terminal text-xs hover:bg-primary/30 transition disabled:opacity-40 flex items-center gap-1">
          <Send size={11} /> Send
        </button>
      </div>
    </div>
  );
}

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

        {/* AI Chat */}
        <AiChat />

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
