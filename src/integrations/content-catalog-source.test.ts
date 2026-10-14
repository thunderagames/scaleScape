import { describe, expect, it, vi } from 'vitest'
import { loadContentCatalog } from './content-catalog-source'

const parse = (value: unknown): { readonly ok: true } | null => (typeof value === 'object' && value !== null && 'ok' in value ? { ok: true } : null)

function json_response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('content catalog source', () => {
  it('given_api_available_when_loading_then_uses_api', async () => {
    const fetch_impl = vi.fn(async () => json_response({ ok: true }))
    expect(await loadContentCatalog(parse, ['api', 'fallback'], fetch_impl)).toEqual({ catalog: { ok: true }, source: 'api' })
    expect(fetch_impl).toHaveBeenCalledTimes(1)
  })

  it('given_api_missing_or_invalid_when_loading_then_falls_back_to_static_json', async () => {
    const fetch_impl = vi.fn(async (source: string | URL | Request) => {
      if (source === 'api') return new Response('<html>not php</html>', { status: 200 })
      return json_response({ ok: true })
    })
    expect(await loadContentCatalog(parse, ['api', 'fallback'], fetch_impl)).toEqual({ catalog: { ok: true }, source: 'fallback' })
  })

  it('given_every_source_fails_when_loading_then_returns_null', async () => {
    const fetch_impl = vi.fn(async (source: string | URL | Request) => {
      if (source === 'api') throw new Error('offline')
      return json_response({}, 404)
    })
    expect(await loadContentCatalog(parse, ['api', 'fallback'], fetch_impl)).toBeNull()
  })
})
