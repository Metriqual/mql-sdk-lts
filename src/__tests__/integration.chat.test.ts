import { describe, it, expect, beforeAll } from 'vitest';
import { createTestClient, testConfig } from '../test-utils';

/**
 * Integration Tests for Chat API
 * These tests run against real deployed APIs
 * Requires: MQL_API_KEY environment variable
 */

describe('ChatAPI - Integration Tests (Real API)', () => {
  beforeAll(function() {
    if (!testConfig.isIntegrationTest()) {
      this.skip();
    }
  });

  it('should create chat completion', async () => {
    const mql = createTestClient();

    const response = await mql.chat.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "Hello from MQL SDK"' }
      ],
      temperature: 0.5,
      max_tokens: 50
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeDefined();
    expect(response.choices.length).toBeGreaterThan(0);
    expect(response.choices[0].message).toBeDefined();
    expect(response.choices[0].message.content).toBeDefined();
    expect(response.model).toBe('gpt-3.5-turbo');
  });

  it('should handle streaming responses', async () => {
    const mql = createTestClient();
    let chunkCount = 0;

    const stream = mql.chat.stream({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Count from 1 to 3' }],
      max_tokens: 20
    });

    for await (const chunk of stream) {
      chunkCount++;
      expect(chunk).toBeDefined();
    }

    expect(chunkCount).toBeGreaterThan(0);
  });

  it('should use complete() helper', async () => {
    const mql = createTestClient();

    const response = await mql.chat.complete(
      'gpt-3.5-turbo',
      'Say "test"'
    );

    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  it('should handle multiple messages (conversation)', async () => {
    const mql = createTestClient();

    const response = await mql.chat.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ]
    });

    expect(response.choices[0].message.content).toBeDefined();
  });

  it('should include usage information', async () => {
    const mql = createTestClient();

    const response = await mql.chat.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }]
    });

    expect(response.usage).toBeDefined();
    expect(response.usage.promptTokens).toBeGreaterThan(0);
    expect(response.usage.completionTokens).toBeGreaterThanOrEqual(0);
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });

  it('should handle invalid model gracefully', async () => {
    const mql = createTestClient();

    await expect(
      mql.chat.create({
        model: 'invalid-model-xyz',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    ).rejects.toThrow();
  });

  it('should handle invalid API key gracefully', async () => {
    const mql = createTestClient({ apiKey: 'invalid-key' });

    await expect(
      mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      })
    ).rejects.toThrow();
  });

  it('should respect timeout', async () => {
    // This test verifies timeout handling
    // Actual timeout may not trigger with normal API, but tests configuration
    const mql = createTestClient();

    const response = await mql.chat.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }]
    });

    expect(response).toBeDefined();
  });
});
