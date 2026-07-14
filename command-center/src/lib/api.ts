import { QueryClient } from '@tanstack/react-query'

export const formatUSD = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)

export const formatDateEC = (date: Date | string) =>
  new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', (error as Error).message)
      },
    },
  },
})

export const api = {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`/api${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error((error as any).message || `HTTP ${res.status}`)
    }
    return res.json()
  },

  async post<T>(url: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.fetchWithMethod('POST', url, data, options)
  },

  async patch<T>(url: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.fetchWithMethod('PATCH', url, data, options)
  },

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.fetchWithMethod('DELETE', url, undefined, options)
  },

  async fetchWithMethod<T>(
    method: string,
    url: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    const res = await fetch(`/api${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error((error as any).message || `HTTP ${res.status}`)
    }
    return res.json()
  },
}
