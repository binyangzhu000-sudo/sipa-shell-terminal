/**
 * SIPA Shell — WebSocket ↔ SSH 代理服务器
 *
 * 用途：将浏览器 WebSocket 连接桥接到 SSH 服务器
 * 运行：node server/ws-ssh-proxy.js
 * 端口：默认 2222（WS_PORT 环境变量可覆盖）
 *
 * 依赖安装：npm install ws ssh2
 */

'use strict';

const { WebSocketServer } = require('ws');
const { Client: SshClient } = require('ssh2');

const PORT = parseInt(process.env.WS_PORT || '2222', 10);

const wss = new WebSocketServer({ port: PORT }, () => {
  console.log(`[SIPA Proxy] WebSocket SSH 代理已启动，监听 ws://0.0.0.0:${PORT}`);
  console.log('[SIPA Proxy] 等待浏览器连接...');
});

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress || 'unknown';
  console.log(`[SIPA Proxy] 新的 WebSocket 连接来自 ${clientIp}`);

  let ssh = null;
  let stream = null;
  let authReceived = false;

  const send = (obj) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  };

  const cleanup = () => {
    if (stream) {
      try { stream.close(); } catch {}
      stream = null;
    }
    if (ssh) {
      try { ssh.end(); } catch {}
      ssh = null;
    }
  };

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      // 非 JSON 数据忽略
      return;
    }

    if (msg.type === 'auth') {
      if (authReceived) {
        send({ type: 'error', message: '已经在认证中，请断开后重试' });
        return;
      }
      authReceived = true;

      const { host, port = 22, username, password, privateKey } = msg;

      if (!host || !username) {
        send({ type: 'error', message: '缺少必要参数: host 或 username' });
        ws.close();
        return;
      }

      console.log(`[SIPA Proxy] 正在连接 SSH: ${username}@${host}:${port}`);

      ssh = new SshClient();

      ssh.on('ready', () => {
        console.log(`[SIPA Proxy] SSH 已连接: ${username}@${host}:${port}`);

        ssh.shell({ term: 'xterm-256color' }, (err, s) => {
          if (err) {
            console.error('[SIPA Proxy] 打开 shell 失败:', err.message);
            send({ type: 'error', message: `无法打开 Shell: ${err.message}` });
            cleanup();
            ws.close();
            return;
          }

          stream = s;
          send({ type: 'connected' });

          // SSH → WebSocket
          stream.on('data', (chunk) => {
            send({ type: 'data', data: chunk.toString('utf8') });
          });

          stream.stderr?.on('data', (chunk) => {
            send({ type: 'data', data: chunk.toString('utf8') });
          });

          stream.on('close', () => {
            console.log(`[SIPA Proxy] SSH Stream 已关闭: ${username}@${host}`);
            send({ type: 'close' });
            cleanup();
            ws.close();
          });
        });
      });

      ssh.on('error', (err) => {
        console.error(`[SIPA Proxy] SSH 错误: ${err.message}`);
        let userMessage = err.message;
        if (err.message.includes('ECONNREFUSED')) {
          userMessage = `无法连接到 ${host}:${port}，请检查主机地址和端口`;
        } else if (err.message.includes('Authentication') || err.message.includes('auth')) {
          userMessage = '认证失败，请检查用户名和密码/密钥';
        } else if (err.message.includes('ETIMEDOUT') || err.message.includes('TIMEOUT')) {
          userMessage = `连接超时: ${host}:${port}`;
        }
        send({ type: 'error', message: userMessage });
        cleanup();
        ws.close();
      });

      ssh.on('end', () => {
        console.log(`[SIPA Proxy] SSH 连接结束: ${username}@${host}`);
      });

      // 构建认证选项
      const connectOptions = {
        host,
        port: parseInt(String(port), 10) || 22,
        username,
        readyTimeout: 10000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 3,
      };

      if (privateKey) {
        connectOptions.privateKey = privateKey;
      } else if (password) {
        connectOptions.password = password;
      } else {
        send({ type: 'error', message: '请提供密码或私钥' });
        ws.close();
        return;
      }

      ssh.connect(connectOptions);

    } else if (msg.type === 'data') {
      // WebSocket → SSH
      if (stream?.writable) {
        stream.write(msg.data);
      }
    } else if (msg.type === 'resize') {
      // 终端大小调整
      if (stream) {
        try {
          stream.setWindow(msg.rows || 24, msg.cols || 80, 0, 0);
        } catch {}
      }
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[SIPA Proxy] WebSocket 关闭 (${code}): ${reason || 'no reason'}`);
    cleanup();
  });

  ws.on('error', (err) => {
    console.error('[SIPA Proxy] WebSocket 错误:', err.message);
    cleanup();
  });
});

wss.on('error', (err) => {
  console.error('[SIPA Proxy] 服务器错误:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`[SIPA Proxy] 端口 ${PORT} 已被占用，请修改 WS_PORT 环境变量`);
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('[SIPA Proxy] 收到 SIGTERM，正在关闭...');
  wss.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[SIPA Proxy] 收到 SIGINT，正在关闭...');
  wss.close(() => process.exit(0));
});
