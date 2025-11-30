import type { MQLClientOptions, MQLError } from './types';

/**
 * Custom error class for MQL API errors
 */
export class MQLAPIError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'MQLAPIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static fromResponse(error: MQLError, status: number): MQLAPIError {
    return new MQLAPIError(error.error, status, error.code, error.details);
  }
}

/**
 * Internal HTTP client for making API requests
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly token?: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetchFn: typeof fetch;

  constructor(options: MQLClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'https://api.metriqual.com').replace(/\/$/, '');
    this.apiKey = options.apiKey;
    this.token = options.token;
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.fetchFn = options.fetch || globalThis.fetch;

    if (!this.fetchFn) {
      throw new Error(
        'fetch is not available. Please provide a fetch implementation via the options.'
      );
    }
  }

  /**
   * Update authentication
   */
  public updateAuth(options: { apiKey?: string; token?: string }): HttpClient {
    return new HttpClient({
      baseUrl: this.baseUrl,
      apiKey: options.apiKey ?? this.apiKey,
      token: options.token ?? this.token,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      fetch: this.fetchFn,
    });
  }

  /**
   * Build headers for requests
   */
  private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Use apiKey (proxy key) for Bearer auth
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Use token (Supabase JWT) for authenticated user operations
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders);
    }

    return headers;
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Make a request with retry logic
   */
  private async requestWithRetry<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      retryCount?: number;
    } = {}
  ): Promise<T> {
    const { body, params, headers: additionalHeaders, retryCount = 0 } = options;
    const url = this.buildUrl(path, params);
    const headers = this.buildHeaders(additionalHeaders);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetchFn(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: response.statusText }));
        
        // Retry on 5xx errors
        if (response.status >= 500 && retryCount < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          await this.sleep(delay);
          return this.requestWithRetry<T>(method, path, { ...options, retryCount: retryCount + 1 });
        }

        throw MQLAPIError.fromResponse(errorBody as MQLError, response.status);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof MQLAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new MQLAPIError('Request timeout', 408);
        }

        // Retry on network errors
        if (retryCount < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          await this.sleep(delay);
          return this.requestWithRetry<T>(method, path, { ...options, retryCount: retryCount + 1 });
        }

        throw new MQLAPIError(error.message, 0);
      }

      throw new MQLAPIError('Unknown error occurred', 0);
    }
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.requestWithRetry<T>('GET', path, { params, headers });
  }

  /**
   * POST request
   */
  async post<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.requestWithRetry<T>('POST', path, { body, headers });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.requestWithRetry<T>('PATCH', path, { body, headers });
  }

  /**
   * PUT request
   */
  async put<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.requestWithRetry<T>('PUT', path, { body, headers });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.requestWithRetry<T>('DELETE', path, { headers });
  }

  /**
   * Stream a POST request (for chat completions with streaming)
   */
  async *stream(
    path: string,
    body: unknown,
    headers?: Record<string, string>,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    const url = this.buildUrl(path);
    const requestHeaders = this.buildHeaders({
      ...headers,
      'Accept': 'text/event-stream',
    });

    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: response.statusText }));
      throw MQLAPIError.fromResponse(errorBody as MQLError, response.status);
    }

    if (!response.body) {
      throw new MQLAPIError('No response body for stream', 500);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            yield data;
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data !== '[DONE]') {
          yield data;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
