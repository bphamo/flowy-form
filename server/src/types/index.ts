/* eslint-disable @typescript-eslint/no-explicit-any */

export interface FormSchema {
  components: any[];
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}
