import { HttpClient } from '../client';
import type {
  Organization,
  CreateOrganizationRequest,
  UserOrganizationsResponse,
  OrganizationMember,
  OrganizationInvite,
  InviteMemberRequest,
  AcceptInviteRequest,
  UpdateMemberRoleRequest,
  PendingInvite,
  UserRole,
} from '../types';

/**
 * Organizations API
 * Manage organizations, members, and invitations
 */
export class OrganizationsAPI {
  constructor(private readonly client: HttpClient) {}

  // ============================================================================
  // Organization CRUD
  // ============================================================================

  /**
   * List all organizations the user is a member of
   * 
   * @example
   * ```typescript
   * const { organizations } = await mql.organizations.list();
   * organizations.forEach(org => console.log(org.name, org.displayName));
   * ```
   */
  async list(): Promise<UserOrganizationsResponse> {
    const response = await this.client.get<Record<string, unknown>>('/v1/organizations');
    return this.transformListResponse(response);
  }

  /**
   * Get details of a specific organization
   * 
   * @example
   * ```typescript
   * const org = await mql.organizations.get('org-id');
   * console.log(`${org.name} has ${org.memberCount} members`);
   * console.log(`Your role: ${org.yourRole}`);
   * ```
   */
  async get(orgId: string): Promise<Organization> {
    const response = await this.client.get<Record<string, unknown>>(`/v1/organizations/${orgId}`);
    return this.transformOrganization(response);
  }

  /**
   * Create a new organization
   * 
   * @example
   * ```typescript
   * const org = await mql.organizations.create({
   *   name: 'my-company',
   *   displayName: 'My Company Inc.',
   * });
   * ```
   */
  async create(request: CreateOrganizationRequest): Promise<Organization> {
    const body = {
      name: request.name,
      display_name: request.displayName,
    };
    const response = await this.client.post<Record<string, unknown>>('/v1/organizations', body);
    return this.transformOrganization(response);
  }

  // ============================================================================
  // Member Management
  // ============================================================================

  /**
   * List all members of an organization
   * 
   * @example
   * ```typescript
   * const members = await mql.organizations.listMembers('org-id');
   * members.forEach(m => console.log(m.email, m.role));
   * ```
   */
  async listMembers(orgId: string): Promise<OrganizationMember[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>(`/v1/organizations/${orgId}/members`);
    return response.map(m => this.transformMember(m));
  }

  /**
   * Update a member's role
   * 
   * @example
   * ```typescript
   * await mql.organizations.updateMemberRole('org-id', 'user-id', { role: 'admin' });
   * ```
   */
  async updateMemberRole(orgId: string, userId: string, request: UpdateMemberRoleRequest): Promise<void> {
    await this.client.patch(`/v1/organizations/${orgId}/members/${userId}`, { role: request.role });
  }

  /**
   * Remove a member from the organization
   * 
   * @example
   * ```typescript
   * await mql.organizations.removeMember('org-id', 'user-id');
   * ```
   */
  async removeMember(orgId: string, userId: string): Promise<void> {
    await this.client.delete(`/v1/organizations/${orgId}/members/${userId}`);
  }

  // ============================================================================
  // Invitation Management
  // ============================================================================

  /**
   * List all invitations for an organization
   * 
   * @example
   * ```typescript
   * const invites = await mql.organizations.listInvites('org-id');
   * invites.forEach(i => console.log(i.email, i.status, i.role));
   * ```
   */
  async listInvites(orgId: string): Promise<OrganizationInvite[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>(`/v1/organizations/${orgId}/invites`);
    return response.map(i => this.transformInvite(i));
  }

  /**
   * Invite a new member to the organization
   * 
   * @example
   * ```typescript
   * const invite = await mql.organizations.inviteMember('org-id', {
   *   email: 'newuser@example.com',
   *   role: 'developer',
   * });
   * ```
   */
  async inviteMember(orgId: string, request: InviteMemberRequest): Promise<OrganizationInvite> {
    const body = {
      email: request.email,
      role: request.role,
    };
    const response = await this.client.post<Record<string, unknown>>(`/v1/organizations/${orgId}/invites`, body);
    return this.transformInvite(response);
  }

  /**
   * Resend an invitation email
   * 
   * @example
   * ```typescript
   * await mql.organizations.resendInvite('org-id', 'invite-id');
   * ```
   */
  async resendInvite(orgId: string, inviteId: string): Promise<void> {
    await this.client.post(`/v1/organizations/${orgId}/invites/${inviteId}/resend`);
  }

  /**
   * Cancel a pending invitation
   * 
   * @example
   * ```typescript
   * await mql.organizations.cancelInvite('org-id', 'invite-id');
   * ```
   */
  async cancelInvite(orgId: string, inviteId: string): Promise<void> {
    await this.client.delete(`/v1/organizations/${orgId}/invites/${inviteId}`);
  }

  /**
   * Get pending invitations for the current user
   * 
   * @example
   * ```typescript
   * const myInvites = await mql.organizations.getMyInvites();
   * myInvites.forEach(i => console.log(`Invited to ${i.orgName} as ${i.role}`));
   * ```
   */
  async getMyInvites(): Promise<PendingInvite[]> {
    const response = await this.client.get<Array<Record<string, unknown>>>('/v1/invites/pending');
    return response.map(i => this.transformPendingInvite(i));
  }

  /**
   * Accept an organization invitation
   * 
   * @example
   * ```typescript
   * // Accept using the invite ID (when authenticated)
   * const result = await mql.organizations.acceptInvite({ token: 'invite-id' });
   * console.log(`Joined ${result.orgId} as ${result.role}`);
   * ```
   */
  async acceptInvite(request: AcceptInviteRequest): Promise<{ orgId: string; role: string }> {
    const response = await this.client.post<Record<string, unknown>>('/v1/invites/accept', {
      token: request.token,
    });
    
    const data = response as { org_id: string; role: string };
    return {
      orgId: data.org_id,
      role: data.role,
    };
  }

  // ============================================================================
  // Transform helpers
  // ============================================================================

  private transformOrganization(data: Record<string, unknown>): Organization {
    const o = data as {
      id: string;
      name: string;
      display_name: string | null;
      created_at?: string;
      member_count?: number;
      your_role?: string;
      owner_email?: string | null;
    };

    return {
      id: o.id,
      name: o.name,
      displayName: o.display_name,
      createdAt: o.created_at,
      memberCount: o.member_count,
      yourRole: o.your_role as UserRole | undefined,
      ownerEmail: o.owner_email,
    };
  }

  private transformListResponse(response: Record<string, unknown>): UserOrganizationsResponse {
    const data = response as { organizations: Array<Record<string, unknown>> };
    return {
      organizations: data.organizations.map(o => this.transformOrganization(o)),
    };
  }

  private transformMember(data: Record<string, unknown>): OrganizationMember {
    const m = data as {
      user_id: string;
      email: string;
      role: string;
      joined_at: string;
    };

    return {
      userId: m.user_id,
      email: m.email,
      role: m.role as UserRole,
      joinedAt: m.joined_at,
    };
  }

  private transformInvite(data: Record<string, unknown>): OrganizationInvite {
    const i = data as {
      id: string;
      email: string;
      role: string;
      status: string;
      expires_at: string;
    };

    return {
      id: i.id,
      email: i.email,
      role: i.role as UserRole,
      status: i.status as OrganizationInvite['status'],
      expiresAt: i.expires_at,
    };
  }

  private transformPendingInvite(data: Record<string, unknown>): PendingInvite {
    const i = data as {
      id: string;
      org_id: string;
      org_name: string;
      org_display_name: string | null;
      role: string;
      expires_at: string;
    };

    return {
      id: i.id,
      orgId: i.org_id,
      orgName: i.org_name,
      orgDisplayName: i.org_display_name,
      role: i.role as UserRole,
      expiresAt: i.expires_at,
    };
  }
}
