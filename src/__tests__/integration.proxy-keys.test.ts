import { describe, it, expect, beforeAll } from 'vitest';
import { createTestClient, testConfig } from '../test-utils';

/**
 * Integration Tests for Proxy Keys API
 * These tests create real proxy keys (cleanup required)
 * Requires: MQL_TOKEN environment variable
 */

describe('ProxyKeysAPI - Integration Tests (Real API)', () => {
  let createdKeyId: string;

  beforeAll(function() {
    if (!testConfig.token || testConfig.isProduction()) {
      this.skip();
    }
  });

  it('should create a proxy key', async () => {
    const mql = createTestClient();

    const response = await mql.proxyKeys.create({
      name: `test-key-${Date.now()}`,
      providers: [
        {
          provider: 'openai',
          api_key: process.env.OPENAI_API_KEY || 'sk-test'
        }
      ]
    });

    expect(response.id).toBeDefined();
    expect(response.proxyKey).toBeDefined();
    expect(response.name).toBeDefined();

    createdKeyId = response.id;
  });

  it('should list proxy keys', async () => {
    const mql = createTestClient();

    const response = await mql.proxyKeys.list();

    expect(response.keys).toBeDefined();
    expect(Array.isArray(response.keys)).toBe(true);
  });

  it('should get usage for a proxy key', async () => {
    if (!createdKeyId) {
      return; // Skip this test if key wasn't created
    }

    const mql = createTestClient();

    const usage = await mql.proxyKeys.getUsage(createdKeyId);

    expect(usage).toBeDefined();
    expect(typeof usage.totalRequests).toBe('number');
  });

  it('should test proxy key with chat', async () => {
    if (!createdKeyId) {
      return; // Skip this test if key wasn't created
    }

    const mql = createTestClient();

    const result = await mql.proxyKeys.test(createdKeyId, {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }]
    });

    expect(result).toBeDefined();
  });

  it('should regenerate proxy key', async () => {
    if (!createdKeyId) {
      return; // Skip this test if key wasn't created
    }

    const mql = createTestClient();

    const response = await mql.proxyKeys.regenerate(createdKeyId);

    expect(response.proxyKey).toBeDefined();
  });

  it('should delete proxy key', async () => {
    if (!createdKeyId) {
      return; // Skip this test if key wasn't created
    }

    const mql = createTestClient();

    const result = await mql.proxyKeys.delete(createdKeyId);

    expect(result.success).toBe(true);
  });
});
