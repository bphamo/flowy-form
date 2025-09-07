// API Response Types for Flowy Form
// This file contains type definitions for all API endpoints based on server route handlers

import { FormType } from '@formio/react';
import { z } from 'zod';

// Base types
export interface ApiError {
  error: string;
  errors?: z.ZodIssue[];
}

export interface ApiSuccessMessage {
  message: string;
}

// User/Auth types
export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  githubId: string | null;
  avatarUrl: string | null;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string | null;
  githubId: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

// Version types
export interface FormVersion {
  id: number;
  versionSha: string;
  schema: FormType | undefined;
  description: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  metadata: {
    baseVersionSha: string | null;
    auditDescription: string | null;
    createdAt: string;
    operation: 'initial' | 'derived';
  } | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  };
}

export interface FormVersionWithSchema extends FormVersion {
  schema: FormType;
}

// Form types
export interface FormSummary {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormWithCreator {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  schema: FormType | undefined;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    name: string;
  } | null;
}

export interface FormSchema {
  id: number;
  name: string;
  schema: FormType | undefined;
  versionSha: string | null;
}

export interface Form {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  schema: FormType | undefined;
  createdBy: number;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
}

// Submission types
export interface SubmitterInformation {
  name: string;
  email: string | null;
}

export interface SubmissionSummary {
  id: number;
  data: unknown;
  createdAt: string;
  submitterInformation: SubmitterInformation | null;
  isAnonymous: boolean;
}

export interface SubmissionDetail {
  id: number;
  formId: number;
  formName: string | null;
  data: Submission | undefined;
  schema: FormType | undefined;
  versionSha: string | null;
  version: {
    sha: string;
    description: string | null;
  } | null;
  createdAt: string;
  isFormOwner: boolean;
  submitterInformation: SubmitterInformation | null;
  token?: string;
}

export interface SubmissionCreateResult {
  id: number;
  token: string | null;
  formId: number;
  submittedAt: string;
}

export interface UserSubmission {
  id: number;
  formId: number;
  formName: string;
  formDescription: string | null;
  data: unknown;
  createdAt: string;
  versionSha: string | null;
  formOwner: {
    id: number;
    name: string;
    email: string | null;
  };
}

// API Response Types

// Auth endpoints
export interface GetUserResponse {
  user: AuthUser;
}

export interface LogoutResponse {
  message: string;
}

// Form endpoints
export interface GetFormsResponse {
  data: FormSummary[];
}

export interface GetFormResponse {
  data: FormWithCreator;
}

export interface GetFormSchemaResponse {
  data: FormSchema;
}

export interface CreateFormResponse {
  data: Form;
}

export interface UpdateFormResponse {
  data: Form;
}

export interface UpdateFormSchemaResponse {
  data: Form;
}

export interface DeleteFormResponse {
  message: string;
}

export interface GetFormSubmissionsResponse {
  data: SubmissionSummary[];
}

// Version endpoints
export interface GetFormVersionsResponse {
  data: {
    versions: FormVersion[];
    liveVersion: string | null;
  };
}

export interface CreateVersionResponse {
  data: {
    version: FormVersionWithSchema;
    sha: string;
  };
}

export interface UpdateVersionResponse {
  data: FormVersion;
}

export interface DeleteVersionResponse {
  message: string;
}

export interface PublishVersionResponse {
  data: FormVersion;
}

export interface RevertVersionResponse {
  data: FormVersion[];
  message: string;
}

// Submission endpoints
export interface GetSubmissionResponse {
  data: SubmissionDetail;
}

export interface GetSubmissionsByFormResponse {
  data: SubmissionSummary[];
}

export interface CreateSubmissionResponse {
  data: SubmissionCreateResult;
}

export interface GetUserSubmissionsResponse {
  data: UserSubmission[];
}

// Settings endpoints
export interface GetProfileResponse {
  data: UserProfile;
}

export interface UpdateProfileResponse {
  data: {
    id: number;
    name: string;
    email: string | null;
    githubId: string | null;
    avatarUrl: string | null;
  };
}

export interface DeleteAccountResponse {
  message: string;
}

// Union types for error responses
export type AuthApiResponse<T> = T | ApiError;
export type FormApiResponse<T> = T | ApiError;
export type SubmissionApiResponse<T> = T | ApiError;
export type SettingsApiResponse<T> = T | ApiError;

// Complete API interface mapping
export interface ApiResponses {
  // Auth
  'GET /auth/user': AuthApiResponse<GetUserResponse>;
  'POST /auth/logout': AuthApiResponse<LogoutResponse>;

  // Forms
  'GET /forms': FormApiResponse<GetFormsResponse>;
  'GET /forms/:id': FormApiResponse<GetFormResponse>;
  'GET /forms/:id/submit': FormApiResponse<GetFormSchemaResponse>;
  'POST /forms': FormApiResponse<CreateFormResponse>;
  'PATCH /forms/:id': FormApiResponse<UpdateFormResponse>;
  'PATCH /forms/:id/schema': FormApiResponse<UpdateFormSchemaResponse>;
  'DELETE /forms/:id': FormApiResponse<DeleteFormResponse>;
  'GET /forms/:id/submissions': FormApiResponse<GetFormSubmissionsResponse>;

  // Submissions
  'GET /submissions/:id': SubmissionApiResponse<GetSubmissionResponse>;
  'GET /submissions/form/:formId': SubmissionApiResponse<GetSubmissionsByFormResponse>;
  'GET /submissions/user': SubmissionApiResponse<GetUserSubmissionsResponse>;
  'POST /submissions/form/:formId': SubmissionApiResponse<CreateSubmissionResponse>;

  // Settings
  'GET /settings/profile': SettingsApiResponse<GetProfileResponse>;
  'PATCH /settings/profile': SettingsApiResponse<UpdateProfileResponse>;
  'DELETE /settings/profile': SettingsApiResponse<DeleteAccountResponse>;
}

// Helper type to extract response type from endpoint
export type ApiResponse<K extends keyof ApiResponses> = ApiResponses[K];

// Request payload types
export interface CreateFormRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  schema?: unknown;
}

export interface UpdateFormRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
  schema?: unknown;
}

export interface UpdateFormSchemaRequest {
  schema: FormType | undefined;
}

export interface CreateSubmissionRequest {
  formId: number;
  versionSha: string;
  data: unknown;
}

export interface UpdateProfileRequest {
  name: string;
  email?: string;
}

// Version request types
export interface CreateVersionRequest {
  description?: string;
  schema?: FormType; // Optional - server will determine base schema if not provided
  publish?: boolean;
  baseVersionSha?: string; // Optional base version to copy schema from
}

export interface UpdateVersionRequest {
  description?: string;
  schema?: unknown;
}

export interface RevertVersionRequest {
  description?: string;
}
