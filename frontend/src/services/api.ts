const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

/**
 * A small wrapper around fetch that:
 * - Auto-attaches the JWT token from Pinia store
 * - Auto-serializes body to JSON
 * - Auto-parses response as JSON
 * - Throws a proper Error on non-2xx responses with the backend's error message
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(
      data?.error || `Request failed with status ${res.status}`,
      res.status,
      data?.details
    );
  }

  return data as T;
}