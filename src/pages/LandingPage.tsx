import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal, Bot, Shield, Zap, ArrowRight, Wifi, Search,
  Settings, HelpCircle, CreditCard, MessageSquare, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLang } from '@/contexts/LangContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const TYPING_LINES = [
  '$ ssh sipa@172.27.22.217 -p 22',
  'Connected to sipa-os-server...',
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

  const currentLine =
    currentLineIdx < TYPING_LINES.length
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

type FeatureKey = 'landing.feat1_title' | 'landing.feat2_title' | 'landing.feat3_title';
type FeatureDescKey = 'landing.feat1_desc' | 'landing.feat2_desc' | 'landing.feat3_desc';

const featuresDef = [
  {
    icon: Terminal,
    titleKey: 'landing.feat1_title' as FeatureKey,
    descKey: 'landing.feat1_desc' as FeatureDescKey,
    color: 'text-primary',
    borderColor: 'border-primary/30',
    glowClass: 'glow-green-sm',
    href: '/shell',
  },
  {
    icon: Bot,
    titleKey: 'landing.feat2_title' as FeatureKey,
    descKey: 'landing.feat2_desc' as FeatureDescKey,
    color: 'text-accent-foreground',
    borderColor: 'border-accent-foreground/30',
    glowClass: 'glow-purple-sm',
    href: '/ai',
  },
  {
    icon: Shield,
    titleKey: 'landing.feat3_title' as FeatureKey,
    descKey: 'landing.feat3_desc' as FeatureDescKey,
    color: 'text-info',
    borderColor: 'border-info/30',
    glowClass: '',
    href: '/connect',
  },
];

function Footer() {
  const { t, lang, toggle } = useLang();
  return (
    <footer className="border-t border-border px-4 md:px-8 py-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          <span className="font-mono-terminal text-xs text-muted-foreground">
            SIPA Shell {t('footer.copy')}
          </span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {[
            { to: '/terms', key: 'footer.terms' as const },
            { to: '/policy', key: 'footer.policy' as const },
            { to: '/faq', key: 'footer.faq' as const },
            { to: '/support', key: 'footer.support' as const },
          ].map(({ to, key }) => (
            <Link
              key={to}
              to={to}
              className="font-mono-terminal text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {t(key)}
            </Link>
          ))}
          <button
            onClick={toggle}
            className="font-mono text-xs px-2 py-0.5 border border-border rounded hover:border-primary hover:text-primary text-muted-foreground"
          >
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
        </nav>
      </div>
    </footer>
  );
}

export { Footer };

export default function LandingPage() {
  const { t, lang, toggle } = useLang();
  const { canInstall, install } = usePWAInstall();

  const quickNavTranslated = [
    { to: '/shell', icon: Terminal, label: t('nav.terminal') },
    { to: '/ai', icon: Bot, label: t('nav.ai') },
    { to: '/connect', icon: Wifi, label: t('nav.connect') },
    { to: '/find-device', icon: Search, label: t('nav.find_device') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
    { to: '/support', icon: HelpCircle, label: t('nav.support') },
    { to: '/subscription', icon: CreditCard, label: t('nav.subscription') },
    { to: '/faq', icon: MessageSquare, label: t('nav.faq') },
  ];

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
          {quickNavTranslated.slice(0, 6).map(({ to, label }) => (
            <Link key={to} to={to}>
              <Button
                variant="ghost"
                size="sm"
                className="font-mono-terminal text-xs text-muted-foreground hover:text-primary h-7 px-3"
              >
                {label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="font-mono text-xs px-2 py-1 border border-border rounded hover:border-primary hover:text-primary text-muted-foreground"
          >
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
          <a href="/login">
            <Button
              variant="ghost"
              size="sm"
              className="font-mono-terminal text-xs border border-border text-muted-foreground hover:text-primary hover:border-primary/40 h-7 px-3"
            >
              {lang === 'ru' ? 'Войти' : 'Log in'}
            </Button>
          </a>
          <Link to="/shell">
            <Button
              size="sm"
              className="font-mono-terminal text-xs bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm h-7 px-4"
            >
              {t('landing.launch')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 border border-primary/30 bg-primary/5 font-mono-terminal text-xs text-primary">
          <span className="status-pulse inline-block w-2 h-2 rounded-full bg-primary" />
          WEB SSH TERMINAL // v1.0.0
        </div>

        <h1 className="text-3xl md:text-5xl font-bold font-mono-terminal mb-4 leading-tight text-balance">
          <span className="gradient-text">SIPA Shell</span>
          <br />
          <span className="text-foreground/80 text-xl md:text-2xl font-normal">
            {t('landing.tagline')}
          </span>
        </h1>

        <p className="text-muted-foreground max-w-xl mb-8 text-sm md:text-base text-pretty">
          {t('landing.hero_sub')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-16">
          <Link to="/shell">
            <Button className="font-mono-terminal bg-primary text-primary-foreground hover:bg-primary/90 glow-green px-8 h-11 text-sm gap-2">
              <Terminal size={16} />
              {t('landing.launch')}
              <ArrowRight size={14} />
            </Button>
          </Link>
          <Link to="/find-device">
            <Button
              variant="ghost"
              className="font-mono-terminal border border-border text-muted-foreground hover:text-primary hover:border-primary/40 px-8 h-11 text-sm gap-2"
            >
              <Search size={16} />
              {t('landing.find_devices')}
            </Button>
          </Link>
          <Link to="/ai">
            <Button
              variant="ghost"
              className="font-mono-terminal border border-border text-muted-foreground hover:text-primary hover:border-primary/40 px-8 h-11 text-sm gap-2"
            >
              <Bot size={16} />
              {t('landing.ai_assistant')}
            </Button>
          </Link>
          {canInstall && (
            <Button
              onClick={install}
              variant="ghost"
              className="font-mono-terminal border border-primary/40 text-primary hover:bg-primary/10 px-8 h-11 text-sm gap-2 glow-green-sm"
            >
              <Download size={16} />
              {lang === 'ru' ? 'Установить приложение' : 'Install App'}
            </Button>
          )}
        </div>

        {/* Terminal preview */}
        <div className="w-full max-w-2xl glass-panel scanlines overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50">
            <span className="w-3 h-3 rounded-full bg-destructive/70" />
            <span className="w-3 h-3 rounded-full bg-warning/70" />
            <span className="w-3 h-3 rounded-full bg-success/70" />
            <span className="ml-4 font-mono-terminal text-xs text-muted-foreground">
              sipa-shell — bash
            </span>
          </div>
          <div className="p-4 min-h-48 bg-black/60">
            <TypingEffect />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 md:px-8 py-16 max-w-5xl mx-auto w-full">
        <h2 className="font-mono-terminal text-lg text-primary text-center mb-2 text-glow-green">
          // Core Features
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-10">
          Enterprise-grade web SSH built for developers and sysadmins
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuresDef.map(({ icon: Icon, titleKey, descKey, color, borderColor, glowClass, href }) => (
            <Link key={href} to={href} className="group">
              <div
                className={`glass-panel p-6 border ${borderColor} flex flex-col gap-3 h-full hover:border-opacity-60 transition-colors`}
              >
                <div className={`${glowClass} inline-flex`}>
                  <Icon size={24} className={color} />
                </div>
                <h3 className={`font-mono-terminal font-semibold text-sm ${color}`}>{t(titleKey)}</h3>
                <p className="text-muted-foreground text-sm text-pretty flex-1">{t(descKey)}</p>
                <div className={`flex items-center gap-1 font-mono-terminal text-xs ${color} opacity-70 group-hover:opacity-100 transition-opacity`}>
                  Open <ArrowRight size={11} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick nav grid */}
      <section className="px-4 md:px-8 py-16 max-w-5xl mx-auto w-full">
        <h2 className="font-mono-terminal text-lg text-primary text-center mb-2 text-glow-green">
          // Quick Navigation
        </h2>
        <p className="text-center text-muted-foreground text-sm mb-10">
          All modules at a glance
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickNavTranslated.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="group">
              <div className="glass-panel p-4 border border-transparent hover:border-primary/40 transition-colors flex items-center gap-3 h-full">
                <Icon
                  size={18}
                  className="text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                />
                <span className="font-mono-terminal text-sm text-muted-foreground group-hover:text-primary transition-colors">
                  {label}
                </span>
                <ArrowRight
                  size={12}
                  className="ml-auto text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Your server section */}
      <section className="px-4 md:px-8 py-16 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-mono-terminal text-lg text-primary mb-2 text-glow-green">
            // {lang === 'ru' ? 'Ваш сервер. Ваш шелл.' : 'Your server. Your shell.'}
          </h2>
          <p className="text-muted-foreground text-sm mb-10 max-w-xl mx-auto">
            {lang === 'ru'
              ? 'Войдите и подключите свой сервер за 30 секунд. Мы создаём изолированный bash-сеанс под ваш аккаунт — никакого доступа к чужим данным.'
              : 'Log in and connect your own server in 30 seconds. We create an isolated bash session under your account — no access to anyone else\'s data.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              {
                step: '01',
                title: lang === 'ru' ? 'Войдите' : 'Log in',
                desc: lang === 'ru' ? 'Auth0 — Google, GitHub или email. Ваш аккаунт, ваши данные.' : 'Auth0 — Google, GitHub or email. Your account, your data.',
              },
              {
                step: '02',
                title: lang === 'ru' ? 'Подключите сервер' : 'Connect your server',
                desc: lang === 'ru' ? 'Введите host, порт, логин и пароль. SSH-ключ генерируется автоматически.' : 'Enter host, port, username and password. SSH key is generated automatically.',
              },
              {
                step: '03',
                title: lang === 'ru' ? 'Работайте' : 'Work',
                desc: lang === 'ru' ? 'Полноценный bash в браузере. С любого устройства. Сохранённые подключения.' : 'Full bash in the browser. From any device. Saved connections.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="glass-panel p-6 border border-primary/20 text-left">
                <div className="font-mono-terminal text-3xl text-primary/30 font-bold mb-3">{step}</div>
                <h3 className="font-mono-terminal text-sm text-primary font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <Link to="/connect">
            <Button className="font-mono-terminal bg-primary text-primary-foreground hover:bg-primary/90 glow-green px-8 h-11 text-sm gap-2">
              <Wifi size={16} />
              {lang === 'ru' ? 'Подключить мой сервер' : 'Connect my server'}
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Support section */}
      <section className="px-4 md:px-8 py-16 border-t border-border bg-card/20">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-info/30 bg-info/5 font-mono-terminal text-xs text-info mb-4">
                <Shield size={12} />
                {lang === 'ru' ? 'ПРЯМАЯ ПОДДЕРЖКА' : 'DIRECT SUPPORT'}
              </div>
              <h2 className="font-mono-terminal text-xl font-bold text-foreground mb-3">
                {lang === 'ru' ? 'Мы подключимся к вашему серверу' : 'We connect to your server'}
              </h2>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                {lang === 'ru'
                  ? 'Создайте сессию поддержки — получите одноразовый код. Передайте его нашей команде. Мы подключимся к вашему серверу напрямую через SIPA Shell и решим проблему в реальном времени.'
                  : 'Create a support session and get a one-time code. Share it with our team. We connect directly to your server via SIPA Shell and fix the issue in real time.'}
              </p>
              <div className="flex flex-col gap-2 font-mono-terminal text-xs text-muted-foreground mb-6">
                {(lang === 'ru'
                  ? ['✓ Вы контролируете доступ', '✓ Сессия закрывается по вашей команде', '✓ Лог всех действий доступен вам']
                  : ['✓ You control the access', '✓ Session closes on your command', '✓ Full action log available to you']
                ).map(line => <span key={line}>{line}</span>)}
              </div>
              <div className="flex gap-3">
                <Link to="/connect?mode=support">
                  <Button className="font-mono-terminal bg-info text-white hover:bg-info/90 px-6 h-10 text-xs gap-2">
                    <MessageSquare size={14} />
                    {lang === 'ru' ? 'Запросить поддержку' : 'Request support'}
                  </Button>
                </Link>
                <a href="https://t.me/messycketch" target="_blank" rel="noreferrer">
                  <Button variant="ghost" className="font-mono-terminal border border-border text-muted-foreground hover:text-primary hover:border-primary/40 px-6 h-10 text-xs gap-2">
                    <MessageSquare size={14} />
                    Telegram
                  </Button>
                </a>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="glass-panel border border-info/20 p-4 font-mono-terminal text-xs">
                <div className="flex items-center gap-2 mb-3 text-info">
                  <span className="status-pulse inline-block w-2 h-2 rounded-full bg-info" />
                  {lang === 'ru' ? 'Сессия поддержки' : 'Support session'}
                </div>
                <div className="space-y-1 text-muted-foreground">
                  <div><span className="text-info">$</span> {lang === 'ru' ? '# Клиент создаёт сессию' : '# Client creates session'}</div>
                  <div><span className="text-primary">→</span> {lang === 'ru' ? 'Код: SIPA-2847-XK91' : 'Code: SIPA-2847-XK91'}</div>
                  <div className="mt-2"><span className="text-info">$</span> {lang === 'ru' ? '# SIPA подключается' : '# SIPA connects'}</div>
                  <div><span className="text-primary">→</span> ssh client@host -p 22</div>
                  <div><span className="text-success">✓</span> {lang === 'ru' ? 'Подключено. Помогаем.' : 'Connected. Fixing.'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="px-4 md:px-8 py-16 bg-card/30 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-mono-terminal text-lg text-primary text-center mb-10 text-glow-green">
            // System Architecture
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-0 font-mono-terminal text-sm">
            {[
              { label: 'Browser', sub: 'xterm.js + WebSocket', color: 'text-primary' },
              { label: '──WSS──>', sub: 'wss://ws.soulinpsy.info', color: 'text-muted-foreground' },
              { label: 'WS Proxy', sub: 'ws-pty-proxy :2228', color: 'text-primary' },
              { label: '──SSH──>', sub: 'ssh2 library', color: 'text-muted-foreground' },
              { label: 'SSH Server', sub: 'sipa@172.27.22.217', color: 'text-primary' },
            ].map((item, i) =>
              i % 2 === 0 ? (
                <div
                  key={i}
                  className="glass-panel px-4 py-3 border border-border text-center min-w-28"
                >
                  <div className={item.color}>{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.sub}</div>
                </div>
              ) : (
                <div
                  key={i}
                  className="text-muted-foreground text-xs text-center px-2 py-1"
                >
                  <div>{item.label}</div>
                  <div className="opacity-60">{item.sub}</div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
