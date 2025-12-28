import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQL } from '../../index';

describe('ModelsAPI - Unit Tests (Mocked)', () => {
  let mql: MQL;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    mql = new MQL({
      apiKey: 'test-key',
      fetch: fetchMock
    });
  });

  describe('list()', () => {
    it('should list all available models', async () => {
      const mockResponse = {
        models: [
          {
            id: 'gpt-3.5-turbo',
            provider: 'openai',
            contextLength: 4096
          },
          {
            id: 'claude-2',
            provider: 'anthropic',
            contextLength: 100000
          }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.models.list();

      expect(result.models).toHaveLength(2);
    });
  });

  describe('listByProvider()', () => {
    it('should list models by provider', async () => {
      const mockResponse = {
        models: [
          { id: 'gpt-3.5-turbo', provider: 'openai' },
          { id: 'gpt-4', provider: 'openai' }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.models.listByProvider('openai');

      expect(result.models).toHaveLength(2);
      expect(result.models[0].provider).toBe('openai');
    });
  });

  describe('get()', () => {
    it('should get specific model details', async () => {
      const mockResponse = {
        id: 'gpt-3.5-turbo',
        provider: 'openai',
        contextLength: 4096,
        supportsVision: false,
        supportsFunctionCalling: true
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const model = await mql.models.get('gpt-3.5-turbo');

      expect(model.contextLength).toBe(4096);
      expect(model.supportsFunctionCalling).toBe(true);
    });
  });
});

describe('PricingAPI - Unit Tests (Mocked)', () => {
  let mql: MQL;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    mql = new MQL({
      apiKey: 'test-key',
      fetch: fetchMock
    });
  });

  describe('getByProvider()', () => {
    it('should get generic provider pricing', async () => {
      const mockResponse = {
        provider: 'openai',
        models: [
          {
            id: 'gpt-3.5-turbo',
            input_cost: 0.0005,
            output_cost: 0.0015
          }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const pricing = await mql.pricing.getByProvider('openai');

      expect(pricing.provider).toBe('openai');
      expect(pricing.models[0].inputCost).toBe(0.0005);
    });
  });

  describe('getOpenAI()', () => {
    it('should get OpenAI pricing', async () => {
      const mockResponse = {
        models: [
          {
            id: 'gpt-3.5-turbo',
            input_cost: 0.0005,
            output_cost: 0.0015
          },
          {
            id: 'gpt-4',
            input_cost: 0.003,
            output_cost: 0.006
          }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const pricing = await mql.pricing.getOpenAI();

      expect(pricing.models).toHaveLength(2);
      expect(pricing.models[1].outputCost).toBe(0.006);
    });
  });

  describe('getAnthropic()', () => {
    it('should get Anthropic pricing', async () => {
      const mockResponse = {
        models: [
          {
            id: 'claude-2',
            input_cost: 0.008,
            output_cost: 0.024
          }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const pricing = await mql.pricing.getAnthropic();

      expect(pricing.models[0].inputCost).toBe(0.008);
    });
  });

  describe('getMistral()', () => {
    it('should get Mistral pricing', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [] }), { status: 200 })
      );

      await mql.pricing.getMistral();

      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('getGemini()', () => {
    it('should get Google Gemini pricing', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [] }), { status: 200 })
      );

      await mql.pricing.getGemini();

      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('getCohere()', () => {
    it('should get Cohere pricing', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ models: [] }), { status: 200 })
      );

      await mql.pricing.getCohere();

      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
