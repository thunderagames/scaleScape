import type { ScaleInstance } from '../theory/scale-instance'
import type { TempoBpm } from '../shared/tempo'

export type PlaybackInstrument = 'piano' | 'guitar' | 'bass' | 'ukulele'

export interface PlayableNote {
  readonly pitch_class: number
  readonly octave: number
  readonly semitones: number
}

export interface PlaybackListener {
  on_note_started(note_index: number): void
  on_chord_started?(note_indexes: readonly number[]): void
  on_stopped(): void
}

export interface PlaybackState {
  readonly is_muted: boolean
  readonly volume: number
  readonly context: 'off' | 'drone' | 'pedal'
}

export interface PlaybackPort {
  playScale(scale_instance: ScaleInstance, instruments: readonly PlaybackInstrument[]): Promise<{ readonly ok: boolean }>
  playChord(scale_instance: ScaleInstance, instruments: readonly PlaybackInstrument[]): Promise<{ readonly ok: boolean }>
  previewNote(note: PlayableNote, instruments: readonly PlaybackInstrument[]): Promise<{ readonly ok: boolean }>
  stopAll(): Promise<void>
  setContext(root_pitch_class: number, context: 'off' | 'drone' | 'pedal'): Promise<{ readonly ok: boolean }>
  setTempo(tempo_bpm: TempoBpm): void
  setVolume(volume: number): void
  setMuted(is_muted: boolean): void
  getPlaybackState(): PlaybackState
  subscribePlaybackState(listener: (state: PlaybackState) => void): () => void
  subscribe(listener: PlaybackListener): () => void
}
