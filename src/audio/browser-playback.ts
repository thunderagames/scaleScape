import { pitchToFrequency, transposePitch } from '../theory/frequency'
import type { ScaleInstance } from '../theory/scale-instance'
import type { EventLoggerPort } from '../observability/event-logger'
import type { PlaybackInstrument, PlaybackListener, PlaybackPort, PlaybackState, PlayableNote } from './playback-port'
import type { TempoBpm } from '../shared/tempo'

interface BrowserAudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

const PIANO_PARTIALS = [
  { partial: 1, amplitude: 0.82 },
  { partial: 2, amplitude: 0.38 },
  { partial: 3, amplitude: 0.18 },
  { partial: 4, amplitude: 0.09 },
  { partial: 5, amplitude: 0.045 },
  { partial: 6, amplitude: 0.022 }
] as const

const GUITAR_PARTIALS = [
  { multiplier: 1, amplitude: 0.72, type: 'sawtooth' as OscillatorType },
  { multiplier: 2, amplitude: 0.24, type: 'triangle' as OscillatorType },
  { multiplier: 3, amplitude: 0.12, type: 'sawtooth' as OscillatorType },
  { multiplier: 4, amplitude: 0.045, type: 'sine' as OscillatorType }
] as const

const BASS_PARTIALS = [
  { multiplier: 1, amplitude: 0.66, type: 'sawtooth' as OscillatorType },
  { multiplier: 2, amplitude: 0.2, type: 'triangle' as OscillatorType },
  { multiplier: 3, amplitude: 0.08, type: 'square' as OscillatorType },
  { multiplier: 0.5, amplitude: 0.3, type: 'sine' as OscillatorType }
] as const

const MAX_SCALE_NOTE_DURATION = 1.1
const PREVIEW_NOTE_DURATION = 1.35

function create_guitar_distortion_curve(amount: number): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(new ArrayBuffer(1024 * Float32Array.BYTES_PER_ELEMENT))
  const radians = Math.PI / 180
  for (let index = 0; index < curve.length; index += 1) {
    const input = index * 2 / curve.length - 1
    curve[index] = (3 + amount) * input * 20 * radians / (Math.PI + amount * Math.abs(input))
  }
  return curve
}

const GUITAR_DISTORTION_CURVE = create_guitar_distortion_curve(42)
const BASS_OVERDRIVE_CURVE = create_guitar_distortion_curve(8)

export function createBrowserPlayback(diagnostics: EventLoggerPort = { log: () => undefined }): PlaybackPort {
  let audio_context: AudioContext | null = null
  let active_nodes: AudioScheduledSourceNode[] = []
  let context_nodes: AudioScheduledSourceNode[] = []
  let active_timers: number[] = []
  let playback_generation = 0
  let volume = 0.7
  let is_muted = false
  let context_mode: 'off' | 'drone' | 'pedal' = 'off'
  let context_root_pitch_class = 0
  let tempo_bpm: TempoBpm = 120
  const listeners = new Set<PlaybackListener>()
  const state_listeners = new Set<(state: PlaybackState) => void>()
  let master_gain: GainNode | null = null
  let piano_hammer_buffer: AudioBuffer | null = null
  let piano_hammer_buffer_context: AudioContext | null = null

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

  function handle_visibility_change(): void {
    if (document.visibilityState !== 'hidden') return
    if (active_nodes.length === 0 && context_nodes.length === 0) return
    stopScheduledAudio()
    log('audio.context_stopped', { generation_id: playback_generation, reason_code: 'PAGE_HIDDEN' })
    listeners.forEach((listener) => listener.on_stopped())
  }

  document.addEventListener('visibilitychange', handle_visibility_change)

  function get_master_gain(context: AudioContext): GainNode {
    if (!master_gain) {
      master_gain = context.createGain()
      master_gain.connect(context.destination)
      master_gain.gain.value = is_muted ? 0 : volume
    }
    return master_gain
  }

  function schedule_envelope(gain: GainNode, start_time: number, duration: number, peak_gain: number, decay_ratio: number): void {
    const attack_end = start_time + Math.min(0.008, duration * 0.2)
    const decay_end = start_time + Math.min(0.35, duration * 0.45)
    const release_start = Math.max(decay_end, start_time + duration - 0.16)
    gain.gain.setValueAtTime(0.0001, start_time)
    gain.gain.exponentialRampToValueAtTime(peak_gain, attack_end)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak_gain * decay_ratio), decay_end)
    gain.gain.exponentialRampToValueAtTime(0.0001, release_start + Math.min(0.15, duration * 0.12))
  }

  function schedule_context(context: AudioContext, root_pitch_class: number, mode: 'drone' | 'pedal', start_time: number, duration: number): void {
    const tonic_frequency = pitchToFrequency(root_pitch_class, 3)
    schedule_recorder_note(context, tonic_frequency, start_time, duration)
    if (mode === 'pedal') schedule_recorder_note(context, tonic_frequency * 2 ** (7 / 12), start_time, duration)
  }

  function schedule_context_note(context: AudioContext, frequency: number, start_time: number, duration: number, peak_gain: number): void {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = peak_gain < 0.2 ? 'sine' : 'triangle'
    oscillator.frequency.setValueAtTime(frequency, start_time)
    gain.gain.setValueAtTime(0.0001, start_time)
    gain.gain.exponentialRampToValueAtTime(peak_gain, start_time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start_time + duration - 0.04)
    oscillator.connect(gain)
    gain.connect(get_master_gain(context))
    oscillator.start(start_time)
    oscillator.stop(start_time + duration)
    context_nodes.push(oscillator)
  }

  function schedule_recorder_note(context: AudioContext, frequency: number, start_time: number, duration: number): void {
    schedule_context_note(context, frequency, start_time, duration, 0.12)
    schedule_context_note(context, frequency * 2, start_time, duration, 0.035)
    schedule_context_note(context, frequency * 3, start_time, duration, 0.012)
  }

  function get_piano_partial_frequency(frequency: number, partial: number): number {
    const inharmonicity = 0.0007
    return frequency * partial * Math.sqrt(1 + inharmonicity * partial * partial)
  }

  function schedule_piano_hammer(context: AudioContext, frequency: number, start_time: number, destination_nodes: AudioScheduledSourceNode[]): void {
    try {
      if (!piano_hammer_buffer || piano_hammer_buffer_context !== context) {
        const sample_count = Math.max(1, Math.floor(context.sampleRate * 0.04))
        piano_hammer_buffer = context.createBuffer(1, sample_count, context.sampleRate)
        piano_hammer_buffer_context = context
        const samples = piano_hammer_buffer.getChannelData(0)
        for (let index = 0; index < samples.length; index += 1) samples[index] = (Math.random() * 2 - 1) * Math.exp(-index / samples.length * 7)
      }
      const source = context.createBufferSource()
      const filter = context.createBiquadFilter()
      const gain = context.createGain()
      source.buffer = piano_hammer_buffer
      filter.type = 'highpass'
      filter.frequency.setValueAtTime(Math.min(9000, Math.max(1400, frequency * 3)), start_time)
      gain.gain.setValueAtTime(0.0001, start_time)
      gain.gain.exponentialRampToValueAtTime(0.045, start_time + 0.002)
      gain.gain.exponentialRampToValueAtTime(0.0001, start_time + 0.04)
      source.connect(filter)
      filter.connect(gain)
      gain.connect(get_master_gain(context))
      source.start(start_time)
      source.stop(start_time + 0.04)
      destination_nodes.push(source)
    } catch {
      // The tonal piano partials remain usable if a browser rejects the transient buffer.
    }
  }

  function schedule_piano_note(context: AudioContext, frequency: number, start_time: number, duration: number): void {
    const voice_gain = context.createGain()
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(Math.min(10000, Math.max(2600, frequency * 8)), start_time)
    filter.Q.value = 0.7
    voice_gain.connect(filter)
    filter.connect(get_master_gain(context))
    schedule_envelope(voice_gain, start_time, duration, 0.32, 0.22)
    PIANO_PARTIALS.forEach(({ partial, amplitude }) => {
      const oscillator = context.createOscillator()
      const partial_gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(get_piano_partial_frequency(frequency, partial), start_time)
      partial_gain.gain.value = amplitude
      oscillator.connect(partial_gain)
      partial_gain.connect(voice_gain)
      oscillator.start(start_time)
      oscillator.stop(start_time + duration)
      active_nodes.push(oscillator)
    })
    schedule_piano_hammer(context, frequency, start_time, active_nodes)
  }

  function schedule_guitar_note(context: AudioContext, frequency: number, start_time: number, duration: number): void {
    const voice_gain = context.createGain()
    const distortion = context.createWaveShaper()
    const filter = context.createBiquadFilter()
    distortion.curve = GUITAR_DISTORTION_CURVE
    distortion.oversample = '4x'
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(Math.min(7200, Math.max(2400, frequency * 9)), start_time)
    filter.Q.value = 0.8
    voice_gain.connect(distortion)
    distortion.connect(filter)
    filter.connect(get_master_gain(context))
    schedule_envelope(voice_gain, start_time, duration, 0.2, 0.36)
    GUITAR_PARTIALS.forEach(({ multiplier, amplitude, type }) => {
      const oscillator = context.createOscillator()
      const partial_gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency * multiplier * 1.004, start_time)
      oscillator.frequency.linearRampToValueAtTime(frequency * multiplier, start_time + 0.08)
      partial_gain.gain.value = amplitude
      oscillator.connect(partial_gain)
      partial_gain.connect(voice_gain)
      oscillator.start(start_time)
      oscillator.stop(start_time + duration)
      active_nodes.push(oscillator)
    })
  }

  function schedule_bass_note(context: AudioContext, frequency: number, start_time: number, duration: number): void {
    const voice_gain = context.createGain()
    const overdrive = context.createWaveShaper()
    const filter = context.createBiquadFilter()
    overdrive.curve = BASS_OVERDRIVE_CURVE
    overdrive.oversample = '2x'
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(Math.min(3600, Math.max(900, frequency * 6)), start_time)
    filter.Q.value = 0.9
    voice_gain.connect(overdrive)
    overdrive.connect(filter)
    filter.connect(get_master_gain(context))
    schedule_envelope(voice_gain, start_time, duration, 0.28, 0.42)
    BASS_PARTIALS.forEach(({ multiplier, amplitude, type }) => {
      const oscillator = context.createOscillator()
      const partial_gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency * multiplier, start_time)
      partial_gain.gain.value = amplitude
      oscillator.connect(partial_gain)
      partial_gain.connect(voice_gain)
      oscillator.start(start_time)
      oscillator.stop(start_time + duration)
      active_nodes.push(oscillator)
    })
  }

  function schedule_instrument_note(context: AudioContext, frequency: number, start_time: number, duration: number, instruments: readonly PlaybackInstrument[]): void {
    if (instruments.includes('piano')) schedule_piano_note(context, frequency, start_time, duration)
    if (instruments.includes('guitar')) schedule_guitar_note(context, frequency, start_time, duration)
    if (instruments.includes('bass')) schedule_bass_note(context, frequency, start_time, duration)
  }

  return {
    async playScale(scale_instance, instruments) {
      const context = await unlock()
      if (!context) return { ok: false }
      try {
        stopScheduledAudio()
        const start_time = context.currentTime + 0.05
        const ascending_notes = scale_instance.notes.map((note, note_index) => ({ note_index, semitones: note.semitones }))
        const playback_notes = [
          ...ascending_notes,
          { note_index: 0, semitones: 12 },
          ...ascending_notes.slice().reverse()
        ]
        const note_step_seconds = 60 / tempo_bpm
        const note_duration = Math.min(MAX_SCALE_NOTE_DURATION, note_step_seconds * 0.8)
        const duration = note_duration + Math.max(0, playback_notes.length - 1) * note_step_seconds
        if (context_mode !== 'off') schedule_context(context, scale_instance.root_pitch_class, context_mode, start_time, duration)
        if (context_mode !== 'off') log('audio.context_started', { generation_id: playback_generation, context_kind: context_mode === 'drone' ? 'DRONE' : 'PEDAL' })
        const scheduled_generation = playback_generation
        playback_notes.forEach(({ note_index, semitones }, index) => {
          const frequency = transposePitch(scale_instance.root_pitch_class, 4, semitones).frequency
          const note_start = start_time + index * note_step_seconds
          schedule_instrument_note(context, frequency, note_start, note_duration, instruments)
          const timer = window.setTimeout(() => {
            if (scheduled_generation === playback_generation) {
              listeners.forEach((listener) => listener.on_note_started(note_index))
            }
          }, Math.max(0, (note_start - context.currentTime) * 1000))
          active_timers.push(timer)
        })
        const completion_timer = window.setTimeout(() => {
          if (scheduled_generation === playback_generation) listeners.forEach((listener) => listener.on_stopped())
        }, Math.max(0, (start_time - context.currentTime + duration) * 1000))
        active_timers.push(completion_timer)
        return { ok: true }
      } catch {
        stopScheduledAudio()
        log('audio.lifecycle_changed', { previous_lifecycle: 'READY', new_lifecycle: 'ERROR', reason_code: 'ENGINE_ERROR' })
        return { ok: false }
      }
    },
    async previewNote(note: PlayableNote, instruments) {
      const context = await unlock()
      if (!context) return { ok: false }
      try {
        stopScheduledAudio()
        const start_time = context.currentTime + 0.02
        if (context_mode !== 'off') schedule_context(context, context_root_pitch_class, context_mode, start_time, 0.55)
        if (context_mode !== 'off') log('audio.context_started', { generation_id: playback_generation, context_kind: context_mode === 'drone' ? 'DRONE' : 'PEDAL' })
        schedule_instrument_note(context, pitchToFrequency(note.pitch_class, note.octave), start_time, PREVIEW_NOTE_DURATION, instruments)
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
    setTempo(next_tempo_bpm) {
      tempo_bpm = next_tempo_bpm
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
