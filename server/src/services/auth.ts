import { eq } from 'drizzle-orm';
import type { Database } from '../db/index';
import { users } from '../db/schema';

/**
 * Retrieves user profile information for settings page
 * Returns safe user data without sensitive fields
 */
export const getUserProfile = async (db: Database, userId: string) => {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
};

/**
 * Updates user profile information (name and email)
 * Returns updated user data for immediate UI refresh
 */
export const updateUserProfile = async (
  db: Database,
  userId: string,
  profileData: {
    name?: string;
    email?: string;
  },
) => {
  return await db
    .update(users)
    .set({
      ...profileData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      emailVerified: users.emailVerified,
    });
};

/**
 * Permanently deletes a user account
 * Cascading deletes will handle related forms and submissions
 */
export const deleteUser = async (db: Database, userId: string) => {
  return await db.delete(users).where(eq(users.id, userId));
};
