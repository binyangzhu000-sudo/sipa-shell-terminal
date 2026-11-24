'use strict';

const OPENAI_COMPATIBLE_PROVIDERS = Object.freeze({
  openai: Object.freeze({
    apiKeyEnv: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
  }),
  atlascloud: Object.freeze({
    apiKeyEnv: 'ATLASCLOUD_API_KEY',
    modelEnv: 'ATLASCLOUD_MODEL',
    defaultModel: 'deepseek-ai/deepseek-v4-pro',
    baseURL: 'https://api.atlascloud.ai/v1',
  }),
});

function resolveOpenAICompatibleProvider(provider, env = process.env) {
  if (!Object.prototype.hasOwnProperty.call(OPENAI_COMPATIBLE_PROVIDERS, provider)) return null;
  const spec = OPENAI_COMPATIBLE_PROVIDERS[provider];

  const apiKey = env[spec.apiKeyEnv];
  if (!apiKey) return null;

  return {
    apiKey,
    baseURL: spec.baseURL,
    model: env[spec.modelEnv] || spec.defaultModel,
  };
}

function hasConfiguredAIKey(provider, env = process.env) {
  if (provider === 'anthropic') return Boolean(env.ANTHROPIC_API_KEY);
  return resolveOpenAICompatibleProvider(provider, env) !== null;
}

module.exports = {
  OPENAI_COMPATIBLE_PROVIDERS,
  hasConfiguredAIKey,
  resolveOpenAICompatibleProvider,
};
