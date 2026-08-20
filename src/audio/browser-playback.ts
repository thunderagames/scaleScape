import { pitchToFrequency, transposePitch } from '../theory/frequency'
import type { ScaleInstance } from '../theory/scale-instance'
import type { EventLoggerPort } from '../observability/event-logger'
import type { PlaybackListener, PlaybackPort, PlaybackState, PlayableNote } from './playback-port'

interface BrowserAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

export function createBrowserPlayback(diagnostics: EventLoggerPort = { log: () => undefined }): PlaybackPort {
  let audio_context: AudioContext | null = null
  let active_nodes: OscillatorNode[] = []
  let context_nodes: OscillatorNode[] = []
  let active_timers: number[] = []
  let playback_generation = 0
  let volume = 0.7
  let is_muted = false
  let context_mode: 'off' | 'drone' | 'pedal' = 'off'
  let context_root_pitch_class = 0
  const listeners = new Set<PlaybackListener>()
  const state_listeners = new Set<(state: PlaybackState) => void>()
  let master_gain: GainNode | null = null

  function log(event_name: string, attributes: Readonly<Record<string, string | number | boolean>>): void {
    try { diagnostics.log(event_name, attributes) } catch { /* Diagnostics must not block audio. */ }
  }

  function getContext(): AudioContext | null {
    if (audio_context) return audio_context
    const browser_window = window as BrowserAudioWindow
    const AudioContextConstructor = window.AudioContext ?? browser_window.webkitAudioContext
    if (!AudioContextConstructor) return null
    try {
      audio_context = new AudioContextConstructor()
      return audio_context
    } catch {
      return null
    }
  }

  async function unlock(): Promise<AudioContext | null> {
    const context = getContext()
    if (!context) {
      log('audio.unlock_failed', { audio_lifecycle: 'UNAVAILABLE' })
      return null
    }
    try {
      if (context.state === 'suspended') await context.resume()
      if (context.state !== 'running') {
        log('audio.unlock_failed', { audio_lifecycle: 'SUSPENDED' })
        return null
      }
      log('audio.unlock_completed', { audio_lifecycle: 'READY' })
      return context
    } catch {
      log('audio.unlock_failed', { audio_lifecycle: 'ERROR' })
      return null
    }
  }

  function stopAllNodes(notify = true): void {
    stopScheduledAudio()
    if (notify) listeners.forEach((listener) => listener.on_stopped())
  }

  function stopScheduledAudio(): void {
    playback_generation += 1
    active_timers.forEach((timer) => window.clearTimeout(timer))
    active_timers = []
    active_nodes.forEach((node) => {
      try { node.stop(); node.disconnect() } catch { /* already ended */ }
    })
    active_nodes = []
    context_nodes.forEach((node) => {
      try { node.stop(); node.disconnect() } catch { /* already ended */ }
    })
    context_nodes = []
  }

  function schedule_context(context: AudioContext, root_pitch_class: number, mode: 'drone' | 'pedal', start_time: number, duration: number): void {
    const tonic_frequency = pitchToFrequency(root_pitch_class, 3)
    schedule_recorder_note(context, tonic_frequency, start_time, duration, context_nodes)
    if (mode === 'pedal') schedule_recorder_note(context, tonic_frequency * 2 ** (7 / 12), start_time, duration, context_nodes)
  }

  function schedule_note(context: AudioContext, frequency: number, start_time: number, duration: number, destination_nodes = active_nodes, peak_gain = 0.2): void {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = peak_gain < 0.2 ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(frequency, start_time)
    gain.gain.setValueAtTime(0.0001, start_time)
    gain.gain.exponentialRampToValueAtTime(peak_gain, start_time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start_time + duration - 0.04)
    oscillator.connect(gain)
    if (!master_gain) {
      master_gain = context.createGain()
      master_gain.connect(context.destination)
      master_gain.gain.value = is_muted ? 0 : volume
    }
    gain.connect(master_gain)
    oscillator.start(start_time)
    oscillator.stop(start_time + duration)
    destination_nodes.push(oscillator)
  }

  function schedule_recorder_note(context: AudioContext, frequency: number, start_time: number, duration: number, destination_nodes: OscillatorNode[]): void {
    schedule_note(context, frequency, start_time, duration, destination_nodes, 0.12)
    schedule_note(context, frequency * 2, start_time, duration, destination_nodes, 0.035)
    schedule_note(context, frequency * 3, start_time, duration, destination_nodes, 0.012)
  }

  return {
    async playScale(scale_instance) {
      const context = await unlock()
      if (!context) return { ok: false }
      try {
        stopScheduledAudio()
        const start_time = context.currentTime + 0.05
        const duration = 0.6 + Math.max(0, scale_instance.notes.length - 1) * 0.7
        if (context_mode !== 'off') schedule_context(context, scale_instance.root_pitch_class, context_mode, start_time, duration)
        if (context_mode !== 'off') log('audio.context_started', { generation_id: playback_generation, context_kind: context_mode === 'drone' ? 'DRONE' : 'PEDAL' })
        const scheduled_generation = playback_generation
        const frequencies = scale_instance.notes.map((note) => transposePitch(scale_instance.root_pitch_class, 4, note.semitones).frequency)
        frequencies.forEach((frequency, index) => {
          const note_start = start_time + index * 0.7
          schedule_note(context, frequency, note_start, 0.6)
          const timer = window.setTimeout(() => {
            if (scheduled_generation === playback_generation) {
              listeners.forEach((listener) => listener.on_note_started(index))
            }
          }, Math.max(0, (note_start - context.currentTime) * 1000))
          active_timers.push(timer)
        })
        return { ok: true }
      } catch {
        stopScheduledAudio()
        log('audio.lifecycle_changed', { previous_lifecycle: 'READY', new_lifecycle: 'ERROR', reason_code: 'ENGINE_ERROR' })
        return { ok: false }
      }
    },
    async previewNote(note: PlayableNote) {
      const context = await unlock()
      if (!context) return { ok: false }
      try {
        stopScheduledAudio()
        const start_time = context.currentTime + 0.02
        if (context_mode !== 'off') schedule_context(context, context_root_pitch_class, context_mode, start_time, 0.55)
        if (context_mode !== 'off') log('audio.context_started', { generation_id: playback_generation, context_kind: context_mode === 'drone' ? 'DRONE' : 'PEDAL' })
        schedule_note(context, pitchToFrequency(note.pitch_class, note.octave), start_time, 0.55)
        return { ok: true }
      } catch {
        stopScheduledAudio()
        log('audio.lifecycle_changed', { previous_lifecycle: 'READY', new_lifecycle: 'ERROR', reason_code: 'ENGINE_ERROR' })
        return { ok: false }
      }
    },
    async stopAll() {
      stopAllNodes()
    },
    async setContext(root_pitch_class, next_context) {
      stopScheduledAudio()
      context_root_pitch_class = root_pitch_class
      context_mode = next_context
      state_listeners.forEach((listener) => listener({ is_muted, volume, context: context_mode }))
      return { ok: true }
    },
    setVolume(next_volume) {
      volume = Math.min(1, Math.max(0, next_volume))
      if (master_gain) master_gain.gain.value = is_muted ? 0 : volume
      const state = { is_muted, volume, context: context_mode }
      state_listeners.forEach((listener) => listener(state))
    },
    setMuted(next_is_muted) {
      is_muted = next_is_muted
      if (master_gain) master_gain.gain.value = is_muted ? 0 : volume
      const state = { is_muted, volume, context: context_mode }
      state_listeners.forEach((listener) => listener(state))
    },
    getPlaybackState() {
      return { is_muted, volume, context: context_mode }
    },
    subscribePlaybackState(listener) {
      state_listeners.add(listener)
      return () => state_listeners.delete(listener)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }
  }
}
