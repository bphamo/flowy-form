# BetterAuth Migration Guide

## Overview

This document outlines the migration from the current custom JWT-based authentication system to BetterAuth for both the Hono backend and React frontend.

## Current Architecture Analysis

### Backend (Hono + Custom JWT)

- **Authentication Route**: `/api/auth/github` and `/api/auth/github/callback` handle GitHub OAuth
- **Auth Middleware**: Custom JWT verification using `hono/jwt`
- **User Management**: Custom services in `services/auth.ts`
- **Session Storage**: JWT tokens in httpOnly cookies
- **Database**: Drizzle ORM with custom user schema

### Frontend (React + TanStack Router)

- **Auth Context**: Custom `useAuth` hook with manual session management
- **Router Integration**: TanStack Router with auth context
- **Login Flow**: Redirects to backend GitHub OAuth endpoint
- **Session Persistence**: Relies on httpOnly cookies

## Migration Strategy

### Phase 1: Backend Migration

#### 1.1 Install BetterAuth Dependencies

Install the following packages in the server directory:

- `better-auth` (core authentication library)
- `better-auth/adapters/drizzle` (Drizzle ORM adapter)
- `@better-auth/hono` (Hono integration)

#### 1.2 Database Schema Updates

Update the Drizzle schema to be compatible with BetterAuth requirements:

**Required Tables:**

- Modify existing `users` table to include BetterAuth required fields
- Add `sessions` table for session management
- Add `accounts` table for OAuth provider data
- Add `verificationTokens` table for email verification

**Schema Changes Needed:**

- Add `emailVerified` boolean field to users table
- Ensure all BetterAuth required fields are present
- Update indexes for performance

#### 1.3 BetterAuth Configuration

Create a new auth configuration file that:

- Configures GitHub OAuth provider with existing environment variables
- Sets up Drizzle adapter with existing database connection
- Configures session management (recommend database sessions for production)
- Sets up CORS for the React frontend
- Configures cookie settings for secure authentication

#### 1.4 Replace Custom Auth Routes

Remove the existing custom auth routes and middleware:

- Delete `/routes/auth.ts` (GitHub OAuth, callback, user, logout endpoints)
- Remove custom `authMiddleware` and `optionalAuthMiddleware`
- Remove custom auth services from `services/auth.ts`

Replace with BetterAuth integration:

- Mount BetterAuth handlers on `/api/auth/**` routes
- Create new middleware using BetterAuth's session validation
- Update all protected routes to use new middleware

#### 1.5 Update Protected Routes

Modify all routes that currently use `authMiddleware`:

- Replace JWT payload access with BetterAuth session data
- Update user data structure access patterns
- Ensure proper error handling for unauthenticated requests

### Phase 2: Frontend Migration

#### 2.1 Install BetterAuth Client Dependencies

Install in the client directory:

- `better-auth/client` (client-side authentication utilities)
- `better-auth/react` (React hooks and components)

#### 2.2 Replace Custom Auth Hook

Replace the existing custom auth implementation:

- Remove current `hooks/use-auth.ts`
- Remove custom `AuthProvider` and context
- Replace with BetterAuth React client configuration

#### 2.3 Update Auth Client Setup

Create BetterAuth client configuration:

- Configure base URL to point to Hono backend
- Enable credentials for cookie-based sessions
- Set up proper error handling

#### 2.4 Update Authentication Components

Modify authentication-related components:

- Update login page to use BetterAuth's signIn methods
- Modify logout functionality to use BetterAuth's signOut
- Update any user profile display components

#### 2.5 Update Router Integration

Modify TanStack Router setup:

- Replace custom auth context with BetterAuth session management
- Update route guards (`requireAuth`, `requireGuest`) to use BetterAuth hooks
- Ensure proper loading states during authentication checks

#### 2.6 Update API Request Handling

Modify API request patterns:

- Ensure all requests to protected endpoints include proper credentials
- Update error handling for 401 responses
- Consider implementing automatic token refresh if using JWT mode

### Phase 3: Testing and Validation

#### 3.1 Authentication Flow Testing

- Test GitHub OAuth login flow end-to-end
- Verify session persistence across browser refreshes
- Test logout functionality and session cleanup
- Validate protected route access control

#### 3.2 Database Migration Testing

- Verify existing user data compatibility
- Test user lookup and creation during OAuth
- Validate session storage and retrieval
- Check cascade deletion behavior

#### 3.3 Security Validation

- Verify CORS configuration is secure
- Test session timeout behavior
- Validate cookie security settings
- Check for any authentication bypass vulnerabilities

## Environment Variables Updates

Update environment configuration:

- Keep existing GitHub OAuth credentials (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
- Add BetterAuth-specific configuration
- Update redirect URIs to match BetterAuth endpoints
- Configure session secrets and security settings

## Migration Considerations

### Breaking Changes

- User objects may have different field names/structure
- Session data access patterns will change
- Authentication state management differs
- API request patterns may need adjustment

### Compatibility

- Existing user data should be preserved
- GitHub OAuth flow should remain similar for users
- Session behavior should be equivalent or better

### Performance

- Database sessions may have different performance characteristics
- Consider session cleanup strategies
- Monitor authentication endpoint performance

## Rollback Plan

In case migration issues occur:

- Keep backup of current authentication implementation
- Maintain separate database migration files
- Document configuration changes for easy reversal
- Test rollback procedures in development environment

## Post-Migration Cleanup

After successful migration:

- Remove unused JWT dependencies
- Clean up old auth-related files
- Update documentation and README files
- Archive old authentication code for reference
