/**
 * ConnectPage — multi-tenant SSH connect
 *
 * Users enter their own server credentials. The WS proxy on our backend
 * opens an SSH connection to THEIR server on behalf of the authenticated user.
 *
 * Flow:
 *   1. User fills form (host/port/user/pass or key)
 *   2. POST /api/ws-token → short-lived JWT
 *   3. Open WebSocket to wss://ws.soulinpsy.info
 *   4. Send { type:"connect", mode:"ssh", host, port, username, password }
 *   5. Proxy handles the SSH session; xterm renders the output inline
 *
 * Saved connections are stored in localStorage (no backend needed for v1).
 */

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { toast } from 'sonner';
import { useAuth0 } from '@auth0/auth0-react';
import QRCode from 'qrcode';
import {
  Wifi, Plus, Trash2, Copy, Edit2, Check, X, ChevronRight,
  Key, Terminal, QrCode, Shield, ExternalLink, Loader2,
  Power, PowerOff, RotateCcw, ServerCrash, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AppLayout from '@/components/layouts/AppLayout';

// ── Types ──────────────────────────────────────────────────────────────────

interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: string;
  username: string;
  authType: 'password' | 'key';
  createdAt: string;
}

interface ConnectForm {
  name: string;
  host: string;
  port: string;
  username: string;
  authType: 'password' | 'key';
  password: string;
  privateKey: string;
}

type SessionStatus = 'idle' | 'fetching-token' | 'connecting' | 'connected' | 'error' | 'disconnected';

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sipa_shell_connections';
const WS_PROXY    = import.meta.env.VITE_WS_PROXY ?? 'wss://ws.soulinpsy.info';
const API_BASE    = import.meta.env.VITE_API_URL   ?? 'https://shell.sipa-os.org';

// ── localStorage helpers ────────────────────────────────────────────────

function loadConnections(): SavedConnection[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveConnections(conns: SavedConnection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conns));
}

const emptyForm = (): ConnectForm => ({
  name: '', host: '', port: '22', username: '',
  authType: 'password', password: '', privateKey: '',
});

// ── SSH Terminal hook ──────────────────────────────────────────────────────

function useSshSession(containerRef: React.RefObject<HTMLDivElement>) {
  const { getIdTokenClaims } = useAuth0();
  const termRef      = useRef<import('@xterm/xterm').Terminal | null>(null);
  const fitRef       = useRef<import('@xterm/addon-fit').FitAddon | null>(null);
  const wsRef        = useRef<WebSocket | null>(null);
  const bufRef       = useRef<string[]>([]);
  const statusRef    = useRef<SessionStatus>('idle');
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  const setStatusBoth = (s: SessionStatus) => {
    statusRef.current = s;
    setStatus(s);
  };

  // Init xterm once
  useEffect(() => {
    let disposed = false;
    (async () => {
      const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import('@xterm/xterm'),
        import('@xterm/addon-fit'),
        import('@xterm/addon-web-links'),
      ]);
      if (disposed || !containerRef.current) return;
      const term = new Terminal({
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 13,
        cursorBlink: true,
        scrollback: 5000,
        theme: {
          background: '#0a0a0a',
          foreground: '#00ff41',
          cursor: '#00ff41',
          selectionBackground: 'rgba(0,255,65,0.25)',
          black: '#0a0a0a', brightBlack: '#444',
          red: '#ff4444', brightRed: '#ff6666',
          green: '#00ff41', brightGreen: '#33ff66',
          yellow: '#ffcc00', brightYellow: '#ffe066',
          blue: '#4488ff', brightBlue: '#66aaff',
          magenta: '#cc44ff', brightMagenta: '#dd66ff',
          cyan: '#00ccff', brightCyan: '#33ddff',
          white: '#cccccc', brightWhite: '#ffffff',
        },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.loadAddon(new WebLinksAddon());
      term.open(containerRef.current);
      fit.fit();
      term.writeln('\x1b[32mSIPA Shell · SSH · Заполните форму и нажмите «Подключить»\x1b[0m');
      term.onData((d) => {
        if (wsRef.current?.readyState === 1)
          wsRef.current.send(JSON.stringify({ type: 'data', data: d }));
      });
      termRef.current = term;
      fitRef.current  = fit;
    })();
    const onResize = () => fitRef.current?.fit();
    window.addEventListener('resize', onResize);
    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  const connect = useCallback(async (params: {
    host: string; port: number; username: string;
    password?: string; privateKey?: string;
  }) => {
    const term = termRef.current;
    if (!term) return;

    // Close any existing session
    wsRef.current?.close();
    bufRef.current = [];

    setStatusBoth('fetching-token');
    setStatusMsg('Получение токена…');
    term.writeln('\r\n\x1b[33m[sipa] Получение токена авторизации…\x1b[0m');

    let token: string;
    try {
      let idToken: string;
      try {
        const claims = await getIdTokenClaims();
        if (!claims?.__raw) throw new Error('no id token');
        idToken = claims.__raw;
      } catch {
        term.writeln('\x1b[31m[sipa] Не авторизован — войдите через кнопку логина\x1b[0m');
        setStatusBoth('error');
        setStatusMsg('Не авторизован');
        return;
      }

      const res = await fetch(`${API_BASE}/api/ws-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.status === 401) {
        term.writeln('\x1b[31m[sipa] Не авторизован — войдите через кнопку логина\x1b[0m');
        setStatusBoth('error');
        setStatusMsg('Не авторизован');
        return;
      }
      const json = await res.json();
      if (!json.token) throw new Error('Нет токена в ответе');
      token = json.token;
    } catch (e: any) {
      term.writeln(`\x1b[31m[sipa] Ошибка токена: ${e.message}\x1b[0m`);
      setStatusBoth('error');
      setStatusMsg(e.message);
      return;
    }

    setStatusBoth('connecting');
    setStatusMsg(`Подключение к ${params.host}…`);
    term.writeln(`\x1b[33m[sipa] Подключение к ${params.username}@${params.host}:${params.port}…\x1b[0m`);

    const wsUrl = `${WS_PROXY}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const cols = fitRef.current ? (termRef.current?.cols ?? 220) : 220;
      const rows = fitRef.current ? (termRef.current?.rows ?? 50)  : 50;
      ws.send(JSON.stringify({
        type: 'connect',
        mode: 'ssh',
        host: params.host,
        port: params.port,
        username: params.username,
        ...(params.password   ? { password:   params.password   } : {}),
        ...(params.privateKey ? { privateKey: params.privateKey } : {}),
        cols,
        rows,
      }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'connected') {
          setStatusBoth('connected');
          setStatusMsg(`${params.username}@${params.host}`);
          term.writeln(`\x1b[32m[sipa] Подключено: ${params.username}@${params.host}:${params.port}\x1b[0m\r\n`);
          fitRef.current?.fit();
        } else if (msg.type === 'data') {
          term.write(msg.data);
          const lines = (bufRef.current.join('') + msg.data).split(/\r?\n/);
          bufRef.current = lines.slice(-500);
        } else if (msg.type === 'error') {
          term.writeln(`\r\n\x1b[31m[sipa] Ошибка: ${msg.message}\x1b[0m`);
          setStatusBoth('error');
          setStatusMsg(msg.message);
        } else if (msg.type === 'close') {
          term.writeln('\r\n\x1b[33m[sipa] Соединение закрыто\x1b[0m');
          setStatusBoth('disconnected');
          setStatusMsg('Отключено');
        }
      } catch {
        term.write(e.data);
      }
    };

    ws.onerror = () => {
      term.writeln('\r\n\x1b[31m[sipa] WebSocket ошибка\x1b[0m');
      setStatusBoth('error');
      setStatusMsg('WebSocket ошибка');
    };

    ws.onclose = () => {
      if (statusRef.current === 'connected') {
        term.writeln('\r\n\x1b[33m[sipa] Соединение прервано\x1b[0m');
      }
      setStatusBoth('disconnected');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clear        = () => termRef.current?.clear();
  const copySelected = () => {
    const sel = termRef.current?.getSelection();
    if (sel) { navigator.clipboard.writeText(sel); toast.success('Скопировано'); }
  };

  return { status, statusMsg, connect, disconnect, clear, copySelected };
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [connections, setConnections] = useState<SavedConnection[]>(loadConnections);
  const [addOpen,  setAddOpen]  = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [form,     setForm]     = useState<ConnectForm>(emptyForm);
  const [showPass, setShowPass] = useState(false);

  // Quick-connect form (visible always, no dialog)
  const [qf, setQf] = useState<ConnectForm>(emptyForm);
  const [showQfPass, setShowQfPass] = useState(false);

  // QR
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrTarget,  setQrTarget]  = useState('');

  // Terminal
  const termContainerRef = useRef<HTMLDivElement>(null);
  const { status, statusMsg, connect, disconnect, clear, copySelected } = useSshSession(
    termContainerRef as React.RefObject<HTMLDivElement>
  );

  const updateForm = (key: keyof ConnectForm, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const updateQf = (key: keyof ConnectForm, value: string) =>
    setQf(prev => ({ ...prev, [key]: value }));

  const resetForm = () => { setForm(emptyForm()); setEditId(null); };

  // Generate QR
  const generateQr = async (target: string) => {
    try {
      const url = await QRCode.toDataURL(target, {
        width: 200, color: { dark: '#00ff41', light: '#000000' },
      });
      setQrDataUrl(url);
      setQrTarget(target);
    } catch {
      toast.error('Ошибка генерации QR-кода');
    }
  };

  useEffect(() => {
    const proxyUrl = import.meta.env.VITE_WS_PROXY || 'wss://ws.soulinpsy.info';
    generateQr(`sipa-shell proxy: ${proxyUrl}`);
  }, []);

  // ── CRUD ────────────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!form.name || !form.host || !form.username) {
      toast.error('Заполните название, хост и пользователя');
      return;
    }
    if (editId) {
      const updated = connections.map(c =>
        c.id === editId ? { ...c, name: form.name, host: form.host, port: form.port, username: form.username, authType: form.authType } : c
      );
      setConnections(updated);
      saveConnections(updated);
      toast.success('Подключение обновлено');
    } else {
      const newConn: SavedConnection = {
        id: crypto.randomUUID(),
        name: form.name, host: form.host, port: form.port,
        username: form.username, authType: form.authType,
        createdAt: new Date().toISOString(),
      };
      const updated = [...connections, newConn];
      setConnections(updated);
      saveConnections(updated);
      toast.success('Подключение сохранено');
    }
    setAddOpen(false);
    resetForm();
  };

  const handleEdit = (conn: SavedConnection) => {
    setForm({ name: conn.name, host: conn.host, port: conn.port, username: conn.username, authType: conn.authType, password: '', privateKey: '' });
    setEditId(conn.id);
    setAddOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = connections.filter(c => c.id !== deleteId);
    setConnections(updated);
    saveConnections(updated);
    setDeleteId(null);
    toast.success('Подключение удалено');
  };

  // Launch SSH session from quick-connect form
  const handleQuickConnect = async (params: ConnectForm) => {
    if (!params.host || !params.username) {
      toast.error('Укажите хост и пользователя');
      return;
    }
    await connect({
      host: params.host,
      port: parseInt(params.port || '22', 10),
      username: params.username,
      password:   params.authType === 'password' ? params.password   || undefined : undefined,
      privateKey: params.authType === 'key'      ? params.privateKey || undefined : undefined,
    });
    // Scroll to terminal
    termContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Launch from saved connection (asks for password/key inline via quick-connect form)
  const handleSavedConnect = (conn: SavedConnection) => {
    setQf({
      name: conn.name, host: conn.host, port: conn.port,
      username: conn.username, authType: conn.authType,
      password: '', privateKey: '',
    });
    toast.info(`Заполните пароль/ключ для «${conn.name}» и нажмите Подключить`);
    // Scroll to quick-connect form
    document.getElementById('quick-connect-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const copyCommand = (conn: SavedConnection) => {
    navigator.clipboard.writeText(`ssh ${conn.username}@${conn.host} -p ${conn.port}`);
    toast.success('SSH команда скопирована');
  };

  // ── Status helpers ───────────────────────────────────────────────────────

  const statusColor =
    status === 'connected'    ? 'text-primary' :
    status === 'connecting' || status === 'fetching-token' ? 'text-yellow-400' :
    status === 'error'        ? 'text-destructive' :
    status === 'disconnected' ? 'text-orange-400' : 'text-muted-foreground';

  const statusLabel: Record<SessionStatus, string> = {
    idle:            'Ожидание',
    'fetching-token':'Токен…',
    connecting:      'Подключение…',
    connected:       'Подключено',
    error:           'Ошибка',
    disconnected:    'Отключено',
  };

  const isBusy = status === 'fetching-token' || status === 'connecting';

  // ── Support session mode ────────────────────────────────────────────────
  const [isSupportMode] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'support');
  const [supportForm, setSupportForm] = useState({ host: '', port: '22', username: 'root', password: '', clientName: '', clientEmail: '' });
  const [supportCode, setSupportCode] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  const submitSupportSession = async () => {
    if (!supportForm.host || !supportForm.username) { toast.error('Укажите host и пользователя'); return; }
    setSupportLoading(true);
    try {
      const res = await fetch('/api/support-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(supportForm),
      });
      const data = await res.json();
      if (data.code) { setSupportCode(data.code); toast.success('Сессия создана!'); }
      else toast.error(data.error || 'Ошибка');
    } catch (e) { toast.error('Ошибка соединения'); }
    finally { setSupportLoading(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout title="SSH Подключения">
      <div className="p-4 md:p-6 space-y-6 max-w-5xl">

        {/* ── Support session mode ───────────────────────────────────────── */}
        {isSupportMode && (
          <div className="glass-panel border border-info/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-info" />
              <h2 className="font-mono-terminal text-sm text-info">Запрос поддержки SIPA</h2>
            </div>
            {supportCode ? (
              <div className="text-center py-6">
                <div className="font-mono-terminal text-2xl text-primary mb-2">{supportCode}</div>
                <p className="text-muted-foreground text-sm mb-4">Отправьте этот код команде SIPA в Telegram</p>
                <div className="flex gap-3 justify-center">
                  <Button size="sm" className="font-mono-terminal text-xs gap-2" onClick={() => { navigator.clipboard.writeText(supportCode); toast.success('Скопировано'); }}>
                    <Copy size={12} /> Скопировать код
                  </Button>
                  <a href="https://t.me/messycketch" target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="font-mono-terminal text-xs gap-2 border-info/40 text-info">
                      <ExternalLink size={12} /> Написать в Telegram
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs mb-4">Введите данные вашего сервера. Мы подключимся и поможем.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="font-mono-terminal text-xs">Host / IP</Label><Input className="font-mono-terminal text-xs h-8 mt-1" placeholder="1.2.3.4" value={supportForm.host} onChange={e => setSupportForm(f => ({...f, host: e.target.value}))} /></div>
                  <div><Label className="font-mono-terminal text-xs">Порт</Label><Input className="font-mono-terminal text-xs h-8 mt-1" placeholder="22" value={supportForm.port} onChange={e => setSupportForm(f => ({...f, port: e.target.value}))} /></div>
                  <div><Label className="font-mono-terminal text-xs">Пользователь</Label><Input className="font-mono-terminal text-xs h-8 mt-1" placeholder="root" value={supportForm.username} onChange={e => setSupportForm(f => ({...f, username: e.target.value}))} /></div>
                  <div><Label className="font-mono-terminal text-xs">Пароль</Label><Input type="password" className="font-mono-terminal text-xs h-8 mt-1" placeholder="••••••" value={supportForm.password} onChange={e => setSupportForm(f => ({...f, password: e.target.value}))} /></div>
                  <div><Label className="font-mono-terminal text-xs">Ваше имя</Label><Input className="font-mono-terminal text-xs h-8 mt-1" placeholder="Имя" value={supportForm.clientName} onChange={e => setSupportForm(f => ({...f, clientName: e.target.value}))} /></div>
                  <div><Label className="font-mono-terminal text-xs">Email (опционально)</Label><Input className="font-mono-terminal text-xs h-8 mt-1" placeholder="you@example.com" value={supportForm.clientEmail} onChange={e => setSupportForm(f => ({...f, clientEmail: e.target.value}))} /></div>
                </div>
                <Button onClick={submitSupportSession} disabled={supportLoading} className="font-mono-terminal text-xs bg-info text-white hover:bg-info/90 gap-2 mt-2">
                  {supportLoading ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                  Запросить поддержку
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Quick-connect form ─────────────────────────────────────────── */}
        <div id="quick-connect-form" className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={16} className="text-primary" />
            <h2 className="font-mono-terminal text-sm text-primary">Быстрое SSH подключение</h2>
            <Badge className="ml-auto font-mono-terminal text-xs px-2 py-0 h-5 border-0"
              style={{ background: status === 'connected' ? 'rgba(0,255,65,0.15)' : 'rgba(255,255,255,0.05)' }}>
              <span className={statusColor}>● {statusLabel[status]}</span>
              {statusMsg && status !== 'idle' && (
                <span className="ml-1 text-muted-foreground truncate max-w-[160px]">{statusMsg}</span>
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: form fields */}
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Хост / IP</Label>
                  <Input
                    value={qf.host} onChange={e => updateQf('host', e.target.value)}
                    placeholder="IP или hostname вашего сервера"
                    className="font-mono-terminal text-sm h-8 bg-input border-border"
                    onKeyDown={e => e.key === 'Enter' && handleQuickConnect(qf)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Порт</Label>
                  <Input
                    value={qf.port} onChange={e => updateQf('port', e.target.value)}
                    placeholder="22"
                    className="font-mono-terminal text-sm h-8 bg-input border-border"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Пользователь</Label>
                <Input
                  value={qf.username} onChange={e => updateQf('username', e.target.value)}
                  placeholder="ubuntu / root / admin / sipa"
                  className="font-mono-terminal text-sm h-8 bg-input border-border"
                />
              </div>

              {/* Auth type toggle */}
              <div>
                <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Метод авторизации</Label>
                <div className="flex gap-2">
                  {(['password', 'key'] as const).map(t => (
                    <Button
                      key={t} variant="ghost" size="sm"
                      className={`flex-1 h-7 text-xs font-mono-terminal border gap-1 ${qf.authType === t ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground'}`}
                      onClick={() => updateQf('authType', t)}
                    >
                      {t === 'password' ? <Key size={10} /> : <Shield size={10} />}
                      {t === 'password' ? 'Пароль' : 'SSH ключ'}
                    </Button>
                  ))}
                </div>
              </div>

              {qf.authType === 'password' ? (
                <div>
                  <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Пароль</Label>
                  <div className="relative">
                    <Input
                      type={showQfPass ? 'text' : 'password'}
                      value={qf.password} onChange={e => updateQf('password', e.target.value)}
                      placeholder="••••••••"
                      className="font-mono-terminal text-sm h-8 bg-input border-border pr-8"
                      onKeyDown={e => e.key === 'Enter' && handleQuickConnect(qf)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                      onClick={() => setShowQfPass(v => !v)}
                    >
                      {showQfPass ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Приватный ключ (PEM)</Label>
                  <Textarea
                    value={qf.privateKey} onChange={e => updateQf('privateKey', e.target.value)}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                    className="font-mono-terminal text-xs bg-input border-border resize-none"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1 h-9 font-mono-terminal text-sm bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm gap-2 disabled:opacity-60"
                  onClick={() => handleQuickConnect(qf)}
                  disabled={isBusy || status === 'connected'}
                >
                  {isBusy
                    ? <><Loader2 size={14} className="animate-spin" /> Подключение…</>
                    : <><Power size={14} /> Подключить</>
                  }
                </Button>
                {(status === 'connected' || status === 'disconnected' || status === 'error') && (
                  <Button
                    variant="ghost"
                    className="h-9 px-3 font-mono-terminal text-xs border border-border text-muted-foreground hover:text-destructive gap-1"
                    onClick={disconnect}
                    title="Отключиться"
                  >
                    <PowerOff size={13} />
                  </Button>
                )}
              </div>
            </div>

            {/* Right: SSH reference + QR */}
            <div className="space-y-3">
              <div className="bg-black/40 border border-border p-3 space-y-1.5">
                <p className="font-mono-terminal text-xs text-muted-foreground mb-2">Быстрые команды</p>
                {[
                  ['Подключение',  'ssh user@host -p 22'],
                  ['С ключом',     'ssh -i ~/.ssh/id_ed25519 user@host'],
                  ['Проброс порта','ssh -L 8080:localhost:80 user@host'],
                  ['Копировать',   'scp file user@host:/path/'],
                ].map(([label, cmd]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="font-mono-terminal text-[10px] text-muted-foreground w-24 shrink-0">{label}</span>
                    <div className="flex-1 flex items-center gap-1 bg-black/30 px-2 py-1 border border-border/50 min-w-0">
                      <code className="font-mono-terminal text-[10px] text-primary flex-1 truncate">{cmd}</code>
                      <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0 text-muted-foreground hover:text-primary"
                        onClick={() => { navigator.clipboard.writeText(cmd); toast.success('Скопировано'); }}>
                        <Copy size={9} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {qrDataUrl && (
                <div className="flex items-center gap-3 bg-black/40 border border-border p-3">
                  <img src={qrDataUrl} alt="QR" className="w-16 h-16 border border-primary/20" />
                  <div className="min-w-0">
                    <p className="font-mono-terminal text-[10px] text-muted-foreground mb-1">QR прокси</p>
                    <p className="font-mono-terminal text-[10px] text-primary break-all">{qrTarget}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Embedded SSH Terminal ──────────────────────────────────────── */}
        <div className="glass-panel border border-border overflow-hidden">
          {/* Terminal toolbar */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 bg-black/40">
            <Terminal size={13} className="text-primary" />
            <span className="font-mono-terminal text-xs text-primary">SSH Terminal</span>
            {statusMsg && status === 'connected' && (
              <span className="font-mono-terminal text-[10px] text-muted-foreground ml-1">— {statusMsg}</span>
            )}
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={clear} title="Очистить">
                <RotateCcw size={11} />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={copySelected} title="Копировать выделение">
                <Copy size={11} />
              </Button>
              {status === 'connected' && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={disconnect} title="Отключить">
                  <PowerOff size={11} />
                </Button>
              )}
              {status === 'error' || status === 'disconnected' ? (
                <Badge className="font-mono-terminal text-[10px] px-1.5 h-5 bg-destructive/10 text-destructive border-0">
                  <ServerCrash size={9} className="mr-1" />
                  {statusLabel[status]}
                </Badge>
              ) : status !== 'idle' ? (
                <Badge className={`font-mono-terminal text-[10px] px-1.5 h-5 border-0 ${status === 'connected' ? 'bg-primary/10 text-primary' : 'bg-yellow-400/10 text-yellow-400'}`}>
                  ● {statusLabel[status]}
                </Badge>
              ) : null}
            </div>
          </div>
          {/* xterm container */}
          <div
            ref={termContainerRef}
            className="h-72 md:h-96 bg-[#0a0a0a] overflow-hidden"
            style={{ padding: '8px' }}
          />
        </div>

        {/* ── Saved connections ──────────────────────────────────────────── */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-primary" />
              <h2 className="font-mono-terminal text-sm text-primary">Сохранённые подключения</h2>
              <Badge className="font-mono-terminal text-xs px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                {connections.length}
              </Badge>
            </div>

            {/* Add dialog */}
            <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-7 text-xs font-mono-terminal bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm gap-1">
                  <Plus size={12} />Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-mono-terminal text-sm text-primary">
                    {editId ? 'Редактировать подключение' : 'Новое подключение'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Название</Label>
                    <Input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="Мой сервер" className="font-mono-terminal text-sm h-8 bg-input border-border" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Хост</Label>
                      <Input value={form.host} onChange={e => updateForm('host', e.target.value)} placeholder="example.com" className="font-mono-terminal text-sm h-8 bg-input border-border" />
                    </div>
                    <div>
                      <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Порт</Label>
                      <Input value={form.port} onChange={e => updateForm('port', e.target.value)} placeholder="22" className="font-mono-terminal text-sm h-8 bg-input border-border" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Пользователь</Label>
                    <Input value={form.username} onChange={e => updateForm('username', e.target.value)} placeholder="root" className="font-mono-terminal text-sm h-8 bg-input border-border" />
                  </div>
                  <div>
                    <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">Метод авторизации</Label>
                    <div className="flex gap-2">
                      {(['password', 'key'] as const).map(t => (
                        <Button key={t} variant="ghost" size="sm"
                          className={`flex-1 h-7 text-xs font-mono-terminal border ${form.authType === t ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}
                          onClick={() => updateForm('authType', t)}>
                          {t === 'password' ? 'Пароль' : 'SSH ключ'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <p className="font-mono-terminal text-[10px] text-muted-foreground">
                    Пароль/ключ не сохраняются — вводятся при каждом подключении.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1 h-8 font-mono-terminal text-sm bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                      <Check size={12} className="mr-1" />Сохранить
                    </Button>
                    <Button variant="ghost" className="h-8 px-3 font-mono-terminal text-sm border border-border text-muted-foreground hover:text-primary" onClick={() => { setAddOpen(false); resetForm(); }}>
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border">
              <Wifi size={32} className="text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-mono-terminal text-sm text-muted-foreground">Нет сохранённых подключений</p>
              <p className="font-mono-terminal text-xs text-muted-foreground mt-1">Нажмите «Добавить» для нового SSH подключения</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map(conn => (
                <div key={conn.id} className="flex items-center gap-3 p-3 border border-border hover:border-primary/30 transition-colors bg-card/30">
                  <div className="shrink-0 w-8 h-8 flex items-center justify-center border border-primary/20">
                    <Terminal size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono-terminal text-sm text-foreground font-medium truncate">{conn.name}</span>
                      <Badge className="text-xs px-1.5 py-0 h-4 bg-secondary text-muted-foreground border-0 font-mono-terminal shrink-0">
                        {conn.authType === 'key' ? <Key size={8} className="mr-1" /> : null}
                        {conn.authType === 'password' ? 'Пароль' : 'SSH ключ'}
                      </Badge>
                    </div>
                    <p className="font-mono-terminal text-xs text-muted-foreground truncate">
                      {conn.username}@{conn.host}:{conn.port}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => copyCommand(conn)} title="Скопировать команду">
                      <Copy size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => generateQr(`ssh://${conn.username}@${conn.host}:${conn.port}`)} title="QR-код">
                      <QrCode size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit(conn)} title="Редактировать">
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(conn.id)} title="Удалить">
                      <Trash2 size={12} />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 text-xs font-mono-terminal bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 glow-green-sm gap-1"
                      onClick={() => handleSavedConnect(conn)}
                    >
                      Подключить <ChevronRight size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SSH key info ───────────────────────────────────────────────── */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-info" />
            <h2 className="font-mono-terminal text-sm text-info">SSH-ключ авторизация</h2>
          </div>
          <div className="space-y-1">
            {[
              '1. Сгенерируйте ключ: ssh-keygen -t ed25519 -C "my-key"',
              '2. Скопируйте публичный ключ на сервер: ssh-copy-id user@host',
              '3. Вставьте содержимое ~/.ssh/id_ed25519 в поле «Приватный ключ»',
            ].map(s => (
              <p key={s} className="font-mono-terminal text-xs text-muted-foreground">{s}</p>
            ))}
          </div>
          <div className="mt-3 bg-black/40 border border-border p-3 flex items-center justify-between">
            <code className="font-mono-terminal text-xs text-primary">
              cat ~/.ssh/authorized_keys  {/* verify key is added on your server */}
            </code>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-primary"
              onClick={() => { navigator.clipboard.writeText('cat ~/.ssh/authorized_keys'); toast.success('Скопировано'); }}>
              <Copy size={10} />
            </Button>
          </div>
        </div>

        {/* ── External SSH reference ─────────────────────────────────────── */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink size={16} className="text-muted-foreground" />
            <h2 className="font-mono-terminal text-sm text-muted-foreground">Справочник SSH команд</h2>
          </div>
          <div className="space-y-2">
            {[
              ['Подключение',   'ssh username@host -p 22'],
              ['С ключом',      'ssh -i ~/.ssh/id_ed25519 user@host'],
              ['Проброс порта', 'ssh -L 8080:localhost:80 user@host'],
              ['Фоновое',       'ssh -fN -L 3306:localhost:3306 user@host'],
              ['Копировать',    'scp local_file user@host:/remote/path/'],
            ].map(([label, cmd]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="font-mono-terminal text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                <div className="flex-1 min-w-0 flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-border">
                  <code className="font-mono-terminal text-xs text-primary flex-1 truncate">{cmd}</code>
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-primary"
                    onClick={() => { navigator.clipboard.writeText(cmd); toast.success('Скопировано'); }}>
                    <Copy size={10} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono-terminal text-sm text-foreground">Подтвердить удаление</AlertDialogTitle>
            <AlertDialogDescription className="font-mono-terminal text-xs text-muted-foreground">
              Это действие нельзя отменить. Удалить это подключение?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono-terminal text-xs h-8">Отмена</AlertDialogCancel>
            <AlertDialogAction className="font-mono-terminal text-xs h-8 bg-destructive text-destructive-foreground" onClick={handleDelete}>Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
