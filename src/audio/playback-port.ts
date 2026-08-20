import type { ScaleInstance } from '../theory/scale-instance'

export interface PlayableNote {
  readonly pitch_class: number
  readonly octave: number
  readonly semitones: number
}

export interface PlaybackListener {
  on_note_started(note_index: number): void
  on_stopped(): void
}

export interface PlaybackState {
  readonly is_muted: boolean
  readonly volume: number
}

export interface PlaybackPort {
  playScale(scale_instance: ScaleInstance): Promise<{ readonly ok: boolean }>
  previewNote(note: PlayableNote): Promise<{ readonly ok: boolean }>
  stopAll(): Promise<void>
  setVolume(volume: number): void
  setMuted(is_muted: boolean): void
  getPlaybackState(): PlaybackState
  subscribePlaybackState(listener: (state: PlaybackState) => void): () => void
  subscribe(listener: PlaybackListener): () => void
}
