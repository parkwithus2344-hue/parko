export const API_BASE = import.meta.env.VITE_API_URL || ''

export async function apiFetch(path: string, options?: RequestInit) {
  const token = localStorage.getItem('parkspot_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('parkspot_token')
    localStorage.removeItem('parkspot_user')
    window.location.href = '/login'
  }

  return res
}
