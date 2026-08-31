# SIPA Shell Terminal

Web-based SSH terminal with an integrated AI assistant, part of the SIPA OS ecosystem.
Production: https://shell.sipa-os.org

## Project Directory

```
├── README.md # Documentation
├── components.json # Component library configuration
├── index.html # Entry file
├── package.json # Package management
├── postcss.config.js # PostCSS configuration
├── public # Static resources directory
│   ├── favicon.png # Icon
│   └── images # Image resources
├── src # Source code directory
│   ├── App.tsx # Entry file
│   ├── components # Components directory
│   ├── context # Context directory
│   ├── db # Database configuration directory
│   ├── hooks # Common hooks directory
│   ├── index.css # Global styles
│   ├── layout # Layout directory
│   ├── lib # Utility library directory
│   ├── main.tsx # Entry file
│   ├── routes.tsx # Routing configuration
│   ├── pages # Pages directory
│   ├── services # Database interaction directory
│   ├── types # Type definitions directory
├── tsconfig.app.json # TypeScript frontend configuration file
├── tsconfig.json # TypeScript configuration file
├── tsconfig.node.json # TypeScript Node.js configuration file
└── vite.config.ts # Vite configuration file
```

## Tech Stack

Vite, TypeScript, React, Supabase, Auth0, xterm.js

## Development

### Environment Requirements

```
# Node.js ≥ 20
# npm ≥ 10
```

### Getting started

```
# Step 1: Install dependencies: npm i
# Step 2: Start the development server: npm run dev -- --host 127.0.0.1
# Step 3: if that fails, run the dev server directly: npx vite --host 127.0.0.1
```

### Build

Production builds use the default Vite config directly:

```
npx vite build --outDir dist-clean
```

### How to develop backend services?

Configure environment variables and install relevant dependencies. If you need to use a database, please use the official version of Supabase.

The AI assistant supports `anthropic` by default, plus optional `openai` and `atlascloud` providers. Atlas Cloud uses the existing OpenAI-compatible streaming path, so selecting it does not change the default behavior:

```bash
AI_PROVIDER=atlascloud
ATLASCLOUD_API_KEY=your-api-key
ATLASCLOUD_MODEL=deepseek-ai/deepseek-v4-pro
```

`ATLASCLOUD_MODEL` is optional. The default is `deepseek-ai/deepseek-v4-pro`, and the Atlas Cloud base URL is configured internally as `https://api.atlascloud.ai/v1`.
