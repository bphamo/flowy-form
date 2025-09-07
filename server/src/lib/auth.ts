import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as dotenv from 'dotenv';
import { db } from '../db/index';
import { accounts, sessions, users, verificationTokens } from '../db/schema';

dotenv.config();

export const auth = betterAuth({
  baseURL: process.env.BASE_URL || 'http://localhost:3001',
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key',
  trustedOrigins: [(process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '')],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verificationTokens,
    },
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
});

export type Session = typeof auth.$Infer.Session;
