/**
 * SIPA Shell — AI API 服务器
 *
 * 用途：提供流式 AI 回答接口，支持 Claude / OpenAI / Atlas Cloud
 * 运行：node server/api.js
 * 端口：默认 3001（API_PORT 环境变量可覆盖）
 *
 * 依赖安装：npm install express cors @anthropic-ai/sdk openai
 *
 * 环境变量（server/.env 或系统环境）：
 *   ANTHROPIC_API_KEY=sk-ant-...   使用 Claude
 *   OPENAI_API_KEY=sk-...          使用 GPT（备选）
 *   ATLASCLOUD_API_KEY=...         使用 Atlas Cloud（备选）
 *   ATLASCLOUD_MODEL=...           Atlas Cloud 模型（可选）
 *   AI_PROVIDER=anthropic|openai|atlascloud   默认 anthropic
 *   CORS_ORIGIN=*                  允许的跨域来源
 */

'use strict';

require('dotenv').config({ path: `${__dirname}/.env` });

const express = require('express');
const cors = require('cors');
const { hasConfiguredAIKey, resolveOpenAICompatibleProvider } = require('./ai-provider');

const app = express();
const PORT = parseInt(process.env.API_PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const AI_PROVIDER = process.env.AI_PROVIDER || 'anthropic';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

// 健康检查
app.get('/ping', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), provider: AI_PROVIDER });
});

// Banner / 版本信息
app.get('/banner', (_req, res) => {
  res.json({
    name: 'SIPA Shell API',
    version: '1.0.0',
    provider: AI_PROVIDER,
    endpoints: ['/ping', '/banner', '/ai/chat'],
  });
});

// AI 流式聊天
app.post('/ai/chat', async (req, res) => {
  const { messages = [], system = '' } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages 不能为空' });
  }

  // 设置 SSE 流式响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const defaultSystem = system || `你是 SIPA Shell 的 AI 命令助手，专注于 Linux/Unix 系统管理、SSH、Shell 脚本和服务器运维。
回复要求：
- 简洁、有实操价值
- 代码放在 markdown 代码块中（指定语言）
- 优先给出可直接运行的命令
- 如需解释，放在命令之后`;
  const openAICompatibleProvider = resolveOpenAICompatibleProvider(AI_PROVIDER);

  try {
    if (AI_PROVIDER === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 2048,
        system: defaultSystem,
        messages: messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content),
        })),
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          res.write(chunk.delta.text);
        }
      }
      res.end();

    } else if (openAICompatibleProvider) {
      const OpenAI = require('openai');
      const client = new OpenAI.default({
        apiKey: openAICompatibleProvider.apiKey,
        ...(openAICompatibleProvider.baseURL ? { baseURL: openAICompatibleProvider.baseURL } : {}),
      });

      const stream = await client.chat.completions.create({
        model: openAICompatibleProvider.model,
        max_tokens: 2048,
        stream: true,
        messages: [
          { role: 'system', content: defaultSystem },
          ...messages.map((m) => ({
            role: m.role,
            content: String(m.content),
          })),
        ],
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) res.write(delta);
      }
      res.end();

    } else {
      // Fallback mock 响应
      console.warn('[SIPA API] 未配置 AI API Key，使用 mock 响应');
      const lastMsg = messages[messages.length - 1];
      const userInput = String(lastMsg?.content || '').toLowerCase();

      let response = '**SIPA Shell AI 助手（演示模式）**\n\n';

      if (userInput.includes('ssh')) {
        response += '```bash\n# SSH 基本连接\nssh username@hostname -p 22\n\n# 使用密钥连接\nssh -i ~/.ssh/id_ed25519 user@host\n\n# 端口转发\nssh -L 8080:localhost:80 user@host\n```';
      } else if (userInput.includes('cpu') || userInput.includes('性能')) {
        response += '```bash\n# 实时 CPU 监控\nhtop\n\n# CPU 使用率\nmpstat 1 5\n\n# 进程 CPU 排序\nps aux --sort=-%cpu | head -10\n```';
      } else if (userInput.includes('磁盘') || userInput.includes('disk')) {
        response += '```bash\n# 磁盘使用情况\ndf -h\n\n# 目录大小\ndu -sh /var/log/*\n\n# 查找大文件\nfind / -size +100M -type f 2>/dev/null\n```';
      } else if (userInput.includes('日志') || userInput.includes('log')) {
        response += '```bash\n# 实时系统日志\ntail -f /var/log/syslog\n\n# journalctl\njournalctl -xe -f\n\n# 查看特定服务日志\njournalctl -u nginx -n 100\n```';
      } else {
        response += '请配置 ANTHROPIC_API_KEY、OPENAI_API_KEY 或 ATLASCLOUD_API_KEY 环境变量以获得完整 AI 功能。\n\n当前为演示模式，仅支持有限问答。';
      }

      // 模拟流式输出
      for (const char of response) {
        res.write(char);
        await new Promise((r) => setTimeout(r, 5));
      }
      res.end();
    }
  } catch (err) {
    console.error('[SIPA API] AI 请求失败:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI 服务暂时不可用', detail: err.message });
    } else {
      res.write(`\n\n[错误] AI 服务异常: ${err.message}`);
      res.end();
    }
  }
});

// 404 处理
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SIPA API] AI API 服务器已启动，监听 http://0.0.0.0:${PORT}`);
  console.log(`[SIPA API] AI 提供商: ${AI_PROVIDER}`);
  if (!hasConfiguredAIKey(AI_PROVIDER)) {
    console.warn(`[SIPA API] ⚠️  未检测到 AI_PROVIDER=${AI_PROVIDER} 对应的 API Key，将使用 mock 模式`);
  }
});
