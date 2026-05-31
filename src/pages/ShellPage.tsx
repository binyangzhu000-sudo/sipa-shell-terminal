import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { toast } from 'sonner';
import {
  Terminal, Wifi, WifiOff, RefreshCw, Trash2, Copy, Download,
  Bot, X, Send, ChevronDown, Loader2, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/components/layouts/AppLayout';
import { cn } from '@/lib/utils';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

type ConnStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

const XTERM_THEME = {
  background: '#000000',
  foreground: '#00ff41',
  cursor: '#00ff41',
  cursorAccent: '#000000',
  selectionBackground: 'rgba(0,255,65,0.3)',
  black: '#000000',
  red: '#ff5555',
  green: '#00ff41',
  yellow: '#ffff55',
  blue: '#5555ff',
  magenta: '#9D4EDD',
  cyan: '#55ffff',
  white: '#bbbbbb',
  brightBlack: '#555555',
  brightRed: '#ff7777',
  brightGreen: '#55ff77',
  brightYellow: '#ffff77',
  brightBlue: '#7777ff',
  brightMagenta: '#c77dff',
  brightCyan: '#77ffff',
  brightWhite: '#ffffff',
};

export default function ShellPage() {
  const termDivRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termLinesRef = useRef<string[]>([]);
  const currentLineRef = useRef('');

  const [status, setStatus] = useState<ConnStatus>('disconnected');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [authType, setAuthType] = useState<'password' | 'key'>('password');
  const [password, setPassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConnForm, setShowConnForm] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize xterm
  useEffect(() => {
    if (!termDivRef.current) return;
    const term = new XTerm({
      theme: XTERM_THEME,
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      convertEol: true,
      allowProposedApi: true,
    });
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(termDivRef.current);
    fitAddon.fit();
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Track terminal lines for AI context
    term.onData((data) => {
      if (data === '\r' || data === '\n') {
        if (currentLineRef.current.trim()) {
          termLinesRef.current.push(currentLineRef.current);
          if (termLinesRef.current.length > 200) termLinesRef.current.shift();
        }
        currentLineRef.current = '';
      } else if (data === '\x7f') {
        currentLineRef.current = currentLineRef.current.slice(0, -1);
      } else {
        currentLineRef.current += data;
      }
    });

    // Write to WebSocket
    term.onData((data) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'data', data }));
      }
    });

    // Resize observer
    const ro = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch {}
    });
    ro.observe(termDivRef.current);

    // Keyboard shortcut Ctrl+Shift+A to toggle AI panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAiOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    term.writeln('\x1b[32m SIPA Shell Terminal\x1b[0m');
    term.writeln('\x1b[2m ─────────────────────────────────────────\x1b[0m');
    term.writeln('\x1b[32m 填写连接信息后点击"连接"按钮开始 SSH 会话。\x1b[0m');
    term.writeln('\x1b[2m 提示: Ctrl+Shift+A 切换 AI 助手面板\x1b[0m');
    term.writeln('');

    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      term.dispose();
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
    setShowConnForm(true);
  }, []);

  const connect = useCallback(() => {
    if (!host || !username) {
      toast.error('请填写主机地址和用户名');
      return;
    }
    const saved = JSON.parse(localStorage.getItem('sipa_shell_settings') || '{}');
    const proxyUrl = saved.wsProxy || import.meta.env.VITE_WS_PROXY || 'wss://ws.soulinpsy.info';
    setStatus('connecting');
    const ws = new WebSocket(proxyUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send auth
      ws.send(JSON.stringify({
        type: 'auth',
        host,
        port: parseInt(port) || 22,
        username,
        ...(authType === 'password' ? { password } : { privateKey }),
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'connected') {
          setStatus('connected');
          setShowConnForm(false);
          toast.success(`已连接至 ${username}@${host}`);
          xtermRef.current?.writeln('\x1b[32m[已连接]\x1b[0m');
          if (fitAddonRef.current) fitAddonRef.current.fit();
        } else if (msg.type === 'data') {
          xtermRef.current?.write(msg.data);
          // Track lines for AI
          const lines = msg.data.split(/\r?\n/);
          lines.forEach((line: string) => {
            if (line.trim()) {
              termLinesRef.current.push(line);
              if (termLinesRef.current.length > 200) termLinesRef.current.shift();
            }
          });
        } else if (msg.type === 'error') {
          setStatus('error');
          xtermRef.current?.writeln(`\x1b[31m[错误] ${msg.message}\x1b[0m`);
          toast.error(msg.message || '连接出错');
          setShowConnForm(true);
        } else if (msg.type === 'close') {
          setStatus('disconnected');
          xtermRef.current?.writeln('\x1b[33m[连接已断开]\x1b[0m');
          setShowConnForm(true);
        }
      } catch {
        // Binary data
        xtermRef.current?.write(event.data);
      }
    };

    ws.onerror = () => {
      setStatus('error');
      xtermRef.current?.writeln('\x1b[31m[WebSocket 错误] 无法连接到代理服务器\x1b[0m');
      xtermRef.current?.writeln('\x1b[2m 请检查设置页面的代理 URL 配置\x1b[0m');
      toast.error('无法连接到 WebSocket 代理');
      setShowConnForm(true);
    };

    ws.onclose = () => {
      if (status === 'connected') {
        setStatus('disconnected');
        xtermRef.current?.writeln('\x1b[33m[连接已关闭]\x1b[0m');
        setShowConnForm(true);
      }
    };
  }, [host, port, username, authType, password, privateKey, status]);

  const handleClear = () => {
    xtermRef.current?.clear();
  };

  const handleCopy = () => {
    const selection = xtermRef.current?.getSelection();
    if (selection) {
      navigator.clipboard.writeText(selection);
      toast.success('已复制选中内容');
    } else {
      toast.info('请先在终端中选择文本');
    }
  };

  const handleDownloadLog = () => {
    const lines = termLinesRef.current;
    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sipa-shell-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('日志已下载');
  };

  // AI assistant
  const getTerminalContext = () => {
    const last20 = termLinesRef.current.slice(-20).join('\n');
    return last20;
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    setAiInput('');
    const context = getTerminalContext();
    const newMessages: AiMessage[] = [
      ...aiMessages,
      { role: 'user' as const, content: userMsg },
    ];
    setAiMessages(newMessages);
    setAiLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const systemPrompt = `你是 SIPA Shell 的 AI 命令助手。用户正在使用 SSH 终端。当前终端上下文（最近20行）：\n\n${context || '(终端暂无输出)'}\n\n请帮助用户理解命令输出、排查问题或生成有用的命令。回复简洁、技术性强。`;

      let assistantContent = '';
      setAiMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (apiUrl) {
        // Use external API
        const response = await fetch(`${apiUrl}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, system: systemPrompt }),
        });
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            assistantContent += chunk;
            setAiMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
              return updated;
            });
          }
        }
      } else {
        // Fallback: simple mock responses for preview
        const mockResponses: Record<string, string> = {
          default: `根据终端上下文，我分析如下：\n\n${context ? `**当前上下文摘要：**\n\`\`\`\n${context.slice(0, 200)}\n\`\`\`\n\n` : ''}**建议：**\n- 使用 \`man <命令>\` 查看命令手册\n- 使用 \`journalctl -xe\` 查看系统日志\n- 使用 \`systemctl status <服务>\` 检查服务状态`,
        };
        const lowerInput = userMsg.toLowerCase();
        let response = mockResponses.default;
        if (lowerInput.includes('ls') || lowerInput.includes('文件')) {
          response = '**文件列表命令：**\n\n```bash\nls -la          # 详细列表含隐藏文件\nls -lh          # 人类可读的文件大小\nfind . -name "*.log"  # 查找日志文件\ntree -L 2       # 树形显示目录结构\n```';
        } else if (lowerInput.includes('ssh')) {
          response = '**SSH 相关命令：**\n\n```bash\n# 生成 SSH 密钥对\nssh-keygen -t ed25519 -C "your@email.com"\n\n# 复制公钥到服务器\nssh-copy-id user@host\n\n# 使用特定密钥连接\nssh -i ~/.ssh/id_ed25519 user@host -p 22\n```';
        } else if (lowerInput.includes('服务') || lowerInput.includes('service')) {
          response = '**服务管理命令：**\n\n```bash\nsystemctl status <服务>    # 查看状态\nsystemctl start <服务>     # 启动\nsystemctl stop <服务>      # 停止\nsystemctl restart <服务>   # 重启\njournalctl -u <服务> -f    # 实时日志\n```';
        }

        // Simulate streaming
        for (let i = 0; i < response.length; i += 5) {
          await new Promise(r => setTimeout(r, 20));
          assistantContent = response.slice(0, i + 5);
          setAiMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
            return updated;
          });
        }
        setAiMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: response };
          return updated;
        });
      }
    } catch {
      setAiMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: '抱歉，AI 服务暂时不可用。请检查 API 配置。' };
        return updated;
      });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const statusInfo: Record<ConnStatus, { label: string; color: string; icon: React.ReactNode }> = {
    disconnected: { label: '未连接', color: 'text-muted-foreground', icon: <WifiOff size={12} /> },
    connecting: { label: '连接中...', color: 'text-warning', icon: <Loader2 size={12} className="animate-spin" /> },
    connected: { label: '已连接', color: 'text-primary status-pulse', icon: <Wifi size={12} /> },
    error: { label: '连接错误', color: 'text-destructive', icon: <WifiOff size={12} /> },
  };
  const si = statusInfo[status];

  return (
    <AppLayout title="SSH 终端">
      <div className="flex flex-col h-[calc(100vh-3rem)]">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-border bg-card/50 shrink-0">
          <div className={cn('flex items-center gap-1.5 font-mono-terminal text-xs', si.color)}>
            {si.icon}
            <span>{si.label}</span>
            {status === 'connected' && (
              <span className="text-muted-foreground ml-2">{username}@{host}:{port}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {status === 'connected' && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={disconnect} title="断开连接">
                <WifiOff size={12} />
              </Button>
            )}
            {status !== 'connecting' && status !== 'connected' && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => setShowConnForm(true)} title="重新连接">
                <RefreshCw size={12} />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleClear} title="清屏">
              <Trash2 size={12} />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleCopy} title="复制选中">
              <Copy size={12} />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleDownloadLog} title="下载日志">
              <Download size={12} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-6 w-6 transition-colors', aiOpen ? 'text-accent-foreground glow-purple-sm' : 'text-muted-foreground hover:text-accent-foreground')}
              onClick={() => setAiOpen(o => !o)}
              title="AI 助手 (Ctrl+Shift+A)"
            >
              <Bot size={12} />
            </Button>
          </div>
        </div>

        {/* Main split area */}
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Terminal panel */}
            <ResizablePanel defaultSize={aiOpen ? 70 : 100} minSize={40}>
              <div className="relative h-full flex flex-col">
                {/* Connection form overlay */}
                {showConnForm && (
                  <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-panel border border-border w-full max-w-sm p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <Terminal size={16} className="text-primary" />
                        <h2 className="font-mono-terminal text-sm text-primary">SSH 连接</h2>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">主机地址</Label>
                            <Input
                              value={host}
                              onChange={e => setHost(e.target.value)}
                              placeholder="example.com"
                              className="font-mono-terminal text-sm h-8 bg-input border-border focus:border-primary text-foreground"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">端口</Label>
                            <Input
                              value={port}
                              onChange={e => setPort(e.target.value)}
                              placeholder="22"
                              className="font-mono-terminal text-sm h-8 bg-input border-border focus:border-primary text-foreground"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">用户名</Label>
                          <Input
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="username"
                            className="font-mono-terminal text-sm h-8 bg-input border-border focus:border-primary text-foreground"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn('flex-1 h-7 text-xs font-mono-terminal border', authType === 'password' ? 'border-primary text-primary' : 'border-border text-muted-foreground')}
                            onClick={() => setAuthType('password')}
                          >
                            密码
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn('flex-1 h-7 text-xs font-mono-terminal border', authType === 'key' ? 'border-primary text-primary' : 'border-border text-muted-foreground')}
                            onClick={() => setAuthType('key')}
                          >
                            私钥
                          </Button>
                        </div>
                        {authType === 'password' ? (
                          <div>
                            <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">密码</Label>
                            <div className="relative">
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="font-mono-terminal text-sm h-8 bg-input border-border focus:border-primary text-foreground pr-8"
                                onKeyDown={e => e.key === 'Enter' && connect()}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => setShowPassword(s => !s)}
                              >
                                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">私钥内容</Label>
                            <Textarea
                              value={privateKey}
                              onChange={e => setPrivateKey(e.target.value)}
                              placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                              className="font-mono-terminal text-xs bg-input border-border focus:border-primary text-foreground min-h-24 resize-none"
                            />
                          </div>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button
                            className="flex-1 h-8 font-mono-terminal text-sm bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm"
                            onClick={connect}
                            disabled={status === 'connecting'}
                          >
                            {status === 'connecting' ? (
                              <><Loader2 size={12} className="animate-spin mr-2" />连接中</>
                            ) : '连接'}
                          </Button>
                          {status !== 'disconnected' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 border border-border text-muted-foreground hover:text-primary"
                              onClick={() => setShowConnForm(false)}
                            >
                              <ChevronDown size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* xterm container */}
                <div
                  ref={termDivRef}
                  className="flex-1 min-h-0 scanlines bg-black p-2"
                  style={{ overflow: 'hidden' }}
                />
              </div>
            </ResizablePanel>

            {/* AI panel */}
            {aiOpen && (
              <>
                <ResizableHandle className="bg-border hover:bg-primary/30 transition-colors w-1" />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <div className="h-full flex flex-col glass-panel-purple border-l border-accent-foreground/10">
                    {/* AI Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-accent-foreground/10">
                      <div className="flex items-center gap-2">
                        <Bot size={14} className="text-accent-foreground glow-purple-sm" />
                        <span className="font-mono-terminal text-xs text-accent-foreground">AI 命令助手</span>
                        <Badge className="text-xs px-1.5 py-0 h-4 bg-accent text-accent-foreground font-mono-terminal border-0">BETA</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-accent-foreground"
                        onClick={() => setAiOpen(false)}
                      >
                        <X size={12} />
                      </Button>
                    </div>

                    {/* Context hint */}
                    <div className="px-3 py-2 border-b border-accent-foreground/10 bg-accent/20">
                      <p className="font-mono-terminal text-xs text-muted-foreground">
                        上下文：终端最近 {Math.min(termLinesRef.current.length, 20)} 行 · Ctrl+Shift+A 切换
                      </p>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
                      {aiMessages.length === 0 && (
                        <div className="text-center pt-8">
                          <Bot size={32} className="text-accent-foreground/30 mx-auto mb-3" />
                          <p className="font-mono-terminal text-xs text-muted-foreground">
                            提问任何 SSH / 命令行问题<br />AI 将结合终端上下文回答
                          </p>
                        </div>
                      )}
                      {aiMessages.map((msg, i) => (
                        <div key={i} className={cn('flex flex-col gap-1', msg.role === 'user' ? 'items-end' : 'items-start')}>
                          <span className="font-mono-terminal text-xs text-muted-foreground">
                            {msg.role === 'user' ? '你' : 'AI'}
                          </span>
                          <div className={cn(
                            'max-w-full rounded-sm px-3 py-2 font-mono-terminal text-xs leading-relaxed whitespace-pre-wrap break-words',
                            msg.role === 'user'
                              ? 'bg-primary/10 border border-primary/20 text-primary'
                              : 'bg-accent/30 border border-accent-foreground/10 text-accent-foreground'
                          )}>
                            {msg.content || (aiLoading && i === aiMessages.length - 1 ? (
                              <span className="cursor-blink inline-block w-2 h-3 bg-accent-foreground" />
                            ) : '')}
                          </div>
                        </div>
                      ))}
                      <div ref={aiMessagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="px-3 py-2 border-t border-accent-foreground/10">
                      <div className="flex gap-2">
                        <Input
                          value={aiInput}
                          onChange={e => setAiInput(e.target.value)}
                          placeholder="提问关于命令的问题..."
                          className="font-mono-terminal text-xs h-8 bg-input border-border focus:border-accent-foreground flex-1"
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAiMessage()}
                          disabled={aiLoading}
                        />
                        <Button
                          size="icon"
                          className="h-8 w-8 bg-accent-foreground/20 hover:bg-accent-foreground/30 glow-purple-sm text-accent-foreground border border-accent-foreground/20"
                          onClick={sendAiMessage}
                          disabled={aiLoading || !aiInput.trim()}
                        >
                          {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </AppLayout>
  );
}
