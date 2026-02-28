import { HttpClient } from '../client';
import type {
  SubscriptionStatus,
  TrialStatus,
  StartTrialRequest,
  StartTrialResponse,
  PlanTier,
  PlanLimits,
  PlanFeatures,
} from '../types';

/**
 * Subscription API
 * Manage subscription status, trial, and plan information
 *
 * B2B Model:
 * - Free tier: 1 proxy key, 1 fallback provider, 1 filter, 1 prompt, 100 requests/month
 * - Enterprise tier: Unlimited everything + teams, webhooks, SSO, dedicated support
 * - 14-day trial: Full Enterprise access, no credit card required
 */
export class SubscriptionAPI {
  constructor(private readonly client: HttpClient) {}

  // ============================================================================
  // Subscription Status
  // ============================================================================

  /**
   * Get current subscription status including plan, limits, and usage
   *
   * @example
   * ```typescript
   * const status = await mql.subscription.getStatus();
   * console.log(`Current plan: ${status.tier}`);
   * console.log(`Trial active: ${status.trial.isActive}`);
   * console.log(`Proxy keys: ${status.usage.proxyKeys}/${status.limits.maxProxyKeys}`);
   * ```
   */
  async getStatus(orgId?: string): Promise<SubscriptionStatus> {
    // Use org endpoint if orgId provided, otherwise use user endpoint
    const url = orgId
      ? `/v1/organizations/${orgId}/subscription-status`
      : '/v1/user/subscription-status';
    return this.client.get<SubscriptionStatus>(url);
  }

  /**
   * Get current plan tier
   *
   * @example
   * ```typescript
   * const tier = await mql.subscription.getPlanTier();
   * if (tier === 'Free') {
   *   console.log('Upgrade to Enterprise for unlimited access');
   * }
   * ```
   */
  async getPlanTier(orgId?: string): Promise<PlanTier> {
    const status = await this.getStatus(orgId);
    return status.tier;
  }

  /**
   * Get plan limits for current tier
   *
   * @example
   * ```typescript
   * const limits = await mql.subscription.getLimits();
   * console.log(`Max proxy keys: ${limits.maxProxyKeys === -1 ? 'Unlimited' : limits.maxProxyKeys}`);
   * ```
   */
  async getLimits(orgId?: string): Promise<PlanLimits> {
    const status = await this.getStatus(orgId);
    return status.limits;
  }

  /**
   * Get enabled features for current tier
   *
   * @example
   * ```typescript
   * const features = await mql.subscription.getFeatures();
   * if (!features.teams) {
   *   console.log('Team collaboration requires Enterprise plan');
   * }
   * ```
   */
  async getFeatures(orgId?: string): Promise<PlanFeatures> {
    const status = await this.getStatus(orgId);
    return status.features;
  }

  /**
   * Check if a specific feature is available
   *
   * @example
   * ```typescript
   * const hasTeams = await mql.subscription.hasFeature('teams');
   * const hasWebhooks = await mql.subscription.hasFeature('webhooks');
   * ```
   */
  async hasFeature(feature: keyof PlanFeatures, orgId?: string): Promise<boolean> {
    const features = await this.getFeatures(orgId);
    return features[feature] ?? false;
  }

  // ============================================================================
  // Trial Management
  // ============================================================================

  /**
   * Get trial status
   * 
   * @experimental Trial-specific endpoints are not yet available.
   * Falls back to checking subscription status.
   *
   * @example
   * ```typescript
   * const trial = await mql.subscription.getTrialStatus();
   * if (trial.isActive) {
   *   console.log(`Trial ends in ${trial.daysRemaining} days`);
   * } else if (!trial.hasUsedTrial) {
   *   console.log('Start your free 14-day Enterprise trial!');
   * }
   * ```
   */
  async getTrialStatus(orgId?: string): Promise<TrialStatus> {
    // Use org endpoint if orgId provided, otherwise use user endpoint
    const url = orgId
      ? `/v1/organizations/${orgId}/trial-status`
      : '/v1/user/trial/status';
    return this.client.get<TrialStatus>(url);
  }

  /**
   * Start a 14-day Enterprise trial
   * Requires company information for lead qualification
   * 
   * @experimental Company info endpoints are not yet available.
   * Will return 404 until backend routes are registered.
   *
   * @example
   * ```typescript
   * const result = await mql.subscription.startTrial({
   *   companyName: 'Acme Corp',
   *   companySize: '11-50',
   *   industry: 'Technology',
   * });
   * if (result.success) {
   *   console.log('Trial started! You now have full Enterprise access.');
   * }
   * ```
   */
  async startTrial(request: StartTrialRequest, orgId?: string): Promise<StartTrialResponse> {
    // Use org endpoint if orgId provided, otherwise use user endpoint
    const url = orgId
      ? `/v1/organizations/${orgId}/company-info`
      : '/v1/user/company-info';
    return this.client.post<StartTrialResponse>(url, {
      company_name: request.companyName,
      company_size: request.companySize,
      industry: request.industry,
      phone_number: request.phoneNumber,
    });
  }

  /**
   * Check if trial is available (not yet used)
   *
   * @example
   * ```typescript
   * const canTrial = await mql.subscription.canStartTrial();
   * if (canTrial) {
   *   // Show trial CTA
   * }
   * ```
   */
  async canStartTrial(orgId?: string): Promise<boolean> {
    const trial = await this.getTrialStatus(orgId);
    return !trial.hasUsedTrial && !trial.isActive;
  }

  // ============================================================================
  // Usage Checking
  // ============================================================================

  /**
   * Check if user is approaching or at a usage limit
   *
   * @example
   * ```typescript
   * const atLimit = await mql.subscription.isAtLimit('proxyKeys');
   * if (atLimit) {
   *   console.log('You have reached your proxy key limit');
   * }
   * ```
   */
  async isAtLimit(
    resource: 'proxyKeys' | 'teamMembers' | 'filters' | 'prompts' | 'monthlyRequests',
    orgId?: string
  ): Promise<boolean> {
    const status = await this.getStatus(orgId);
    const limitMap: Record<string, keyof PlanLimits> = {
      proxyKeys: 'maxProxyKeys',
      teamMembers: 'maxTeamMembers',
      filters: 'maxFilters',
      prompts: 'maxPrompts',
      monthlyRequests: 'maxMonthlyRequests',
    };

    const limitKey = limitMap[resource];
    const limit = status.limits[limitKey];
    const current = status.usage[resource];

    // -1 means unlimited
    if (limit === -1) return false;
    return current >= limit;
  }

  /**
   * Get remaining quota for a resource
   *
   * @example
   * ```typescript
   * const remaining = await mql.subscription.getRemainingQuota('proxyKeys');
   * console.log(`You can create ${remaining} more proxy keys`);
   * ```
   */
  async getRemainingQuota(
    resource: 'proxyKeys' | 'teamMembers' | 'filters' | 'prompts' | 'monthlyRequests',
    orgId?: string
  ): Promise<number | 'unlimited'> {
    const status = await this.getStatus(orgId);
    const limitMap: Record<string, keyof PlanLimits> = {
      proxyKeys: 'maxProxyKeys',
      teamMembers: 'maxTeamMembers',
      filters: 'maxFilters',
      prompts: 'maxPrompts',
      monthlyRequests: 'maxMonthlyRequests',
    };

    const limitKey = limitMap[resource];
    const limit = status.limits[limitKey];
    const current = status.usage[resource];

    // -1 means unlimited
    if (limit === -1) return 'unlimited';
    return Math.max(0, limit - current);
  }
}
