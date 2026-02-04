/**
 * API клиент для BugTracker с поддержкой CSRF
 */

export interface Project {
  id: number
  name: string
  description: string
  owner: number
  created_at: string
  updated_at: string
}

export interface Issue {
  id: number
  title: string
  description: string
  project: number
  status: 'open' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  assignee: number | null
  reporter: number
  created_at: string
  updated_at: string
}

export interface User {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface AuthState {
  isAuthenticated: boolean
  user?: User
}

export class ApiClient {
  private baseUrl = '/api'

  /** Получаем CSRF-токен из cookie */
  private getCsrfToken(): string {
    const match = document.cookie.match(/csrftoken=([^;]+)/)
    return match ? match[1] : ''
  }

  /** Универсальный GET */
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: 'include',
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  /** Универсальный POST */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCsrfToken(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  /** Универсальный PUT */
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCsrfToken(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  /** Универсальный DELETE */
  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': this.getCsrfToken(),
      },
      credentials: 'include',
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
  }

  // ===== Auth методы =====

  async getWhoami(): Promise<AuthState> {
    return this.get('/auth/whoami/')
  }

  async login(username: string, password: string): Promise<AuthState> {
    return this.post('/auth/login/', { username, password })
  }

  async logout(): Promise<void> {
    return this.post('/auth/logout/', {})
  }

  async register(
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthState> {
    return this.post('/auth/register/', {
      username,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    })
  }
}

export const api = new ApiClient()
