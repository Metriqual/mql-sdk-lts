/**
 * Test utilities and helpers for MQL SDK tests
 * Supports both unit tests (mocked) and integration tests (real APIs)
 */

import { MQL } from './index';

/**
 * Environment configuration for tests
 */
export const testConfig = {
  baseUrl: process.env.MQL_BASE_URL || 'https://api.metriqual.com',
  environment: process.env.MQL_TEST_ENV || 'staging',
  apiKey: process.env.MQL_API_KEY || '',
  token: process.env.MQL_TOKEN || '',
  orgId: process.env.MQL_ORG_ID || '',

  /**
   * Check if running integration tests
   * Integration tests need real API credentials
   */
  isIntegrationTest(): boolean {
    return !!(this.apiKey || this.token);
  },

  /**
   * Check if running against production
   */
  isProduction(): boolean {
    return this.environment === 'production';
  }
};

/**
 * Create MQL client for testing
 */
export function createTestClient(overrides?: {
  apiKey?: string;
  token?: string;
  baseUrl?: string;
}): MQL {
  return new MQL({
    apiKey: overrides?.apiKey || testConfig.apiKey,
    token: overrides?.token || testConfig.token,
    baseUrl: overrides?.baseUrl || testConfig.baseUrl,
    timeout: 30000,
    maxRetries: 2
  });
}

/**
 * Mock response for fetch
 */
export function createMockResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Mock error response
 */
export function createMockErrorResponse(
  message: string,
  status = 400,
  code?: string
): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        code: code || `HTTP_${status}`
      }
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Skip test if credentials not available
 * Use in integration tests
 */
export function skipIfNoCredentials() {
  if (!testConfig.isIntegrationTest()) {
    console.log('⊘ Skipping: Test credentials not configured');
  }
}

/**
 * Skip test if running in production
 * Safety check for destructive tests
 */
export function skipIfProduction() {
  if (testConfig.isProduction()) {
    console.log('⊘ Skipping: Test configured for production (safety)');
  }
}

/**
 * Wait for a duration (for polling/retry tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options = { maxAttempts: 3, delayMs: 1000 }
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < options.maxAttempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < options.maxAttempts - 1) {
        await wait(options.delayMs * Math.pow(2, i));
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}

/**
 * Generate test data
 */
export const testData = {
  /**
   * Sample chat message
   */
  chatMessage: (content = 'Hello, world!'): { role: string; content: string } => ({
    role: 'user',
    content
  }),

  /**
   * Sample chat request
   */
  chatRequest: (model = 'gpt-3.5-turbo') => ({
    model,
    messages: [testData.chatMessage()],
    temperature: 0.7,
    max_tokens: 100
  }),

  /**
   * Sample proxy key config
   */
  proxyKeyConfig: () => ({
    name: `test-key-${Date.now()}`,
    providers: [
      {
        provider: 'openai',
        api_key: process.env.OPENAI_API_KEY || 'sk-test'
      }
    ],
    metadata: {
      test: true,
      createdAt: new Date().toISOString()
    }
  }),

  /**
   * Sample filter config
   */
  filterConfig: () => ({
    name: `test-filter-${Date.now()}`,
    type: 'PII' as const,
    action: 'WARN' as const,
    apply_to: 'REQUEST' as const
  }),

  /**
   * Sample webhook
   */
  webhookConfig: () => ({
    url: 'https://example.com/webhook',
    events: ['request.completed', 'error.occurred'],
    active: true
  })
};
