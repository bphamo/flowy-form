import { jest } from '@jest/globals';
import { MockDb, MockForm, MockFormVersion, MockSubmission, MockSubmissionToken, MockUser } from './types';

// Mock data for testing
export const mockUser: MockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  githubId: '123456',
  avatarUrl: 'https://avatars.githubusercontent.com/u/123456',
  emailVerifiedAt: null,
  rememberToken: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockForm: MockForm = {
  id: 1,
  name: 'Test Form',
  description: 'A test form',
  isPublic: true,
  schema: { components: [] },
  liveVersionId: 1,
  createdBy: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockFormVersion: MockFormVersion = {
  id: 1,
  formId: 1,
  versionSha: 'abc123',
  description: 'Initial version',
  schema: { components: [] },
  isPublished: true,
  createdBy: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockSubmission: MockSubmission = {
  id: 1,
  formId: 1,
  versionSha: 'abc123',
  data: { field1: 'value1' },
  createdBy: 1,
  updatedBy: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockSubmissionToken: MockSubmissionToken = {
  id: 1,
  submissionId: 1,
  token: 'test-token-123',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

// Mock database operations
export const createMockDb = (): MockDb => {
  const mockQuery = jest.fn();
  const mockSelect = jest.fn().mockReturnThis();
  const mockWhere = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  const mockValues = jest.fn().mockReturnThis();
  const mockSet = jest.fn().mockReturnThis();
  const mockReturning = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockOrderBy = jest.fn().mockReturnThis();
  const mockInnerJoin = jest.fn().mockReturnThis();
  const mockLeftJoin = jest.fn().mockReturnThis();

  const mockTable = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  };

  return {
    query: mockQuery,
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    // Table accessors
    users: mockTable,
    forms: mockTable,
    formVersions: mockTable,
    submissions: mockTable,
    submissionTokens: mockTable,
    // Chain methods
    where: mockWhere,
    values: mockValues,
    set: mockSet,
    returning: mockReturning,
    limit: mockLimit,
    orderBy: mockOrderBy,
    innerJoin: mockInnerJoin,
    leftJoin: mockLeftJoin,
    // Mock implementations
    mockSelect,
    mockWhere,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockValues,
    mockSet,
    mockReturning,
    mockLimit,
    mockOrderBy,
    mockInnerJoin,
    mockLeftJoin,
  };
};

// Helper to create mock BetterAuth session
export const createMockBetterAuthSession = (user: MockUser = mockUser) => ({
  user: {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    image: user.avatarUrl,
  },
  session: {
    id: 'mock-session-id',
    userId: user.id.toString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
});

// Helper to mock successful database response
export const mockDbResponse = <T>(data: T): Promise<T> => Promise.resolve(data);

// Helper to mock failed database response
export const mockDbError = (error: string): Promise<never> => Promise.reject(new Error(error));
