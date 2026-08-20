import { afterEach, describe, expect, it } from 'vitest'
import { createBrowserPlayback } from './browser-playback'
import { createScaleInstance } from '../theory/scale-instance'
import type { EventLoggerPort } from '../observability/event-logger'

function createDiagnosticsFake(should_throw = false): EventLoggerPort & { readonly events: string[] } {
  const events: string[] = []
  return {
    events,
    log: (event_name) => { if (should_throw) throw new Error('diagnostics unavailable'); events.push(event_name) }
  }
}

class FakeAudioContext {
  readonly state: AudioContextState = 'running'
  readonly currentTime = 0
  readonly destination = {}
  resume = async () => undefined
  createOscillator() {
    return { type: 'triangle', frequency: { setValueAtTime: () => undefined }, connect: () => undefined, start: () => undefined, stop: () => undefined, disconnect: () => undefined }
  }
  createGain() {
    return { gain: { value: 0, setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined }, connect: () => undefined }
  }
}

afterEach(() => {
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
})

describe('browser playback', () => {
  it('given_unavailable_audio_context_when_playing_scale_then_returns_failure_and_logs_unlock_failure', async () => {
    const diagnostics = createDiagnosticsFake()
    const playback = createBrowserPlayback(diagnostics)

    const result = await playback.playScale(createScaleInstance(4, 'dorian'))

    expect(result.ok).toBe(false)
    expect(diagnostics.events).toEqual(['audio.unlock_failed'])
  })

  it('given_running_audio_context_when_playing_scale_then_logs_unlock_and_context_events', async () => {
    const diagnostics = createDiagnosticsFake()
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const playback = createBrowserPlayback(diagnostics)
    await playback.setContext(4, 'drone')

    const result = await playback.playScale(createScaleInstance(4, 'dorian'))

    expect(result.ok).toBe(true)
    expect(diagnostics.events).toEqual(['audio.unlock_completed', 'audio.context_started'])
    await playback.stopAll()
  })

  it('given_failing_diagnostics_when_audio_unlocking_then_returns_audio_result_without_throwing', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const playback = createBrowserPlayback(createDiagnosticsFake(true))

    const result = await playback.playScale(createScaleInstance(4, 'dorian'))

    expect(result.ok).toBe(true)
  })

  it('given_playing_scale_when_page_becomes_hidden_then_stops_audio_and_notifies_listener', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const diagnostics = createDiagnosticsFake()
    const playback = createBrowserPlayback(diagnostics)
    let was_stopped = false
    playback.subscribe({ on_note_started: () => undefined, on_stopped: () => { was_stopped = true } })
    await playback.playScale(createScaleInstance(4, 'dorian'))

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(was_stopped).toBe(true)
    expect(diagnostics.events).toContain('audio.context_stopped')
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    await playback.stopAll()
  })
})
