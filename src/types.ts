// ============================================================================
// MQL SDK - TypeScript Types
// Comprehensive type definitions for the MQL AI Proxy Gateway
// ============================================================================

// ============================================================================
// Common Types
// ============================================================================

export interface MQLClientOptions {
  /** Base URL of the MQL API (default: https://api.metriqual.io) */
  baseUrl?: string;
  /** API key or proxy key for authentication */
  apiKey?: string;
  /** Supabase JWT token for authenticated user operations */
  token?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retries for failed requests (default: 3) */
  maxRetries?: number;
  /** Custom fetch implementation for environments without native fetch */
  fetch?: typeof fetch;
}

export interface MQLError {
  error: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface DeleteResponse {
  message: string;
}

// ============================================================================
// Provider Types
// ============================================================================

export type ProviderName = 'openai' | 'anthropic' | 'mistral' | 'cohere' | 'gemini' | 'azure' | string;

export interface ProviderConfig {
  /** Provider name: "openai", "anthropic", "mistral", "cohere", "gemini" */
  provider: ProviderName;
  /** Model name: "gpt-4o-mini", "claude-3-opus-20240229", etc. */
  model: string;
  /** API key for this provider */
  apiKey: string;
  /** Usage limit for this provider (requests before switching to fallback) */
  usageLimit: number;
}

export interface ProviderStatus {
  /** Provider name */
  provider: string;
  /** Model being used */
  model: string | null;
  /** Priority in the fallback chain */
  priority: number;
  /** Maximum usage allowed */
  usageLimit: number;
  /** Current usage count */
  usageCount: number;
  /** Remaining requests before exhaustion */
  remaining: number;
  /** Whether this provider has reached its limit */
  isExhausted: boolean;
}

// ============================================================================
// Proxy Key Types
// ============================================================================

export interface ProxyKey {
  id: string;
  proxyKey: string;
  orgId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProxyKeyRequest {
  /** List of providers in fallback order (first = primary, rest = fallbacks) */
  providers: ProviderConfig[];
  /** Optional list of filter IDs to apply to this proxy key */
  filterIds?: string[];
  /** Optional list of system prompt IDs to inject into requests */
  systemPromptIds?: string[];
}

export interface CreateProxyKeyResponse {
  proxyKey: string;
  providers: ProviderStatus[];
  createdAt: string;
}

export interface ProxyKeyUsageResponse {
  proxyKey: string;
  providers: ProviderStatus[];
  activeProvider: string | null;
  allExhausted: boolean;
  filters?: Array<{
    id: string;
    name: string;
    description?: string;
    filterType: FilterType;
    action: FilterAction;
    applyTo: FilterApplyTo;
    enabled: boolean;
    config: Record<string, unknown>;
  }>;
  systemPrompts?: Array<{
    id: string;
    name: string;
    description?: string;
    content: string;
    injectionMode: InjectionMode;
    priority: number;
  }>;
}

export interface ProxyKeyListResponse {
  keys: ProxyKeyListItem[];
  count: number;
}

export interface ProxyKeyListItem {
  id: string;
  keyPreview: string;
  orgId: string | null;
  createdAt: string;
  totalUsageDollars: number;
  providerCount: number;
  activeProvider: string | null;
  allExhausted: boolean;
}

export interface RegenerateProxyKeyResponse {
  proxyKey: string;
  id: string;
  providers: ProviderStatus[];
  message: string;
}

// ============================================================================
// Chat Completion Types (OpenAI Compatible)
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | null;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  /** Model to use (will use proxy key's configured model if not specified) */
  model?: string;
  /** Messages for the conversation */
  messages: ChatMessage[];
  /** Whether to stream the response */
  stream?: boolean;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Sampling temperature (0-2) */
  temperature?: number;
  /** Nucleus sampling parameter */
  topP?: number;
  /** Number of completions to generate */
  n?: number;
  /** Stop sequences */
  stop?: string | string[];
  /** Presence penalty (-2 to 2) */
  presencePenalty?: number;
  /** Frequency penalty (-2 to 2) */
  frequencyPenalty?: number;
  /** User identifier for tracking */
  user?: string;
  /** Available functions for function calling */
  functions?: FunctionDefinition[];
  /** Function call behavior */
  functionCall?: 'none' | 'auto' | { name: string };
  /** Available tools for tool use */
  tools?: ToolDefinition[];
  /** Tool choice behavior */
  toolChoice?: 'none' | 'auto' | 'required' | { type: 'function'; function: { name: string } };
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface ToolDefinition {
  type: 'function';
  function: FunctionDefinition;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: UsageInfo;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finishReason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null;
}

export interface UsageInfo {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// Streaming types
export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: Partial<ChatMessage>;
  finishReason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null;
}

// ============================================================================
// Filter Types
// ============================================================================

export type FilterType = 'PII' | 'PROFANITY' | 'KEYWORDS' | 'REGEX' | 'CUSTOM';
export type FilterAction = 'BLOCK' | 'REDACT' | 'WARN';
export type FilterApplyTo = 'REQUEST' | 'RESPONSE' | 'BOTH';

export interface Filter {
  id: string;
  orgId: string | null;
  userId: string | null;
  proxyKeyId: string | null;
  name: string;
  description: string | null;
  enabled: boolean;
  filterType: FilterType;
  action: FilterAction;
  applyTo: FilterApplyTo;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFilterRequest {
  orgId?: string;
  proxyKeyId?: string;
  name: string;
  description?: string;
  filterType: FilterType;
  action: FilterAction;
  applyTo: FilterApplyTo;
  config: Record<string, unknown>;
}

export interface UpdateFilterRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  filterType?: FilterType;
  action?: FilterAction;
  applyTo?: FilterApplyTo;
  config?: Record<string, unknown>;
}

export interface FilterTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  filterType: FilterType;
  action: FilterAction;
  applyTo: FilterApplyTo;
  config: Record<string, unknown>;
}

export interface FilterTemplatesResponse {
  templates: FilterTemplate[];
  categories: string[];
}

export interface CreateFilterFromTemplateRequest {
  templateId: string;
  name?: string;
  proxyKeyId?: string;
  orgId?: string;
}

export interface TestFilterRequest {
  filterType: FilterType;
  action: FilterAction;
  config: Record<string, unknown>;
  testContent: string;
}

export interface TestFilterMatch {
  matchedText: string;
  pattern: string;
  position: [number, number];
}

export interface TestFilterResponse {
  matchesFound: boolean;
  actionTaken: string;
  matches: TestFilterMatch[];
  resultContent: string | null;
}

export interface FilterListResponse {
  filters: Filter[];
}

// ============================================================================
// System Prompt Types
// ============================================================================

export type InjectionMode = 'prepend' | 'append' | 'replace';

export interface SystemPrompt {
  id: string;
  name: string;
  description: string | null;
  content: string;
  injectionMode: InjectionMode;
  priority: number;
  isTemplate: boolean;
  userId: string | null;
  orgId: string | null;
  proxyKeyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSystemPromptRequest {
  name: string;
  description?: string;
  content: string;
  injectionMode?: InjectionMode;
  priority?: number;
}

export interface UpdateSystemPromptRequest {
  name?: string;
  description?: string;
  content?: string;
  injectionMode?: InjectionMode;
  priority?: number;
}

export interface SystemPromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
  injectionMode: InjectionMode;
  useCases: string[];
}

export interface SystemPromptListResponse {
  prompts: SystemPrompt[];
  total: number;
}

export interface SystemPromptTemplatesResponse {
  templates: SystemPromptTemplate[];
  categories: string[];
}

// ============================================================================
// Organization Types
// ============================================================================

export type UserRole = 'owner' | 'admin' | 'developer' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  displayName: string | null;
  createdAt?: string;
  memberCount?: number;
  yourRole?: UserRole;
  ownerEmail?: string | null;
}

export interface CreateOrganizationRequest {
  name: string;
  displayName?: string;
}

export interface OrganizationMember {
  userId: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

export interface OrganizationInvite {
  id: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
}

export interface InviteMemberRequest {
  email: string;
  role: UserRole;
}

export interface AcceptInviteRequest {
  token: string;
}

export interface UpdateMemberRoleRequest {
  role: UserRole;
}

export interface UserOrganizationsResponse {
  organizations: Organization[];
}

export interface PendingInvite {
  id: string;
  orgId: string;
  orgName: string;
  orgDisplayName: string | null;
  role: UserRole;
  expiresAt: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsQuery {
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface AnalyticsOverview {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number | null;
}

export interface TimeseriesPoint {
  timestamp: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface ProviderStats {
  provider: string;
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

// ============================================================================
// Usage Log Types
// ============================================================================

export interface UsageLog {
  id: string;
  proxyKey: string;
  provider: string;
  model: string;
  requestId: string | null;
  timestamp: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  latencyMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

export interface UsageLogsResponse {
  proxyKey: string;
  logs: UsageLog[];
}

export interface UsageAnalyticsResponse {
  proxyKey: string;
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  models: ModelUsage[];
}

export interface ModelUsage {
  provider: string;
  model: string;
  requests: number;
  tokens: number;
  costUsd: number;
}

// ============================================================================
// Webhook Types
// ============================================================================

export type WebhookEvent = 
  | 'usage.threshold'
  | 'fallback.activated'
  | 'provider.exhausted'
  | 'filter.blocked'
  | 'filter.warned'
  | 'request.completed'
  | 'error.occurred';

export interface Webhook {
  id: string;
  userId?: string;
  orgId?: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEvent;
  payload: Record<string, unknown>;
  statusCode?: number;
  responseBody?: string;
  errorMessage?: string;
  success: boolean;
  attemptedAt: string;
}

export interface CreateWebhookRequest {
  url: string;
  events: WebhookEvent[];
  secret?: string;
  orgId?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: WebhookEvent[];
  secret?: string;
  enabled?: boolean;
}

// ============================================================================
// Model Listing Types
// ============================================================================

export interface Model {
  id: string;
  object: 'model';
  created: number;
  ownedBy: string;
}

export interface ModelListResponse {
  object: 'list';
  data: Model[];
}

// ============================================================================
// Streaming Types
// ============================================================================

export interface StreamOptions {
  /** Callback for each chunk received */
  onChunk?: (chunk: ChatCompletionChunk) => void;
  /** Callback when the stream completes */
  onComplete?: (fullResponse: string) => void;
  /** Callback for errors during streaming */
  onError?: (error: MQLError) => void;
  /** AbortSignal for canceling the stream */
  signal?: AbortSignal;
}

// ============================================================================
// Testing Types
// ============================================================================

export interface TestProxyKeyRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
}

// ============================================================================
// Response Headers from Proxy
// ============================================================================

export interface ProxyResponseHeaders {
  /** Which provider handled the request */
  'x-mql-provider-used'?: string;
  /** Whether a fallback was used */
  'x-mql-is-fallback'?: string;
  /** Request ID for tracking */
  'x-mql-request-id'?: string;
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface ModelPricing {
  model: string;
  inputPricePerToken?: number;
  outputPricePerToken?: number;
  inputPricePer1M?: number;
  outputPricePer1M?: number;
  contextLength?: number;
  supportsVision?: boolean;
  supportsFunctionCalling?: boolean;
}

export interface ProviderPricingResponse {
  provider: string;
  models: ModelPricing[];
}

// ============================================================================
// Subscription & Plan Types (B2B Model)
// ============================================================================

export type PlanTier = 'Free' | 'Enterprise';

export interface PlanLimits {
  /** Maximum proxy keys (-1 = unlimited) */
  maxProxyKeys: number;
  /** Maximum providers per key (-1 = unlimited) */
  maxProvidersPerKey: number;
  /** Maximum team members (-1 = unlimited) */
  maxTeamMembers: number;
  /** Maximum filters (-1 = unlimited) */
  maxFilters: number;
  /** Maximum system prompts (-1 = unlimited) */
  maxSystemPrompts: number;
  /** Maximum monthly requests (-1 = unlimited) */
  maxMonthlyRequests: number;
}

export interface PlanFeatures {
  teams: boolean;
  filters: boolean;
  prompts: boolean;
  webhooks: boolean;
  analytics: boolean;
  fallbackProviders: boolean;
  customIntegrations: boolean;
  sso: boolean;
  dedicatedSupport: boolean;
  onPremise: boolean;
}

export interface TrialStatus {
  /** Whether trial is currently active */
  isActive: boolean;
  /** Days remaining in trial */
  daysRemaining: number;
  /** When trial started */
  startedAt: string | null;
  /** When trial ends */
  endsAt: string | null;
  /** Whether trial has already been used */
  hasUsedTrial: boolean;
}

export interface SubscriptionStatus {
  /** Current plan tier */
  tier: PlanTier;
  /** Plan limits for this tier */
  limits: PlanLimits;
  /** Features enabled for this tier */
  features: PlanFeatures;
  /** Trial information */
  trial: TrialStatus;
  /** Current usage counts */
  usage: {
    proxyKeys: number;
    teamMembers: number;
    filters: number;
    systemPrompts: number;
    monthlyRequests: number;
  };
}

export interface StartTrialRequest {
  /** Company name (required) */
  companyName: string;
  /** Company size */
  companySize: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  /** Industry (optional) */
  industry?: string;
  /** Phone number (required for consumer email domains) */
  phoneNumber?: string;
}

export interface StartTrialResponse {
  /** Whether trial was started successfully */
  success: boolean;
  /** Trial status after starting */
  trial: TrialStatus;
  /** Message to display */
  message: string;
}

export interface UsageCapError {
  error: string;
  capType: 'proxy_keys' | 'providers' | 'filters' | 'system_prompts' | 'requests' | 'teams';
  current: number;
  limit: number;
  trialAvailable: boolean;
  trialCtaText?: string;
  salesCtaText?: string;
  currentPlan: string;
}
