import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index';
import { authMiddleware } from '../middleware/auth';
import * as authService from '../services/auth';

const settingsRoutes = new Hono();

// Validation schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email').optional(),
});

/**
 * GET /api/settings/profile
 *
 * Retrieves current user's profile information
 * Returns safe user data for settings page display
 *
 * Access: Authenticated users only (own profile)
 * Auth Required: Yes
 *
 * Response: { data: UserProfile }
 */
settingsRoutes.get('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    const userProfile = await authService.getUserProfile(db, user.id);

    if (userProfile.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ data: userProfile[0] });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

/**
 * PATCH /api/settings/profile
 *
 * Updates user profile information (name and email)
 * Validates input and returns updated data for immediate UI refresh
 *
 * Access: Authenticated users only (own profile)
 * Auth Required: Yes
 *
 * Body: { name, email? }
 * Response: { data: UpdatedUserProfile }
 */
settingsRoutes.patch('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }
    const body = await c.req.json();

    const validatedData = updateProfileSchema.parse(body);

    const updatedUser = await authService.updateUserProfile(db, user.id, validatedData);

    return c.json({ data: updatedUser[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation failed', errors: error.issues }, 400);
    }
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

/**
 * DELETE /api/settings/profile
 *
 * Permanently deletes the user account and all associated data
 * This action is irreversible and removes all forms and submissions
 *
 * Access: Authenticated users only (own account)
 * Auth Required: Yes
 *
 * Response: { message: "Account deleted successfully" }
 */
settingsRoutes.delete('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Note: In a real application, you might want to handle this more gracefully
    // by anonymizing data instead of hard deleting, depending on your data retention policies
    await authService.deleteUser(db, user.id);

    return c.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

export default settingsRoutes;
