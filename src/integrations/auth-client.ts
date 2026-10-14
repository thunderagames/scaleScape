export interface AuthUser {
  readonly username: string
}

export type AuthErrorCode = 'invalid_credentials' | 'username_taken' | 'invalid_username' | 'invalid_password' | 'too_many_attempts' | 'unavailable'

export type AuthResult =
  | { readonly ok: true; readonly user: AuthUser | null }
  | { readonly ok: false; readonly error: AuthErrorCode }

export interface AuthClient {
  getSession(): Promise<AuthResult>
  register(username: string, password: string): Promise<AuthResult>
  login(username: string, password: string): Promise<AuthResult>
  logout(): Promise<AuthResult>
  getData(): Promise<Readonly<Record<string, unknown>> | null>
  saveData(key: string, value: unknown): Promise<boolean>
}

export const AUTH_ENDPOINT = './api/auth.php'

const KNOWN_ERRORS: ReadonlySet<string> = new Set(['invalid_credentials', 'username_taken', 'invalid_username', 'invalid_password', 'too_many_attempts'])

type Payload = Readonly<Record<string, unknown>>

function is_record(value: unknown): value is Payload {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createAuthClient(endpoint = AUTH_ENDPOINT, fetch_impl: typeof fetch = fetch): AuthClient {
  let csrf_token = ''

  async function request(action: string, body?: unknown): Promise<Payload | null> {
    try {
      const is_post = body !== undefined
      const response = await fetch_impl(`${endpoint}?action=${action}`, {
        method: is_post ? 'POST' : 'GET',
        credentials: 'same-origin',
        headers: is_post ? { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': csrf_token } : { Accept: 'application/json' },
        body: is_post ? JSON.stringify(body) : undefined
      })
      const payload: unknown = await response.json()
      if (!is_record(payload)) return null
      if (typeof payload.csrf_token === 'string') csrf_token = payload.csrf_token
      return payload
    } catch {
      return null
    }
  }

  function to_result(payload: Payload | null): AuthResult {
    if (payload && typeof payload.error === 'string') return { ok: false, error: KNOWN_ERRORS.has(payload.error) ? payload.error as AuthErrorCode : 'unavailable' }
    if (!payload || !('user' in payload) || typeof payload.csrf_token !== 'string') return { ok: false, error: 'unavailable' }
    const user = payload.user
    return { ok: true, user: is_record(user) && typeof user.username === 'string' ? { username: user.username } : null }
  }

  return {
    getSession: async () => to_result(await request('session')),
    register: async (username, password) => to_result(await request('register', { username, password })),
    login: async (username, password) => to_result(await request('login', { username, password })),
    logout: async () => to_result(await request('logout', {})),
    getData: async () => {
      const payload = await request('data')
      return payload && is_record(payload.data) ? payload.data : null
    },
    saveData: async (key, value) => (await request('data', { key, value }))?.ok === true
  }
}
