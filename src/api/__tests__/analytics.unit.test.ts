import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQL } from '../../index';

describe('AnalyticsAPI - Unit Tests (Mocked)', () => {
  let mql: MQL;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    mql = new MQL({
      token: 'test-jwt-token',
      fetch: fetchMock
    });
  });

  describe('getOverview()', () => {
    it('should get usage overview', async () => {
      const mockResponse = {
        totalRequests: 1000,
        totalTokens: 50000,
        totalCost: 1.5,
        averageLatency: 250
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const overview = await mql.analytics.getOverview();

      expect(overview.totalRequests).toBe(1000);
      expect(overview.totalTokens).toBe(50000);
      expect(overview.totalCost).toBe(1.5);
    });

    it('should accept date range filters', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      await mql.analytics.getOverview({
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      });

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('start_date=2024-01-01');
      expect(url).toContain('end_date=2024-01-31');
    });
  });

  describe('getTimeseries()', () => {
    it('should get hourly timeseries data', async () => {
      const mockResponse = {
        data: [
          { timestamp: '2024-01-01T00:00:00Z', requests: 10, tokens: 500, cost: 0.01 },
          { timestamp: '2024-01-01T01:00:00Z', requests: 15, tokens: 750, cost: 0.015 }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.analytics.getTimeseries();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].requests).toBe(10);
    });

    it('should support granularity parameter', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), { status: 200 })
      );

      await mql.analytics.getTimeseries({ granularity: 'daily' });

      const url = fetchMock.mock.calls[0][0];
      expect(url).toContain('granularity=daily');
    });
  });

  describe('getProviderStats()', () => {
    it('should get provider breakdown', async () => {
      const mockResponse = {
        providers: [
          { name: 'openai', requests: 600, tokens: 30000, cost: 0.9 },
          { name: 'anthropic', requests: 400, tokens: 20000, cost: 0.6 }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.analytics.getProviderStats();

      expect(result.providers).toHaveLength(2);
      expect(result.providers[0].name).toBe('openai');
    });
  });

  describe('getUsageLogs()', () => {
    it('should get detailed usage logs', async () => {
      const mockResponse = {
        logs: [
          {
            id: 'log_1',
            timestamp: '2024-01-01T00:00:00Z',
            proxyKeyId: 'pk_123',
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            tokens: 100,
            cost: 0.002
          }
        ],
        total: 1
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.analytics.getUsageLogs('pk_123');

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].provider).toBe('openai');
    });
  });

  describe('getUsageAnalytics()', () => {
    it('should get aggregated usage per proxy key', async () => {
      const mockResponse = {
        analytics: [
          {
            proxyKeyId: 'pk_1',
            totalRequests: 500,
            totalTokens: 25000,
            totalCost: 0.75
          },
          {
            proxyKeyId: 'pk_2',
            totalRequests: 500,
            totalTokens: 25000,
            totalCost: 0.75
          }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.analytics.getUsageAnalytics();

      expect(result.analytics).toHaveLength(2);
      expect(result.analytics[0].totalRequests).toBe(500);
    });
  });
});
