import { describe, expect, it, vi } from 'vitest'
import { createAuthClient } from './auth-client'

const json_response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('auth client', () => {
  it('given_session_token_when_logging_in_then_posts_credentials_with_csrf_header', async () => {
    const fetch_impl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json_response({ user: null, csrf_token: 'token-1' }))
      .mockResolvedValueOnce(json_response({ user: { username: 'ana' }, csrf_token: 'token-2' }))
    const auth = createAuthClient('/api/auth.php', fetch_impl)

    expect(await auth.getSession()).toEqual({ ok: true, user: null })
    expect(await auth.login('ana', 'secret-pass')).toEqual({ ok: true, user: { username: 'ana' } })

    const [url, init] = fetch_impl.mock.calls[1]
    expect(url).toBe('/api/auth.php?action=login')
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>)['X-CSRF-Token']).toBe('token-1')
    expect(JSON.parse(String(init?.body))).toEqual({ username: 'ana', password: 'secret-pass' })
  })

  it('given_error_payload_when_registering_then_maps_the_error_code', async () => {
    const auth = createAuthClient('/api/auth.php', vi.fn<typeof fetch>().mockResolvedValue(json_response({ error: 'username_taken' }, 409)))
    expect(await auth.register('ana', 'secret-pass')).toEqual({ ok: false, error: 'username_taken' })
  })

  it('given_static_hosting_without_php_when_getting_session_then_reports_unavailable', async () => {
    const auth = createAuthClient('/api/auth.php', vi.fn<typeof fetch>().mockResolvedValue(new Response('<html>Not found</html>', { status: 404 })))
    expect(await auth.getSession()).toEqual({ ok: false, error: 'unavailable' })
  })

  it('given_signed_in_user_when_saving_and_reading_data_then_round_trips_values', async () => {
    const fetch_impl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(json_response({ ok: true }))
      .mockResolvedValueOnce(json_response({ data: { favorites: ['dorian'] } }))
    const auth = createAuthClient('/api/auth.php', fetch_impl)

    expect(await auth.saveData('favorites', ['dorian'])).toBe(true)
    expect(await auth.getData()).toEqual({ favorites: ['dorian'] })
  })
})
