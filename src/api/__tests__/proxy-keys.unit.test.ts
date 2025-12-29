import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQL } from '../../index';

describe('ProxyKeysAPI - Unit Tests (Mocked)', () => {
  let mql: MQL;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    mql = new MQL({
      token: 'test-jwt-token',
      fetch: fetchMock
    });
  });

  describe('create()', () => {
    it('should create a proxy key with single provider', async () => {
      const mockResponse = {
        id: 'pk_123',
        name: 'test-key',
        proxy_key: 'sk_test123',
        providers: [{ provider: 'openai', position: 0 }],
        created_at: '2024-01-01T00:00:00Z'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const response = await mql.proxyKeys.create({
        name: 'test-key',
        providers: [{ provider: 'openai', api_key: 'sk_test' }]
      });

      expect(response.id).toBe('pk_123');
      expect(response.proxyKey).toBe('sk_test123');
      expect(response.name).toBe('test-key');
    });

    it('should create a proxy key with fallback providers', async () => {
      const mockResponse = {
        id: 'pk_123',
        providers: [
          { provider: 'openai', position: 0 },
          { provider: 'anthropic', position: 1 }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 201 })
      );

      await mql.proxyKeys.create({
        name: 'multi-provider',
        providers: [
          { provider: 'openai', api_key: 'sk_openai' },
          { provider: 'anthropic', api_key: 'sk_anthropic' }
        ]
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.providers).toHaveLength(2);
    });

    it('should handle creation errors', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { message: 'Invalid provider' } }),
          { status: 400 }
        )
      );

      await expect(
        mql.proxyKeys.create({
          name: 'bad-key',
          providers: [{ provider: 'invalid', api_key: 'test' }]
        })
      ).rejects.toThrow();
    });
  });

  describe('list()', () => {
    it('should list user proxy keys', async () => {
      const mockResponse = {
        keys: [
          { id: 'pk_1', name: 'key1', proxyKey: 'sk_1' },
          { id: 'pk_2', name: 'key2', proxyKey: 'sk_2' }
        ],
        total: 2
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const response = await mql.proxyKeys.list();

      expect(response.keys).toHaveLength(2);
      expect(response.total).toBe(2);
    });

    it('should support pagination', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ keys: [], total: 0 }), { status: 200 })
      );

      await mql.proxyKeys.list({ limit: 10, offset: 0 });

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('limit=10');
      expect(url).toContain('offset=0');
    });
  });

  describe('getUsage()', () => {
    it('should get usage stats for proxy key', async () => {
      const mockResponse = {
        proxyKeyId: 'pk_123',
        totalRequests: 100,
        totalTokens: 5000,
        totalCost: 0.10
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const usage = await mql.proxyKeys.getUsage('pk_123');

      expect(usage.totalRequests).toBe(100);
      expect(usage.totalTokens).toBe(5000);
    });
  });

  describe('delete()', () => {
    it('should delete a proxy key', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await mql.proxyKeys.delete('pk_123');

      expect(result.success).toBe(true);
    });
  });

  describe('regenerate()', () => {
    it('should regenerate proxy key', async () => {
      const mockResponse = {
        id: 'pk_123',
        proxy_key: 'sk_new123'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.proxyKeys.regenerate('pk_123');

      expect(result.proxyKey).toBe('sk_new123');
    });
  });
});
