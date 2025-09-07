import { jest } from '@jest/globals';

// Test response type interfaces
export interface TestResponse<T = unknown> {
  status: number;
  data?: T;
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
  user?: {
    id: number;
    name: string;
    email: string;
    githubId: string;
    avatarUrl: string;
  };
  token?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Mock user interface
export interface MockUser {
  id: number;
  name: string;
  email: string;
  githubId: string;
  avatarUrl: string;
  emailVerifiedAt: Date | null;
  rememberToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Mock form interface
export interface MockForm {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  schema: Record<string, unknown>;
  liveVersionId: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock form version interface
export interface MockFormVersion {
  id: number;
  formId: number;
  versionSha: string;
  description: string;
  schema: Record<string, unknown>;
  isPublished: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mock submission interface
export interface MockSubmission {
  id: number;
  formId: number;
  versionSha: string;
  data: Record<string, unknown>;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Mock submission token interface
export interface MockSubmissionToken {
  id: number;
  submissionId: number;
  token: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock context interface
export interface MockContext {
  req: {
    param: jest.Mock;
    json: jest.Mock;
    header: jest.Mock;
  };
  json: jest.Mock;
  get: jest.Mock;
  set: jest.Mock;
}

// Mock database interface
export interface MockDb {
  query: jest.Mock;
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  users: MockTable;
  forms: MockTable;
  formVersions: MockTable;
  submissions: MockTable;
  submissionTokens: MockTable;
  where: jest.Mock;
  values: jest.Mock;
  set: jest.Mock;
  returning: jest.Mock;
  limit: jest.Mock;
  orderBy: jest.Mock;
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  mockSelect: jest.Mock;
  mockWhere: jest.Mock;
  mockInsert: jest.Mock;
  mockUpdate: jest.Mock;
  mockDelete: jest.Mock;
  mockValues: jest.Mock;
  mockSet: jest.Mock;
  mockReturning: jest.Mock;
  mockLimit: jest.Mock;
  mockOrderBy: jest.Mock;
  mockInnerJoin: jest.Mock;
  mockLeftJoin: jest.Mock;
}

// Mock table interface
export interface MockTable {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

// BetterAuth Session interface
export interface MockBetterAuthSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}
