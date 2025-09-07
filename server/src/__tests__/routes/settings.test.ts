import { beforeEach, describe, expect, it } from '@jest/globals';
import { Hono } from 'hono';
import { mockUser } from '../mocks';
import { TestResponse } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Create test app with mocked settings routes
const createTestSettingsApp = () => {
  const app = new Hono();

  // Mock get profile endpoint
  app.get('/profile', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = {
      id: mockUser.id.toString(),
      name: mockUser.name,
      email: mockUser.email,
      image: mockUser.image,
      emailVerified: mockUser.emailVerified,
      createdAt: mockUser.createdAt,
    };

    return c.json({ data: profile });
  });

  // Mock update profile endpoint
  app.put('/profile', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();

    // Basic validation
    if (body.email && !body.email.includes('@')) {
      return c.json(
        {
          error: 'Validation failed',
          errors: { email: ['Invalid email format'] },
        },
        400,
      );
    }

    if (body.name && body.name.length < 2) {
      return c.json(
        {
          error: 'Validation failed',
          errors: { name: ['Name must be at least 2 characters'] },
        },
        400,
      );
    }

    const updatedProfile = {
      ...mockUser,
      name: body.name || mockUser.name,
      email: body.email || mockUser.email,
      updatedAt: new Date(),
    };

    return c.json({
      data: updatedProfile,
      message: 'Profile updated successfully',
    });
  });

  // Mock delete account endpoint
  app.delete('/account', async (c) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({ message: 'Account deleted successfully' });
  });

  return app;
};

describe('Settings Routes', () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestSettingsApp();
  });

  describe('GET /profile', () => {
    it('should return user profile when authenticated', async () => {
      const res = await app.request('/profile', {
        headers: { Authorization: 'Bearer mock-token' },
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      expect((data.data as any).id).toBe(mockUser.id.toString());
      expect((data.data as any).name).toBe(mockUser.name);
      expect((data.data as any).email).toBe(mockUser.email);
    });

    it('should return unauthorized without authentication', async () => {
      const res = await app.request('/profile');
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('PUT /profile', () => {
    it('should update profile with valid data', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      expect((data.data as any).name).toBe(updateData.name);
      expect((data.data as any).email).toBe(updateData.email);
      expect(data.message).toBe('Profile updated successfully');
    });

    it('should update profile with partial data', async () => {
      const updateData = {
        name: 'Updated Name Only',
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      expect((data.data as any).name).toBe(updateData.name);
    });

    it('should return validation error for invalid email', async () => {
      const updateData = {
        email: 'invalid-email',
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors).toBeDefined();
    });

    it('should return validation error for short name', async () => {
      const updateData = {
        name: 'A',
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.errors).toBeDefined();
    });

    it('should return unauthorized without authentication', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('DELETE /account', () => {
    it('should delete account successfully when authenticated', async () => {
      const res = await app.request('/account', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mock-token' },
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(200);
      expect(data.message).toBe('Account deleted successfully');
    });

    it('should return unauthorized without authentication', async () => {
      const res = await app.request('/account', { method: 'DELETE' });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle profile updates with unicode characters', async () => {
      const updateData = {
        name: 'Test User 🚀 with émojis',
        email: 'test+unicode@example.com',
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      expect((data.data as any).name).toBe(updateData.name);
    });

    it('should handle very long names', async () => {
      const updateData = {
        name: 'A'.repeat(100),
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it('should handle emails with special characters', async () => {
      const updateData = {
        email: 'test+special.chars_123@example-domain.co.uk',
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      expect((data.data as any).email).toBe(updateData.email);
    });

    it('should handle malformed JSON in profile update', async () => {
      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: 'invalid json{',
      });

      // Should handle JSON parse error gracefully
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle empty profile update request', async () => {
      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
      // Should return existing data when no updates provided
    });

    it('should handle concurrent profile updates', async () => {
      const updateData = {
        name: 'Concurrent Update',
      };

      const promises = Array.from({ length: 3 }, (_, i) =>
        app.request('/profile', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...updateData, name: `${updateData.name} ${i}` }),
        }),
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });

    it('should handle malformed authorization header', async () => {
      const res = await app.request('/profile', {
        headers: { Authorization: 'InvalidFormat' },
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle empty authorization header', async () => {
      const res = await app.request('/profile', {
        headers: { Authorization: '' },
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle authorization header without Bearer prefix', async () => {
      const res = await app.request('/profile', {
        headers: { Authorization: 'just-token' },
      });
      const data = (await res.json()) as TestResponse;

      expect(res.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle profile update with null values', async () => {
      const updateData = {
        name: null,
        email: null,
      };

      const res = await app.request('/profile', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = (await res.json()) as TestResponse;

      // Should use existing values when null is provided
      expect(res.status).toBe(200);
      expect(data.data).toBeDefined();
    });
  });
});
