/**
 * @fileoverview OpenPath Component
 * @module Frontend/API/Client
 * @description Provides a strongly-typed wrapper around native fetch for communicating with the FastAPI backend.
 * Handles common tasks like error parsing, JSON serialization, and dynamic base URLs.
 * @dependencies None
 * @stateConsumed N/A
 * @stateProduced N/A
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface ApiError {
  message: string;
  status: number;
}

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = 'An error occurred during the request.';
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.detail || errorBody.message || errorMessage;
        } catch {
          // Fallback to status text if body isn't JSON
          errorMessage = response.statusText;
        }
        
        throw { message: errorMessage, status: response.status } as ApiError;
      }
      
      if (response.status === 204) {
          return {} as T;
      }

      return await response.json();
    } catch (error) {
      if ((error as ApiError).status) {
          throw error;
      }
      throw { message: (error as Error).message, status: 500 } as ApiError;
    }
  }

  static get<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  static post<T>(endpoint: string, data?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static put<T>(endpoint: string, data?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static delete<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}
