import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Search, Terminal, Plus, Trash2, ChevronRight, Cpu, Edit2, X, Check, Camera, MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import AppLayout from '@/components/layouts/AppLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { cn } from '@/lib/utils';
import { useLang } from '@/contexts/LangContext';

// WIP page — GPS/photo snapshot access to real devices (T15/X7), not the
// generic bring-your-own-server tool. Temporary allowlist until finished.
const ALLOWED_EMAILS = new Set([
  'soulinpsyabstract@outlook.com',
  'sipa-core@sipa-os.org',
  'soulinpsyabstract@gmail.com',
]);

interface Device {
  id: string;
  name: string;
  host: string;
  port: string;
  user: string;
  addedAt: string;
}

const STORAGE_KEY = 'sipa_devices';
const WEBHOOK_SERVER = `http://${import.meta.env.VITE_SIPA_SERVER_IP || '172.27.22.217'}:9922`;
const SNAPSHOT_DEVICES = new Set(['t15', 'x7']);

interface SnapshotPhoto {
  b64: string;
  fresh?: boolean;
}

interface SnapshotResult {
  photos?: Record<string, SnapshotPhoto>;
  gps_links?: Record<string, string>;
  error?: string;
}

function loadDevices(): Device[] {
  try {
    const stored: Device[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return stored;
  } catch {
    return [];
  }
}

function saveDevices(devices: Device[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
}

const emptyForm = { name: '', host: '', port: '22', user: '' };

export default function FindDevicePage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const { user, isLoading, isAuthenticated, loginWithRedirect } = useAuth0();

  if (isLoading) return null;
  if (!isAuthenticated || !user?.email || !ALLOWED_EMAILS.has(user.email.toLowerCase())) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
          <p className="text-muted-foreground font-mono-terminal text-sm">
            This page is still being worked on and isn't available yet.
          </p>
          {!isAuthenticated && (
            <Button onClick={() => loginWithRedirect()} className="font-mono-terminal">
              Log in
            </Button>
          )}
        </div>
      </AppLayout>
    );
  }
  const [devices, setDevices] = useState<Device[]>(loadDevices);
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<typeof emptyForm>>({});
  const [snapshotLoading, setSnapshotLoading] = useState<string | null>(null);
  const [snapshotResult, setSnapshotResult] = useState<{ deviceId: string; data: SnapshotResult } | null>(null);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);

  // Persist on every change
  useEffect(() => {
    saveDevices(devices);
  }, [devices]);

  const updateForm = (key: keyof typeof emptyForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFormErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<typeof emptyForm> = {};
    if (!form.name.trim()) errors.name = 'Required';
    if (!form.host.trim()) errors.host = 'Required';
    if (!form.port.trim()) errors.port = 'Required';
    if (!form.user.trim()) errors.user = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAdd = () => {
    setForm(emptyForm);
    setFormErrors({});
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (device: Device) => {
    setForm({ name: device.name, host: device.host, port: device.port, user: device.user });
    setFormErrors({});
    setEditId(device.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!validateForm()) return;
    if (editId) {
      setDevices(prev =>
        prev.map(d =>
          d.id === editId ? { ...d, ...form } : d
        )
      );
      toast.success('Device updated');
    } else {
      const newDevice: Device = {
        id: crypto.randomUUID(),
        ...form,
        addedAt: new Date().toISOString(),
      };
      setDevices(prev => [...prev, newDevice]);
      toast.success('Device added');
    }
    setDialogOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    toast.success('Device removed');
  };

  const handleConnect = (device: Device) => {
    sessionStorage.setItem(
      'sipa_quick_connect',
      JSON.stringify({
        name: device.name,
        host: device.host,
        port: device.port,
        username: device.user,
        authType: 'password',
      })
    );
    navigate('/shell');
    toast.info(`Connecting to ${device.name}…`);
  };

  const handleSnapshot = async (device: Device) => {
    const deviceKey = device.name.toLowerCase();
    setSnapshotLoading(device.id);
    try {
      const token = import.meta.env.VITE_FIND_DEVICE_TOKEN || '';
      const res = await fetch(`${WEBHOOK_SERVER}/find-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ device: deviceKey }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }
      const data: SnapshotResult = await res.json();
      setSnapshotResult({ deviceId: device.id, data });
      setSnapshotDialogOpen(true);
    } catch (err: unknown) {
      toast.error(`Snapshot failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSnapshotLoading(null);
    }
  };

  const filtered = query.trim()
    ? devices.filter(
        d =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.host.toLowerCase().includes(query.toLowerCase()) ||
          d.user.toLowerCase().includes(query.toLowerCase())
      )
    : devices;

  return (
    <AppLayout title={t('device.title')}>
      <div className="p-4 md:p-6 space-y-6 max-w-5xl">
        {/* Header row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('device.search')}
                className="font-mono-terminal text-sm h-9 bg-input border-border focus:border-primary pl-8"
              />
            </div>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={open => {
              setDialogOpen(open);
              if (!open) {
                setEditId(null);
                setForm(emptyForm);
                setFormErrors({});
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 px-4 font-mono-terminal text-sm bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm gap-2 shrink-0"
                onClick={openAdd}
              >
                <Plus size={14} />
                {t('device.add')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-mono-terminal text-sm text-primary">
                  {editId ? t('device.edit') : t('device.add')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-1">
                <div>
                  <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">
                    {t('device.name')}
                  </Label>
                  <Input
                    value={form.name}
                    onChange={e => updateForm('name', e.target.value)}
                    placeholder="My Server"
                    className={cn(
                      'font-mono-terminal text-sm h-8 bg-input border-border',
                      formErrors.name && 'border-destructive'
                    )}
                  />
                  {formErrors.name && (
                    <p className="font-mono-terminal text-xs text-destructive mt-0.5">{formErrors.name}</p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">
                      {t('device.host')}
                    </Label>
                    <Input
                      value={form.host}
                      onChange={e => updateForm('host', e.target.value)}
                      placeholder="192.168.1.10"
                      className={cn(
                        'font-mono-terminal text-sm h-8 bg-input border-border',
                        formErrors.host && 'border-destructive'
                      )}
                    />
                    {formErrors.host && (
                      <p className="font-mono-terminal text-xs text-destructive mt-0.5">{formErrors.host}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">
                      {t('device.port')}
                    </Label>
                    <Input
                      value={form.port}
                      onChange={e => updateForm('port', e.target.value)}
                      placeholder="22"
                      className={cn(
                        'font-mono-terminal text-sm h-8 bg-input border-border',
                        formErrors.port && 'border-destructive'
                      )}
                    />
                    {formErrors.port && (
                      <p className="font-mono-terminal text-xs text-destructive mt-0.5">{formErrors.port}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">
                    {t('device.user')}
                  </Label>
                  <Input
                    value={form.user}
                    onChange={e => updateForm('user', e.target.value)}
                    placeholder="root"
                    className={cn(
                      'font-mono-terminal text-sm h-8 bg-input border-border',
                      formErrors.user && 'border-destructive'
                    )}
                  />
                  {formErrors.user && (
                    <p className="font-mono-terminal text-xs text-destructive mt-0.5">{formErrors.user}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1 h-8 font-mono-terminal text-sm bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
                    onClick={handleSave}
                  >
                    <Check size={12} />
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-8 px-3 font-mono-terminal text-sm border border-border text-muted-foreground hover:text-primary"
                    onClick={() => setDialogOpen(false)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Devices table */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-primary" />
              <h2 className="font-mono-terminal text-sm text-primary">{t('device.title')}</h2>
              <Badge className="font-mono-terminal text-xs px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                {filtered.length}
              </Badge>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border">
              <Cpu size={28} className="text-muted-foreground/40 mx-auto mb-3" />
              {devices.length === 0 ? (
                <>
                  <p className="font-mono-terminal text-sm text-muted-foreground">{t('device.empty')}</p>
                  <Button
                    size="sm"
                    className="mt-4 h-8 text-xs font-mono-terminal bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm gap-1"
                    onClick={openAdd}
                  >
                    <Plus size={12} />
                    {t('device.add')}
                  </Button>
                </>
              ) : (
                <p className="font-mono-terminal text-xs text-muted-foreground">
                  No results for "{query}"
                </p>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-border">
                    {[
                      t('device.name'),
                      t('device.host'),
                      t('device.port'),
                      t('device.user'),
                      'Added',
                      'Actions',
                    ].map(h => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 font-mono-terminal text-xs text-muted-foreground whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(device => (
                    <tr
                      key={device.id}
                      className="border-b border-border/50 hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="font-mono-terminal text-xs text-foreground font-medium">
                          {device.name}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-primary">
                        {device.host}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-muted-foreground">
                        {device.port}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-foreground">
                        {device.user}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-muted-foreground">
                        {new Date(device.addedAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-mono-terminal bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 glow-green-sm gap-1"
                            onClick={() => handleConnect(device)}
                            title={t('device.connect')}
                          >
                            <Terminal size={11} />
                            {t('device.connect')}
                            <ChevronRight size={11} />
                          </Button>
                          {SNAPSHOT_DEVICES.has(device.name.toLowerCase()) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs font-mono-terminal bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 gap-1"
                              onClick={() => handleSnapshot(device)}
                              disabled={snapshotLoading === device.id}
                              title="Snapshot camera"
                            >
                              <Camera size={11} />
                              {snapshotLoading === device.id ? '…' : 'Snapshot'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => openEdit(device)}
                            title={t('device.edit')}
                          >
                            <Edit2 size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(device.id)}
                            title={t('device.delete')}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="font-mono-terminal text-xs text-muted-foreground text-center">
          Devices are stored in your browser's localStorage — never sent to any server.
        </p>
      </div>

      {/* Snapshot result dialog */}
      <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-mono-terminal text-sm text-primary flex items-center gap-2">
              <Camera size={14} />
              Snapshot —{' '}
              {snapshotResult
                ? devices.find(d => d.id === snapshotResult.deviceId)?.name ?? 'Device'
                : ''}
            </DialogTitle>
          </DialogHeader>
          {snapshotResult?.data.error && (
            <p className="font-mono-terminal text-xs text-destructive p-2 border border-destructive/30 rounded">
              {snapshotResult.data.error}
            </p>
          )}
          {snapshotResult?.data.gps_links && Object.keys(snapshotResult.data.gps_links).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(snapshotResult.data.gps_links).map(([cam, link]) => (
                <a
                  key={cam}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono-terminal text-xs text-primary underline hover:text-primary/80"
                >
                  <MapPin size={11} />
                  {cam} GPS
                </a>
              ))}
            </div>
          )}
          {snapshotResult?.data.photos && Object.keys(snapshotResult.data.photos).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {Object.entries(snapshotResult.data.photos).map(([filename, photo]) => (
                <div key={filename} className="space-y-1">
                  <p className="font-mono-terminal text-xs text-muted-foreground flex items-center gap-1">
                    {filename}
                    {photo.fresh && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1 rounded">fresh</span>
                    )}
                  </p>
                  <img
                    src={`data:image/jpeg;base64,${photo.b64}`}
                    alt={filename}
                    className="w-full rounded border border-border object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            !snapshotResult?.data.error && (
              <p className="font-mono-terminal text-xs text-muted-foreground text-center py-6">
                No photos returned.
              </p>
            )
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
