const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

export interface FeedbackSubmission {
  readonly name: string
  readonly email: string
  readonly message: string
}

export type FeedbackResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'not_configured' | 'request_failed' | 'service_error' }

export async function submitFeedback(
  submission: FeedbackSubmission,
  access_key: string,
  fetch_impl: typeof fetch = fetch
): Promise<FeedbackResult> {
  if (!access_key) return { ok: false, reason: 'not_configured' }

  const payload = new FormData()
  payload.append('access_key', access_key)
  payload.append('subject', 'ScaleScape application feedback')
  payload.append('name', submission.name)
  payload.append('email', submission.email)
  payload.append('message', submission.message)
  payload.append('botcheck', '')

  try {
    const response = await fetch_impl(WEB3FORMS_ENDPOINT, { method: 'POST', body: payload })
    if (!response.ok) return { ok: false, reason: 'request_failed' }
    const result = await response.json() as { readonly success?: boolean }
    return result.success === true ? { ok: true } : { ok: false, reason: 'service_error' }
  } catch {
    return { ok: false, reason: 'request_failed' }
  }
}
