import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { RefreshCw, Eraser, Copy, Download } from "lucide-react";

import { getOperatorToken } from './OperatorGate';

const WS_PROXY = import.meta.env.VITE_WS_PROXY ?? "wss://ws.soulinpsy.info";

type Status = "idle" | "connecting" | "connected" | "disconnected";

export type TerminalHandle = {
  getRecentLines: () => string;
};

export const TerminalPane = forwardRef<TerminalHandle>(function TerminalPane(_props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<import("@xterm/xterm").Terminal | null>(null);
  const fitRef = useRef<import("@xterm/addon-fit").FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);

  useImperativeHandle(ref, () => ({
    getRecentLines: () => bufferRef.current.slice(-20).join("\n"),
  }));

  useEffect(() => {
    let disposed = false;
    (async () => {
      const [{ Terminal }, { FitAddon }, { WebLinksAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
        import("@xterm/addon-web-links"),
      ]);
      if (disposed || !containerRef.current) return;
      const term = new Terminal({
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 13,
        cursorBlink: true,
        theme: { background: "#0a0a0a", foreground: "#00ff41", cursor: "#00ff41",
          selectionBackground: "rgba(0,255,65,0.3)" },
      });
      const fit = new FitAddon();
      term.loadAddon(fit);
      term.loadAddon(new WebLinksAddon());
      term.open(containerRef.current);
      fit.fit();
      term.writeln("\x1b[32mSIPA Shell · node-pty · Press Connect\x1b[0m");
      // Send raw keystrokes — wrapped as {type:'data'}
      term.onData((d) => {
        if (wsRef.current?.readyState === 1)
          wsRef.current.send(JSON.stringify({ type: "data", data: d }));
      });
      termRef.current = term;
      fitRef.current = fit;
    })();
    const onResize = () => fitRef.current?.fit();
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      window.removeEventListener("resize", onResize);
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, []);

  const recordOutput = (text: string) => {
    const lines = (bufferRef.current.join("") + text).split(/\r?\n/);
    bufferRef.current = lines.slice(-200);
  };

  const connect = () => {
    const term = termRef.current;
    if (!term) return;
    wsRef.current?.close();
    setStatus("connecting");
    // User param — default, workspace isolation by server
    const saved = JSON.parse(localStorage.getItem("sipa_shell_settings") || "{}");
    const proxyUrl = saved.wsProxy || WS_PROXY;
    const ws = new WebSocket(proxyUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "connect", mode: "bash", operatorToken: getOperatorToken() }));
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "connected") {
          setStatus("connected");
          term.writeln("\x1b[32m[connected]\x1b[0m");
          fitRef.current?.fit();
        } else if (msg.type === "data") {
          term.write(msg.data);
          recordOutput(msg.data);
        } else if (msg.type === "error") {
          term.writeln(`\r\n\x1b[31m[error] ${msg.message}\x1b[0m`);
          setStatus("disconnected");
        } else if (msg.type === "close") {
          term.writeln("\r\n\x1b[33m[disconnected]\x1b[0m");
          setStatus("disconnected");
        }
      } catch {
        // raw fallback
        term.write(e.data);
        recordOutput(e.data);
      }
    };
    ws.onerror = () => {
      term.writeln("\r\n\x1b[31m[WebSocket error]\x1b[0m");
      setStatus("disconnected");
    };
    ws.onclose = () => {
      if (status === "connected") {
        term.writeln("\r\n\x1b[33m[closed]\x1b[0m");
      }
      setStatus("disconnected");
    };
  };

  const clear = () => termRef.current?.clear();
  const copy = () => {
    const sel = termRef.current?.getSelection();
    const text = sel || bufferRef.current.join("\n");
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };
  const downloadLog = () => {
    const blob = new Blob([bufferRef.current.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sipa-shell-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const statusColor =
    status === "connected" ? "text-primary" :
    status === "connecting" ? "text-yellow-400" :
    status === "disconnected" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-2 font-mono text-xs">
        <span className={`${statusColor} font-semibold`}>● {status}</span>
        <button
          onClick={connect}
          disabled={status === "connecting"}
          className="rounded bg-primary px-3 py-1 font-bold text-primary-foreground disabled:opacity-50"
        >
          {status === "disconnected" ? "Reconnect" : "Connect"}
        </button>
        {status === "disconnected" && <RefreshCw className="h-3.5 w-3.5 text-destructive" />}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{WS_PROXY}</span>
      </div>
      <div className="flex items-center gap-2 border-b border-border p-2 font-mono text-xs">
        <button onClick={clear} className="flex items-center gap-1 rounded px-2 py-1 text-muted-foreground hover:text-primary">
          <Eraser className="h-3.5 w-3.5" /> Clear
        </button>
        <button onClick={copy} className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${copied ? "text-green-400" : "text-muted-foreground hover:text-primary"}`}>
          <Copy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy"}
        </button>
        <button onClick={downloadLog} className="flex items-center gap-1 rounded px-2 py-1 text-muted-foreground hover:text-primary">
          <Download className="h-3.5 w-3.5" /> Download log
        </button>
      </div>
      <div ref={containerRef} className="scanlines flex-1 overflow-hidden bg-[#0a0a0a] p-2" />
    </div>
  );
});
