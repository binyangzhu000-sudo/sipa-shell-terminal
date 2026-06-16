import { useEffect, useRef, useState } from 'react';
import { Bot } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { TerminalPane, type TerminalHandle } from '@/components/TerminalPane';
import { useLang } from '@/contexts/LangContext';

export default function ShellPage() {
  const termRef = useRef<TerminalHandle>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { t } = useLang();
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ role: string; content: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setPanelOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const sendAi = async () => {
    const msg = aiInput.trim();
    if (!msg || aiLoading) return;
    setAiInput('');
    const ctx = termRef.current?.getRecentLines() ?? '';
    const next = [...aiMessages, { role: 'user', content: msg }];
    setAiMessages(next);
    setAiLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const system = `You are SIPA Shell AI. Terminal context (last 20 lines):\n\`\`\`\n${ctx || '(empty)'}\n\`\`\`\nBe concise and technical.`;
      let text = '';
      setAiMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      if (apiUrl) {
        const res = await fetch(`${apiUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ messages: next, system }),
        });
        const reader = res.body?.getReader();
        const dec = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            text += dec.decode(value);
            setAiMessages(prev => {
              const u = [...prev];
              u[u.length - 1] = { role: 'assistant', content: text };
              return u;
            });
          }
        }
      } else {
        setAiMessages(prev => {
          const u = [...prev];
          u[u.length - 1] = { role: 'assistant', content: 'AI API not configured (set VITE_API_URL).' };
          return u;
        });
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <AppLayout title="SIPA Shell">
      <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
        {/* Terminal */}
        <div className="min-w-0 flex-1 border-r border-border" style={{ flexBasis: panelOpen ? '70%' : '100%' }}>
          <TerminalPane ref={termRef} />
        </div>

        {/* AI Panel */}
        {panelOpen && (
          <div className="flex w-[30%] min-w-[260px] flex-col border-l border-border bg-card/50">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Bot size={14} className="text-accent-foreground" />
              <span className="font-mono text-xs font-semibold">{t('nav.ai')}</span>
              <button onClick={() => setPanelOpen(false)} className="ml-auto text-xs text-muted-foreground hover:text-primary">×</button>
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
              {aiMessages.length === 0 && (
                <p className="font-mono text-xs text-muted-foreground">{t('ai.context')}</p>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`rounded-md border p-2 font-mono text-xs ${
                  m.role === 'user'
                    ? 'ml-4 border-purple-500/30 bg-purple-500/10 text-right'
                    : 'border-border bg-card/80 whitespace-pre-wrap'
                }`}>{m.content}</div>
              ))}
              <div ref={aiEndRef} />
            </div>
            <div className="flex gap-2 border-t border-border p-2">
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAi(); } }}
                placeholder={t('ai.placeholder')}
                className="flex-1 resize-none rounded border border-border bg-input/40 p-2 font-mono text-xs text-foreground outline-none focus:border-primary"
                rows={2}
              />
              <button
                onClick={sendAi}
                disabled={aiLoading}
                className="self-end rounded bg-primary px-3 py-1.5 font-mono text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                {aiLoading ? '…' : t('ai.send')}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-border px-4 py-1 text-center font-mono text-[10px] text-muted-foreground">
        {t('shell.ai_toggle')}
      </div>
    </AppLayout>
  );
}
