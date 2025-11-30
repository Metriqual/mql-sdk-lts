# @metriqual/sdk

Official TypeScript/JavaScript SDK for **MQL** - The AI Proxy Gateway with smart routing, provider fallback, usage tracking, and content filtering.

[![npm version](https://badge.fury.io/js/%40metriqual%2Fsdk.svg)](https://www.npmjs.com/package/@metriqual/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

## Features

- 🔄 **OpenAI-Compatible API** - Drop-in replacement for OpenAI SDK
- 🌊 **Streaming Support** - Real-time streaming with async iterators
- 🔀 **Automatic Fallback** - Seamless provider switching when limits are reached
- 🛡️ **Content Filtering** - PII protection, profanity filtering, custom rules
- 📊 **Usage Analytics** - Track costs, tokens, and latency
- 🏢 **Multi-tenancy** - Organization support with role-based access
- 💬 **System Prompts** - Behavioral control through prompt injection

## Installation

```bash
npm install @metriqual/sdk
# or
yarn add @metriqual/sdk
# or
pnpm add @metriqual/sdk
```

## Quick Start

### Chat Completions

```typescript
import { MQL } from '@metriqual/sdk';

// Initialize with your proxy key
const mql = new MQL({ apiKey: 'mql-your-proxy-key' });

// Make a chat completion request
const response = await mql.chat.create({
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ]
});

console.log(response.choices[0].message.content);
```

### Streaming

```typescript
// Using async iterator
for await (const chunk of mql.chat.stream({ 
  messages: [{ role: 'user', content: 'Tell me a story' }] 
})) {
  process.stdout.write(chunk.choices[0].delta.content || '');
}

// Or with callbacks
await mql.chat.stream(
  { messages: [{ role: 'user', content: 'Tell me a story' }] },
  {
    onChunk: (chunk) => process.stdout.write(chunk.choices[0].delta.content || ''),
    onComplete: (fullText) => console.log('\n\nDone!'),
  }
);
```

### Simple Completion Helper

```typescript
// Just get the text response
const reply = await mql.chat.complete([
  { role: 'user', content: 'What is 2+2?' }
]);
console.log(reply); // "4"
```

## Management APIs

For management operations (proxy keys, filters, organizations), you'll need a Supabase JWT token:

```typescript
const mql = new MQL({ 
  token: 'your-supabase-jwt',
  baseUrl: 'https://api.metriqual.com' // or your self-hosted URL
});
```

### Proxy Keys

```typescript
// Create a proxy key with fallback chain
const { proxyKey, providers } = await mql.proxyKeys.create({
  providers: [
    { provider: 'openai', model: 'gpt-4o-mini', apiKey: 'sk-...', usageLimit: 100 },
    { provider: 'anthropic', model: 'claude-3-haiku', apiKey: 'sk-ant-...', usageLimit: 50 },
  ],
  filterIds: ['filter-id-1'],
  systemPromptIds: ['prompt-id-1'],
});

console.log(`Created key: ${proxyKey}`);

// List your proxy keys
const { keys } = await mql.proxyKeys.list();
keys.forEach(key => {
  console.log(`${key.keyPreview} - Active: ${key.activeProvider}`);
});

// Get usage details
const usage = await mql.proxyKeys.getUsage('key-id');
console.log(`All providers exhausted: ${usage.allExhausted}`);

// Regenerate a key
const { proxyKey: newKey } = await mql.proxyKeys.regenerate('key-id');
```

### Content Filters

```typescript
// Create a PII filter
const filter = await mql.filters.create({
  name: 'Block PII',
  filterType: 'PII',
  action: 'BLOCK',
  applyTo: 'BOTH',
  config: { types: ['email', 'ssn', 'credit_card'] },
});

// Get templates
const { templates } = await mql.filters.getTemplates();
templates.forEach(t => console.log(`${t.name}: ${t.description}`));

// Create from template
const piiFilter = await mql.filters.createFromTemplate({
  templateId: 'pii-redact-all',
  name: 'My PII Filter',
});

// Test a filter
const result = await mql.filters.test({
  filterType: 'PII',
  action: 'REDACT',
  config: { types: ['email'] },
  testContent: 'Contact me at test@example.com',
});
console.log(result.resultContent); // "Contact me at [REDACTED]"

// Toggle filter
const toggled = await mql.filters.toggle('filter-id');
```

### System Prompts

```typescript
// Create a system prompt
const prompt = await mql.systemPrompts.create({
  name: 'Safety Guidelines',
  content: 'Always prioritize user safety. Never provide harmful information.',
  injectionMode: 'prepend',
  priority: 0,
});

// Get templates
const { templates } = await mql.systemPrompts.getTemplates();

// Create from template
const assistant = await mql.systemPrompts.createFromTemplate('helpful-assistant', {
  name: 'My Assistant',
});

// Update
await mql.systemPrompts.update('prompt-id', { priority: 1 });
```

### Organizations

```typescript
// Create organization
const org = await mql.organizations.create({
  name: 'my-company',
  displayName: 'My Company Inc.',
});

// List your organizations
const { organizations } = await mql.organizations.list();

// Invite members
await mql.organizations.inviteMember(org.id, {
  email: 'colleague@company.com',
  role: 'developer',
});

// List members
const members = await mql.organizations.listMembers(org.id);

// Check pending invites
const myInvites = await mql.organizations.getMyInvites();

// Accept an invite
await mql.organizations.acceptInvite({ token: 'invite-id' });
```

### Analytics

```typescript
// Get overview
const overview = await mql.analytics.getOverview({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
console.log(`Total cost: $${overview.totalCost.toFixed(2)}`);

// Get timeseries data
const timeseries = await mql.analytics.getTimeseries({
  startDate: new Date('2024-01-01'),
});

// Get provider breakdown
const stats = await mql.analytics.getProviderStats();
stats.forEach(s => {
  console.log(`${s.provider}/${s.model}: ${s.requests} requests, $${s.cost}`);
});
```

## Error Handling

```typescript
import { MQL, MQLAPIError } from '@metriqual/sdk';

try {
  const response = await mql.chat.create({ messages: [...] });
} catch (error) {
  if (error instanceof MQLAPIError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status: ${error.status}`);
    console.error(`Code: ${error.code}`);
  } else {
    throw error;
  }
}
```

## Configuration

```typescript
const mql = new MQL({
  // Base URL (default: https://api.metriqual.com)
  baseUrl: 'http://localhost:8080',
  
  // Proxy key for chat completions
  apiKey: 'mql-...',
  
  // Supabase JWT for management APIs
  token: 'eyJ...',
  
  // Request timeout in ms (default: 30000)
  timeout: 60000,
  
  // Retry attempts for failed requests (default: 3)
  maxRetries: 5,
  
  // Custom fetch implementation (for Node.js < 18)
  fetch: customFetch,
});
```

## Switching Authentication

```typescript
// Start with management token
const mql = new MQL({ token: 'jwt-token' });

// Create a proxy key
const { proxyKey } = await mql.proxyKeys.create({ providers: [...] });

// Create a new client with the proxy key for chat
const chatClient = new MQL({ apiKey: proxyKey });
const response = await chatClient.chat.create({ messages: [...] });
```

## TypeScript Support

The SDK is written in TypeScript and provides full type definitions:

```typescript
import { 
  MQL,
  ChatCompletionRequest,
  ChatCompletionResponse,
  CreateProxyKeyRequest,
  Filter,
  SystemPrompt,
  Organization,
} from '@metriqual/sdk';
```

## Browser Support

The SDK works in both Node.js and browser environments. For older browsers without native `fetch`, provide a polyfill:

```typescript
import fetch from 'node-fetch';

const mql = new MQL({
  apiKey: 'mql-...',
  fetch: fetch as unknown as typeof globalThis.fetch,
});
```

## Self-Hosted Deployment

If you're running your own MQL instance:

```typescript
const mql = new MQL({
  baseUrl: 'https://your-mql-instance.com',
  apiKey: 'mql-...',
});
```

## License

MIT

## Links

- [Documentation](https://docs.metriqual.com)
- [GitHub](https://github.com/Metriqual/mql-sdk)
- [MQL Backend](https://github.com/Metriqual/mql)
