import { describe, expect, it } from 'vitest'
import type { PlaybackPort } from '../audio/playback-port'
import { createSettingsStore } from '../settings/settings-store'
import { renderEarGymScreen } from './ear-gym-screen'
import type { EventLoggerPort } from '../observability/event-logger'

function createPlaybackFake() {
  const played_formulas: string[] = []
  const playback: PlaybackPort = {
    playScale: async (scale) => { played_formulas.push(scale.formula.id); return { ok: true } },
    previewNote: async () => ({ ok: true }),
    stopAll: async () => undefined,
    setContext: async () => ({ ok: true }),
    setVolume: () => undefined,
    setMuted: () => undefined,
    getPlaybackState: () => ({ is_muted: false, volume: 0.7, context: 'off' }),
    subscribePlaybackState: () => () => undefined,
    subscribe: () => () => undefined
  }
  return { playback, played_formulas }
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

function createDiagnosticsFake(should_throw = false): EventLoggerPort & { readonly events: string[] } {
  const events: string[] = []
  return { events, log: (event_name) => { if (should_throw) throw new Error('diagnostics unavailable'); events.push(event_name) } }
}

describe('ear gym screen', () => {
  it('given_listen_phase_when_playing_both_examples_then_reports_playback_for_both_formulas', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback_fake = createPlaybackFake()
    renderEarGymScreen(container, playback_fake.playback, createSettings())

    container.querySelector<HTMLButtonElement>('#play-example-a')?.click()
    container.querySelector<HTMLButtonElement>('#play-example-b')?.click()
    await Promise.resolve()

    expect(playback_fake.played_formulas).toEqual(['natural_minor', 'dorian'])
    expect(container.querySelector('#playback-status')?.textContent).toBe('Playing Dorian.')
  })

  it('given_played_example_when_replaying_then_uses_replay_label_and_stop_clears_status', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderEarGymScreen(container, createPlaybackFake().playback, createSettings())

    container.querySelector<HTMLButtonElement>('#play-example-a')?.click()
    expect(container.querySelector('#play-example-a')?.textContent).toContain('Replay')
    container.querySelector<HTMLButtonElement>('#stop-audio')?.click()
    await Promise.resolve()

    expect(container.querySelector('#playback-status')?.textContent).toBe('Audio stopped.')
  })

  it('given_listen_phase_when_answering_sixth_degree_then_reveals_feedback_and_streak', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderEarGymScreen(container, createPlaybackFake().playback, createSettings())

    container.querySelector<HTMLButtonElement>('#start-answer')?.click()
    container.querySelector<HTMLInputElement>('input[value="6"]')?.click()

    expect(container.querySelector('#feedback')?.textContent).toContain('That is the changed degree.')
    expect(container.querySelector('#feedback')?.textContent).toContain('Streak: 1')
    expect(container.querySelector<HTMLButtonElement>('#restart-exercise')?.hidden).toBe(false)
  })

  it('given_answer_submission_when_feedback_renders_then_moves_focus_to_feedback', () => {
    const container = document.createElement('div')
    document.body.append(container)
    renderEarGymScreen(container, createPlaybackFake().playback, createSettings())

    container.querySelector<HTMLButtonElement>('#start-answer')?.click()
    container.querySelector<HTMLInputElement>('input[value="6"]')?.click()

    expect(document.activeElement).toBe(container.querySelector('#feedback'))
  })

  it('given_saved_streak_when_answering_correctly_then_increments_and_persists_streak', () => {
    const storage_data = new Map<string, string>([['scalescape.settings.v1', JSON.stringify({ language: 'en', show_piano: true, show_guitar: true, ear_gym_streak: 2, volume: 0.7 })]])
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage_data.get(key) ?? null,
        setItem: (key: string, value: string) => storage_data.set(key, value),
        removeItem: (key: string) => storage_data.delete(key),
        clear: () => storage_data.clear(),
        key: (index: number) => [...storage_data.keys()][index] ?? null,
        get length() { return storage_data.size }
      }
    })
    const container = document.createElement('div')
    document.body.append(container)
    renderEarGymScreen(container, createPlaybackFake().playback, createSettingsStore())

    container.querySelector<HTMLButtonElement>('#start-answer')?.click()
    container.querySelector<HTMLInputElement>('input[value="6"]')?.click()

    expect(container.querySelector('#feedback')?.textContent).toContain('Streak: 3')
    expect(JSON.parse(storage_data.get('scalescape.settings.v1') ?? '{}').ear_gym_streak).toBe(3)
  })

  it('given_ear_gym_screen_when_selecting_major_mixolydian_then_updates_comparison_and_examples', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const playback_fake = createPlaybackFake()
    renderEarGymScreen(container, playback_fake.playback, createSettings())

    const selector = container.querySelector<HTMLSelectElement>('#comparison-selector')
    if (selector) {
      selector.value = 'major_mixolydian'
      selector.dispatchEvent(new Event('change', { bubbles: true }))
    }
    container.querySelector<HTMLButtonElement>('#play-example-b')?.click()
    await Promise.resolve()

    expect(container.querySelector('#comparison-title')?.textContent).toBe('Major vs Mixolydian')
    expect(playback_fake.played_formulas).toContain('mixolydian')
  })

  it('given_ear_gym_screen_when_answering_then_logs_comparison_feedback', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const diagnostics = createDiagnosticsFake()
    renderEarGymScreen(container, createPlaybackFake().playback, createSettings(), diagnostics)

    container.querySelector<HTMLButtonElement>('#start-answer')?.click()
    container.querySelector<HTMLInputElement>('input[value="6"]')?.click()

    expect(diagnostics.events).toContain('application.start_guided_comparison')
    expect(diagnostics.events).toContain('application.submit_answer')
  })

  it('given_failing_diagnostics_when_playing_example_then_keeps_ear_gym_functional', () => {
    const container = document.createElement('div')
    document.body.append(container)

    renderEarGymScreen(container, createPlaybackFake().playback, createSettings(), createDiagnosticsFake(true))

    expect(() => container.querySelector<HTMLButtonElement>('#play-example-a')?.click()).not.toThrow()
    expect(container.querySelector('#playback-status')?.textContent).toBe('Playing natural minor.')
  })
})
