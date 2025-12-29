import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MQL } from '../../index';

describe('OrganizationsAPI - Unit Tests (Mocked)', () => {
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
    it('should create organization', async () => {
      const mockResponse = {
        id: 'org_123',
        name: 'Test Org',
        slug: 'test-org',
        created_at: '2024-01-01T00:00:00Z'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 201 })
      );

      const org = await mql.organizations.create({ name: 'Test Org' });

      expect(org.id).toBe('org_123');
      expect(org.name).toBe('Test Org');
    });
  });

  describe('list()', () => {
    it('should list user organizations', async () => {
      const mockResponse = {
        organizations: [
          { id: 'org_1', name: 'Org 1' },
          { id: 'org_2', name: 'Org 2' }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.organizations.list();

      expect(result.organizations).toHaveLength(2);
    });
  });

  describe('get()', () => {
    it('should get organization details', async () => {
      const mockResponse = {
        id: 'org_123',
        name: 'Test Org',
        memberCount: 5
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const org = await mql.organizations.get('org_123');

      expect(org.id).toBe('org_123');
      expect(org.memberCount).toBe(5);
    });
  });

  describe('listMembers()', () => {
    it('should list organization members', async () => {
      const mockResponse = {
        members: [
          { id: 'user_1', email: 'user1@example.com', role: 'owner' },
          { id: 'user_2', email: 'user2@example.com', role: 'admin' }
        ]
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await mql.organizations.listMembers('org_123');

      expect(result.members).toHaveLength(2);
      expect(result.members[0].role).toBe('owner');
    });
  });

  describe('inviteMember()', () => {
    it('should invite member to organization', async () => {
      const mockResponse = {
        invite_id: 'inv_123',
        email: 'newuser@example.com',
        status: 'pending'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 201 })
      );

      const invite = await mql.organizations.inviteMember('org_123', {
        email: 'newuser@example.com',
        role: 'developer'
      });

      expect(invite.status).toBe('pending');
      expect(invite.email).toBe('newuser@example.com');
    });
  });

  describe('updateMemberRole()', () => {
    it('should update member role', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ role: 'admin' }), { status: 200 })
      );

      const result = await mql.organizations.updateMemberRole('org_123', 'user_123', {
        role: 'admin'
      });

      expect(result.role).toBe('admin');
    });
  });

  describe('acceptInvite()', () => {
    it('should accept organization invite', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await mql.organizations.acceptInvite('inv_123');

      expect(result.success).toBe(true);
    });
  });

  describe('removeMember()', () => {
    it('should remove member from organization', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await mql.organizations.removeMember('org_123', 'user_123');

      expect(result.success).toBe(true);
    });
  });
});
