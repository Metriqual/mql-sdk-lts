import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQL } from '../../index';

describe('FiltersAPI - Unit Tests (Mocked)', () => {
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
    it('should create a PII filter', async () => {
      const mockResponse = {
        id: 'filter_123',
        name: 'PII Filter',
        type: 'PII',
        action: 'REDACT',
        applyTo: 'BOTH'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 201 })
      );

      const filter = await mql.filters.create({
        name: 'PII Filter',
        type: 'PII',
        action: 'REDACT',
        apply_to: 'BOTH'
      });

      expect(filter.id).toBe('filter_123');
      expect(filter.type).toBe('PII');
    });

    it('should create a KEYWORDS filter', async () => {
      const mockResponse = {
        id: 'filter_456',
        name: 'Keyword Filter',
        type: 'KEYWORDS',
        keywords: ['secret', 'password'],
        action: 'BLOCK'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 201 })
      );

      await mql.filters.create({
        name: 'Keyword Filter',
        type: 'KEYWORDS',
        keywords: ['secret', 'password'],
        action: 'BLOCK',
        apply_to: 'REQUEST'
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.keywords).toContain('secret');
    });

    it('should create a REGEX filter', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'filter_789' }), { status: 201 })
      );

      await mql.filters.create({
        name: 'Regex Filter',
        type: 'REGEX',
        pattern: '^secret_.*',
        action: 'WARN',
        apply_to: 'RESPONSE'
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.pattern).toBe('^secret_.*');
    });
  });

  describe('list()', () => {
    it('should list all filters', async () => {
      const mockResponse = {
        filters: [
          { id: 'f1', name: 'Filter 1', type: 'PII' },
          { id: 'f2', name: 'Filter 2', type: 'KEYWORDS' }
        ],
        total: 2
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.filters.list();

      expect(result.filters).toHaveLength(2);
    });
  });

  describe('getTemplates()', () => {
    it('should fetch filter templates', async () => {
      const mockResponse = {
        templates: [
          {
            id: 'template_pii',
            name: 'PII Protection',
            type: 'PII',
            description: 'Detects and redacts PII'
          }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.filters.getTemplates();

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('PII Protection');
    });
  });

  describe('createFromTemplate()', () => {
    it('should create filter from template', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'filter_from_template',
            type: 'PII',
            action: 'REDACT'
          }),
          { status: 201 }
        )
      );

      const filter = await mql.filters.createFromTemplate('template_pii', {
        name: 'My PII Filter'
      });

      expect(filter.type).toBe('PII');
    });
  });

  describe('update()', () => {
    it('should update filter configuration', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'filter_123', action: 'BLOCK' }), {
          status: 200
        })
      );

      await mql.filters.update('filter_123', { action: 'BLOCK' });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.action).toBe('BLOCK');
    });
  });

  describe('toggle()', () => {
    it('should enable/disable filter', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'filter_123', active: false }), {
          status: 200
        })
      );

      await mql.filters.toggle('filter_123', false);

      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('test()', () => {
    it('should test filter against content', async () => {
      const mockResponse = {
        matched: true,
        action: 'REDACT',
        redactedContent: '[REDACTED]'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.filters.test('filter_123', {
        content: 'My SSN is 123-45-6789'
      });

      expect(result.matched).toBe(true);
    });
  });

  describe('delete()', () => {
    it('should delete a filter', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await mql.filters.delete('filter_123');

      expect(result.success).toBe(true);
    });
  });
});
