import { describe, expect, it, vi } from 'vitest'
import type { AuthClient } from '../integrations/auth-client'
import { createSettingsStore } from '../settings/settings-store'
import { mountAccountPanel } from './account-panel'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function create_auth(overrides: Partial<AuthClient> = {}): AuthClient {
  return {
    getSession: vi.fn(async () => ({ ok: true as const, user: null })),
    register: vi.fn(async (username: string) => ({ ok: true as const, user: { username } })),
    login: vi.fn(async () => ({ ok: false as const, error: 'invalid_credentials' as const })),
    logout: vi.fn(async () => ({ ok: true as const, user: null })),
    getData: vi.fn(async () => ({})),
    saveData: vi.fn(async () => true),
    ...overrides
  }
}

describe('account panel', () => {
  it('given_unavailable_auth_api_when_mounting_then_renders_nothing', async () => {
    const container = document.createElement('div')
    await mountAccountPanel(container, create_auth({ getSession: async () => ({ ok: false, error: 'unavailable' }) }), createSettingsStore('en'))
    expect(container.querySelector('#open-account')).toBeNull()
  })

  it('given_wrong_password_when_signing_in_then_shows_localized_error', async () => {
    const container = document.createElement('div')
    const auth = create_auth()
    await mountAccountPanel(container, auth, createSettingsStore('es'))
    container.querySelector<HTMLInputElement>('#account-username')!.value = 'ana'
    container.querySelector<HTMLInputElement>('#account-password')!.value = 'wrong-pass'
    container.querySelector<HTMLFormElement>('#account-form')!.dispatchEvent(new Event('submit', { cancelable: true }))
    await flush()
    expect(auth.login).toHaveBeenCalledWith('ana', 'wrong-pass')
    expect(container.querySelector('#account-status')?.textContent).toBe('Usuario o contraseña incorrectos.')
  })

  it('given_valid_new_user_when_creating_account_then_shows_signed_in_state', async () => {
    const container = document.createElement('div')
    const auth = create_auth()
    await mountAccountPanel(container, auth, createSettingsStore('en'))
    container.querySelector<HTMLInputElement>('#account-username')!.value = 'ana_music'
    container.querySelector<HTMLInputElement>('#account-password')!.value = 'long-enough-pass'
    container.querySelector<HTMLButtonElement>('#account-secondary')!.click()
    await flush()
    expect(auth.register).toHaveBeenCalledWith('ana_music', 'long-enough-pass')
    expect(container.querySelector('#account-signed-in')?.textContent).toBe('Signed in as ana_music.')
    expect(container.querySelector<HTMLElement>('#account-fields')!.hidden).toBe(true)
    expect(container.querySelector('#account-primary')?.textContent).toBe('Sign out')
  })
})
