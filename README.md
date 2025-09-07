# Flowy Form - Form Builder Application

A modern form builder application with a React frontend and Hono backend, supporting GitHub OAuth authentication and dynamic form creation.

## Architecture

- **Frontend**: React + TypeScript + Vite (port 3000)
- **Backend**: Hono + TypeScript + Drizzle ORM (port 3001)
- **Database**: PostgreSQL
- **Authentication**: GitHub OAuth with JWT tokens

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- GitHub OAuth App (for authentication)

### Installation

1. Clone the repository
2. Install dependencies for all packages:
   ```bash
   npm run install:all
   ```

### Environment Setup

1. **Server Configuration** (`server/.env`):

   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/flowyform
   JWT_SECRET=your-super-secret-jwt-key
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   GITHUB_REDIRECT_URI=http://localhost:3001/api/auth/github/callback
   PORT=3001
   CLIENT_URL=http://localhost:3000
   ```

2. **Client Configuration** (`client/.env`):
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

### Database Setup

1. Create a PostgreSQL database
2. Generate and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

Or start them separately:

```bash
# Frontend only (port 3000)
npm run dev:client

# Backend only (port 3001)
npm run dev:server
```

### Building for Production

```bash
npm run build
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

- **Database**: `npm run db:studio` - Open Drizzle Studio
- **Linting**: `npm run lint` - Run ESLint
- **Formatting**: `npm run format` - Run Prettier
- **Type Checking**: `npm run types` - Run TypeScript compiler

## Migration from Laravel

This project was migrated from a Laravel + Inertia.js setup to a modern Hono + React architecture while maintaining all existing functionality and database compatibility.
