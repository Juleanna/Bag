/**
 * Клієнт API: fetch + CSRF + сесійна автентифікація.
 * Працює через Vite-проксі (/api → http://localhost:8000).
 */

import type {
  AuthState,
  PaginatedResponse,
} from './types'

const BASE = '/api'

function getCsrfToken(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1] : ''
}

interface ApiError extends Error {
  status: number
  detail?: string
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message = data.detail || data.error || response.statusText
    const err = new Error(message) as ApiError
    err.status = response.status
    err.detail = message
    throw err
  }
  // 204 No Content
  if (response.status === 204) return undefined as T
  return response.json()
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE}${endpoint}`, { credentials: 'include' })
  return handleResponse(response)
}

export async function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    credentials: 'include',
    body: JSON.stringify(body ?? {}),
  })
  return handleResponse(response)
}

export async function apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    credentials: 'include',
    body: JSON.stringify(body ?? {}),
  })
  return handleResponse(response)
}

export async function apiPatch<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    credentials: 'include',
    body: JSON.stringify(body ?? {}),
  })
  return handleResponse(response)
}

export async function apiDelete(endpoint: string): Promise<void> {
  const response = await fetch(`${BASE}${endpoint}`, {
    method: 'DELETE',
    headers: { 'X-CSRFToken': getCsrfToken() },
    credentials: 'include',
  })
  if (!response.ok && response.status !== 204) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || data.error || response.statusText)
  }
}

export async function apiUpload<T>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PATCH' | 'PUT' = 'POST'
): Promise<T> {
  const response = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: { 'X-CSRFToken': getCsrfToken() },
    credentials: 'include',
    body: formData,
  })
  return handleResponse(response)
}

// Auth helpers (тонка обгортка)

export async function fetchCsrf(): Promise<void> {
  await fetch(`${BASE}/auth/csrf/`, { credentials: 'include' })
}

export async function whoami(): Promise<AuthState> {
  return apiGet('/auth/whoami/')
}

export async function login(username: string, password: string): Promise<AuthState> {
  return apiPost('/auth/login/', { username, password })
}

export async function logout(): Promise<void> {
  await apiPost('/auth/logout/', {})
}

export async function register(payload: {
  username: string
  email: string
  password: string
  first_name?: string
  last_name?: string
}): Promise<AuthState> {
  return apiPost('/auth/register/', payload)
}

// Зручні шорткати для пагінованих ендпоінтів
export async function listAll<T>(endpoint: string): Promise<T[]> {
  const res = await apiGet<PaginatedResponse<T> | T[]>(endpoint)
  if (Array.isArray(res)) return res
  return res.results || []
}
