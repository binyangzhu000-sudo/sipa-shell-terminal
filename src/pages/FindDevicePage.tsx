import React, { useState } from 'react';
import { toast } from 'sonner';
import { Search, Loader2, Wifi, WifiOff, Terminal, Plus, Trash2, ChevronRight, Cpu, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/components/layouts/AppLayout';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Device {
  id: string;
  name: string;
  ip: string;
  port: string;
  username: string;
  os: string;
  status: 'online' | 'offline' | 'unknown';
  lastSeen?: string;
}

const SAMPLE_DEVICES: Device[] = [
  { id: '1', name: 'Web Server', ip: '192.168.1.10', port: '22', username: 'admin', os: 'Ubuntu 22.04', status: 'online', lastSeen: '刚刚' },
  { id: '2', name: 'DB Server', ip: '192.168.1.20', port: '22', username: 'postgres', os: 'Debian 12', status: 'online', lastSeen: '2 分钟前' },
  { id: '3', name: 'Dev Machine', ip: '192.168.1.30', port: '2222', username: 'developer', os: 'Ubuntu 20.04', status: 'offline', lastSeen: '3 小时前' },
  { id: '4', name: 'Backup Server', ip: '10.0.0.5', port: '22', username: 'backup', os: 'CentOS 7', status: 'unknown', lastSeen: '1 天前' },
];

const OS_ICONS: Record<string, string> = {
  ubuntu: '🐧',
  debian: '🐧',
  centos: '🐧',
  arch: '🐧',
  windows: '🪟',
  macos: '🍎',
};

function getOsIcon(os: string) {
  const lower = os.toLowerCase();
  for (const key of Object.keys(OS_ICONS)) {
    if (lower.includes(key)) return OS_ICONS[key];
  }
  return '💻';
}

function StatusBadge({ status }: { status: Device['status'] }) {
  const map = {
    online: { label: '在线', className: 'text-primary border-primary/30 bg-primary/10' },
    offline: { label: '离线', className: 'text-destructive border-destructive/30 bg-destructive/10' },
    unknown: { label: '未知', className: 'text-muted-foreground border-border bg-muted/10' },
  };
  const { label, className } = map[status];
  return (
    <span className={cn('font-mono-terminal text-xs px-2 py-0.5 border', className)}>
      {status === 'online' && <span className="status-pulse inline-block w-1.5 h-1.5 rounded-full bg-primary mr-1.5 align-middle" />}
      {label}
    </span>
  );
}

export default function FindDevicePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [devices, setDevices] = useState<Device[]>(SAMPLE_DEVICES);
  const [searchResult, setSearchResult] = useState<Device | null>(null);
  const [searchDone, setSearchDone] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('请输入设备名称或 IP 地址');
      return;
    }
    setSearching(true);
    setSearchDone(false);

    // Simulate search
    await new Promise(r => setTimeout(r, 800));

    const found = devices.find(d =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.ip.includes(query) ||
      d.username.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResult(found || null);
    setSearchDone(true);
    setSearching(false);

    if (!found) {
      toast.info('未找到匹配的设备');
    }
  };

  const handleQuickConnect = (device: Device) => {
    sessionStorage.setItem('sipa_quick_connect', JSON.stringify({
      name: device.name,
      host: device.ip,
      port: device.port,
      username: device.username,
      authType: 'password',
    }));
    navigate('/shell');
    toast.info(`正在跳转，连接 ${device.name}…`);
  };

  const handleRemoveDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
    toast.success('设备已从列表移除');
  };

  const handleAddToConnections = (device: Device) => {
    const stored = JSON.parse(localStorage.getItem('sipa_shell_connections') || '[]');
    const newConn = {
      id: crypto.randomUUID(),
      name: device.name,
      host: device.ip,
      port: device.port,
      username: device.username,
      authType: 'password',
      createdAt: new Date().toISOString(),
    };
    stored.push(newConn);
    localStorage.setItem('sipa_shell_connections', JSON.stringify(stored));
    toast.success(`${device.name} 已添加到连接列表`);
  };

  const filteredDevices = query.trim()
    ? devices.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.ip.includes(query)
      )
    : devices;

  return (
    <AppLayout title="查找设备">
      <div className="p-4 md:p-6 space-y-6 max-w-4xl">
        {/* Search */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search size={16} className="text-primary" />
            <h2 className="font-mono-terminal text-sm text-primary">设备搜索</h2>
          </div>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="输入设备名称、IP 地址或用户名..."
              className="font-mono-terminal text-sm h-9 bg-input border-border focus:border-primary flex-1"
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <Button
              className="h-9 px-4 font-mono-terminal text-sm bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm gap-2 shrink-0"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              搜索
            </Button>
          </div>
        </div>

        {/* Search result */}
        {searchDone && (
          <div className="glass-panel border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Network size={16} className="text-primary" />
              <h2 className="font-mono-terminal text-sm text-primary">搜索结果</h2>
            </div>
            {searchResult ? (
              <div className="border border-primary/30 p-4 bg-primary/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center border border-primary/20 font-mono-terminal text-lg">
                      {getOsIcon(searchResult.os)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono-terminal text-sm text-foreground font-medium">{searchResult.name}</span>
                        <StatusBadge status={searchResult.status} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-mono-terminal text-xs text-muted-foreground">IP: <span className="text-primary">{searchResult.ip}:{searchResult.port}</span></p>
                        <p className="font-mono-terminal text-xs text-muted-foreground">用户: <span className="text-foreground">{searchResult.username}</span></p>
                        <p className="font-mono-terminal text-xs text-muted-foreground">系统: <span className="text-foreground">{searchResult.os}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="h-7 text-xs font-mono-terminal bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm gap-1"
                      onClick={() => handleQuickConnect(searchResult)}
                    >
                      <Terminal size={12} />
                      快速连接
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-mono-terminal border border-border text-muted-foreground hover:text-primary gap-1"
                      onClick={() => handleAddToConnections(searchResult)}
                    >
                      <Plus size={12} />
                      保存连接
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-border">
                <WifiOff size={28} className="text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-mono-terminal text-sm text-muted-foreground">未找到设备 "{query}"</p>
                <p className="font-mono-terminal text-xs text-muted-foreground mt-1">尝试其他搜索词，或手动添加到连接列表</p>
              </div>
            )}
          </div>
        )}

        {/* Devices table */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-primary" />
              <h2 className="font-mono-terminal text-sm text-primary">已知设备</h2>
              <Badge className="font-mono-terminal text-xs px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                {filteredDevices.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2 font-mono-terminal text-xs text-muted-foreground">
              <span className="status-pulse inline-block w-1.5 h-1.5 rounded-full bg-primary" />
              在线: {devices.filter(d => d.status === 'online').length}
              <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-destructive/70" />
              离线: {devices.filter(d => d.status === 'offline').length}
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-max">
              <thead>
                <tr className="border-b border-border">
                  {['设备名称', 'IP 地址', '端口', '用户名', '操作系统', '最后在线', '状态', '操作'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono-terminal text-xs text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map(device => (
                  <tr key={device.id} className="border-b border-border/50 hover:bg-primary/3 transition-colors">
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getOsIcon(device.os)}</span>
                        <span className="font-mono-terminal text-xs text-foreground">{device.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-primary">{device.ip}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-muted-foreground">{device.port}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-foreground">{device.username}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-muted-foreground">{device.os}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono-terminal text-xs text-muted-foreground">{device.lastSeen || '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={device.status} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleQuickConnect(device)} title="连接">
                          <ChevronRight size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleAddToConnections(device)} title="保存">
                          <Plus size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveDevice(device.id)} title="移除">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredDevices.length === 0 && (
            <div className="text-center py-8">
              <Search size={24} className="text-muted-foreground/40 mx-auto mb-2" />
              <p className="font-mono-terminal text-xs text-muted-foreground">没有找到匹配的设备</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
