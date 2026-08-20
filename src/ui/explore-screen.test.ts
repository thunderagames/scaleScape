import { describe, expect, it } from 'vitest'
import { createExploreApplication } from '../application/explore-application'
import type { PlaybackListener, PlaybackPort } from '../audio/playback-port'
import { createSettingsStore } from '../settings/settings-store'
import { renderExploreScreen } from './explore-screen'

function createPlaybackFake() {
  const previewed_notes: Array<{ readonly pitch_class: number; readonly octave: number }> = []
  let listener: PlaybackListener | null = null
  const playback: PlaybackPort = {
    playScale: async () => ({ ok: true }),
    previewNote: async (note) => { previewed_notes.push(note); return { ok: true } },
    stopAll: async () => undefined,
    setVolume: () => undefined,
    setMuted: () => undefined,
    getPlaybackState: () => ({ is_muted: false, volume: 0.7 }),
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
})
