import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQL } from '../../index';

describe('ChatAPI - Unit Tests (Mocked)', () => {
  let mql: MQL;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    mql = new MQL({
      apiKey: 'test-key',
      fetch: fetchMock
    });
  });

  describe('create()', () => {
    it('should send a chat completion request', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Hello! How can I help?'
            },
            index: 0,
            finish_reason: 'stop'
          }
        ],
        model: 'gpt-3.5-turbo',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );

      const response = await mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      });

      expect(response.choices[0].message.content).toBe('Hello! How can I help?');
      expect(response.model).toBe('gpt-3.5-turbo');
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              message: 'Invalid API key',
              code: 'INVALID_API_KEY'
            }
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      );

      await expect(
        mql.chat.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }]
        })
      ).rejects.toThrow();
    });

    it('should include optional parameters in request', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [] }), { status: 200 })
      );

      await mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.5,
        max_tokens: 100,
        top_p: 0.9
      });

      const call = fetchMock.mock.calls[0];
      const requestBody = JSON.parse(call[1].body);

      expect(requestBody.temperature).toBe(0.5);
      expect(requestBody.max_tokens).toBe(100);
      expect(requestBody.top_p).toBe(0.9);
    });
  });

  describe('stream()', () => {
    it('should stream chat completion', async () => {
      const streamData = `data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]`;

      fetchMock.mockResolvedValueOnce(
        new Response(streamData, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' }
        })
      );

      const stream = mql.chat.stream({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }]
      });

      // Test that it returns an async generator
      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });
  });

  describe('complete()', () => {
    it('should return only text content', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'Hello!' } }]
          }),
          { status: 200 }
        )
      );

      const result = await mql.chat.complete('gpt-3.5-turbo', 'Hello');

      expect(result).toBe('Hello!');
    });

    it('should throw if no choices in response', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [] }), { status: 200 })
      );

      await expect(mql.chat.complete('gpt-3.5-turbo', 'Hello')).rejects.toThrow();
    });
  });

  describe('Request formatting', () => {
    it('should convert camelCase to snake_case', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [] }), { status: 200 })
      );

      await mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hi' }],
        maxTokens: 50,
        topP: 0.9
      } as any);

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.max_tokens).toBe(50);
      expect(requestBody.top_p).toBe(0.9);
    });

    it('should set correct Authorization header', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [] }), { status: 200 })
      );

      await mql.chat.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hi' }]
      });

      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer test-key');
    });
  });
});
