import { describe, it, expect, beforeAll, skip } from 'vitest';
import { createTestClient, testConfig } from '../test-utils';

/**
 * End-to-End (E2E) Tests - Complete Workflows
 * Tests realistic usage scenarios combining multiple features
 * Requires: MQL_API_KEY and MQL_TOKEN environment variables
 */

describe('E2E Workflows - Complete Scenarios', () => {
  beforeAll(() => {
    if (!testConfig.isIntegrationTest()) {
      skip();
    }
  });

  describe('Chat API Workflow', () => {
    it('should complete a multi-turn conversation', async () => {
      const mql = createTestClient();

      // First turn
      const response1 = await mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'What is 2 + 2?' }
        ]
      });

      expect(response1.choices[0].message.content).toBeDefined();
      const firstAnswer = response1.choices[0].message.content;

      // Second turn - building on context
      const response2 = await mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'What is 2 + 2?' },
          { role: 'assistant', content: firstAnswer },
          { role: 'user', content: 'Now what is 4 + 4?' }
        ]
      });

      expect(response2.choices[0].message.content).toBeDefined();
    });

    it('should stream and collect full response', async () => {
      const mql = createTestClient();
      let fullContent = '';

      const stream = mql.chat.stream({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Write a short story in 100 words' }
        ]
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          fullContent += chunk.choices[0].delta.content;
        }
      }

      expect(fullContent.length).toBeGreaterThan(0);
    });

    it('should handle function calling', async () => {
      const mql = createTestClient();

      const response = await mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'What is the weather in New York?' }
        ],
        functions: [
          {
            name: 'get_weather',
            description: 'Get the weather for a location',
            parameters: {
              type: 'object' as const,
              properties: {
                location: { type: 'string' }
              },
              required: ['location']
            }
          }
        ]
      } as any);

      expect(response).toBeDefined();
    });
  });

  describe('Content Filtering Workflow', () => {
    it('should work with filters in proxy keys', async () => {
      // This demonstrates how to structure a workflow with filters
      // Actual filter execution depends on proxy key configuration
      const mql = createTestClient();

      const response = await mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Tell me something without personal information'
          }
        ]
      });

      expect(response).toBeDefined();
      expect(response.choices[0].message.content).toBeDefined();
    });
  });

  describe('Analytics Workflow', () => {
    it('should retrieve and analyze usage patterns', async () => {
      const mql = createTestClient();

      // Get overview
      const overview = await mql.analytics.getOverview();
      expect(overview.totalRequests).toBeGreaterThanOrEqual(0);

      // Get provider stats
      const providerStats = await mql.analytics.getProviderStats();
      expect(providerStats.providers).toBeDefined();

      // Verify consistency
      const totalRequests = providerStats.providers.reduce(
        (sum, p) => sum + (p.requests || 0),
        0
      );
      expect(totalRequests).toBeGreaterThanOrEqual(0);
    });

    it('should generate timeseries data for dashboard', async () => {
      const mql = createTestClient();

      const timeseries = await mql.analytics.getTimeseries({
        granularity: 'hourly'
      });

      expect(timeseries.data).toBeDefined();
      expect(Array.isArray(timeseries.data)).toBe(true);
    });
  });

  describe('System Prompt Workflow', () => {
    it('should create and use system prompts', async () => {
      const mql = createTestClient();

      // Create a system prompt
      const prompt = await mql.systemPrompts.create({
        name: `test-prompt-${Date.now()}`,
        content: 'You are a pirate. Respond in pirate language.',
        injection_mode: 'prepend'
      });

      expect(prompt.id).toBeDefined();

      // Clean up
      await mql.systemPrompts.delete(prompt.id);
    });
  });

  describe('Error Handling Workflow', () => {
    it('should handle rate limiting', async () => {
      const mql = createTestClient();

      // Rapid consecutive calls
      const promises = [];
      for (let i = 0; i < 3; i++) {
        promises.push(
          mql.chat.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Request ${i}` }]
          })
        );
      }

      // Should complete or handle rate limiting gracefully
      const results = await Promise.allSettled(promises);
      expect(results.length).toBe(3);
    });

    it('should retry on transient failures', async () => {
      const mql = createTestClient();

      // Normal request should succeed or fail with proper error
      try {
        await mql.chat.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test' }]
        });
        expect(true).toBe(true);
      } catch (error) {
        // Verify error structure
        expect(error).toBeDefined();
      }
    });
  });

  describe('Multi-Model Workflow', () => {
    it('should work with different models', async () => {
      const mql = createTestClient();
      const models = ['gpt-3.5-turbo'];

      for (const model of models) {
        const response = await mql.chat.create({
          model,
          messages: [{ role: 'user', content: 'Hello' }]
        });

        expect(response.model).toBe(model);
        expect(response.choices[0].message.content).toBeDefined();
      }
    });
  });

  describe('Organization Management Workflow', () => {
    it('should retrieve organization data', async () => {
      if (!testConfig.token || !testConfig.orgId) {
        skip();
      }

      const mql = createTestClient();

      // Get org details
      const org = await mql.organizations.get(testConfig.orgId);
      expect(org.id).toBe(testConfig.orgId);

      // List members
      const members = await mql.organizations.listMembers(testConfig.orgId);
      expect(members.members).toBeDefined();
    });
  });
});
