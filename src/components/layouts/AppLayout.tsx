import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Terminal, Bot, Wifi, Search, Settings, HelpCircle,
  CreditCard, MessageSquare, Menu, X, Zap, LogOut, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useLang } from '@/contexts/LangContext';

type NavItemKey = 'nav.terminal' | 'nav.ai' | 'nav.connect' | 'nav.find_device' | 'nav.settings' | 'nav.support' | 'nav.subscription' | 'nav.faq';

const navItems: { path: string; key: NavItemKey; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { path: '/shell', key: 'nav.terminal', icon: Terminal },
  { path: '/ai', key: 'nav.ai', icon: Bot },
  { path: '/connect', key: 'nav.connect', icon: Wifi },
  { path: '/find-device', key: 'nav.find_device', icon: Search },
  { path: '/settings', key: 'nav.settings', icon: Settings },
  { path: '/support', key: 'nav.support', icon: HelpCircle },
  { path: '/subscription', key: 'nav.subscription', icon: CreditCard },
  { path: '/faq', key: 'nav.faq', icon: MessageSquare },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const location = useLocation();
  const { t } = useLang();
  return (
    <>
      {navItems.map(({ path, key, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm font-mono-terminal transition-colors border',
              active
                ? 'border-primary text-primary glow-green-sm bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/40'
            )}
          >
            <Icon size={15} />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, toggle } = useLang();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-sidebar">
        <div className="px-4 py-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            <span className="font-mono-terminal font-bold text-primary text-glow-green text-sm">
              SIPA<span className="text-muted-foreground">_</span>SHELL
            </span>
          </Link>
        </div>
        <nav className="flex-1 px-2 py-4 flex flex-col gap-1 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="px-4 py-3 border-t border-border flex flex-col gap-2">
          <a
            href="https://community.sipa-os.org"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs font-mono-terminal text-muted-foreground hover:text-primary transition-colors"
          >
            <Users size={12} />
            <span>community.sipa-os.org</span>
          </a>
          <p className="text-xs font-mono-terminal text-muted-foreground">v1.0.0 // dark</p>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center h-12 px-4 border-b border-border bg-card shrink-0 gap-3">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground hover:text-primary h-8 w-8"
              >
                <Menu size={16} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-56 p-0 bg-sidebar border-border"
            >
              <div className="px-4 py-4 border-b border-border flex items-center justify-between">
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Zap size={16} className="text-primary" />
                  <span className="font-mono-terminal font-bold text-primary text-sm">SIPA_SHELL</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => setMobileOpen(false)}
                >
                  <X size={14} />
                </Button>
              </div>
              <nav className="px-2 py-4 flex flex-col gap-1 overflow-y-auto">
                <NavLinks onClick={() => setMobileOpen(false)} />
              </nav>
              <div className="px-4 py-3 border-t border-border">
                <a
                  href="https://community.sipa-os.org"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs font-mono-terminal text-muted-foreground hover:text-primary transition-colors"
                >
                  <Users size={12} />
                  <span>community.sipa-os.org</span>
                </a>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-sm font-mono-terminal text-primary truncate">
                {'>>'} {title}
              </h1>
            )}
          </div>

          <button
            onClick={toggle}
            className="font-mono text-xs px-2 py-1 border border-border rounded hover:border-primary hover:text-primary text-muted-foreground shrink-0"
          >
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>

          <a href="/logout" title={lang === 'ru' ? 'Выйти' : 'Log out'} className="shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <LogOut size={14} />
            </Button>
          </a>

          <Link to="/" className="lg:hidden flex items-center gap-1">
            <Zap size={14} className="text-primary" />
            <span className="font-mono-terminal text-xs text-primary">SIPA</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
