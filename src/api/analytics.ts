import { HttpClient } from '../client';
import type {
  AnalyticsQuery,
  AnalyticsOverview,
  TimeseriesPoint,
  ProviderStats,
  UsageLogsResponse,
  UsageAnalyticsResponse,
} from '../types';

/**
 * Analytics API
 * Access usage analytics, timeseries data, and provider statistics
 */
export class AnalyticsAPI {
  constructor(private readonly client: HttpClient) {}

  /**
   * Get overview analytics (total requests, tokens, cost, latency)
   * 
   * @example
   * ```typescript
   * const overview = await mql.analytics.getOverview({
   *   startDate: '2024-01-01',
   *   endDate: '2024-01-31',
   * });
   * console.log(`Total cost: $${overview.totalCost.toFixed(2)}`);
   * ```
   */
  async getOverview(query?: AnalyticsQuery): Promise<AnalyticsOverview> {
    const params = this.transformQuery(query);
    const response = await this.client.get<Record<string, unknown>>('/v1/analytics/overview', params);
    return this.transformOverview(response);
  }

  /**
   * Get timeseries data (hourly aggregated)
   * 
   * @example
   * ```typescript
   * const timeseries = await mql.analytics.getTimeseries({
   *   startDate: new Date('2024-01-01'),
   * });
   * timeseries.forEach(point => {
   *   console.log(`${point.timestamp}: ${point.requests} requests, $${point.cost}`);
   * });
   * ```
   */
  async getTimeseries(query?: AnalyticsQuery): Promise<TimeseriesPoint[]> {
    const params = this.transformQuery(query);
    const response = await this.client.get<Array<Record<string, unknown>>>('/v1/analytics/timeseries', params);
    return response.map(p => this.transformTimeseriesPoint(p));
  }

  /**
   * Get provider statistics (breakdown by provider and model)
   * 
   * @example
   * ```typescript
   * const stats = await mql.analytics.getProviderStats();
   * stats.forEach(s => {
   *   console.log(`${s.provider}/${s.model}: ${s.requests} requests, $${s.cost}`);
   * });
   * ```
   */
  async getProviderStats(): Promise<ProviderStats[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>('/v1/analytics/providers');
    return response.map(s => this.transformProviderStats(s));
  }

  /**
   * Get usage logs for a specific proxy key
   * 
   * @example
   * ```typescript
   * const { logs } = await mql.analytics.getUsageLogs('proxy-key-id');
   * logs.forEach(log => {
   *   console.log(`${log.timestamp}: ${log.model} - ${log.totalTokens} tokens`);
   * });
   * ```
   */
  async getUsageLogs(proxyKeyId: string): Promise<UsageLogsResponse> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/user/proxy-keys/${proxyKeyId}/logs`);
    return this.transformUsageLogs(response);
  }

  /**
   * Get aggregated usage analytics for a proxy key
   * 
   * @example
   * ```typescript
   * const usage = await mql.analytics.getUsageAnalytics('proxy-key-id');
   * console.log(`Total: ${usage.totalRequests} requests, $${usage.totalCostUsd}`);
   * usage.models.forEach(m => {
   *   console.log(`  ${m.provider}/${m.model}: $${m.costUsd}`);
   * });
   * ```
   */
  async getUsageAnalytics(proxyKeyId: string): Promise<UsageAnalyticsResponse> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/user/proxy-keys/${proxyKeyId}/usage`);
    return this.transformUsageAnalytics(response);
  }

  // ============================================================================
  // Organization Analytics
  // ============================================================================

  /**
   * Get overview analytics for an organization
   * @experimental Org-scoped analytics not yet available. Will return 404.
   */
  async getOrgOverview(orgId: string, query?: AnalyticsQuery): Promise<AnalyticsOverview> {
    const params = this.transformQuery(query);
    const response = await this.client.get<Record<string, unknown>>(`/v1/organizations/${orgId}/analytics/overview`, params);
    return this.transformOverview(response);
  }

  /**
   * Get timeseries data for an organization
   * @experimental Org-scoped analytics not yet available. Will return 404.
   */
  async getOrgTimeseries(orgId: string, query?: AnalyticsQuery): Promise<TimeseriesPoint[]> {
    const params = this.transformQuery(query);
    const response = await this.client.get<Array<Record<string, unknown>>>(`/v1/organizations/${orgId}/analytics/timeseries`, params);
    return response.map(p => this.transformTimeseriesPoint(p));
  }

  /**
   * Get provider statistics for an organization
   * @experimental Org-scoped analytics not yet available. Will return 404.
   */
  async getOrgProviderStats(orgId: string): Promise<ProviderStats[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>(`/v1/organizations/${orgId}/analytics/providers`);
    return response.map(s => this.transformProviderStats(s));
  }

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformQuery(query?: AnalyticsQuery): Record<string, string | undefined> {
    if (!query) return {};
    
    return {
      start_date: query.startDate instanceof Date 
        ? query.startDate.toISOString() 
        : query.startDate,
      end_date: query.endDate instanceof Date 
        ? query.endDate.toISOString() 
        : query.endDate,
    };
  }

  private transformOverview(data: Record<string, unknown>): AnalyticsOverview {
    const o = data as {
      total_requests: number;
      total_tokens: number;
      total_cost: number;
      avg_latency_ms: number | null;
    };

    return {
      totalRequests: o.total_requests,
      totalTokens: o.total_tokens,
      totalCost: o.total_cost,
      avgLatencyMs: o.avg_latency_ms,
    };
  }

  private transformTimeseriesPoint(data: Record<string, unknown>): TimeseriesPoint {
    const p = data as {
      timestamp: string;
      requests: number;
      tokens: number;
      cost: number;
    };

    return {
      timestamp: p.timestamp,
      requests: p.requests,
      tokens: p.tokens,
      cost: p.cost,
    };
  }

  private transformProviderStats(data: Record<string, unknown>): ProviderStats {
    const s = data as {
      provider: string;
      model: string;
      requests: number;
      tokens: number;
      cost: number;
    };

    return {
      provider: s.provider,
      model: s.model,
      requests: s.requests,
      tokens: s.tokens,
      cost: s.cost,
    };
  }

  private transformUsageLogs(data: Record<string, unknown>): UsageLogsResponse {
    const r = data as {
      proxy_key: string;
      logs: Array<{
        id: string;
        proxy_key: string;
        provider: string;
        model: string;
        request_id: string | null;
        timestamp: string;
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
        cost_usd: number;
        latency_ms: number | null;
        status_code: number | null;
        error_message: string | null;
      }>;
    };

    return {
      proxyKey: r.proxy_key,
      logs: r.logs.map(l => ({
        id: l.id,
        proxyKey: l.proxy_key,
        provider: l.provider,
        model: l.model,
        requestId: l.request_id,
        timestamp: l.timestamp,
        promptTokens: l.prompt_tokens,
        completionTokens: l.completion_tokens,
        totalTokens: l.total_tokens,
        costUsd: l.cost_usd,
        latencyMs: l.latency_ms,
        statusCode: l.status_code,
        errorMessage: l.error_message,
      })),
    };
  }

  private transformUsageAnalytics(data: Record<string, unknown>): UsageAnalyticsResponse {
    const r = data as {
      proxy_key: string;
      total_requests: number;
      total_tokens: number;
      total_cost_usd: number;
      models: Array<{
        provider: string;
        model: string;
        requests: number;
        tokens: number;
        cost_usd: number;
      }>;
    };

    return {
      proxyKey: r.proxy_key,
      totalRequests: r.total_requests,
      totalTokens: r.total_tokens,
      totalCostUsd: r.total_cost_usd,
      models: r.models.map(m => ({
        provider: m.provider,
        model: m.model,
        requests: m.requests,
        tokens: m.tokens,
        costUsd: m.cost_usd,
      })),
    };
  }
}
