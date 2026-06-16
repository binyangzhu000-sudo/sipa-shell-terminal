import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Trash2, Terminal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/components/layouts/AppLayout';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'How do I check CPU usage on Linux?',
  'Find and delete log files older than 30 days',
  'Explain common journalctl flags',
  'How do I run an SSH command in the background?',
  'How to reload nginx config without downtime?',
  'Monitor real-time network traffic',
];

const MOCK_RESPONSES: Record<string, string> = {
  cpu: `**Check CPU usage:**

\`\`\`bash
# Interactive CPU monitor (recommended)
htop

# Classic top
top

# CPU info
lscpu

# Refresh every 1 second
vmstat 1

# Top 10 CPU-hungry processes
ps aux --sort=-%cpu | head -10
\`\`\`

**Tips:**
- In \`htop\`, press **F6** to sort columns
- In \`top\`, press **P** to sort by CPU
- \`vmstat\`'s \`us\` field = user-space CPU %`,

  log: `**Find and delete old log files:**

\`\`\`bash
# List .log files older than 30 days
find /var/log -name "*.log" -mtime +30 -type f

# Delete them
find /var/log -name "*.log" -mtime +30 -type f -delete

# Preview first with -ls
find /var/log -name "*.log" -mtime +30 -type f -ls

# High-volume delete with xargs
find /var/log -name "*.log" -mtime +30 -print0 | xargs -0 rm -f
\`\`\`

> Always preview with \`-ls\` or \`-print\` before deleting.`,

  default: `**SIPA Shell AI Assistant**

I can help you with:
- Understanding command output and error messages
- Generating shell commands and scripts
- Troubleshooting server issues
- Explaining Linux/Unix commands

Describe what you need and I'll provide specific commands and explanations.

**Quick reference:**
\`\`\`bash
# System info
uname -a && cat /etc/os-release

# Disk usage
df -h

# Memory usage
free -h

# Find process
ps aux | grep <name>
\`\`\``,
};

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `**Hello! I'm the SIPA Shell AI Assistant.**

I specialize in SSH and Linux sysadmin tasks. Ask me about:
- Linux/Unix commands
- Server configuration and troubleshooting
- Shell scripting
- Service management (systemctl, nginx, docker…)

Type your question or click a suggestion below.`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userText, timestamp: new Date() },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      let response = '';

      if (apiUrl) {
        const res = await fetch(`${apiUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages
              .filter(m => m.role !== 'system')
              .map(m => ({ role: m.role, content: m.content })),
            system:
              'You are SIPA Shell AI, an expert in Linux/Unix system administration, SSH, and shell scripting. Keep answers concise and practical. Always put code in code blocks.',
          }),
        });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '', timestamp: new Date() },
        ]);
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            response += decoder.decode(value);
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: response,
              };
              return updated;
            });
          }
        }
      } else {
        // Mock fallback
        const lower = userText.toLowerCase();
        if (lower.includes('cpu') || lower.includes('usage')) {
          response = MOCK_RESPONSES.cpu;
        } else if (
          lower.includes('log') ||
          lower.includes('delete') ||
          lower.includes('old')
        ) {
          response = MOCK_RESPONSES.log;
        } else {
          response = MOCK_RESPONSES.default;
        }

        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: '', timestamp: new Date() },
        ]);
        for (let i = 0; i <= response.length; i += 8) {
          await new Promise(r => setTimeout(r, 15));
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: response.slice(0, i),
            };
            return updated;
          });
        }
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: response,
          };
          return updated;
        });
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            'AI service unavailable. Check VITE_API_URL in your environment settings, or try again later.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation cleared. How can I help?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <AppLayout title="AI Assistant">
      <div className="flex flex-col h-[calc(100vh-3rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/30 shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-accent-foreground glow-purple-sm" />
            <span className="font-mono-terminal text-sm text-accent-foreground">
              AI Command Assistant
            </span>
            <span className="font-mono-terminal text-xs text-muted-foreground">
              // SSH &amp; Linux Expert
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-mono-terminal text-muted-foreground hover:text-primary gap-1"
            onClick={clearHistory}
          >
            <Trash2 size={12} />
            Clear
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="shrink-0 mt-1">
                  <div className="w-7 h-7 flex items-center justify-center glass-panel-purple border border-accent-foreground/20 glow-purple-sm">
                    <Bot size={14} className="text-accent-foreground" />
                  </div>
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] md:max-w-[70%] px-4 py-3 font-mono-terminal text-sm leading-relaxed whitespace-pre-wrap break-words',
                  msg.role === 'user'
                    ? 'bg-primary/10 border border-primary/20 text-primary'
                    : 'glass-panel-purple border border-accent-foreground/10 text-foreground'
                )}
              >
                {msg.content}
                {loading &&
                  i === messages.length - 1 &&
                  msg.role === 'assistant' &&
                  !msg.content && (
                    <span className="cursor-blink inline-block w-2 h-4 bg-accent-foreground align-middle" />
                  )}
              </div>
              {msg.role === 'user' && (
                <div className="shrink-0 mt-1">
                  <div className="w-7 h-7 flex items-center justify-center glass-panel border border-primary/20">
                    <Terminal size={14} className="text-primary" />
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-muted-foreground" />
              <span className="font-mono-terminal text-xs text-muted-foreground">
                Common questions
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="font-mono-terminal text-xs px-3 py-1 border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-border shrink-0 bg-card/30">
          <div className="flex gap-2 items-end">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about Linux commands, server issues, scripts…"
              className="font-mono-terminal text-sm bg-input border-border focus:border-accent-foreground flex-1 h-9"
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <Button
              className="h-9 px-4 font-mono-terminal text-sm bg-accent text-accent-foreground hover:bg-accent/80 glow-purple-sm gap-2 shrink-0"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </Button>
          </div>
          <p className="font-mono-terminal text-xs text-muted-foreground mt-1.5">
            Enter to send · On Terminal page use Ctrl+Shift+A to toggle AI panel
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
