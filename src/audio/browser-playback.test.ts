import { afterEach, describe, expect, it, vi } from 'vitest'
import { createBrowserPlayback } from './browser-playback'
import { createScaleInstance } from '../theory/scale-instance'
import type { EventLoggerPort } from '../observability/event-logger'
import type { PlaybackInstrument } from './playback-port'

const BOTH_INSTRUMENTS: readonly PlaybackInstrument[] = ['piano', 'guitar']

function createDiagnosticsFake(should_throw = false): EventLoggerPort & { readonly events: string[] } {
  const events: string[] = []
  return {
    events,
    log: (event_name) => { if (should_throw) throw new Error('diagnostics unavailable'); events.push(event_name) }
  }
}

class FakeAudioContext {
  static last_instance: FakeAudioContext | null = null
  readonly state: AudioContextState = 'running'
  readonly currentTime = 0
  readonly sampleRate = 44100
  readonly destination = {}
  readonly oscillator_types: OscillatorType[] = []
  wave_shaper_count = 0
  buffer_source_count = 0

  constructor() {
    FakeAudioContext.last_instance = this
  }

  resume = async () => undefined
  createOscillator() {
    const context = this
    let oscillator_type: OscillatorType = 'triangle'
    return { get type() { return oscillator_type }, set type(next_type: OscillatorType) { oscillator_type = next_type; context.oscillator_types.push(next_type) }, frequency: { setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined }, connect: () => undefined, start: () => undefined, stop: () => undefined, disconnect: () => undefined }
  }
  createGain() {
    return { gain: { value: 0, setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined }, connect: () => undefined }
  }
  createBiquadFilter() {
    return { type: 'lowpass', frequency: { value: 0, setValueAtTime: () => undefined }, Q: { value: 0 }, connect: () => undefined }
  }
  createWaveShaper() {
    this.wave_shaper_count += 1
    return { curve: null, oversample: 'none', connect: () => undefined }
  }
  createBuffer(_channels: number, length: number) {
    return { getChannelData: () => new Float32Array(length) }
  }
  createBufferSource() {
    this.buffer_source_count += 1
    return { buffer: null, connect: () => undefined, start: () => undefined, stop: () => undefined, disconnect: () => undefined }
  }
}

afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: undefined })
  FakeAudioContext.last_instance = null
})

describe('browser playback', () => {
  it('given_unavailable_audio_context_when_playing_scale_then_returns_failure_and_logs_unlock_failure', async () => {
    const diagnostics = createDiagnosticsFake()
    const playback = createBrowserPlayback(diagnostics)

    const result = await playback.playScale(createScaleInstance(4, 'dorian'), BOTH_INSTRUMENTS)

    expect(result.ok).toBe(false)
    expect(diagnostics.events).toEqual(['audio.unlock_failed'])
  })

  it('given_running_audio_context_when_playing_scale_then_logs_unlock_and_context_events', async () => {
    const diagnostics = createDiagnosticsFake()
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const playback = createBrowserPlayback(diagnostics)
    await playback.setContext(4, 'drone')

    const result = await playback.playScale(createScaleInstance(4, 'dorian'), BOTH_INSTRUMENTS)

    expect(result.ok).toBe(true)
    expect(diagnostics.events).toEqual(['audio.unlock_completed', 'audio.context_started'])
    await playback.stopAll()
  })

  it('given_scale_when_playing_then_reaches_octave_and_returns_to_tonic', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const playback = createBrowserPlayback(createDiagnosticsFake())
    const started_note_indexes: number[] = []
    let stopped_count = 0
    playback.subscribe({ on_note_started: (note_index) => started_note_indexes.push(note_index), on_stopped: () => { stopped_count += 1 } })

    const result = await playback.playScale(createScaleInstance(4, 'dorian'), ['piano'])
    await vi.runAllTimersAsync()

    expect(result.ok).toBe(true)
    expect(started_note_indexes).toEqual([0, 1, 2, 3, 4, 5, 6, 0, 6, 5, 4, 3, 2, 1, 0])
    expect(stopped_count).toBe(1)
    await playback.stopAll()
  })

  it('given_failing_diagnostics_when_audio_unlocking_then_returns_audio_result_without_throwing', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const playback = createBrowserPlayback(createDiagnosticsFake(true))

    const result = await playback.playScale(createScaleInstance(4, 'dorian'), BOTH_INSTRUMENTS)

    expect(result.ok).toBe(true)
  })

  it('given_playing_scale_when_page_becomes_hidden_then_stops_audio_and_notifies_listener', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const diagnostics = createDiagnosticsFake()
    const playback = createBrowserPlayback(diagnostics)
    let was_stopped = false
    playback.subscribe({ on_note_started: () => undefined, on_stopped: () => { was_stopped = true } })
    await playback.playScale(createScaleInstance(4, 'dorian'), BOTH_INSTRUMENTS)

    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(was_stopped).toBe(true)
    expect(diagnostics.events).toContain('audio.context_stopped')
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
    await playback.stopAll()
  })

  it('given_piano_instrument_when_playing_scale_then_schedules_hammer_buffer_without_distortion', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const playback = createBrowserPlayback(createDiagnosticsFake())

    const result = await playback.playScale(createScaleInstance(4, 'dorian'), ['piano'])

    expect(result.ok).toBe(true)
    expect(FakeAudioContext.last_instance?.buffer_source_count).toBeGreaterThan(0)
    expect(FakeAudioContext.last_instance?.wave_shaper_count).toBe(0)
    expect(FakeAudioContext.last_instance?.oscillator_types).toContain('sine')
    expect(FakeAudioContext.last_instance?.oscillator_types).not.toContain('sawtooth')
  })

  it('given_guitar_instrument_when_playing_scale_then_schedules_distortion_without_hammer_buffer', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const playback = createBrowserPlayback(createDiagnosticsFake())

    const result = await playback.playScale(createScaleInstance(4, 'dorian'), ['guitar'])

    expect(result.ok).toBe(true)
    expect(FakeAudioContext.last_instance?.wave_shaper_count).toBeGreaterThan(0)
    expect(FakeAudioContext.last_instance?.buffer_source_count).toBe(0)
    expect(FakeAudioContext.last_instance?.oscillator_types).toContain('sawtooth')
  })

  it('given_bass_instrument_when_playing_scale_then_schedules_overdriven_low_voice_without_hammer_buffer', async () => {
    Object.defineProperty(window, 'AudioContext', { configurable: true, value: FakeAudioContext })
    const playback = createBrowserPlayback(createDiagnosticsFake())

    const result = await playback.playScale(createScaleInstance(4, 'dorian'), ['bass'])

    expect(result.ok).toBe(true)
    expect(FakeAudioContext.last_instance?.wave_shaper_count).toBeGreaterThan(0)
    expect(FakeAudioContext.last_instance?.buffer_source_count).toBe(0)
    expect(FakeAudioContext.last_instance?.oscillator_types).toContain('sawtooth')
  })
})
