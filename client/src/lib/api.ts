import type {
  CreateFormRequest,
  CreateFormResponse,
  CreateSubmissionResponse,
  CreateVersionRequest,
  CreateVersionResponse,
  DeleteAccountResponse,
  DeleteFormResponse,
  DeleteVersionResponse,
  FormVersion,
  GetFormResponse,
  GetFormSchemaResponse,
  GetFormsResponse,
  GetFormSubmissionsResponse,
  GetFormVersionsResponse,
  GetProfileResponse,
  GetSubmissionResponse,
  GetSubmissionsByFormResponse,
  GetUserSubmissionsResponse,
  PublishVersionResponse,
  RevertVersionRequest,
  RevertVersionResponse,
  UpdateFormRequest,
  UpdateFormResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  UpdateSubmissionStatusRequest,
  UpdateSubmissionStatusResponse,
  UpdateVersionRequest,
  UpdateVersionResponse,
} from '../types/api';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL + '/api' || 'http://localhost:3001/api';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Forms methods
  forms = {
    list: () => this.request<GetFormsResponse>('/forms'),
    get: (id: number) => this.request<GetFormResponse>(`/forms/${id}`),
    getSubmitSchema: (id: number) => this.request<GetFormSchemaResponse>(`/forms/${id}/submit`),
    create: (data: CreateFormRequest) =>
      this.request<CreateFormResponse>('/forms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: UpdateFormRequest) =>
      this.request<UpdateFormResponse>(`/forms/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      this.request<DeleteFormResponse>(`/forms/${id}`, {
        method: 'DELETE',
      }),
    getSubmissions: (id: number) => this.request<GetFormSubmissionsResponse>(`/forms/${id}/submissions`),
  };

  // Versions methods
  versions = {
    list: (formId: number) => this.request<GetFormVersionsResponse>(`/forms/${formId}/versions`),
    get: (formId: number, versionSha: string) => this.request<{ data: FormVersion & { schema: unknown } }>(`/forms/${formId}/versions/${versionSha}`),
    create: (formId: number, data: CreateVersionRequest) =>
      this.request<CreateVersionResponse>(`/forms/${formId}/versions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (formId: number, sha: string, data: UpdateVersionRequest) =>
      this.request<UpdateVersionResponse>(`/forms/${formId}/versions/${sha}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (formId: number, sha: string) =>
      this.request<DeleteVersionResponse>(`/forms/${formId}/versions/${sha}`, {
        method: 'DELETE',
      }),
    publish: (formId: number, sha: string) =>
      this.request<PublishVersionResponse>(`/forms/${formId}/versions/${sha}/publish`, {
        method: 'POST',
      }),
    forceReset: (formId: number, sha: string) =>
      this.request<RevertVersionResponse>(`/forms/${formId}/versions/${sha}/force-reset`, {
        method: 'POST',
      }),
    makeLive: (formId: number, sha: string) =>
      this.request<RevertVersionResponse>(`/forms/${formId}/versions/${sha}/make-live`, {
        method: 'POST',
      }),
    makeLatest: (formId: number, sha: string, data: RevertVersionRequest) =>
      this.request<RevertVersionResponse>(`/forms/${formId}/versions/${sha}/make-latest`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Submissions methods
  submissions = {
    submitToForm: (formId: number, versionSha: string, data: unknown) =>
      this.request<CreateSubmissionResponse>(`/submissions/form/${formId}`, {
        method: 'POST',
        body: JSON.stringify({ formId, versionSha, data }),
      }),
    get: (id: number, token?: string) => {
      const params = token ? `?token=${token}` : '';
      return this.request<GetSubmissionResponse>(`/submissions/${id}${params}`);
    },
    getByForm: (formId: number) => this.request<GetSubmissionsByFormResponse>(`/submissions/form/${formId}`),
    getByUser: () => this.request<GetUserSubmissionsResponse>('/submissions'),
    updateStatus: (id: number, data: UpdateSubmissionStatusRequest) =>
      this.request<UpdateSubmissionStatusResponse>(`/submissions/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // Settings methods
  settings = {
    getProfile: () => this.request<GetProfileResponse>('/settings/profile'),
    updateProfile: (data: UpdateProfileRequest) =>
      this.request<UpdateProfileResponse>('/settings/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteAccount: () =>
      this.request<DeleteAccountResponse>('/settings/profile', {
        method: 'DELETE',
      }),
  };
}

export const api = new ApiClient();
