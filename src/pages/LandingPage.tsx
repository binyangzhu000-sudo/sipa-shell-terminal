import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Bot, Shield, Zap, ArrowRight, Wifi, Search, BookOpen, Settings, Github, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPING_LINES = [
  '$ ssh user@remote-server -p 22',
  'Connected to remote-server...',
  '$ ls -la /var/log/',
  '$ tail -f /var/log/syslog',
  '$ systemctl status nginx',
  '$ df -h',
  '$ htop',
];

function TypingEffect() {
  const [displayLines, setDisplayLines] = useState<string[]>([]);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (currentLineIdx >= TYPING_LINES.length) return;
    const line = TYPING_LINES[currentLineIdx];
    if (currentChar <= line.length) {
      const timeout = setTimeout(() => {
        if (currentChar === line.length) {
          setDisplayLines(prev => [...prev, line]);
          setTimeout(() => {
            setCurrentLineIdx(i => i + 1);
            setCurrentChar(0);
          }, 400);
        } else {
          setCurrentChar(c => c + 1);
        }
      }, currentChar === line.length ? 0 : 50);
      return () => clearTimeout(timeout);
    }
  }, [currentLineIdx, currentChar]);

  const currentLine = currentLineIdx < TYPING_LINES.length
    ? TYPING_LINES[currentLineIdx].slice(0, currentChar)
    : '';

  return (
    <div className="font-mono-terminal text-sm leading-relaxed">
      {displayLines.map((line, i) => (
        <div key={i} className={line.startsWith('$') ? 'text-primary' : 'text-muted-foreground'}>
          {line}
        </div>
      ))}
      {currentLineIdx < TYPING_LINES.length && (
        <div className={currentLine.startsWith('$') ? 'text-primary' : 'text-muted-foreground'}>
          {currentLine}
          <span className="cursor-blink inline-block w-2 h-4 bg-primary align-middle ml-0.5" />
        </div>
      )}
    </div>
  );
}

const features = [
  {
    icon: Terminal,
    title: '真实 SSH 终端',
    desc: '通过 xterm.js 驱动的浏览器终端，经由 WebSocket ↔ SSH 代理实现完整的终端体验。支持 ANSI 颜色、交互程序、键盘快捷键。',
    color: 'text-primary',
    borderColor: 'border-primary/30',
    glowClass: 'glow-green-sm',
  },
  {
    icon: Bot,
    title: 'AI 命令助手',
    desc: '集成 AI 助手，自动获取终端最近 20 行作为上下文，帮助你理解错误、生成命令、排查问题。支持流式回答。',
    color: 'text-accent-foreground',
    borderColor: 'border-accent-foreground/30',
    glowClass: 'glow-purple-sm',
  },
  {
    icon: Shield,
    title: 'Cloudflare 隧道',
    desc: '零暴露架构：通过 Cloudflare Tunnel 将本地代理安全发布到公网。无需公网 IP，无需开放端口，TLS 加密。',
    color: 'text-info',
    borderColor: 'border-info/30',
    glowClass: '',
  },
];

const navLinks = [
  { to: '/shell', icon: Terminal, label: '打开终端' },
  { to: '/ai', icon: Bot, label: 'AI 助手' },
  { to: '/connect', icon: Wifi, label: 'SSH 连接' },
  { to: '/find-device', icon: Search, label: '查找设备' },
  { to: '/settings', icon: Settings, label: '设置' },
  { to: '/docs', icon: BookOpen, label: '文档' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
      <header className="border-b border-border px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur z-50">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-primary" />
          <span className="font-mono-terminal font-bold text-primary text-glow-green text-base">
            SIPA<span className="text-muted-foreground">_</span>SHELL
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to}>
              <Button variant="ghost" size="sm" className="font-mono-terminal text-xs text-muted-foreground hover:text-primary h-7 px-3">
                {label}
              </Button>
            </Link>
          ))}
        </nav>
        <Link to="/shell">
          <Button size="sm" className="font-mono-terminal text-xs bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm h-7 px-4">
            启动终端
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 border border-primary/30 bg-primary/5 font-mono-terminal text-xs text-primary">
          <span className="status-pulse inline-block w-2 h-2 rounded-full bg-primary" />
          WEB SSH TERMINAL // v1.0.0
        </div>

        <h1 className="text-3xl md:text-5xl font-bold font-mono-terminal mb-4 leading-tight text-balance">
          <span className="gradient-text">SIPA Shell</span>
          <br />
          <span className="text-foreground/80 text-2xl md:text-3xl font-normal">浏览器里的真实 SSH 终端</span>
        </h1>

        <p className="text-muted-foreground max-w-xl mb-8 text-sm md:text-base text-pretty">
          通过 WebSocket 代理连接任意 SSH 服务器，内置 AI 命令助手，
          支持 Cloudflare Tunnel 零暴露发布。无需安装，打开浏览器即用。
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link to="/shell">
            <Button className="font-mono-terminal bg-primary text-primary-foreground hover:bg-primary/90 glow-green px-8 h-11 text-sm gap-2">
              <Terminal size={16} />
              启动终端
              <ArrowRight size={14} />
            </Button>
          </Link>
          <Link to="/docs">
            <Button variant="ghost" className="font-mono-terminal border border-border text-muted-foreground hover:text-primary hover:border-primary/40 px-8 h-11 text-sm gap-2">
              <BookOpen size={16} />
              查看文档
            </Button>
          </Link>
        </div>

        {/* Terminal preview */}
        <div className="w-full max-w-2xl glass-panel scanlines overflow-hidden">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50">
            <span className="w-3 h-3 rounded-full bg-destructive/70" />
            <span className="w-3 h-3 rounded-full bg-warning/70" />
            <span className="w-3 h-3 rounded-full bg-success/70" />
            <span className="ml-4 font-mono-terminal text-xs text-muted-foreground">sipa-shell — bash</span>
          </div>
          <div className="p-4 min-h-48 bg-black/60">
            <TypingEffect />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 md:px-8 py-16 max-w-5xl mx-auto w-full">
        <h2 className="font-mono-terminal text-lg text-primary text-center mb-2 text-glow-green">// 核心功能</h2>
        <p className="text-center text-muted-foreground text-sm mb-10">企业级 Web SSH 解决方案</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, color, borderColor, glowClass }) => (
            <div key={title} className={`glass-panel p-6 border ${borderColor} flex flex-col gap-3 h-full`}>
              <div className={`${glowClass} inline-flex`}>
                <Icon size={24} className={color} />
              </div>
              <h3 className={`font-mono-terminal font-semibold text-sm ${color}`}>{title}</h3>
              <p className="text-muted-foreground text-sm text-pretty flex-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick nav grid */}
      <section className="px-4 md:px-8 py-16 max-w-5xl mx-auto w-full">
        <h2 className="font-mono-terminal text-lg text-primary text-center mb-2 text-glow-green">// 快速导航</h2>
        <p className="text-center text-muted-foreground text-sm mb-10">所有功能模块一览</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="group">
              <div className="glass-panel p-4 border border-transparent hover:border-primary/40 transition-colors flex items-center gap-3 h-full">
                <Icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                <span className="font-mono-terminal text-sm text-muted-foreground group-hover:text-primary transition-colors">{label}</span>
                <ArrowRight size={12} className="ml-auto text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section className="px-4 md:px-8 py-16 bg-card/30 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono-terminal text-lg text-primary text-center mb-10 text-glow-green">// 系统架构</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0 font-mono-terminal text-sm">
            {[
              { label: '浏览器', sub: 'xterm.js + WebSocket', color: 'text-primary' },
              { label: '──WSS──>', sub: 'Cloudflare Tunnel', color: 'text-muted-foreground' },
              { label: 'WS 代理', sub: 'ws-ssh-proxy :2222', color: 'text-primary' },
              { label: '──SSH──>', sub: 'ssh2 库', color: 'text-muted-foreground' },
              { label: 'SSH 服务器', sub: '你的远程服务器', color: 'text-primary' },
            ].map((item, i) => (
              i % 2 === 0 ? (
                <div key={i} className="glass-panel px-4 py-3 border border-border text-center min-w-28">
                  <div className={item.color}>{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.sub}</div>
                </div>
              ) : (
                <div key={i} className="text-muted-foreground text-xs text-center px-2 py-1">
                  <div>{item.label}</div>
                  <div className="opacity-60">{item.sub}</div>
                </div>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          <span className="font-mono-terminal text-xs text-muted-foreground">SIPA_SHELL © 2024 // MIT License</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="flex items-center gap-1 font-mono-terminal text-xs text-muted-foreground hover:text-primary transition-colors">
            <Github size={12} />
            GitHub
          </a>
          <a href="#" className="flex items-center gap-1 font-mono-terminal text-xs text-muted-foreground hover:text-primary transition-colors">
            <Globe size={12} />
            Docs
          </a>
          <Link to="/docs" className="font-mono-terminal text-xs text-muted-foreground hover:text-primary transition-colors">
            文档
          </Link>
        </div>
      </footer>
    </div>
  );
}
