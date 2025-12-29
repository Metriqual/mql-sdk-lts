import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQL } from '../../index';

describe('SystemPromptsAPI - Unit Tests (Mocked)', () => {
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
    it('should create system prompt', async () => {
      const mockResponse = {
        id: 'sp_123',
        name: 'Helpful Assistant',
        content: 'You are a helpful assistant.',
        injectionMode: 'prepend',
        priority: 1
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 201 })
      );

      const prompt = await mql.systemPrompts.create({
        name: 'Helpful Assistant',
        content: 'You are a helpful assistant.',
        injection_mode: 'prepend'
      });

      expect(prompt.id).toBe('sp_123');
      expect(prompt.name).toBe('Helpful Assistant');
    });

    it('should support different injection modes', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'sp_123' }), { status: 201 })
      );

      await mql.systemPrompts.create({
        name: 'Prompt',
        content: 'Test',
        injection_mode: 'append'
      });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.injection_mode).toBe('append');
    });
  });

  describe('list()', () => {
    it('should list system prompts', async () => {
      const mockResponse = {
        prompts: [
          { id: 'sp_1', name: 'Prompt 1' },
          { id: 'sp_2', name: 'Prompt 2' }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.systemPrompts.list();

      expect(result.prompts).toHaveLength(2);
    });
  });

  describe('get()', () => {
    it('should get specific prompt', async () => {
      const mockResponse = {
        id: 'sp_123',
        name: 'Test Prompt',
        content: 'Test content'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const prompt = await mql.systemPrompts.get('sp_123');

      expect(prompt.id).toBe('sp_123');
    });
  });

  describe('update()', () => {
    it('should update prompt', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'sp_123',
            content: 'Updated content'
          }),
          { status: 200 }
        )
      );

      await mql.systemPrompts.update('sp_123', { content: 'Updated content' });

      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('getTemplates()', () => {
    it('should get prompt templates', async () => {
      const mockResponse = {
        templates: [
          { id: 'template_1', name: 'Helpful', content: 'Be helpful...' },
          { id: 'template_2', name: 'Strict', content: 'Be strict...' }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.systemPrompts.getTemplates();

      expect(result.templates).toHaveLength(2);
    });
  });

  describe('createFromTemplate()', () => {
    it('should create prompt from template', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'sp_new',
            name: 'My Helpful Assistant'
          }),
          { status: 201 }
        )
      );

      const prompt = await mql.systemPrompts.createFromTemplate('template_1', {
        name: 'My Helpful Assistant'
      });

      expect(prompt.id).toBe('sp_new');
    });
  });

  describe('delete()', () => {
    it('should delete prompt', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await mql.systemPrompts.delete('sp_123');

      expect(result.success).toBe(true);
    });
  });
});
