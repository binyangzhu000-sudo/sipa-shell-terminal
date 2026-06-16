import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Chrome, MoreVertical } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';

type Step = { icon: React.ReactNode; text: string };

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallBanner() {
  const { lang } = useLang();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    const dismissed = sessionStorage.getItem('pwa_banner_dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show manual instructions after 8s if no prompt fired (new Android/Samsung)
    const timer = setTimeout(() => {
      if (!deferredPrompt) setShowBanner(true);
    }, 8000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowManual(true);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('pwa_banner_dismissed', '1');
  };

  if (installed || !showBanner) return null;

  const ru = lang === 'ru';

  const manualSteps: Step[] = ru
    ? [
        { icon: <Chrome size={14} />, text: 'Откройте сайт в Chrome' },
        { icon: <MoreVertical size={14} />, text: 'Нажмите ⋮ (три точки) в правом верхнем углу' },
        { icon: <Smartphone size={14} />, text: 'Выберите «Добавить на главный экран»' },
        { icon: <Download size={14} />, text: 'Нажмите «Установить» или «Добавить»' },
      ]
    : [
        { icon: <Chrome size={14} />, text: 'Open the site in Chrome' },
        { icon: <MoreVertical size={14} />, text: 'Tap ⋮ (three dots) in top-right corner' },
        { icon: <Smartphone size={14} />, text: 'Select "Add to Home Screen"' },
        { icon: <Download size={14} />, text: 'Tap "Install" or "Add"' },
      ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="glass-panel border border-primary/30 bg-card/95 p-4 shadow-lg backdrop-blur-md">
        {!showManual ? (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10">
                <img src="/icon-192.png" alt="SIPA Shell" className="h-7 w-7 rounded" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono-terminal text-sm font-bold text-foreground">
                  {ru ? 'Установить SIPA Shell' : 'Install SIPA Shell'}
                </p>
                <p className="font-mono-terminal text-xs text-muted-foreground">
                  {ru
                    ? 'Работает офлайн, быстрее браузера'
                    : 'Works offline, faster than browser'}
                </p>
              </div>
              <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="flex flex-1 items-center justify-center gap-2 rounded border border-primary bg-primary/10 py-2 font-mono-terminal text-sm font-bold text-primary hover:bg-primary/20 glow-green-sm"
              >
                <Download size={14} />
                {deferredPrompt
                  ? (ru ? 'Установить' : 'Install')
                  : (ru ? 'Как установить?' : 'How to install?')}
              </button>
              <button
                onClick={dismiss}
                className="rounded border border-border px-3 py-2 font-mono-terminal text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                {ru ? 'Позже' : 'Later'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono-terminal text-sm font-bold text-primary">
                {ru ? '// Как установить на Android' : '// Install on Android'}
              </p>
              <button onClick={() => setShowManual(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <ol className="space-y-2">
              {manualSteps.map((step, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary/40 font-mono-terminal text-[10px] text-primary">
                    {i + 1}
                  </span>
                  <span className="font-mono-terminal text-xs text-foreground">{step.text}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 font-mono-terminal text-[10px] text-muted-foreground">
              {ru
                ? '* Если Chrome предложил баннер автоматически — просто нажмите «Установить»'
                : '* If Chrome showed an install banner — just tap "Install"'}
            </p>
            <button
              onClick={dismiss}
              className="mt-3 w-full rounded border border-border py-1.5 font-mono-terminal text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              {ru ? 'Понял, закрыть' : 'Got it, close'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
