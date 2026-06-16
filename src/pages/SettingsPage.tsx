import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Settings, Save, Wifi, Bot, Monitor, RefreshCw, Check, Eye, EyeOff, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/components/layouts/AppLayout';

interface AppSettings {
  wsProxy: string;
  apiUrl: string;
  fontSize: string;
  showScanlines: boolean;
  cfTunnelId: string;
  cfCredentials: string;
}

const DEFAULTS: AppSettings = {
  wsProxy: 'wss://ws.soulinpsy.info',
  apiUrl: '',
  fontSize: '14',
  showScanlines: true,
  cfTunnelId: '',
  cfCredentials: '',
};

const SETTINGS_KEY = 'sipa_shell_settings';

function loadSettings(): AppSettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return DEFAULTS;
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);
  const [showCreds, setShowCreds] = useState(false);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const handleSave = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    toast.success('Настройки сохранены');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULTS);
    localStorage.removeItem(SETTINGS_KEY);
    toast.info('Настройки сброшены до значений по умолчанию');
  };

  const handleTestProxy = async () => {
    const url = settings.wsProxy || import.meta.env.VITE_WS_PROXY || 'ws://localhost:2222';
    setTesting(true);
    setTestResult(null);
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(url);
        const timeout = setTimeout(() => { ws.close(); reject(new Error('Таймаут')); }, 3000);
        ws.onopen = () => { clearTimeout(timeout); ws.close(); resolve(); };
        ws.onerror = () => { clearTimeout(timeout); reject(new Error('Ошибка соединения')); };
      });
      setTestResult('ok');
      toast.success('Прокси-сервер доступен');
    } catch (err) {
      setTestResult('fail');
      const msg = err instanceof Error ? err.message : 'Ошибка соединения';
      toast.error(`Прокси недоступен: ${msg}`);
    } finally {
      setTesting(false);
    }
  };

  const currentProxy = settings.wsProxy || import.meta.env.VITE_WS_PROXY || 'ws://localhost:2222';
  const currentApi = settings.apiUrl || import.meta.env.VITE_API_URL || '(встроенный fallback)';

  return (
    <AppLayout title="Настройки">
      <div className="p-4 md:p-6 space-y-6 max-w-2xl">
        {/* WebSocket proxy */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wifi size={16} className="text-primary" />
            <h2 className="font-mono-terminal text-sm text-primary">WebSocket Прокси</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">URL прокси-сервера</Label>
              <div className="flex gap-2">
                <Input
                  value={settings.wsProxy}
                  onChange={e => update('wsProxy', e.target.value)}
                  placeholder="ws://localhost:2222"
                  className="font-mono-terminal text-sm h-9 bg-input border-border focus:border-primary flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-9 px-3 font-mono-terminal text-xs border shrink-0 gap-1 ${
                    testResult === 'ok' ? 'border-primary text-primary' :
                    testResult === 'fail' ? 'border-destructive text-destructive' :
                    'border-border text-muted-foreground hover:text-primary hover:border-primary/40'
                  }`}
                  onClick={handleTestProxy}
                  disabled={testing}
                >
                  {testing ? <RefreshCw size={12} className="animate-spin" /> :
                   testResult === 'ok' ? <Check size={12} /> : <Wifi size={12} />}
                  Тест
                </Button>
              </div>
              <p className="font-mono-terminal text-xs text-muted-foreground mt-1">
                Сейчас используется: <span className="text-foreground">{currentProxy}</span>
              </p>
            </div>
            <div className="bg-black/30 border border-border p-3">
              <p className="font-mono-terminal text-xs text-muted-foreground mb-1">Запуск локального прокси-сервера:</p>
              <code className="font-mono-terminal text-xs text-primary block">node server/ws-ssh-proxy.js</code>
              <p className="font-mono-terminal text-xs text-muted-foreground mt-2">Прокси будет слушать ws://localhost:2222</p>
            </div>
          </div>
        </div>

        {/* API URL */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={16} className="text-accent-foreground" />
            <h2 className="font-mono-terminal text-sm text-accent-foreground">Конфигурация AI API</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">URL API-сервера</Label>
              <Input
                value={settings.apiUrl}
                onChange={e => update('apiUrl', e.target.value)}
                placeholder="http://localhost:3001"
                className="font-mono-terminal text-sm h-9 bg-input border-border focus:border-accent-foreground"
              />
              <p className="font-mono-terminal text-xs text-muted-foreground mt-1">
                Сейчас используется: <span className="text-foreground">{currentApi}</span>
              </p>
            </div>
            <div className="bg-accent/20 border border-accent-foreground/10 p-3">
              <p className="font-mono-terminal text-xs text-accent-foreground mb-1">💡 Режим предпросмотра</p>
              <p className="font-mono-terminal text-xs text-muted-foreground">
                Если URL API не задан, ИИ-помощник использует встроенный fallback — функции доступны, но ответы предустановлены.
                Запустите <code className="text-accent-foreground">server/api.js</code> и укажите адрес для полного ИИ.
              </p>
            </div>
            <div className="bg-black/30 border border-border p-3">
              <p className="font-mono-terminal text-xs text-muted-foreground mb-1">Запуск API-сервера:</p>
              <code className="font-mono-terminal text-xs text-accent-foreground block">node server/api.js</code>
              <p className="font-mono-terminal text-xs text-muted-foreground mt-2">API будет слушать http://localhost:3001</p>
            </div>
          </div>
        </div>

        {/* Terminal appearance */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={16} className="text-info" />
            <h2 className="font-mono-terminal text-sm text-info">Внешний вид терминала</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Размер шрифта (px)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={e => update('fontSize', e.target.value)}
                  className="font-mono-terminal text-sm h-9 bg-input border-border focus:border-primary w-24"
                />
                <span className="font-mono-terminal text-xs text-muted-foreground">Рекомендовано: 12–16px</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-mono-terminal text-foreground block">Эффект сканлайнов</Label>
                <p className="font-mono-terminal text-xs text-muted-foreground mt-0.5">Показывать CRT-сканлайны в области терминала</p>
              </div>
              <Switch
                checked={settings.showScanlines}
                onCheckedChange={v => update('showScanlines', v)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>

        {/* Cloudflare Tunnel */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-warning" />
            <h2 className="font-mono-terminal text-sm text-warning">Cloudflare Tunnel</h2>
          </div>
          <div className="space-y-3">
            <div className="bg-black/30 border border-warning/20 p-3">
              <p className="font-mono-terminal text-xs text-warning mb-2">Архитектура</p>
              <p className="font-mono-terminal text-xs text-muted-foreground">
                Cloudflare Tunnel публикует локальный ws-ssh-proxy в интернет без открытия портов в файрволле —
                трафик шифруется через edge-узлы Cloudflare.
              </p>
            </div>
            <div>
              <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Tunnel ID</Label>
              <Input
                value={settings.cfTunnelId}
                onChange={e => update('cfTunnelId', e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono-terminal text-sm h-9 bg-input border-border focus:border-warning"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs font-mono-terminal text-muted-foreground">Credentials (JSON)</Label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary"
                  onClick={() => setShowCreds(s => !s)}
                >
                  {showCreds ? <EyeOff size={12} /> : <Eye size={12} />}
                </Button>
              </div>
              <Input
                type={showCreds ? 'text' : 'password'}
                value={settings.cfCredentials}
                onChange={e => update('cfCredentials', e.target.value)}
                placeholder='{"AccountTag":"...","TunnelSecret":"..."}'
                className="font-mono-terminal text-sm h-9 bg-input border-border focus:border-warning"
              />
            </div>
            <div className="bg-black/30 border border-border p-3">
              <p className="font-mono-terminal text-xs text-muted-foreground mb-1">Запуск туннеля через cloudflared:</p>
              <code className="font-mono-terminal text-xs text-warning block whitespace-pre-wrap">{`cloudflared tunnel run --url ws://localhost:2222 ${settings.cfTunnelId || '<tunnel-id>'}`}</code>
            </div>
          </div>
        </div>

        {/* Save / Reset */}
        <div className="flex gap-3 pb-4">
          <Button
            className={`flex-1 h-9 font-mono-terminal text-sm gap-2 ${saved ? 'bg-primary/80' : 'bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm'}`}
            onClick={handleSave}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? 'Сохранено' : 'Сохранить настройки'}
          </Button>
          <Button
            variant="ghost"
            className="h-9 px-4 font-mono-terminal text-sm border border-border text-muted-foreground hover:text-primary gap-2"
            onClick={handleReset}
          >
            <RefreshCw size={14} />
            Сбросить
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
