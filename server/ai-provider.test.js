'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  OPENAI_COMPATIBLE_PROVIDERS,
  hasConfiguredAIKey,
  resolveOpenAICompatibleProvider,
} = require('./ai-provider');

test('resolves Atlas Cloud as an optional OpenAI-compatible provider', () => {
  const resolved = resolveOpenAICompatibleProvider('atlascloud', {
    ATLASCLOUD_API_KEY: 'test-key',
  });

  assert.deepEqual(resolved, {
    apiKey: 'test-key',
    baseURL: 'https://api.atlascloud.ai/v1',
    model: 'deepseek-ai/deepseek-v4-pro',
  });
});

test('keeps the existing OpenAI defaults unchanged', () => {
  const resolved = resolveOpenAICompatibleProvider('openai', {
    OPENAI_API_KEY: 'test-key',
  });

  assert.equal(resolved.baseURL, undefined);
  assert.equal(resolved.model, 'gpt-4o-mini');
});

test('supports an Atlas Cloud model override', () => {
  const resolved = resolveOpenAICompatibleProvider('atlascloud', {
    ATLASCLOUD_API_KEY: 'test-key',
    ATLASCLOUD_MODEL: 'deepseek-ai/deepseek-v4-pro-0813',
  });

  assert.equal(resolved.model, 'deepseek-ai/deepseek-v4-pro-0813');
  assert.equal(OPENAI_COMPATIBLE_PROVIDERS.atlascloud.apiKeyEnv, 'ATLASCLOUD_API_KEY');
});

test('returns null when the selected provider is not configured', () => {
  assert.equal(resolveOpenAICompatibleProvider('atlascloud', {}), null);
  assert.equal(resolveOpenAICompatibleProvider('anthropic', {}), null);
});

test('ignores inherited object keys when looking up the provider', () => {
  for (const provider of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    assert.equal(resolveOpenAICompatibleProvider(provider, { undefined: 'x' }), null);
  }
});

test('freezes each provider spec, not only the registry', () => {
  assert.equal(Object.isFrozen(OPENAI_COMPATIBLE_PROVIDERS.atlascloud), true);
  assert.equal(Object.isFrozen(OPENAI_COMPATIBLE_PROVIDERS.openai), true);
});

test('checks the key of the selected provider, not any provider key', () => {
  assert.equal(hasConfiguredAIKey('anthropic', { ATLASCLOUD_API_KEY: 'k' }), false);
  assert.equal(hasConfiguredAIKey('anthropic', { ANTHROPIC_API_KEY: 'k' }), true);
  assert.equal(hasConfiguredAIKey('atlascloud', { ANTHROPIC_API_KEY: 'k' }), false);
  assert.equal(hasConfiguredAIKey('atlascloud', { ATLASCLOUD_API_KEY: 'k' }), true);
  assert.equal(hasConfiguredAIKey('openai', { OPENAI_API_KEY: 'k' }), true);
  assert.equal(hasConfiguredAIKey('__proto__', { ATLASCLOUD_API_KEY: 'k' }), false);
});
