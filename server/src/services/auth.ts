import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import type { Database } from '../db/index';
import { users } from '../db/schema';

/**
 * Finds a user by their GitHub ID
 * Used during GitHub OAuth authentication to check if user already exists
 */
export const findUserByGithubId = async (db: Database, githubId: string) => {
  return await db.select().from(users).where(eq(users.githubId, githubId)).limit(1);
};

/**
 * Finds a user by their email address
 * Used during GitHub OAuth to link existing email accounts with GitHub
 */
export const findUserByEmail = async (db: Database, email: string) => {
  return await db.select().from(users).where(eq(users.email, email)).limit(1);
};

/**
 * Creates a new user in the database
 * Returns the created user data for JWT token generation
 */
export const createUser = async (
  db: Database,
  userData: {
    name: string;
    email?: string | null;
    githubId?: string | null;
    avatarUrl?: string | null;
  },
) => {
  return await db.insert(users).values({
    id: createId(),
    ...userData,
  }).returning();
};

/**
 * Updates an existing user with GitHub OAuth data
 * Used when linking a GitHub account to an existing email-based account
 */
export const updateUserWithGithubData = async (
  db: Database,
  userId: string,
  githubData: {
    githubId: string;
    avatarUrl?: string | null;
  },
) => {
  return await db
    .update(users)
    .set({
      ...githubData,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
};

/**
 * Retrieves user profile information for settings page
 * Returns safe user data without sensitive fields like password
 */
export const getUserProfile = async (db: Database, userId: string) => {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      githubId: users.githubId,
      avatarUrl: users.avatarUrl,
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
      githubId: users.githubId,
      avatarUrl: users.avatarUrl,
    });
};

/**
 * Permanently deletes a user account
 * Cascading deletes will handle related forms and submissions
 */
export const deleteUser = async (db: Database, userId: string) => {
  return await db.delete(users).where(eq(users.id, userId));
};
