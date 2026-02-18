/**
 * API client for BugTracker with CSRF support
 */

export interface UserShort {
  id: number
  username: string
  first_name: string
  last_name: string
}

export interface Project {
  id: number
  name: string
  description: string
  owner: UserShort
  members: UserShort[]
  issues_count: number
  created_at: string
  updated_at: string
}

export interface Issue {
  id: number
  title: string
  description: string
  project: number
  status: 'open' | 'in_progress' | 'done' | 'cancelled'
  status_display: string
  priority: 'low' | 'medium' | 'high'
  priority_display: string
  assignee: number | null
  reporter: UserShort
  labels: number[]
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  issue: number
  author: UserShort
  body: string
  created_at: string
}

export interface Label {
  id: number
  name: string
  color: string
}

export interface ProjectMembership {
  id: number
  project: number
  user: UserShort
  role: string
  created_at: string
}

export interface Invitation {
  id: number
  project: number
  email: string
  role: string
  token: string
  accepted: boolean
  created_at: string
}

export interface AuthState {
  ok?: boolean
  isAuthenticated: boolean
  user?: UserShort
  error?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export class ApiClient {
  private baseUrl = '/api'

  private getCsrfToken(): string {
    const match = document.cookie.match(/csrftoken=([^;]+)/)
    return match ? match[1] : ''
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: 'include',
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || data.error || response.statusText)
    }
    return response.json()
  }

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
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || err.error || response.statusText)
    }
    return response.json()
  }

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
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || err.error || response.statusText)
    }
    return response.json()
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCsrfToken(),
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || err.error || response.statusText)
    }
    return response.json()
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'X-CSRFToken': this.getCsrfToken(),
      },
      credentials: 'include',
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || err.error || response.statusText)
    }
  }

  async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': this.getCsrfToken(),
      },
      credentials: 'include',
      body: formData,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.detail || err.error || response.statusText)
    }
    return response.json()
  }

  // ===== Auth =====

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
