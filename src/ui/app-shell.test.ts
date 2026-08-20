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
    previewNote: async () => ({ ok: true }),
    stopAll: async () => undefined,
    setContext: async (_root_pitch_class, next_context) => { context = next_context; return { ok: true } },
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
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), createSettings())

    expect(container.querySelector<HTMLElement>('#guided-start-screen')?.hidden).toBe(false)
    expect(container.querySelector<HTMLElement>('#explore-screen')?.hidden).toBe(true)
    expect(container.querySelector<HTMLElement>('#ear-gym-screen')?.hidden).toBe(true)
    expect(container.querySelector('#explore-directly')?.textContent).toBe('Explore directly')
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
    expect(container.querySelector('#audio-status')?.textContent).toBe('Guided Start is playing.')
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
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)

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
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)

    settings.setLanguage('es')

    expect(container.querySelector('#navigate-explore')?.textContent).toBe('Explorar')
    expect(container.querySelector('#navigate-ear-gym')?.textContent).toBe('Gimnasio auditivo')
    expect(container.querySelector('#ear-gym-title')?.textContent).toBe('Gimnasio auditivo')
  })

  it('given_audio_controls_when_changing_volume_and_mute_then_updates_playback_and_persists_volume', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const settings = createSettings()
    renderAppShell(container, createExploreApplication(), createPlaybackFake(), settings)
    const volume_control = container.querySelector<HTMLInputElement>('#volume-control')

    if (volume_control) {
      volume_control.value = '0.4'
      volume_control.dispatchEvent(new Event('input', { bubbles: true }))
    }
    container.querySelector<HTMLButtonElement>('#mute-audio')?.click()

    expect(settings.getSettings().volume).toBe(0.4)
    expect(container.querySelector('#mute-status')?.textContent).toBe('Muted')
    expect(container.querySelector('#mute-audio')?.textContent).toBe('Unmute')
  })

  it('given_audio_context_control_when_selecting_pedal_then_starts_context_for_current_root', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback = createPlaybackFake()
    renderAppShell(container, createExploreApplication(), playback, createSettings())
    const context_control = container.querySelector<HTMLSelectElement>('#context-control')

    if (context_control) {
      context_control.value = 'pedal'
      context_control.dispatchEvent(new Event('change', { bubbles: true }))
    }
    await Promise.resolve()

    expect(playback.getPlaybackState().context).toBe('pedal')
  })

  it('given_enabled_context_when_stopping_current_audio_then_keeps_context_enabled_for_next_playback', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback = createPlaybackFake()
    renderAppShell(container, createExploreApplication(), playback, createSettings())
    const context_control = container.querySelector<HTMLSelectElement>('#context-control')
    if (context_control) {
      context_control.value = 'drone'
      context_control.dispatchEvent(new Event('change', { bubbles: true }))
    }

    await playback.stopAll()

    expect(playback.getPlaybackState().context).toBe('drone')
    expect(container.querySelector<HTMLSelectElement>('#context-control')?.value).toBe('drone')
  })
})
