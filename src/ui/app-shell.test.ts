import { describe, expect, it } from 'vitest'
import { createExploreApplication } from '../application/explore-application'
import type { PlaybackPort } from '../audio/playback-port'
import type { DiagnosticsPort } from '../observability/event-logger'
import { createSettingsStore } from '../settings/settings-store'
import { renderAppShell } from './app-shell'

function createPlaybackFake(): PlaybackPort {
  let is_muted = false
  let volume = 0.7
  let context: 'off' | 'drone' | 'pedal' = 'off'
  const state_listeners = new Set<(state: { readonly is_muted: boolean; readonly volume: number; readonly context: 'off' | 'drone' | 'pedal' }) => void>()
  return {
    playScale: async () => ({ ok: true }),
    playChord: async () => ({ ok: true }),
    previewNote: async () => ({ ok: true }),
     stopAll: async () => undefined,
     setContext: async (_root_pitch_class, next_context) => { context = next_context; return { ok: true } },
     setTempo: () => undefined,
     setVolume: (next_volume) => { volume = next_volume; state_listeners.forEach((listener) => listener({ is_muted, volume, context })) },
    setMuted: (next_is_muted) => { is_muted = next_is_muted; state_listeners.forEach((listener) => listener({ is_muted, volume, context })) },
    getPlaybackState: () => ({ is_muted, volume, context }),
    subscribePlaybackState: (listener) => { state_listeners.add(listener); return () => state_listeners.delete(listener) },
    subscribe: () => () => undefined
  }
}

function createSettings() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0
    }
  })
  return createSettingsStore()
}

function createCompletedSettings() {
  const settings = createSettings()
  settings.setSettings({ ...settings.getSettings(), guided_start_completed: true })
  return settings
}

function createDiagnosticsFake(): DiagnosticsPort & { readonly events: string[] } {
  const events: string[] = []
  let is_enabled = false
  return {
    events,
    log: (event_name) => events.push(event_name),
    exportJsonl: () => ({ ok: true, content: '{"event_name":"test"}\n' }),
    setEnabled: (next_is_enabled) => { is_enabled = next_is_enabled },
    isEnabled: () => is_enabled
  }
}

describe('application shell', () => {
  it('given_first_visit_when_rendering_shell_then_shows_guided_start_and_keeps_explore_available', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings(), undefined, { default_screen: 'explore', modules: { explore: true, ear_gym: true, guided_start: true } })

    expect(container.querySelector<HTMLElement>('#guided-start-screen')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(false)
    expect(container.querySelector<HTMLElement>('#ear-gym-screen')?.hidden).toBe(true)
    expect(container.querySelector('#explore-directly')?.textContent).toBe('Explore directly')
    expect(container.querySelector('#footer-credit')?.textContent).toBe('Developed by ThunderaGames · 2026')
  })

  it('given_small_navigation_when_toggling_menu_then_opens_and_closes_after_navigation', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())
    const toggle = container.querySelector<HTMLButtonElement>('#toggle-navigation')
    const navigation = container.querySelector<HTMLElement>('#app-navigation')

    toggle?.click()
    expect(toggle?.getAttribute('aria-expanded')).toBe('true')
    expect(navigation?.getAttribute('data-open')).toBe('true')
    container.querySelector<HTMLButtonElement>('#navigate-ear-gym')?.click()

    expect(toggle?.getAttribute('aria-expanded')).toBe('false')
    expect(navigation?.getAttribute('data-open')).toBe('false')
  })

  it('given_disabled_modules_when_rendering_shell_then_hides_optional_navigation_and_screens', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings(), undefined, { default_screen: 'explore', modules: { explore: true, ear_gym: false, guided_start: false } })

    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(false)
    expect(container.querySelector<HTMLButtonElement>('#navigate-ear-gym')?.hidden).toBe(true)
    expect(container.querySelector<HTMLButtonElement>('#navigate-guided-start')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#ear-gym-screen')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#guided-start-screen')?.hidden).toBe(true)
  })

  it('given_narrow_viewport_when_rendering_shell_then_keeps_guided_content_within_container', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    expect(container.querySelector('.app-shell')?.classList.contains('app-shell')).toBe(true)
    expect(container.querySelector<HTMLElement>('.guided-start-screen')?.style.overflowX).toBe('')
  })

  it('given_guided_start_when_starting_then_selects_drone_and_plays_initial_scale', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback = createPlaybackFake()
    const diagnostics = createDiagnosticsFake()
    const play_scale = playback.playScale
    let played = false
    playback.playScale = async (scale) => { played = scale.formula.id === 'dorian'; return { ok: true } }
    renderAppShell(container, createExploreApplication(), playback, createSettings(), diagnostics)

    container.querySelector<HTMLButtonElement>('#start-guided')?.click()
    await Promise.resolve()
    await Promise.resolve()

    expect(playback.getPlaybackState().context).toBe('drone')
    expect(played).toBe(true)
    expect(container.querySelector<HTMLElement>('#guided-start-screen')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#guided-progress')?.hidden).toBe(false)
    expect(container.querySelector('#guided-progress-text')?.textContent).toBe('Now select the characteristic note on piano or guitar.')
    expect(diagnostics.events).toEqual(['application.guided_start_entered', 'application.guided_start_completed'])
    playback.playScale = play_scale
  })

  it('given_guided_progress_when_selecting_characteristic_note_then_offers_ear_gym', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback = createPlaybackFake()
    renderAppShell(container, createExploreApplication(), playback, createSettings())

    container.querySelector<HTMLButtonElement>('#start-guided')?.click()
    await Promise.resolve()
    await Promise.resolve()
    container.querySelector<HTMLButtonElement>('#scale-notes .characteristic')?.click()

    expect(container.querySelector('#guided-progress-text')?.textContent).toBe('You found the characteristic note. Compare it in Ear Gym.')
    expect(container.querySelector<HTMLButtonElement>('#guided-progress-action')?.hidden).toBe(false)
  })

  it('given_guided_progress_when_opening_ear_gym_then_switches_to_ear_gym', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    container.querySelector<HTMLButtonElement>('#start-guided')?.click()
    await Promise.resolve()
    await Promise.resolve()
    container.querySelector<HTMLButtonElement>('#scale-notes .characteristic')?.click()
    container.querySelector<HTMLButtonElement>('#guided-progress-action')?.click()

    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#ear-gym-screen')?.hidden).toBe(false)
  })

  it('given_completed_guided_start_when_rendering_shell_then_opens_explore', () => {
    const container = document.createElement('div')
    document.body.append(container)

    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createCompletedSettings())

    expect(container.querySelector<HTMLElement>('#guided-start-screen')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(false)
  })

  it('given_returning_user_when_opening_guided_start_navigation_then_shows_guided_start_without_resetting_completion', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createCompletedSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings, undefined, { default_screen: 'explore', modules: { explore: true, ear_gym: true, guided_start: true } })

    container.querySelector<HTMLButtonElement>('#navigate-guided-start')?.click()

    expect(container.querySelector<HTMLElement>('#guided-start-screen')?.hidden).toBe(false)
    expect(container.querySelector('#navigate-guided-start')?.getAttribute('aria-current')).toBe('page')
    expect(settings.getSettings().guided_start_completed).toBe(true)
  })

  it('given_diagnostics_button_when_not_clicked_then_does_not_export', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const diagnostics = createDiagnosticsFake()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings(), diagnostics)

    expect(container.querySelector('#diagnostics-status')?.textContent).toBe('')
  })

  it('given_diagnostics_button_when_clicked_then_reports_export_success', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const diagnostics = createDiagnosticsFake()
    const create_object_url = URL.createObjectURL
    const revoke_object_url = URL.revokeObjectURL
    const anchor_click = HTMLAnchorElement.prototype.click
    URL.createObjectURL = () => 'blob:test'
    URL.revokeObjectURL = () => undefined
    HTMLAnchorElement.prototype.click = () => undefined
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings(), diagnostics)

    container.querySelector<HTMLButtonElement>('#export-diagnostics')?.click()

    expect(container.querySelector('#diagnostics-status')?.textContent).toBe('Diagnostics exported.')
    URL.createObjectURL = create_object_url
    URL.revokeObjectURL = revoke_object_url
    HTMLAnchorElement.prototype.click = anchor_click
  })

  it('given_diagnostic_mode_when_toggling_then_updates_logger_state', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const diagnostics = createDiagnosticsFake()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings(), diagnostics)

    const control = container.querySelector<HTMLInputElement>('#diagnostics-mode-control')
    if (control) {
      control.checked = true
      control.dispatchEvent(new Event('change', { bubbles: true }))
    }

    expect(diagnostics.isEnabled()).toBe(true)
  })

  it('given_explore_screen_when_opening_ear_gym_then_switches_visible_screen_and_current_navigation', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    container.querySelector<HTMLButtonElement>('#navigate-ear-gym')?.click()

    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#ear-gym-screen')?.hidden).toBe(false)
    expect(container.querySelector('#navigate-ear-gym')?.getAttribute('aria-current')).toBe('page')
    expect(document.activeElement).toBe(container.querySelector('#navigate-ear-gym'))
  })

  it('given_ear_gym_screen_when_returning_to_explore_then_preserves_explore_dom_and_current_navigation', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())
    const scale_title = container.querySelector('#scale-title')?.textContent
    container.querySelector<HTMLButtonElement>('#navigate-ear-gym')?.click()

    container.querySelector<HTMLButtonElement>('#navigate-explore')?.click()

    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(false)
    expect(container.querySelector('#scale-title')?.textContent).toBe(scale_title)
    expect(container.querySelector('#navigate-explore')?.getAttribute('aria-current')).toBe('page')
  })

  it('given_english_shell_when_switching_to_spanish_then_localizes_navigation_and_ear_gym_placeholder', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings, undefined, { default_screen: 'explore', modules: { explore: true, ear_gym: true, guided_start: true } })

    settings.setLanguage('es')

    expect(container.querySelector('#navigate-explore')?.textContent).toBe('Explorar')
    expect(container.querySelector('#navigate-ear-gym')?.textContent).toBe('Gimnasio auditivo')
    expect(container.querySelector('#ear-gym-title')?.textContent).toBe('Gimnasio auditivo')
    expect(container.querySelector('#footer-credit')?.textContent).toBe('Desarrollado por ThunderaGames en 2026')
  })

  it('given_settings_modal_when_changing_volume_and_mute_then_updates_playback_and_persists_volume', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)
    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    const volume_control = container.querySelector<HTMLInputElement>('#volume-control')

    if (volume_control) {
      volume_control.value = '0.4'
      volume_control.dispatchEvent(new Event('input', { bubbles: true }))
    }
    container.querySelector<HTMLButtonElement>('#mute-audio')?.click()

    expect(settings.getSettings().volume).toBe(0.4)
    expect(container.querySelector('#mute-status')?.textContent).toBe('Muted')
    expect(container.querySelector('#mute-audio')?.textContent).toBe('Unmute')
    expect(container.querySelector('#audio-controls')).toBeNull()
    expect(container.querySelector('#volume-control')?.closest('dialog')).not.toBeNull()
  })

  it('given_settings_button_when_rendering_shell_then_is_fixed_at_upper_left', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    expect(container.querySelector('#open-settings')?.classList.contains('settings-floating')).toBe(true)
    expect(container.querySelector('#open-settings')?.getAttribute('aria-label')).toBe('Settings')
    expect(container.querySelector('#open-settings .settings-icon')).not.toBeNull()
    expect(container.querySelector('#open-settings')?.textContent).toBe('')
  })

  it('given_settings_modal_when_rendering_then_uses_shared_modal_controls_and_icon_close', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    const close_button = container.querySelector<HTMLButtonElement>('#close-settings')

    expect(container.querySelector('#settings-modal')?.classList.contains('settings-modal')).toBe(true)
    expect(close_button?.classList.contains('control-button--icon')).toBe(true)
    expect(close_button?.textContent).toBe('')
    expect(close_button?.getAttribute('aria-label')).toBe('Close')
    expect(close_button?.querySelector('.modal-close-icon')).not.toBeNull()
    expect(container.querySelectorAll('#settings-modal .modal-field')).toHaveLength(4)
    expect(container.querySelectorAll('#settings-modal .settings-group')).toHaveLength(5)
    expect(container.querySelectorAll('#settings-modal .control-button')).toHaveLength(8)
    expect(container.querySelectorAll('#settings-modal .control-select')).toHaveLength(3)
    expect(container.querySelectorAll('#settings-modal .control-range')).toHaveLength(1)
    expect(container.querySelectorAll('#settings-modal .control-choice')).toHaveLength(9)
    expect(container.querySelector('#show-scale-description-label')?.textContent).toBe('Show scale history and uses')
    expect(container.querySelector('#show-ukulele-label')?.textContent).toBe('Show ukulele')
    expect(container.querySelector('#open-guitar-tuning')?.textContent).toBe('Tuner')
    expect(container.querySelector('#open-guitar-tuning')?.parentElement?.classList.contains('settings-choice-row')).toBe(true)
    expect(container.querySelector('#open-guitar-tuning')?.previousElementSibling?.querySelector('input')?.id).toBe('show-guitar')
    expect(container.querySelector('#open-bass-tuning')?.textContent).toBe('Tuner')
    expect(container.querySelector('#open-bass-tuning')?.parentElement?.classList.contains('settings-choice-row')).toBe(true)
    expect(container.querySelector('#open-bass-tuning')?.previousElementSibling?.querySelector('input')?.id).toBe('show-bass')
    expect(container.querySelector('.settings-actions')?.children).toHaveLength(2)
  })

  it('given_settings_modal_when_selecting_tempo_then_persists_tempo_choice', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)

    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    const tempo_select = container.querySelector<HTMLSelectElement>('#tempo-select')
    if (tempo_select) tempo_select.value = '200'
    container.querySelector<HTMLButtonElement>('#save-settings')?.click()

    expect(settings.getSettings().tempo_bpm).toBe(200)
  })

  it('given_settings_modal_when_hiding_scale_information_then_persists_visibility_choice', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)

    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    const control = container.querySelector<HTMLInputElement>('#show-scale-description')
    if (control) control.checked = false
    container.querySelector<HTMLButtonElement>('#save-settings')?.click()

    expect(settings.getSettings().show_scale_description).toBe(false)
    expect(container.querySelector<HTMLElement>('#scale-description')?.hidden).toBe(true)
  })

  it('given_settings_modal_when_adjusting_guitar_tuning_then_saves_common_semitone_shift', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)

    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    container.querySelector<HTMLButtonElement>('#open-guitar-tuning')?.click()
    container.querySelector<HTMLButtonElement>('#lower-guitar-tuning')?.click()
    container.querySelector<HTMLButtonElement>('#lower-guitar-tuning')?.click()

    expect(container.querySelector('#guitar-tuning-modal')?.classList.contains('guitar-tuning-modal')).toBe(true)
    expect(container.querySelector('#guitar-tuning-value')?.textContent).toContain('D')
    expect(settings.getSettings().guitar_tuning_semitones).toBe(0)

    container.querySelector<HTMLButtonElement>('#save-guitar-tuning')?.click()

    expect(settings.getSettings().guitar_tuning_semitones).toBe(-2)
    expect(container.querySelector('#guitar-card')?.textContent).toContain('Low D')
  })

  it('given_settings_modal_when_adjusting_bass_tuning_then_saves_common_semitone_shift', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)

    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    container.querySelector<HTMLButtonElement>('#open-bass-tuning')?.click()
    container.querySelector<HTMLButtonElement>('#lower-guitar-tuning')?.click()
    container.querySelector<HTMLButtonElement>('#lower-guitar-tuning')?.click()

    expect(container.querySelector('#guitar-tuning-title')?.textContent).toBe('Bass tuning')
    expect(container.querySelector('#guitar-tuning-value')?.textContent).toContain('D')
    expect(settings.getSettings().bass_tuning_semitones).toBe(0)

    container.querySelector<HTMLButtonElement>('#save-guitar-tuning')?.click()

    expect(settings.getSettings().bass_tuning_semitones).toBe(-2)
    expect(container.querySelector('#bass-card')?.textContent).toContain('D')
  })

  it('given_settings_modal_when_adjusting_ukulele_tuning_then_saves_common_semitone_shift', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)

    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    container.querySelector<HTMLButtonElement>('#open-ukulele-tuning')?.click()
    container.querySelector<HTMLButtonElement>('#lower-guitar-tuning')?.click()

    expect(container.querySelector('#guitar-tuning-title')?.textContent).toBe('Ukulele tuning')
    expect(container.querySelector('#guitar-tuning-value')?.textContent).toContain('F')
    expect(settings.getSettings().ukulele_tuning_semitones).toBe(0)

    container.querySelector<HTMLButtonElement>('#save-guitar-tuning')?.click()

    expect(settings.getSettings().ukulele_tuning_semitones).toBe(-1)
    expect(container.querySelector('#ukulele-card')?.textContent).toContain('F')
  })

  it('given_open_help_when_opening_settings_modal_then_closes_help_before_modal', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    container.querySelector<HTMLButtonElement>('#scale-help-button')?.click()
    container.querySelector<HTMLButtonElement>('#open-settings')?.click()

    expect(container.querySelector('#scale-help')?.classList.contains('is-open')).toBe(false)
  })

  it('given_settings_modal_when_toggling_diagnostics_then_keeps_diagnostic_controls_inside_modal', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    container.querySelector<HTMLButtonElement>('#open-settings')?.click()

    expect(container.querySelector('#diagnostics-mode-control')?.closest('dialog')).not.toBeNull()
    expect(container.querySelector('#export-diagnostics')?.closest('dialog')).not.toBeNull()
  })

  it('given_settings_modal_when_selecting_pedal_then_starts_context_for_current_root', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback = createPlaybackFake()
    renderAppShell(container, createExploreApplication(), playback, createSettings())
    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    const context_control = container.querySelector<HTMLInputElement>('#context-pedal')

    if (context_control) {
      context_control.checked = true
      context_control.dispatchEvent(new Event('change', { bubbles: true }))
    }
    container.querySelector<HTMLButtonElement>('#save-settings')?.click()
    await Promise.resolve()

    expect(playback.getPlaybackState().context).toBe('pedal')
  })

  it('given_settings_modal_when_saving_context_then_removes_context_control_from_audio_header', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback = createPlaybackFake()
    renderAppShell(container, createExploreApplication(), playback, createSettings())
    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    const context_control = container.querySelector<HTMLInputElement>('#context-drone')
    if (context_control) context_control.checked = true
    container.querySelector<HTMLButtonElement>('#save-settings')?.click()

    expect(playback.getPlaybackState().context).toBe('drone')
    expect(container.querySelector('#audio-controls #context-control')).toBeNull()
  })

  it('given_settings_modal_when_saving_instrument_visibility_then_updates_visible_instrument_cards', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    const show_guitar = container.querySelector<HTMLInputElement>('#show-guitar')
    if (show_guitar) show_guitar.checked = false
    container.querySelector<HTMLButtonElement>('#save-settings')?.click()

    expect(container.querySelector<HTMLElement>('#guitar-card')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#piano-card')?.hidden).toBe(false)
  })

  it('given_settings_modal_when_enabling_bass_then_shows_bass_card', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())
    container.querySelector<HTMLButtonElement>('#open-settings')?.click()
    const show_bass = container.querySelector<HTMLInputElement>('#show-bass')
    if (show_bass) show_bass.checked = true
    container.querySelector<HTMLButtonElement>('#save-settings')?.click()

    expect(container.querySelector<HTMLElement>('#bass-card')?.hidden).toBe(false)
    expect(container.querySelectorAll('#bass-view tbody tr')).toHaveLength(4)
  })
})
