import React, { useState } from 'react';
import { Copy, BookOpen, ChevronDown, ChevronRight, Terminal, Globe, Wifi, Bot, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AppLayout from '@/components/layouts/AppLayout';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const copy = () => {
    navigator.clipboard.writeText(code);
    toast.success('代码已复制');
  };
  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-black/60 border border-border px-3 py-1.5">
        <span className="font-mono-terminal text-xs text-muted-foreground">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={copy}
        >
          <Copy size={10} />
        </Button>
      </div>
      <pre className="bg-black/80 border border-t-0 border-border p-4 overflow-x-auto">
        <code className="font-mono-terminal text-xs text-primary leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function Accordion({ sections }: { sections: Section[] }) {
  const [open, setOpen] = useState<string | null>(sections[0]?.id || null);
  return (
    <div className="space-y-2">
      {sections.map(s => (
        <div key={s.id} className="glass-panel border border-border overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-primary/3 transition-colors"
            onClick={() => setOpen(open === s.id ? null : s.id)}
          >
            <div className="flex items-center gap-3">
              {s.icon}
              <span className="font-mono-terminal text-sm text-foreground">{s.title}</span>
            </div>
            {open === s.id
              ? <ChevronDown size={14} className="text-muted-foreground shrink-0" />
              : <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            }
          </button>
          {open === s.id && (
            <div className="px-4 pb-5 pt-1 border-t border-border">
              {s.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3 font-mono-terminal text-xs text-muted-foreground leading-relaxed">{children}</div>;
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 w-5 h-5 flex items-center justify-center border border-primary/30 text-primary text-xs">{n}</span>
      <div className="flex-1 min-w-0 pt-0.5">{children}</div>
    </div>
  );
}

const FAQs = [
  {
    q: 'SSH 终端需要什么环境？',
    a: '需要本地运行 server/ws-ssh-proxy.js，该脚本监听 WebSocket 端口 2222，并将连接桥接到目标 SSH 服务器。可以通过 Cloudflare Tunnel 将代理发布到公网。',
  },
  {
    q: '为什么终端在 Preview 中无法真正连接？',
    a: '浏览器托管环境无法直接访问你本地的 ws-ssh-proxy。需要在本机或 VPS 上运行代理，并配置好 VITE_WS_PROXY 环境变量（或在设置页面填入代理 URL）。',
  },
  {
    q: 'AI 助手在没有 API 的情况下如何工作？',
    a: '当 VITE_API_URL 未设置时，AI 助手使用内置的 fallback 模式，可以回答常见 Linux 命令问题。配置 server/api.js 后可获得完整的 AI 能力（支持 Claude / GPT 流式回答）。',
  },
  {
    q: 'Cloudflare Tunnel 和直接开放端口有什么区别？',
    a: 'Cloudflare Tunnel 不需要公网 IP 或开放防火墙端口，通过 Cloudflare 边缘节点建立出站连接，安全性更高。直接开放端口更简单，适合有 VPS 的用户。',
  },
  {
    q: '如何保存连接信息？',
    a: '在"SSH 连接"页面可以保存连接（存储在浏览器 localStorage），支持名称、主机、端口、用户名、认证方式。在"查找设备"页面也可一键将设备添加到连接列表。',
  },
  {
    q: '支持哪些 SSH 认证方式？',
    a: '当前支持密码认证和私钥认证（将私钥内容粘贴到输入框）。代理后端使用 ssh2 库处理认证，与原生 SSH 客户端兼容。',
  },
];

export default function DocsPage() {
  const sections: Section[] = [
    {
      id: 'quickstart',
      icon: <Terminal size={14} className="text-primary" />,
      title: '快速开始',
      content: (
        <Prose>
          <div className="space-y-3">
            <Step n={1}>
              <p>克隆项目并安装依赖：</p>
              <CodeBlock code={`git clone https://github.com/your-org/sipa-shell.git
cd sipa-shell
pnpm install`} />
            </Step>
            <Step n={2}>
              <p>安装代理服务器依赖：</p>
              <CodeBlock code={`cd server
npm install ssh2 ws express cors`} />
            </Step>
            <Step n={3}>
              <p>启动 WebSocket SSH 代理（终端窗口 1）：</p>
              <CodeBlock code={`node server/ws-ssh-proxy.js
# 监听 ws://localhost:2222`} />
            </Step>
            <Step n={4}>
              <p>启动 AI API 服务器（终端窗口 2，可选）：</p>
              <CodeBlock code={`node server/api.js
# 监听 http://localhost:3001`} />
            </Step>
            <Step n={5}>
              <p>启动前端开发服务器：</p>
              <CodeBlock code={`pnpm dev
# 访问 http://localhost:5173`} />
            </Step>
            <Step n={6}>
              <p>打开浏览器访问 <span className="text-primary">/shell</span> 页面，填写 SSH 服务器信息点击"连接"即可。</p>
            </Step>
          </div>
        </Prose>
      ),
    },
    {
      id: 'cf-tunnel',
      icon: <Globe size={14} className="text-warning" />,
      title: 'Cloudflare Tunnel 配置',
      content: (
        <Prose>
          <p>通过 Cloudflare Tunnel 将本地代理安全发布到公网，无需公网 IP 和开放端口。</p>
          <div className="space-y-3">
            <Step n={1}>
              <p>安装 cloudflared CLI：</p>
              <CodeBlock code={`# macOS
brew install cloudflared

# Linux (x86_64)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Windows (scoop)
scoop install cloudflared`} />
            </Step>
            <Step n={2}>
              <p>登录 Cloudflare 账号：</p>
              <CodeBlock code="cloudflared tunnel login" />
            </Step>
            <Step n={3}>
              <p>创建隧道：</p>
              <CodeBlock code={`cloudflared tunnel create sipa-shell-proxy
# 记录输出的 Tunnel ID`} />
            </Step>
            <Step n={4}>
              <p>创建配置文件 <span className="text-primary">~/.cloudflared/config.yml</span>：</p>
              <CodeBlock language="yaml" code={`tunnel: <YOUR_TUNNEL_ID>
credentials-file: /root/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: shell-proxy.your-domain.com
    service: ws://localhost:2222
    originRequest:
      noTLSVerify: false
  - service: http_status:404`} />
            </Step>
            <Step n={5}>
              <p>在 Cloudflare DNS 添加 CNAME 记录，然后启动隧道：</p>
              <CodeBlock code={`cloudflared tunnel run sipa-shell-proxy
# 或作为系统服务
cloudflared service install`} />
            </Step>
            <Step n={6}>
              <p>在设置页面将代理 URL 设置为：</p>
              <CodeBlock code="wss://shell-proxy.your-domain.com" />
            </Step>
          </div>
          <div className="bg-warning/10 border border-warning/20 p-3 mt-3">
            <div className="flex gap-2">
              <AlertTriangle size={12} className="text-warning shrink-0 mt-0.5" />
              <p className="text-warning text-xs">注意：确保域名已添加到 Cloudflare，并且 WebSocket 在 Cloudflare 中已开启。</p>
            </div>
          </div>
        </Prose>
      ),
    },
    {
      id: 'proxy-setup',
      icon: <Wifi size={14} className="text-primary" />,
      title: 'WS-SSH 代理服务器',
      content: (
        <Prose>
          <p>代理服务器（<span className="text-primary">server/ws-ssh-proxy.js</span>）负责将 WebSocket 连接桥接到 SSH 服务器。</p>
          <p>协议流程：</p>
          <div className="bg-black/50 border border-border p-3 my-2">
            <p className="text-primary text-xs font-mono-terminal">
              浏览器 → WebSocket → ws-ssh-proxy.js → ssh2 → SSH Server
            </p>
          </div>
          <p>消息格式（JSON）：</p>
          <CodeBlock language="json" code={`// 客户端 → 代理（认证）
{ "type": "auth", "host": "192.168.1.1", "port": 22,
  "username": "root", "password": "pass" }

// 客户端 → 代理（数据）
{ "type": "data", "data": "ls -la\\n" }

// 代理 → 客户端（成功）
{ "type": "connected" }

// 代理 → 客户端（数据）
{ "type": "data", "data": "..." }

// 代理 → 客户端（错误）
{ "type": "error", "message": "..." }`} />
          <p>运行代理：</p>
          <CodeBlock code={`# 默认端口 2222
node server/ws-ssh-proxy.js

# 自定义端口
PORT=8022 node server/ws-ssh-proxy.js`} />
        </Prose>
      ),
    },
    {
      id: 'ai-setup',
      icon: <Bot size={14} className="text-accent-foreground" />,
      title: 'AI 服务配置',
      content: (
        <Prose>
          <p>AI 助手通过 <span className="text-accent-foreground">server/api.js</span> 提供流式回答。</p>
          <p>支持的 AI 提供商（在 api.js 中配置）：</p>
          <CodeBlock code={`# 设置 API Key（在 server/.env 或环境变量中）
ANTHROPIC_API_KEY=sk-ant-...   # Claude
OPENAI_API_KEY=sk-...          # GPT
# 或使用其他兼容 OpenAI 格式的 API`} />
          <p>前端配置：</p>
          <CodeBlock code={`# .env.local
VITE_API_URL=http://localhost:3001

# 使用 Cloudflare Tunnel 后
VITE_API_URL=https://api.your-domain.com`} />
          <p>启动 API 服务：</p>
          <CodeBlock code="node server/api.js   # 监听 :3001" />
          <div className="bg-accent/20 border border-accent-foreground/10 p-3">
            <p className="text-accent-foreground text-xs">
              当 VITE_API_URL 为空时，前端使用内置 fallback 模式，可以演示常见命令问答。
            </p>
          </div>
        </Prose>
      ),
    },
    {
      id: 'env',
      icon: <Shield size={14} className="text-info" />,
      title: '环境变量参考',
      content: (
        <Prose>
          <CodeBlock language="env" code={`# 前端环境变量 (.env.local)
# WebSocket SSH 代理地址
VITE_WS_PROXY=ws://localhost:2222

# AI API 服务地址（留空使用 fallback）
VITE_API_URL=http://localhost:3001

# ---
# 服务端环境变量 (server/.env)
# 代理监听端口
WS_PORT=2222

# AI API 服务端口
API_PORT=3001

# AI API Key（任选其一）
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxx

# 允许的跨域来源（生产环境设置）
CORS_ORIGIN=https://your-app.com`} />
        </Prose>
      ),
    },
  ];

  return (
    <AppLayout title="文档">
      <div className="p-4 md:p-6 max-w-3xl space-y-6">
        {/* Header */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen size={20} className="text-primary" />
            <h1 className="font-mono-terminal text-base text-primary text-glow-green">SIPA Shell 文档</h1>
          </div>
          <p className="font-mono-terminal text-xs text-muted-foreground text-pretty">
            本文档涵盖快速开始、Cloudflare Tunnel 配置、WebSocket 代理搭建、AI 服务集成，以及常见问题解答。
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['快速开始', 'CF Tunnel', '代理服务器', 'AI 配置', '环境变量'].map(tag => (
              <span key={tag} className="font-mono-terminal text-xs px-2 py-0.5 border border-primary/20 text-primary/60">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Sections */}
        <Accordion sections={sections} />

        {/* FAQ */}
        <div className="glass-panel border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={14} className="text-primary" />
            <h2 className="font-mono-terminal text-sm text-primary">常见问题 (FAQ)</h2>
          </div>
          <div className="space-y-4">
            {FAQs.map((faq, i) => (
              <div key={i} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <p className="font-mono-terminal text-xs text-foreground font-medium mb-1.5">
                  Q: {faq.q}
                </p>
                <p className="font-mono-terminal text-xs text-muted-foreground leading-relaxed">
                  A: {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="glass-panel border border-border p-5">
          <h2 className="font-mono-terminal text-sm text-primary mb-4">// 技术栈</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              ['@xterm/xterm', '终端模拟器'],
              ['WebSocket', '实时双向通信'],
              ['ssh2', 'Node.js SSH 客户端'],
              ['React + Vite', '前端框架'],
              ['Tailwind CSS', '样式系统'],
              ['Cloudflare Tunnel', '安全隧道'],
            ].map(([name, desc]) => (
              <div key={name} className="border border-border p-2.5">
                <p className="font-mono-terminal text-xs text-primary">{name}</p>
                <p className="font-mono-terminal text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
