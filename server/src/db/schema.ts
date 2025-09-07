import { boolean, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';

// Submission status enum
export const submissionStatusEnum = pgEnum('submission_status', [
  'SUBMITTED',
  'REVIEWING', 
  'PENDING_UPDATES',
  'COMPLETED'
]);

// BetterAuth users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// BetterAuth sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});

// BetterAuth accounts table (for OAuth providers)
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => new Date())
    .notNull(),
});

// BetterAuth verification tokens table
export const verificationTokens = pgTable('verification_tokens', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Forms table
export const forms = pgTable('forms', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(true),
  schema: jsonb('schema'),
  liveVersionId: integer('live_version_id'),
  createdBy: text('created_by')
    .references(() => users.id)
    .notNull(),
  updatedBy: text('updated_by')
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Form versions table
export const formVersions = pgTable(
  'form_versions',
  {
    id: serial('id').primaryKey(),
    formId: integer('form_id')
      .references(() => forms.id, { onDelete: 'cascade' })
      .notNull(),
    versionSha: text('version_sha').notNull(),
    description: text('description'),
    schema: jsonb('schema').notNull(),
    isPublished: boolean('is_published').default(false),
    publishedAt: timestamp('published_at'),
    metadata: jsonb('metadata'),
    createdBy: text('created_by')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_form_versions_form_id').on(table.formId),
    index('idx_form_versions_published').on(table.formId, table.isPublished),
    unique('form_versions_version_sha_unique').on(table.versionSha),
  ],
);

// Submissions table
export const submissions = pgTable('submissions', {
  id: serial('id').primaryKey(),
  formId: integer('form_id')
    .references(() => forms.id, { onDelete: 'cascade' })
    .notNull(),
  versionSha: text('version_sha').references(() => formVersions.versionSha),
  data: jsonb('data').notNull(),
  status: submissionStatusEnum('status').default('SUBMITTED').notNull(),
  createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Submission tokens table (for anonymous submissions)
export const submissionTokens = pgTable('submission_tokens', {
  id: serial('id').primaryKey(),
  submissionId: integer('submission_id')
    .references(() => submissions.id, { onDelete: 'cascade' })
    .notNull(),
  token: text('token').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Jobs table (for queue management if needed)
export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  queue: text('queue').notNull(),
  payload: jsonb('payload').notNull(),
  attempts: integer('attempts').default(0),
  reservedAt: timestamp('reserved_at'),
  availableAt: timestamp('available_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type FormVersion = typeof formVersions.$inferSelect;
export type NewFormVersion = typeof formVersions.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type SubmissionToken = typeof submissionTokens.$inferSelect;
export type NewSubmissionToken = typeof submissionTokens.$inferInsert;
