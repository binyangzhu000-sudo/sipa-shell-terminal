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
  '如何查看 Linux 系统的 CPU 使用率？',
  '如何查找并删除 30 天前的日志文件？',
  '解释 journalctl 的常用参数',
  '如何在后台运行 SSH 命令？',
  'nginx 配置文件如何重新加载？',
  '如何监控实时网络流量？',
];

const MOCK_RESPONSES: Record<string, string> = {
  cpu: `**查看 CPU 使用率的命令：**

\`\`\`bash
# 实时 CPU 监控（推荐）
htop

# 简单 top 命令
top

# 查看 CPU 信息
lscpu

# 每秒刷新一次，显示 CPU
vmstat 1

# 查看特定进程的 CPU 占用
ps aux --sort=-%cpu | head -10
\`\`\`

**说明：**
- \`htop\` 提供交互式界面，按 F6 排序
- \`top\` 按 \`P\` 键按 CPU 排序
- \`vmstat\` 的 \`us\` 字段表示用户空间 CPU 使用率`,

  log: `**查找并删除旧日志文件：**

\`\`\`bash
# 查找 30 天前的 .log 文件（仅列出）
find /var/log -name "*.log" -mtime +30 -type f

# 删除 30 天前的日志文件
find /var/log -name "*.log" -mtime +30 -type f -delete

# 先预览，确认无误后删除
find /var/log -name "*.log" -mtime +30 -type f -ls

# 使用 xargs 删除（适合大量文件）
find /var/log -name "*.log" -mtime +30 -print0 | xargs -0 rm -f
\`\`\`

> ⚠️ 删除前建议用 \`-ls\` 或 \`-print\` 参数预览文件列表`,

  default: `**SIPA Shell AI 助手**

我可以帮助你：
- 理解命令输出和错误信息
- 生成 Shell 命令和脚本
- 排查服务器问题
- 解释 Linux/Unix 命令

请描述你遇到的问题或需要执行的操作，我会给出具体的命令和说明。

**快速提示：**
\`\`\`bash
# 查看系统信息
uname -a && cat /etc/os-release

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看进程
ps aux | grep <进程名>
\`\`\``,
};

export default function AiPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `**你好！我是 SIPA Shell AI 助手** 🤖

我专门帮助 SSH 用户处理命令行问题。你可以问我：
- Linux/Unix 命令的使用方法
- 服务器配置和排错
- Shell 脚本编写
- 服务管理（systemctl、nginx、docker 等）

直接输入你的问题，或点击下方的常用问题快速开始。`,
    timestamp: new Date(),
  }]);
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
            messages: newMessages.filter(m => m.role !== 'system').map(m => ({
              role: m.role,
              content: m.content,
            })),
            system: '你是 SIPA Shell 的 AI 命令助手，专注于 Linux/Unix 系统管理、SSH、Shell 脚本。回复简洁、有实操价值，代码放在代码块中。',
          }),
        });
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            response += decoder.decode(value);
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { ...updated[updated.length - 1], content: response };
              return updated;
            });
          }
        }
      } else {
        // Mock fallback
        const lower = userText.toLowerCase();
        if (lower.includes('cpu') || lower.includes('使用率')) {
          response = MOCK_RESPONSES.cpu;
        } else if (lower.includes('日志') || lower.includes('log') || lower.includes('删除')) {
          response = MOCK_RESPONSES.log;
        } else {
          response = MOCK_RESPONSES.default;
        }

        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);
        for (let i = 0; i <= response.length; i += 8) {
          await new Promise(r => setTimeout(r, 15));
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: response.slice(0, i) };
            return updated;
          });
        }
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: response };
          return updated;
        });
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，AI 服务暂时不可用。请检查设置页面中的 API URL 配置，或稍后再试。',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([{
      role: 'assistant',
      content: '对话历史已清除。有什么可以帮你的？',
      timestamp: new Date(),
    }]);
  };

  return (
    <AppLayout title="AI 命令助手">
      <div className="flex flex-col h-[calc(100vh-3rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/30 shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-accent-foreground glow-purple-sm" />
            <span className="font-mono-terminal text-sm text-accent-foreground">AI 命令助手</span>
            <span className="font-mono-terminal text-xs text-muted-foreground">// SSH & Linux 专家</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-mono-terminal text-muted-foreground hover:text-primary gap-1"
            onClick={clearHistory}
          >
            <Trash2 size={12} />
            清除
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="shrink-0 mt-1">
                  <div className="w-7 h-7 flex items-center justify-center glass-panel-purple border border-accent-foreground/20 glow-purple-sm">
                    <Bot size={14} className="text-accent-foreground" />
                  </div>
                </div>
              )}
              <div className={cn(
                'max-w-[80%] md:max-w-[70%] px-4 py-3 font-mono-terminal text-sm leading-relaxed whitespace-pre-wrap break-words',
                msg.role === 'user'
                  ? 'bg-primary/10 border border-primary/20 text-primary'
                  : 'glass-panel-purple border border-accent-foreground/10 text-foreground'
              )}>
                {msg.content}
                {loading && i === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
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
              <span className="font-mono-terminal text-xs text-muted-foreground">常用问题</span>
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
              placeholder="输入 Linux 命令或系统管理问题..."
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
            Enter 发送 · 在终端页面可使用 Ctrl+Shift+A 快速呼出
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
