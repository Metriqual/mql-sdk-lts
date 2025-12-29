import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQL } from '../../index';

describe('WebhooksAPI - Unit Tests (Mocked)', () => {
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
    it('should create webhook', async () => {
      const mockResponse = {
        id: 'webhook_123',
        url: 'https://example.com/webhook',
        events: ['request.completed', 'error.occurred'],
        active: true
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 201 })
      );

      const webhook = await mql.webhooks.create({
        url: 'https://example.com/webhook',
        events: ['request.completed', 'error.occurred']
      });

      expect(webhook.id).toBe('webhook_123');
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.events).toContain('request.completed');
    });

    it('should include auth header if provided', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'webhook_123' }), { status: 201 })
      );

      await mql.webhooks.create({
        url: 'https://example.com/webhook',
        events: ['request.completed'],
        auth_header: 'Bearer secret'
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.auth_header).toBe('Bearer secret');
    });
  });

  describe('list()', () => {
    it('should list user webhooks', async () => {
      const mockResponse = {
        webhooks: [
          { id: 'wh_1', url: 'https://example.com/1' },
          { id: 'wh_2', url: 'https://example.com/2' }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.webhooks.list();

      expect(result.webhooks).toHaveLength(2);
    });
  });

  describe('listForOrg()', () => {
    it('should list organization webhooks', async () => {
      const mockResponse = {
        webhooks: [{ id: 'wh_1', url: 'https://example.com/1' }]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.webhooks.listForOrg('org_123');

      expect(result.webhooks).toHaveLength(1);
    });
  });

  describe('update()', () => {
    it('should update webhook', async () => {
      const mockResponse = {
        id: 'webhook_123',
        active: false
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const webhook = await mql.webhooks.update('webhook_123', { active: false });

      expect(webhook.active).toBe(false);
    });
  });

  describe('delete()', () => {
    it('should delete webhook', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await mql.webhooks.delete('webhook_123');

      expect(result.success).toBe(true);
    });
  });

  describe('getDeliveries()', () => {
    it('should get webhook deliveries', async () => {
      const mockResponse = {
        deliveries: [
          {
            id: 'del_1',
            status: 'success',
            statusCode: 200,
            timestamp: '2024-01-01T00:00:00Z'
          },
          {
            id: 'del_2',
            status: 'failed',
            statusCode: 500,
            timestamp: '2024-01-01T00:05:00Z'
          }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.webhooks.getDeliveries('webhook_123');

      expect(result.deliveries).toHaveLength(2);
      expect(result.deliveries[0].status).toBe('success');
      expect(result.deliveries[1].statusCode).toBe(500);
    });
  });
});
