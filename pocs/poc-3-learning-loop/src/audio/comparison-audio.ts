import { pitch_to_frequency, transpose_pitch } from '../../../poc-0-theory-audio/src/theory/frequency'
import type { ScaleInstance } from '../../../poc-0-theory-audio/src/theory/scale-instance'
import type { ComparisonExercise } from '../domain/learning-loop'

export type AudioResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'unavailable' | 'failed' }

export interface ComparisonAudioPort {
  play_scale(scale_instance: ScaleInstance): Promise<AudioResult>
  play_characteristic_note(scale_instance: ScaleInstance): Promise<AudioResult>
  stop(): void
}

interface BrowserAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

function get_scale_frequencies(scale_instance: ScaleInstance): readonly number[] {
  return scale_instance.notes.map((note) => transpose_pitch(scale_instance.root_pitch_class, 4, note.interval.semitones).frequency)
}

export function create_comparison_audio(): ComparisonAudioPort {
  let audio_context: AudioContext | null = null
  let active_nodes: OscillatorNode[] = []

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
      return audio_context
    } catch {
      return null
    }
  }

  function stop(): void {
    active_nodes.forEach((node) => {
      try {
        node.stop()
        node.disconnect()
      } catch {
        // A completed oscillator is safely ignored during best-effort cleanup.
      }
    })
    active_nodes = []
  }

  async function unlock(): Promise<AudioContext | null> {
    const context = get_context()
    if (!context) {
      return null
    }

    try {
      if (context.state === 'suspended') {
        await context.resume()
      }
      return context.state === 'running' ? context : null
    } catch {
      return null
    }
  }

  function schedule_tone(context: AudioContext, frequency: number, start_time: number, duration: number, gain_level: number): void {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, start_time)
    gain.gain.setValueAtTime(0.0001, start_time)
    gain.gain.exponentialRampToValueAtTime(gain_level, start_time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start_time + duration - 0.04)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start_time)
    oscillator.stop(start_time + duration)
    active_nodes.push(oscillator)
    oscillator.addEventListener('ended', () => {
      active_nodes = active_nodes.filter((active_node) => active_node !== oscillator)
    })
  }

  async function play_scale(scale_instance: ScaleInstance): Promise<AudioResult> {
    const context = await unlock()
    if (!context) {
      return { ok: false, reason: 'unavailable' }
    }

    try {
      stop()
      const start_time = context.currentTime + 0.05
      schedule_tone(context, pitch_to_frequency(scale_instance.root_pitch_class, 3), start_time, 7.4, 0.07)
      get_scale_frequencies(scale_instance).forEach((frequency, index) => {
        schedule_tone(context, frequency, start_time + index, 0.8, 0.22)
      })
      return { ok: true }
    } catch {
      stop()
      return { ok: false, reason: 'failed' }
    }
  }

  async function play_characteristic_note(scale_instance: ScaleInstance): Promise<AudioResult> {
    const context = await unlock()
    if (!context) {
      return { ok: false, reason: 'unavailable' }
    }

    try {
      stop()
      const characteristic_note = scale_instance.notes.find((note) => note.degree === 6)
      if (!characteristic_note) {
        return { ok: false, reason: 'failed' }
      }
      const start_time = context.currentTime + 0.05
      schedule_tone(context, pitch_to_frequency(scale_instance.root_pitch_class, 3), start_time, 1.6, 0.07)
      schedule_tone(context, transpose_pitch(scale_instance.root_pitch_class, 4, characteristic_note.interval.semitones).frequency, start_time + 0.2, 0.9, 0.24)
      return { ok: true }
    } catch {
      stop()
      return { ok: false, reason: 'failed' }
    }
  }

  return { play_scale, play_characteristic_note, stop }
}

export function get_audio_variant(exercise: ComparisonExercise, variant: 'a' | 'b'): ScaleInstance {
  return variant === 'a' ? exercise.scale_a : exercise.scale_b
}
