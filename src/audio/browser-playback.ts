import { pitchToFrequency, transposePitch } from '../theory/frequency'
import type { ScaleInstance } from '../theory/scale-instance'
import type { PlaybackListener, PlaybackPort, PlaybackState, PlayableNote } from './playback-port'

interface BrowserAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

export function createBrowserPlayback(): PlaybackPort {
  let audio_context: AudioContext | null = null
  let active_nodes: OscillatorNode[] = []
  let active_timers: number[] = []
  let playback_generation = 0
  let volume = 0.7
  let is_muted = false
  const listeners = new Set<PlaybackListener>()
  const state_listeners = new Set<(state: PlaybackState) => void>()
  let master_gain: GainNode | null = null

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
    if (!context) return null
    try {
      if (context.state === 'suspended') await context.resume()
      return context.state === 'running' ? context : null
    } catch {
      return null
    }
  }

  function stopAllNodes(notify = true): void {
    playback_generation += 1
    active_timers.forEach((timer) => window.clearTimeout(timer))
    active_timers = []
    active_nodes.forEach((node) => {
      try { node.stop(); node.disconnect() } catch { /* already ended */ }
    })
    active_nodes = []
    if (notify) listeners.forEach((listener) => listener.on_stopped())
  }

  function schedule_note(context: AudioContext, frequency: number, start_time: number, duration: number): void {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, start_time)
    gain.gain.setValueAtTime(0.0001, start_time)
    gain.gain.exponentialRampToValueAtTime(0.2, start_time + 0.02)
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
    active_nodes.push(oscillator)
  }

  return {
    async playScale(scale_instance) {
      const context = await unlock()
      if (!context) return { ok: false }
      try {
        stopAllNodes(false)
        const start_time = context.currentTime + 0.05
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
        stopAllNodes(false)
        return { ok: false }
      }
    },
    async previewNote(note: PlayableNote) {
      const context = await unlock()
      if (!context) return { ok: false }
      try {
        stopAllNodes(false)
        schedule_note(context, pitchToFrequency(note.pitch_class, note.octave), context.currentTime + 0.02, 0.55)
        return { ok: true }
      } catch {
        stopAllNodes(false)
        return { ok: false }
      }
    },
    async stopAll() {
      stopAllNodes()
    },
    setVolume(next_volume) {
      volume = Math.min(1, Math.max(0, next_volume))
      if (master_gain) master_gain.gain.value = is_muted ? 0 : volume
      const state = { is_muted, volume }
      state_listeners.forEach((listener) => listener(state))
    },
    setMuted(next_is_muted) {
      is_muted = next_is_muted
      if (master_gain) master_gain.gain.value = is_muted ? 0 : volume
      const state = { is_muted, volume }
      state_listeners.forEach((listener) => listener(state))
    },
    getPlaybackState() {
      return { is_muted, volume }
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
