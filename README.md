# FlowableForms - Modern Form Builder Application

A modern form builder application with a React frontend and Hono backend, supporting GitHub OAuth authentication and dynamic form creation with version control.

## Architecture

- **Frontend**: React + TypeScript + TanStack Router + Vite (port 3000)
- **Backend**: Hono + TypeScript + Drizzle ORM (port 3001)
- **Database**: PostgreSQL
- **Authentication**: BetterAuth with GitHub OAuth
- **Runtime**: Bun (JavaScript/TypeScript runtime)

## Getting Started

### Prerequisites

- Bun runtime (latest version)
- PostgreSQL database
- GitHub OAuth App (for authentication)

### Installation

1. Clone the repository
2. Install dependencies for all packages:
   ```bash
   bun run install:all
   ```

### Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values:

```env
# Application Configuration
APP_NAME=FlowableForms
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:3001

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/develform

# Authentication
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
JWT_SECRET=your-jwt-secret-key
BETTER_AUTH_SECRET=your-better-auth-secret-key

# Client Environment Variables (automatically used by Vite)
VITE_APP_NAME=FlowableForms
VITE_SERVER_URL=http://localhost:3001
```

### Database Setup

1. Start PostgreSQL database using Docker:

   ```bash
   docker-compose up -d postgres
   ```

2. Generate and run migrations:
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

### Development

Start both frontend and backend in development mode:

```bash
bun run dev
```

Or start them separately:

```bash
# Frontend only (port 3000)
bun run dev:client

# Backend only (port 3001)
bun run dev:server
```

### Building for Production

```bash
bun run build
```

## API Endpoints

### Authentication

- `GET /api/auth/github` - Redirect to GitHub OAuth
- `GET /api/auth/github/callback` - Handle OAuth callback
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout user

### Forms

- `GET /api/forms` - List user's forms
- `POST /api/forms` - Create new form
- `GET /api/forms/:id` - Get form details
- `PATCH /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `GET /api/forms/:id/submit` - Get form schema for submission

### Submissions

- `POST /api/submissions` - Submit form data
- `GET /api/submissions/:id` - Get submission details
- `GET /api/submissions/form/:formId` - Get all submissions for form

### Settings

- `GET /api/settings/profile` - Get user profile
- `PATCH /api/settings/profile` - Update user profile
- `DELETE /api/settings/profile` - Delete user account

## Features

- **Form Builder**: Create dynamic forms with custom schemas
- **Public/Private Forms**: Control form visibility and access
- **Anonymous Submissions**: Support submissions without authentication
- **GitHub OAuth**: Secure authentication via GitHub
- **Real-time Updates**: Modern React frontend with state management
- **Type Safety**: Full TypeScript coverage for both frontend and backend

## Database Schema

- **Users**: GitHub OAuth integration with profile management
- **Forms**: Form definitions with JSON schemas and metadata
- **Submissions**: Form submission data with user association
- **Submission Tokens**: Secure access tokens for anonymous submissions

## Development Tools

- **Database**: `bun run db:studio` - Open Drizzle Studio
- **Linting**: `bun run lint` - Run ESLint
- **Formatting**: `bun run format` - Run Prettier
- **Type Checking**: `bun run types` - Run TypeScript compiler

## Architecture Migration

## Architecture Migration

This project was successfully migrated from a Laravel + Inertia.js setup to a modern Bun + Hono + React architecture while maintaining all existing functionality and database compatibility. The migration included:

- **Backend**: Laravel → Hono + TypeScript + Drizzle ORM
- **Frontend**: Inertia.js → React + TanStack Router
- **Authentication**: Laravel Sanctum → BetterAuth with GitHub OAuth
- **Database**: Maintained PostgreSQL with improved schema management
- **Runtime**: Node.js → Bun for better performance and package management
- **Form Builder**: Enhanced with version control and real-time auto-save The migration included:

- **Backend**: Laravel → Hono + TypeScript + Drizzle ORM
- **Frontend**: Inertia.js → React + TanStack Router
- **Authentication**: Laravel Sanctum → BetterAuth with GitHub OAuth
- **Database**: Maintained PostgreSQL with improved schema management
- **Runtime**: Node.js → Bun for better performance
- **Form Builder**: Enhanced with version control and real-time auto-save
