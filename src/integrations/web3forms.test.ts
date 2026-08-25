import { describe, expect, it, vi } from 'vitest'
import { submitFeedback } from './web3forms'

describe('Web3Forms feedback integration', () => {
  it('given_configured_form_when_submitting_then_posts_the_feedback_payload', async () => {
    const fetch_impl = vi.fn<typeof fetch>(async (_input, init) => {
      const body = init?.body as FormData
      expect(body.get('access_key')).toBe('test-access-key')
      expect(body.get('subject')).toBe('ScaleScape application feedback')
      expect(body.get('message')).toBe('The piano view is helpful.')
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    })

    const result = await submitFeedback({ name: 'Alex', email: 'alex@example.com', message: 'The piano view is helpful.' }, 'test-access-key', fetch_impl)

    expect(result).toEqual({ ok: true })
    expect(fetch_impl).toHaveBeenCalledOnce()
  })

  it('given_missing_access_key_when_submitting_then_does_not_make_a_request', async () => {
    const fetch_impl = vi.fn<typeof fetch>()

    const result = await submitFeedback({ name: '', email: '', message: 'Test' }, '', fetch_impl)

    expect(result).toEqual({ ok: false, reason: 'not_configured' })
    expect(fetch_impl).not.toHaveBeenCalled()
  })

  it('given_optional_email_when_submitting_then_sends_the_comment_without_email', async () => {
    const fetch_impl = vi.fn<typeof fetch>(async (_input, init) => {
      const body = init?.body as FormData
      expect(body.get('email')).toBe('')
      return new Response(JSON.stringify({ success: true }), { status: 200 })
    })

    const result = await submitFeedback({ name: 'Alex', email: '', message: 'Anonymous feedback.' }, 'test-access-key', fetch_impl)

    expect(result).toEqual({ ok: true })
  })
})
