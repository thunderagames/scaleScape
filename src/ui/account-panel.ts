import type { AuthClient, AuthResult, AuthUser } from '../integrations/auth-client'
import type { SettingsStore } from '../settings/settings-store'

const ACCOUNT_ICON = '<svg class="account-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c1.3-3.8 4.2-5.8 7.5-5.8s6.2 2 7.5 5.8"/></svg>'
const CLOSE_ICON = '<svg class="modal-close-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18"/></svg>'

export async function mountAccountPanel(container: HTMLElement, auth: AuthClient, settings: SettingsStore): Promise<void> {
  const session = await auth.getSession()
  if (!session.ok) return
  let user: AuthUser | null = session.user

  container.insertAdjacentHTML('beforeend', `<button id="open-account" class="control-button control-button--icon settings-floating account-floating" type="button" aria-haspopup="dialog">${ACCOUNT_ICON}</button><dialog id="account-modal" class="feedback-modal account-modal" aria-labelledby="account-title"><form id="account-form" class="modal-form"><div class="modal-heading"><h2 id="account-title"></h2><button id="close-account" class="control-button control-button--icon modal-close" type="button">${CLOSE_ICON}</button></div><p id="account-signed-in" class="feedback-intro account-signed-in"></p><div id="account-fields" class="account-fields"><label class="modal-field" for="account-username"><span id="account-username-label"></span><input id="account-username" class="control-input" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" minlength="3" maxlength="32" pattern="[A-Za-z0-9_.\\-]{3,32}" required /></label><label class="modal-field" for="account-password"><span id="account-password-label"></span><input id="account-password" class="control-input" name="password" type="password" autocomplete="current-password" minlength="8" maxlength="128" required /></label></div><p id="account-status" class="feedback-status" role="status" aria-live="polite"></p><div class="modal-actions"><button id="account-secondary" class="control-button" type="button"></button><button id="account-primary" class="control-button control-button--primary" type="submit"></button></div></form></dialog>`)

  const find = <T extends HTMLElement>(selector: string): T => {
    const element = container.querySelector<T>(selector)
    if (!element) throw new Error(`Account panel element was not found: ${selector}`)
    return element
  }
  const ui = {
    open: find<HTMLButtonElement>('#open-account'), modal: find<HTMLDialogElement>('#account-modal'), form: find<HTMLFormElement>('#account-form'),
    title: find<HTMLElement>('#account-title'), close: find<HTMLButtonElement>('#close-account'), signed_in: find<HTMLElement>('#account-signed-in'),
    fields: find<HTMLElement>('#account-fields'), username_label: find<HTMLElement>('#account-username-label'), password_label: find<HTMLElement>('#account-password-label'),
    username: find<HTMLInputElement>('#account-username'), password: find<HTMLInputElement>('#account-password'), status: find<HTMLElement>('#account-status'),
    secondary: find<HTMLButtonElement>('#account-secondary'), primary: find<HTMLButtonElement>('#account-primary')
  }

  function render(): void {
    const translation = settings.getTranslations()
    ui.open.setAttribute('aria-label', translation.account); ui.open.title = translation.account
    ui.close.setAttribute('aria-label', translation.close); ui.close.title = translation.close
    ui.title.textContent = translation.account_title
    ui.username_label.textContent = translation.account_username
    ui.password_label.textContent = translation.account_password
    ui.signed_in.hidden = user === null
    ui.signed_in.textContent = user ? translation.account_signed_in_as.replace('{username}', user.username) : ''
    ui.fields.hidden = user !== null
    ui.username.disabled = user !== null
    ui.password.disabled = user !== null
    ui.primary.textContent = user ? translation.account_sign_out : translation.account_sign_in
    ui.secondary.textContent = user ? translation.close : translation.account_create
  }

  function close_dialog(): void {
    if (typeof ui.modal.close === 'function') ui.modal.close(); else ui.modal.removeAttribute('open')
    ui.open.focus()
  }

  async function run(action: () => Promise<AuthResult>): Promise<void> {
    ui.primary.disabled = true; ui.secondary.disabled = true; ui.status.textContent = ''
    const result = await action()
    ui.primary.disabled = false; ui.secondary.disabled = false
    if (result.ok) {
      user = result.user
      ui.password.value = ''
      render()
    } else {
      ui.status.textContent = settings.getTranslations()[`account_error_${result.error}`]
    }
  }

  ui.open.addEventListener('click', () => {
    ui.status.textContent = ''
    render()
    if (typeof ui.modal.showModal === 'function') ui.modal.showModal(); else ui.modal.setAttribute('open', '')
  })
  ui.close.addEventListener('click', close_dialog)
  ui.form.addEventListener('submit', (event) => {
    event.preventDefault()
    void run(() => user ? auth.logout() : auth.login(ui.username.value.trim(), ui.password.value))
  })
  ui.secondary.addEventListener('click', () => {
    if (user) { close_dialog(); return }
    if (!ui.form.reportValidity()) return
    void run(() => auth.register(ui.username.value.trim(), ui.password.value))
  })
  settings.subscribe(render)
  render()
}
