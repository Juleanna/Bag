/**
 * API клиент для BugTracker
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

class ApiClient {
  private baseUrl = '/api'

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`)
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
    return response.json()
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, { method: 'DELETE' })
    if (!response.ok) throw new Error(`API error: ${response.statusText}`)
  }
}

export const api = new ApiClient()
