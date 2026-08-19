import type { ScaleInstance } from '../theory/scale-instance'
import { create_ascending_scale_timeline } from './audio-timeline'
import { pitch_to_frequency, transpose_pitch } from '../theory/frequency'

export type AudioLifecycle = 'locked' | 'ready' | 'suspended' | 'unavailable' | 'error'

export interface AudioSnapshot {
  readonly lifecycle: AudioLifecycle
  readonly generation_id: number
  readonly is_playing: boolean
  readonly is_muted: boolean
  readonly error: string | null
}

export interface AudioEngine {
  unlock(): Promise<AudioSnapshot>
  play_scale(scale_instance: ScaleInstance): Promise<AudioSnapshot>
  replay(): Promise<AudioSnapshot>
  stop_all(): Promise<AudioSnapshot>
  subscribe(listener: (snapshot: AudioSnapshot) => void): () => void
}

interface BrowserAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

export function create_audio_engine(): AudioEngine {
  let audio_context: AudioContext | null = null
  let generation_id = 0
  let last_scale_instance: ScaleInstance | null = null
  let active_nodes: AudioScheduledSourceNode[] = []
  let pending_unlock_generation: number | null = null
  let snapshot: AudioSnapshot = {
    lifecycle: 'locked',
    generation_id,
    is_playing: false,
    is_muted: false,
    error: null
  }
  const listeners = new Set<(current_snapshot: AudioSnapshot) => void>()

  function publish(next_snapshot: AudioSnapshot): AudioSnapshot {
    snapshot = next_snapshot
    listeners.forEach((listener) => listener(snapshot))
    return snapshot
  }

  function get_context(): AudioContext | null {
    if (audio_context) {
      return audio_context
    }

    const browser_window = window as BrowserAudioWindow
    const AudioContextConstructor = window.AudioContext ?? browser_window.webkitAudioContext
    if (!AudioContextConstructor) {
      return null
    }

    try {
      audio_context = new AudioContextConstructor()
      audio_context.addEventListener('statechange', () => {
        const current_context = audio_context
        if (!current_context) {
          return
        }

        if (current_context.state === 'suspended') {
          invalidate_playback('suspended', null)
        } else if (current_context.state === 'closed') {
          invalidate_playback('error', 'Audio context is closed')
        } else if (current_context.state === 'running') {
          if (pending_unlock_generation === generation_id) {
            publish({ ...snapshot, lifecycle: 'ready', error: null })
          }
        }
      })

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            void stop_all()
          }
        })
      }

      return audio_context
    } catch {
      audio_context = null
      return null
    }
  }

  function disconnect_nodes(): void {
    active_nodes.forEach((node) => {
      try {
        node.stop()
      } catch {
        // A node that already stopped is safely ignored.
      }
      try {
        node.disconnect()
      } catch {
        // A node that cannot be disconnected must not block other cleanup.
      }
    })
    active_nodes = []
  }

  function invalidate_playback(lifecycle: AudioLifecycle, error: string | null): AudioSnapshot {
    generation_id += 1
    pending_unlock_generation = null
    disconnect_nodes()
    return publish({ ...snapshot, generation_id, lifecycle, is_playing: false, error })
  }

  async function unlock_for_generation(expected_generation_id?: number): Promise<AudioSnapshot> {
    const context = get_context()
    if (!context) {
      if (expected_generation_id !== undefined && expected_generation_id !== generation_id) {
        return snapshot
      }
      return publish({ ...snapshot, lifecycle: 'unavailable', error: 'Web Audio is unavailable' })
    }

    try {
      if (context.state === 'closed') {
        if (expected_generation_id !== undefined && expected_generation_id !== generation_id) {
          return snapshot
        }
        return publish({ ...snapshot, lifecycle: 'error', error: 'Audio context is closed' })
      }
      if (context.state === 'suspended') {
        pending_unlock_generation = expected_generation_id ?? generation_id
        await context.resume()
      }
      if (pending_unlock_generation === (expected_generation_id ?? generation_id)) {
        pending_unlock_generation = null
      }
      if (expected_generation_id !== undefined && expected_generation_id !== generation_id) {
        return snapshot
      }
      const resumed_context_state = context.state as AudioContextState
      if (resumed_context_state === 'closed') {
        return publish({ ...snapshot, lifecycle: 'error', error: 'Audio context is closed' })
      }
      if (resumed_context_state !== 'running') {
        return publish({ ...snapshot, lifecycle: 'suspended', error: 'Audio could not be started' })
      }
      return publish({ ...snapshot, lifecycle: 'ready', error: null })
    } catch {
      if (pending_unlock_generation === (expected_generation_id ?? generation_id)) {
        pending_unlock_generation = null
      }
      if (expected_generation_id !== undefined && expected_generation_id !== generation_id) {
        return snapshot
      }
      return publish({ ...snapshot, lifecycle: 'error', error: 'Audio could not be started' })
    }
  }

  function unlock(): Promise<AudioSnapshot> {
    return unlock_for_generation()
  }

  function schedule_tone(frequency: number, start_time: number, stop_time: number, gain_level: number, scheduled_generation_id: number): void {
    if (!audio_context || snapshot.is_muted) {
      return
    }

    let oscillator: OscillatorNode | null = null

    try {
      oscillator = audio_context.createOscillator()
      const gain = audio_context.createGain()
      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(frequency, start_time)
      gain.gain.setValueAtTime(0.0001, start_time)
      gain.gain.exponentialRampToValueAtTime(gain_level, start_time + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, stop_time)
      oscillator.connect(gain)
      gain.connect(audio_context.destination)
      oscillator.start(start_time)
      oscillator.stop(stop_time + 0.05)
      active_nodes.push(oscillator)
      oscillator.addEventListener('ended', () => {
        active_nodes = active_nodes.filter((node) => node !== oscillator)
        if (scheduled_generation_id === generation_id && active_nodes.length === 0 && snapshot.is_playing) {
          publish({ ...snapshot, is_playing: false })
        }
      })
    } catch (error) {
      try {
        oscillator?.disconnect()
      } catch {
        // Best-effort cleanup after a scheduling failure.
      }
      throw error
    }
  }

  async function play_scale(scale_instance: ScaleInstance): Promise<AudioSnapshot> {
    const requested_generation_id = ++generation_id
    const unlocked_snapshot = await unlock_for_generation(requested_generation_id)
    if (requested_generation_id !== generation_id) {
      return snapshot
    }
    if (unlocked_snapshot.lifecycle !== 'ready' || !audio_context || audio_context.state === 'closed') {
      return publish({ ...unlocked_snapshot, generation_id: requested_generation_id, is_playing: false })
    }

    disconnect_nodes()
    last_scale_instance = scale_instance
    const start_time = audio_context.currentTime + 0.05
    const scale_root_octave = 4
    const root_frequency = pitch_to_frequency(scale_instance.root_pitch_class, 3)
    const note_frequencies = scale_instance.notes.map((note) => transpose_pitch(scale_instance.root_pitch_class, scale_root_octave, note.interval.semitones).frequency)
    const timeline = create_ascending_scale_timeline({
      drone_frequency: root_frequency,
      note_frequencies,
      start_time_seconds: start_time,
      generation_id: requested_generation_id
    })
    const drone_stop_time = timeline.find((event) => event.kind === 'drone_stop')?.time_seconds ?? start_time + 8

    try {
      for (const event of timeline) {
        if (requested_generation_id !== generation_id) {
          return snapshot
        }
        if (event.kind === 'drone_start' && event.frequency) {
          schedule_tone(event.frequency, event.time_seconds, drone_stop_time, 0.07, requested_generation_id)
        }
        if (event.kind === 'note_start' && event.frequency) {
          const stop_event = timeline.find((candidate) => candidate.kind === 'note_stop' && candidate.frequency === event.frequency && candidate.time_seconds > event.time_seconds)
          schedule_tone(event.frequency, event.time_seconds, stop_event?.time_seconds ?? event.time_seconds + 0.8, 0.22, requested_generation_id)
        }
      }
    } catch {
      disconnect_nodes()
      return publish({ ...snapshot, lifecycle: 'error', generation_id: requested_generation_id, is_playing: false, error: 'Audio could not be scheduled' })
    }

    return publish({ ...snapshot, lifecycle: 'ready', generation_id: requested_generation_id, is_playing: true, error: null })
  }

  async function stop_all(): Promise<AudioSnapshot> {
    generation_id += 1
    pending_unlock_generation = null
    disconnect_nodes()
    return publish({ ...snapshot, generation_id, is_playing: false })
  }

  return {
    unlock,
    play_scale,
    replay() {
      if (!last_scale_instance) {
        return Promise.resolve(snapshot)
      }
      return play_scale(last_scale_instance)
    },
    stop_all,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
