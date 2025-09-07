import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { auth } from './lib/auth';
import formRoutes from './routes/forms';
import settingsRoutes from './routes/settings';
import submissionRoutes from './routes/submissions';
import versionRoutes from './routes/versions';
import './types/hono'; // Import Hono context type extensions

dotenv.config();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }),
);

// Health check
app.get('/', (c) => {
  return c.json({ message: 'DevelForm API is running', status: 'ok' });
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// API Routes
app.route('/api/forms', formRoutes);
app.route('/api/submissions', submissionRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api', versionRoutes);

const port = parseInt(process.env.PORT || '3001');

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
