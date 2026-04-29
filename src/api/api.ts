// para manejar las cookies del token
import Cookies from 'js-cookie'
// axios lo uso para hacer peticiones más cómodas
import axios, { type AxiosInstance } from 'axios'

// esto es lo que devuelve cada llamada a la api
type ApiFetchResponse<T = unknown> = {
  ok: boolean
  status: number
  data: T | null
}

// la url del backend la saco de las variables de entorno
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://backend-p4-klvc.onrender.com').replace(/\/+$/g, '')
const API_BASE = `${API_URL}/api`
// mi nombre para el header obligatorio
const STUDENT = process.env.NEXT_PUBLIC_STUDENT_NAME || 'laragonza'

// esto convierte los headers a un objeto normal porque pueden venir de varias formas
function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {}
  if (headers instanceof Headers) return Object.fromEntries(headers.entries())
  if (Array.isArray(headers)) return Object.fromEntries(headers)
  return { ...(headers as Record<string, string>) }
}

// función principal para hacer fetch a la api, la uso en casi todo
export async function apiFetch<T = unknown>(path: string, opts: RequestInit = {}): Promise<ApiFetchResponse<T>> {
  const headers = normalizeHeaders(opts.headers)

  // si el body es json le pongo el content-type
  const hasJsonBody = typeof opts.body === 'string' && opts.body.length > 0
  if (hasJsonBody) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  }

  // header obligatorio para la práctica
  headers['x-nombre'] = STUDENT

  // si hay token en la cookie lo mando en el header
  const token = typeof window !== 'undefined' ? Cookies.get('token') : null
  if (token) headers.Authorization = `Bearer ${token}`

  // construyo la url completa
  let relative = path
  if (relative.startsWith('/api')) relative = relative.slice(4)
  if (!relative.startsWith('/')) relative = `/${relative}`
  const url = `${API_BASE}${relative}`

  // timeout de 12 segundos por si el servidor tarda mucho
  const controller = new AbortController()
  const timeoutMs = 12000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  if (opts.signal) {
    opts.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  let res: Response
  try {
    res = await fetch(url, { ...opts, headers, signal: controller.signal })
  } catch (error) {
    clearTimeout(timeoutId)
    // si se cancela por timeout o por error de red devuelvo un error controlado
    const isAbort = error instanceof DOMException && error.name === 'AbortError'
    const timeoutPayload = { error: `La petición tardó demasiado (>${timeoutMs / 1000}s)` }
    const networkPayload = { error: error instanceof Error ? error.message : 'Error de red desconocido' }
    return {
      ok: false,
      status: isAbort ? 504 : 0,
      data: (isAbort ? timeoutPayload : networkPayload) as T
    }
  }
  clearTimeout(timeoutId)

  // si no está autenticado lo mando al login
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/auth'
  }

  // intento parsear la respuesta como json
  const contentType = res.headers.get('content-type') || ''
  let data: T | null = null
  try {
    if (contentType.includes('application/json')) {
      data = (await res.json()) as T
    } else {
      data = (await res.text()) as T
    }
  } catch {
    data = null
  }

  return { ok: res.ok, status: res.status, data }
}

// también creo una instancia de axios por si necesito usarla
const api: AxiosInstance = axios.create({ baseURL: API_BASE })

// interceptor para añadir los headers en todas las peticiones de axios
api.interceptors.request.use((cfg) => {
  const headers = (cfg.headers || {}) as Record<string, string>
  headers['x-nombre'] = STUDENT
  const token = Cookies.get('token')
  if (token) headers.Authorization = `Bearer ${token}`
  cfg.headers = headers as any
  return cfg
})

export { api }
export default api

// helpers para sacar campos del post porque la api a veces los llama en español y a veces en inglés
export function pickText(postLike: any): string {
  return postLike?.contenido || postLike?.content || ''
}

export function pickAuthor(postLike: any): any {
  return postLike?.autor || postLike?.author || null
}

export function pickComments(postLike: any): any[] {
  return postLike?.comentarios || postLike?.comments || []
}

// saca el id o username del usuario, dependiendo de lo que venga
export function pickUserIdentifier(userLike: any): string | null {
  return userLike?._id || userLike?.id || userLike?.username || null
}