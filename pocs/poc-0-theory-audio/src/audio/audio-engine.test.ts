import { afterEach, describe, expect, it } from 'vitest'
import { create_scale_instance } from '../theory/scale-instance'
import { create_audio_engine } from './audio-engine'

interface FakeOscillator {
  type: string
  frequency: { setValueAtTime(value: number, time: number): void }
  scheduled_frequency?: number[]
  start(time: number): void
  stop(time?: number): void
  connect(node: unknown): void
  disconnect(): void
  addEventListener(type: string, listener: () => void): void
}

interface FakeGain {
  gain: {
    setValueAtTime(value: number, time: number): void
    exponentialRampToValueAtTime(value: number, time: number): void
  }
  connect(node: unknown): void
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  state: AudioContextState = 'suspended'
  currentTime = 100
  destination = {}
  readonly oscillators: FakeOscillator[] = []
  throw_on_create_oscillator = false
  resume_promise: Promise<void> | null = null
  private resume_resolve: (() => void) | null = null
  private statechange_listener: (() => void) | null = null

  constructor() {
    FakeAudioContext.instances.push(this)
  }

  addEventListener(type: string, listener: () => void): void {
    if (type === 'statechange') {
      this.statechange_listener = listener
    }
  }

  resume(): Promise<void> {
    if (this.resume_promise) {
      return this.resume_promise
    }

    this.resume_promise = new Promise<void>((resolve) => {
      this.resume_resolve = resolve
    })
    return this.resume_promise
  }

  resolve_resume(): void {
    this.state = 'running'
    this.statechange_listener?.()
    this.resume_resolve?.()
  }

  set_state(next_state: AudioContextState): void {
    this.state = next_state
    this.statechange_listener?.()
    if (next_state === 'closed') {
      this.resume_resolve?.()
      this.resume_resolve = null
    }
  }

  createOscillator(): FakeOscillator {
    if (this.throw_on_create_oscillator) {
      throw new Error('Fake scheduling failure')
    }

    const values: number[] = []
    const oscillator: FakeOscillator = {
      type: '',
      frequency: {
        setValueAtTime(value) {
          values.push(value)
        }
      },
      start() {
        return
      },
      stop() {
        return
      },
      connect() {
        return
      },
      disconnect() {
        return
      },
      addEventListener() {
        return
      }
    }

    oscillator.scheduled_frequency = values
    this.oscillators.push(oscillator)
    return oscillator
  }

  createGain(): FakeGain {
    return {
      gain: {
        setValueAtTime() {
          return
        },
        exponentialRampToValueAtTime() {
          return
        }
      },
      connect() {
        return
      }
    }
  }
}

function install_fake_audio_context(): void {
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    value: FakeAudioContext
  })
}

afterEach(() => {
  FakeAudioContext.instances = []
  delete (window as Window & { AudioContext?: unknown }).AudioContext
})

describe('create_audio_engine', () => {
  it('given_a_browser_without_web_audio_when_unlocking_then_returns_visible_unavailable_state', async () => {
    const audio_engine = create_audio_engine()

    const snapshot = await audio_engine.unlock()

    expect(snapshot.lifecycle).toBe('unavailable')
    expect(snapshot.error).toBe('Web Audio is unavailable')
  })

  it('given_no_previous_scale_when_replaying_then_preserves_the_current_snapshot', async () => {
    const audio_engine = create_audio_engine()

    const snapshot = await audio_engine.replay()

    expect(snapshot.lifecycle).toBe('locked')
    expect(snapshot.is_playing).toBe(false)
  })

  it('given_an_unavailable_browser_when_playing_a_scale_then_does_not_claim_that_audio_played', async () => {
    const audio_engine = create_audio_engine()
    const scale_instance = create_scale_instance(4, 'dorian')

    const snapshot = await audio_engine.play_scale(scale_instance)

    expect(snapshot.lifecycle).toBe('unavailable')
    expect(snapshot.is_playing).toBe(false)
  })

  it('given_fake_audio_context_when_playing_e_dorian_then_schedules_drone_and_an_ascending_register', async () => {
    install_fake_audio_context()
    const audio_engine = create_audio_engine()
    const play_promise = audio_engine.play_scale(create_scale_instance(4, 'dorian'))

    const fake_context = FakeAudioContext.instances[0]
    if (!fake_context) {
      throw new Error('Expected fake audio context was not created')
    }
    fake_context.resolve_resume()
    const snapshot = await play_promise
    const scheduled_frequencies = fake_context.oscillators.map((oscillator) => oscillator.scheduled_frequency?.[0])

    expect(snapshot.lifecycle).toBe('ready')
    expect(snapshot.is_playing).toBe(true)
    expect(scheduled_frequencies).toEqual([
      expect.closeTo(164.813778, 5),
      expect.closeTo(329.627557, 5),
      expect.closeTo(369.994422, 5),
      expect.closeTo(391.995436, 5),
      expect.closeTo(440, 5),
      expect.closeTo(493.883301, 5),
      expect.closeTo(554.365262, 5),
      expect.closeTo(587.329536, 5)
    ])
  })

  it('given_audio_resume_is_pending_when_stop_runs_then_delayed_play_does_not_start_audio', async () => {
    install_fake_audio_context()
    const audio_engine = create_audio_engine()
    const play_promise = audio_engine.play_scale(create_scale_instance(4, 'dorian'))

    const stop_snapshot = await audio_engine.stop_all()
    const fake_context = FakeAudioContext.instances[0]
    if (!fake_context) {
      throw new Error('Expected fake audio context was not created')
    }
    fake_context.resolve_resume()
    const play_snapshot = await play_promise

    expect(stop_snapshot.is_playing).toBe(false)
    expect(play_snapshot.is_playing).toBe(false)
    expect(fake_context.oscillators).toHaveLength(0)
  })

  it('given_audio_resume_is_pending_when_stop_runs_then_does_not_publish_a_stale_ready_transition', async () => {
    install_fake_audio_context()
    const audio_engine = create_audio_engine()
    const snapshots: string[] = []
    audio_engine.subscribe((snapshot) => snapshots.push(snapshot.lifecycle))
    const play_promise = audio_engine.play_scale(create_scale_instance(4, 'dorian'))

    await audio_engine.stop_all()
    const fake_context = FakeAudioContext.instances[0]
    if (!fake_context) {
      throw new Error('Expected fake audio context was not created')
    }
    fake_context.resolve_resume()
    await play_promise

    expect(snapshots).not.toContain('ready')
  })

  it('given_active_playback_when_audio_context_becomes_suspended_then_invalidates_playback', async () => {
    install_fake_audio_context()
    const audio_engine = create_audio_engine()
    const play_promise = audio_engine.play_scale(create_scale_instance(4, 'dorian'))
    const fake_context = FakeAudioContext.instances[0]
    if (!fake_context) {
      throw new Error('Expected fake audio context was not created')
    }
    fake_context.resolve_resume()
    const playing_snapshot = await play_promise

    fake_context.set_state('suspended')
    const stopped_snapshot = await audio_engine.replay()

    expect(playing_snapshot.is_playing).toBe(true)
    expect(stopped_snapshot.lifecycle).toBe('suspended')
    expect(stopped_snapshot.is_playing).toBe(false)
    expect(stopped_snapshot.generation_id).toBeGreaterThan(playing_snapshot.generation_id)
  })

  it('given_active_playback_when_audio_context_closes_then_invalidates_playback_with_an_error', async () => {
    install_fake_audio_context()
    const audio_engine = create_audio_engine()
    const play_promise = audio_engine.play_scale(create_scale_instance(4, 'dorian'))
    const fake_context = FakeAudioContext.instances[0]
    if (!fake_context) {
      throw new Error('Expected fake audio context was not created')
    }
    fake_context.resolve_resume()
    const playing_snapshot = await play_promise

    fake_context.set_state('closed')
    const stopped_snapshot = await audio_engine.replay()

    expect(playing_snapshot.is_playing).toBe(true)
    expect(stopped_snapshot.lifecycle).toBe('error')
    expect(stopped_snapshot.error).toBe('Audio context is closed')
    expect(stopped_snapshot.is_playing).toBe(false)
  })

  it('given_a_closed_audio_context_when_unlocking_then_reports_an_audio_error', async () => {
    install_fake_audio_context()
    const audio_engine = create_audio_engine()
    const initial_unlock = audio_engine.unlock()
    const fake_context = FakeAudioContext.instances[0]
    if (!fake_context) {
      throw new Error('Expected fake audio context was not created')
    }
    fake_context.set_state('closed')
    const initial_snapshot = await initial_unlock

    const snapshot = await audio_engine.unlock()

    expect(initial_snapshot.lifecycle).toBe('error')
    expect(initial_snapshot.error).toBe('Audio context is closed')
    expect(snapshot.lifecycle).toBe('error')
    expect(snapshot.error).toBe('Audio context is closed')
    expect(snapshot.is_playing).toBe(false)
  })

  it('given_audio_scheduling_throws_when_playing_a_scale_then_reports_a_visible_error', async () => {
    install_fake_audio_context()
    const audio_engine = create_audio_engine()
    const play_promise = audio_engine.play_scale(create_scale_instance(4, 'dorian'))
    const fake_context = FakeAudioContext.instances[0]
    if (!fake_context) {
      throw new Error('Expected fake audio context was not created')
    }
    fake_context.throw_on_create_oscillator = true
    fake_context.resolve_resume()

    const snapshot = await play_promise

    expect(snapshot.lifecycle).toBe('error')
    expect(snapshot.error).toBe('Audio could not be scheduled')
    expect(snapshot.is_playing).toBe(false)
  })
})
