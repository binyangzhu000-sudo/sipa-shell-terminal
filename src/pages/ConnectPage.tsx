import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import {
  Wifi, Plus, Trash2, Copy, Edit2, Check, X, ChevronRight,
  Key, Terminal, QrCode, Shield, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AppLayout from '@/components/layouts/AppLayout';
import { useNavigate } from 'react-router-dom';

interface SavedConnection {
  id: string;
  name: string;
  host: string;
  port: string;
  username: string;
  authType: 'password' | 'key';
  createdAt: string;
}

const STORAGE_KEY = 'sipa_shell_connections';

function loadConnections(): SavedConnection[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveConnections(conns: SavedConnection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conns));
}

export default function ConnectPage() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<SavedConnection[]>(loadConnections);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', host: '', port: '22', username: '', authType: 'password' as 'password' | 'key' });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrTarget, setQrTarget] = useState('');
  const qrRef = useRef<HTMLCanvasElement>(null);

  const generateQr = async (target: string) => {
    try {
      const url = await QRCode.toDataURL(target, {
        width: 200,
        color: { dark: '#00ff41', light: '#000000' },
      });
      setQrDataUrl(url);
      setQrTarget(target);
    } catch {
      toast.error('QR 码生成失败');
    }
  };

  // Example: generate QR for the proxy URL
  useEffect(() => {
    const proxyUrl = import.meta.env.VITE_WS_PROXY || 'ws://localhost:2222';
    generateQr(`ssh://user@localhost:22 (proxy: ${proxyUrl})`);
  }, []);

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({ name: '', host: '', port: '22', username: '', authType: 'password' });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.name || !form.host || !form.username) {
      toast.error('请填写名称、主机和用户名');
      return;
    }
    if (editId) {
      const updated = connections.map(c =>
        c.id === editId ? { ...c, ...form } : c
      );
      setConnections(updated);
      saveConnections(updated);
      toast.success('连接已更新');
      setEditId(null);
    } else {
      const newConn: SavedConnection = {
        id: crypto.randomUUID(),
        ...form,
        createdAt: new Date().toISOString(),
      };
      const updated = [...connections, newConn];
      setConnections(updated);
      saveConnections(updated);
      toast.success('连接已保存');
    }
    setAddOpen(false);
    resetForm();
  };

  const handleEdit = (conn: SavedConnection) => {
    setForm({
      name: conn.name,
      host: conn.host,
      port: conn.port,
      username: conn.username,
      authType: conn.authType,
    });
    setEditId(conn.id);
    setAddOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = connections.filter(c => c.id !== deleteId);
    setConnections(updated);
    saveConnections(updated);
    setDeleteId(null);
    toast.success('连接已删除');
  };

  const handleQuickConnect = (conn: SavedConnection) => {
    // Store connection params in session storage for shell page to pick up
    sessionStorage.setItem('sipa_quick_connect', JSON.stringify(conn));
    navigate('/shell');
    toast.info(`正在跳转到终端，连接 ${conn.name}…`);
  };

  const copyCommand = (conn: SavedConnection) => {
    const cmd = `ssh ${conn.username}@${conn.host} -p ${conn.port}`;
    navigator.clipboard.writeText(cmd);
    toast.success('SSH 命令已复制');
  };

  const publicKey = '# 在服务器上添加你的公钥：\n# cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys\n# chmod 600 ~/.ssh/authorized_keys';

  return (
    <AppLayout title="SSH 连接管理">
      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        {/* QR Code card */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <QrCode size={16} className="text-primary" />
            <h2 className="font-mono-terminal text-sm text-primary">快速连接 QR 码</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="SSH QR Code"
                  className="w-40 h-40 border border-primary/30 glow-green-sm"
                />
              ) : (
                <div className="w-40 h-40 border border-border flex items-center justify-center">
                  <QrCode size={32} className="text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <p className="font-mono-terminal text-xs text-muted-foreground">
                扫描二维码获取连接信息。选择连接后点击二维码图标生成。
              </p>
              <div className="bg-black/50 border border-border p-3">
                <p className="font-mono-terminal text-xs text-muted-foreground mb-1">连接目标</p>
                <p className="font-mono-terminal text-xs text-primary break-all">{qrTarget || '未生成'}</p>
              </div>
              <div className="flex gap-2">
                {connections.length > 0 && connections.slice(0, 3).map(conn => (
                  <Button
                    key={conn.id}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs font-mono-terminal border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                    onClick={() => generateQr(`ssh://${conn.username}@${conn.host}:${conn.port}`)}
                  >
                    {conn.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Public key info */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-info" />
            <h2 className="font-mono-terminal text-sm text-info">SSH 密钥认证</h2>
          </div>
          <div className="bg-black/50 border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono-terminal text-xs text-muted-foreground">设置公钥认证</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary"
                onClick={() => { navigator.clipboard.writeText(publicKey); toast.success('已复制'); }}
              >
                <Copy size={12} />
              </Button>
            </div>
            <pre className="font-mono-terminal text-xs text-primary whitespace-pre-wrap">{publicKey}</pre>
          </div>
          <div className="mt-3 space-y-1">
            <p className="font-mono-terminal text-xs text-muted-foreground">1. 在本地生成密钥：<code className="text-primary">ssh-keygen -t ed25519</code></p>
            <p className="font-mono-terminal text-xs text-muted-foreground">2. 上传到服务器：<code className="text-primary">ssh-copy-id user@host</code></p>
            <p className="font-mono-terminal text-xs text-muted-foreground">3. 在连接表单中粘贴私钥内容即可免密登录</p>
          </div>
        </div>

        {/* Saved connections */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-primary" />
              <h2 className="font-mono-terminal text-sm text-primary">已保存的连接</h2>
              <Badge className="font-mono-terminal text-xs px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                {connections.length}
              </Badge>
            </div>
            <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="h-7 text-xs font-mono-terminal bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm gap-1"
                >
                  <Plus size={12} />
                  新增
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-mono-terminal text-sm text-primary">
                    {editId ? '编辑连接' : '新增连接'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">连接名称</Label>
                    <Input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="我的服务器" className="font-mono-terminal text-sm h-8 bg-input border-border" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">主机地址</Label>
                      <Input value={form.host} onChange={e => updateForm('host', e.target.value)} placeholder="example.com" className="font-mono-terminal text-sm h-8 bg-input border-border" />
                    </div>
                    <div>
                      <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">端口</Label>
                      <Input value={form.port} onChange={e => updateForm('port', e.target.value)} placeholder="22" className="font-mono-terminal text-sm h-8 bg-input border-border" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">用户名</Label>
                    <Input value={form.username} onChange={e => updateForm('username', e.target.value)} placeholder="root" className="font-mono-terminal text-sm h-8 bg-input border-border" />
                  </div>
                  <div>
                    <Label className="text-xs font-mono-terminal text-muted-foreground mb-1 block">认证方式</Label>
                    <div className="flex gap-2">
                      {(['password', 'key'] as const).map(t => (
                        <Button key={t} variant="ghost" size="sm" className={`flex-1 h-7 text-xs font-mono-terminal border ${form.authType === t ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`} onClick={() => updateForm('authType', t)}>
                          {t === 'password' ? '密码' : 'SSH 密钥'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1 h-8 font-mono-terminal text-sm bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>
                      <Check size={12} className="mr-1" />
                      保存
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
              <p className="font-mono-terminal text-sm text-muted-foreground">暂无保存的连接</p>
              <p className="font-mono-terminal text-xs text-muted-foreground mt-1">点击"新增"添加 SSH 连接</p>
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
                        {conn.authType === 'password' ? '密码' : '密钥'}
                      </Badge>
                    </div>
                    <p className="font-mono-terminal text-xs text-muted-foreground truncate">
                      {conn.username}@{conn.host}:{conn.port}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => copyCommand(conn)} title="复制命令">
                      <Copy size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => generateQr(`ssh://${conn.username}@${conn.host}:${conn.port}`)} title="生成 QR">
                      <QrCode size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleEdit(conn)} title="编辑">
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(conn.id)} title="删除">
                      <Trash2 size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs font-mono-terminal bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 glow-green-sm gap-1" onClick={() => handleQuickConnect(conn)}>
                      连接
                      <ChevronRight size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SSH command reference */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink size={16} className="text-muted-foreground" />
            <h2 className="font-mono-terminal text-sm text-muted-foreground">常用 SSH 命令参考</h2>
          </div>
          <div className="space-y-2">
            {[
              ['基本连接', 'ssh username@host -p 22'],
              ['指定密钥', 'ssh -i ~/.ssh/id_ed25519 user@host'],
              ['端口转发', 'ssh -L 8080:localhost:80 user@host'],
              ['后台连接', 'ssh -fN -L 3306:localhost:3306 user@host'],
              ['复制文件', 'scp local_file user@host:/remote/path/'],
            ].map(([label, cmd]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="font-mono-terminal text-xs text-muted-foreground w-20 shrink-0">{label}</span>
                <div className="flex-1 min-w-0 flex items-center gap-2 bg-black/40 px-3 py-1.5 border border-border">
                  <code className="font-mono-terminal text-xs text-primary flex-1 truncate">{cmd}</code>
                  <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-primary" onClick={() => { navigator.clipboard.writeText(cmd); toast.success('已复制'); }}>
                    <Copy size={10} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono-terminal text-sm text-foreground">确认删除</AlertDialogTitle>
            <AlertDialogDescription className="font-mono-terminal text-xs text-muted-foreground">
              此操作不可撤销，确定要删除这个连接吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono-terminal text-xs h-8">取消</AlertDialogCancel>
            <AlertDialogAction className="font-mono-terminal text-xs h-8 bg-destructive text-destructive-foreground" onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
