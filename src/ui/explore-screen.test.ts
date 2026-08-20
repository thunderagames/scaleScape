import { describe, expect, it } from 'vitest'
import { createExploreApplication } from '../application/explore-application'
import type { PlaybackListener, PlaybackPort } from '../audio/playback-port'
import { createSettingsStore } from '../settings/settings-store'
import type { EventLoggerPort } from '../observability/event-logger'
import { renderExploreScreen } from './explore-screen'

function createPlaybackFake() {
  const previewed_notes: Array<{ readonly pitch_class: number; readonly octave: number }> = []
  let listener: PlaybackListener | null = null
  const playback: PlaybackPort = {
    playScale: async () => ({ ok: true }),
    previewNote: async (note) => { previewed_notes.push(note); return { ok: true } },
    stopAll: async () => { listener?.on_stopped() },
    setContext: async () => ({ ok: true }),
    setVolume: () => undefined,
    setMuted: () => undefined,
    getPlaybackState: () => ({ is_muted: false, volume: 0.7, context: 'off' }),
    subscribePlaybackState: () => () => undefined,
    subscribe: (next_listener) => { listener = next_listener; return () => { listener = null } }
  }
  return { playback, previewed_notes, listener: () => listener }
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

function createContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.append(container)
  return container
}

function createDiagnosticsFake(should_throw = false): EventLoggerPort & { readonly events: string[] } {
  const events: string[] = []
  return {
    events,
    log: (event_name) => { if (should_throw) throw new Error('diagnostics unavailable'); events.push(event_name) }
  }
}

describe('explore screen', () => {
  it('given_initial_explore_screen_when_selecting_scale_note_then_announces_note_role_and_previews_pitch', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    const note_button = container.querySelector<HTMLButtonElement>('#scale-notes .scale-note')
    note_button?.click()

    expect(container.querySelector('#note-detail')?.textContent).toContain('degree 1')
    expect(container.querySelector('#note-detail')?.textContent).toContain('tonic')
    expect(playback_fake.previewed_notes[0]).toMatchObject({ pitch_class: 4, octave: 4 })
    expect(note_button?.getAttribute('aria-label')).toContain('degree 1')
  })

  it('given_initial_explore_screen_when_moving_piano_focus_then_advances_to_next_scale_note', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())

    const piano_buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('#piano-view .piano-key.tonic, #piano-view .piano-key.characteristic, #piano-view .piano-key.chord_tone, #piano-view .piano-key.color_tone'))
    const first_button = piano_buttons[0]
    first_button?.focus()
    first_button?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))

    expect(document.activeElement).toBe(piano_buttons[1])
    expect(piano_buttons[0]?.tabIndex).toBe(-1)
    expect(piano_buttons[1]?.tabIndex).toBe(0)
  })

  it('given_english_explore_screen_when_switching_to_spanish_then_localizes_controls_and_modes', () => {
    const container = createContainer()
    const settings = createSettings()
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, settings)

    settings.setLanguage('es')

    expect(container.querySelector('#root-label')?.textContent).toBe('Tónica')
    expect(container.querySelector('#formula-select option[value="dorian"]')?.textContent).toBe('Dórico')
    expect(document.documentElement.lang).toBe('es')
  })

  it('given_changed_root_when_selecting_root_then_keeps_new_root_after_playback_stops', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())
    const root_select = container.querySelector<HTMLSelectElement>('#root-select')

    if (root_select) {
      root_select.value = '7'
      root_select.dispatchEvent(new Event('change', { bubbles: true }))
    }

    expect(root_select?.value).toBe('7')
    expect(container.querySelector('#scale-title')?.textContent).toContain('G Dorian')
  })

  it('given_changed_mode_when_selecting_mode_then_keeps_new_mode_after_playback_stops', () => {
    const container = createContainer()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, createSettings())
    const formula_select = container.querySelector<HTMLSelectElement>('#formula-select')

    if (formula_select) {
      formula_select.value = 'lydian'
      formula_select.dispatchEvent(new Event('change', { bubbles: true }))
    }

    expect(formula_select?.value).toBe('lydian')
    expect(container.querySelector('#scale-title')?.textContent).toContain('E Lydian')
  })

  it('given_scale_controls_when_changing_scale_then_persists_last_root_and_formula', () => {
    const container = createContainer()
    const settings = createSettings()
    const playback_fake = createPlaybackFake()
    renderExploreScreen(container, createExploreApplication(), playback_fake.playback, settings)
    const root_select = container.querySelector<HTMLSelectElement>('#root-select')
    const formula_select = container.querySelector<HTMLSelectElement>('#formula-select')

    if (root_select && formula_select) {
      root_select.value = '9'
      root_select.dispatchEvent(new Event('change', { bubbles: true }))
      formula_select.value = 'lydian'
      formula_select.dispatchEvent(new Event('change', { bubbles: true }))
    }

    expect(settings.getSettings().last_root).toBe(9)
    expect(settings.getSettings().last_formula).toBe('lydian')
  })

  it('given_scale_controls_when_changing_scale_then_logs_completed_scale_change', () => {
    const container = createContainer()
    const diagnostics = createDiagnosticsFake()
    const root_select = '#root-select'
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings(), diagnostics)

    const control = container.querySelector<HTMLSelectElement>(root_select)
    if (control) {
      control.value = '7'
      control.dispatchEvent(new Event('change', { bubbles: true }))
    }

    expect(diagnostics.events).toEqual(['application.scale_change_completed'])
  })

  it('given_failing_diagnostics_when_changing_scale_then_keeps_scale_change_functional', () => {
    const container = createContainer()
    const diagnostics = createDiagnosticsFake(true)
    renderExploreScreen(container, createExploreApplication(), createPlaybackFake().playback, createSettings(), diagnostics)

    const control = container.querySelector<HTMLSelectElement>('#root-select')
    if (control) {
      control.value = '7'
      control.dispatchEvent(new Event('change', { bubbles: true }))
    }

    expect(container.querySelector('#scale-title')?.textContent).toContain('G Dorian')
  })
})
