import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertTriangle } from 'lucide-react';

interface SupportMessage {
  sender: 'user' | 'bot';
  text: string;
  ticket_id?: string;
}

interface SupportResponse {
  ticket_id: string;
  response: string;
  escalate: boolean;
}

interface Props {
  domain?: string;
}

const API_URL = 'https://sipa-os.online/support';
const BEARER = 'Bearer sipa-support-2026-beta';

const SupportWidget: React.FC<Props> = ({ domain }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const lang =
    typeof navigator !== 'undefined'
      ? navigator.language.slice(0, 2)
      : 'en';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function send() {
    const msg = input.trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { sender: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: BEARER },
        body: JSON.stringify({ message: msg, lang, user_id: domain }),
      });
      const data: SupportResponse = await res.json();
      setMessages(p => [...p, { sender: 'bot', text: data.response, ticket_id: data.ticket_id }]);
      if (data.escalate) setCrisis(true);
    } catch {
      setMessages(p => [...p, { sender: 'bot', text: 'Connection error. Email sipa-core@sipa-os.org' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
        aria-label="Support"
      >
        {isOpen ? <X size={18} /> : <MessageCircle size={18} />}
      </button>

      {/* Panel */}
      <div
        className={`fixed bottom-20 right-5 z-40 w-80 flex flex-col rounded-xl border border-border bg-background shadow-2xl transition-all duration-200 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'
        }`}
        style={{ height: '440px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-mono-terminal text-sm text-primary font-medium">SIPA Support AI</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>

        {/* Crisis banner */}
        {crisis && (
          <div className="flex items-center gap-2 bg-red-950/80 border-b border-red-800 px-4 py-2">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <span className="font-mono-terminal text-xs text-red-300">
              Crisis: Israel 112 / ERAN 1201 / US 988
            </span>
            <button onClick={() => setCrisis(false)} className="ml-auto text-red-400 hover:text-red-200">
              <X size={12} />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 && (
            <p className="font-mono-terminal text-xs text-muted-foreground text-center mt-6">
              How can we help you?
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg font-mono-terminal text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-primary/20 text-primary border border-primary/20 rounded-br-none'
                    : 'bg-muted/40 text-foreground border border-border rounded-bl-none'
                }`}
              >
                {m.text}
                {m.ticket_id && (
                  <div className="mt-1 text-[9px] text-muted-foreground opacity-50">
                    #{m.ticket_id.slice(0, 8)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted/40 border border-border rounded-lg rounded-bl-none px-3 py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 p-3 border-t border-border">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Describe your issue..."
            disabled={loading}
            className="flex-1 bg-muted/30 border border-border rounded-md px-3 py-1.5 font-mono-terminal text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="w-7 h-7 rounded-md bg-primary/20 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </>
  );
};

export default SupportWidget;
