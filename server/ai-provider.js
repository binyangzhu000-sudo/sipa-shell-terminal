'use strict';

const OPENAI_COMPATIBLE_PROVIDERS = Object.freeze({
  openai: {
    apiKeyEnv: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
  },
  atlascloud: {
    apiKeyEnv: 'ATLASCLOUD_API_KEY',
    modelEnv: 'ATLASCLOUD_MODEL',
    defaultModel: 'deepseek-ai/deepseek-v4-pro',
    baseURL: 'https://api.atlascloud.ai/v1',
  },
});

function resolveOpenAICompatibleProvider(provider, env = process.env) {
  const spec = OPENAI_COMPATIBLE_PROVIDERS[provider];
  if (!spec) return null;

  const apiKey = env[spec.apiKeyEnv];
  if (!apiKey) return null;

  return {
    apiKey,
    baseURL: spec.baseURL,
    model: env[spec.modelEnv] || spec.defaultModel,
  };
}

module.exports = {
  OPENAI_COMPATIBLE_PROVIDERS,
  resolveOpenAICompatibleProvider,
};
