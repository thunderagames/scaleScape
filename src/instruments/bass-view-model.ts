import type { ScaleInstance } from '../theory/scale-instance'
import { createStringedInstrumentViewModel, getTuningNote, type StringedInstrumentViewModel, type StringedInstrumentString } from './guitar-view-model'

export const STANDARD_BASS_TUNING: readonly StringedInstrumentString[] = [
  { name: 'E', open_midi: 28 },
  { name: 'A', open_midi: 33 },
  { name: 'D', open_midi: 38 },
  { name: 'G', open_midi: 43 }
]

export function getBassTuningNote(semitones: number): string {
  return getTuningNote(semitones, (STANDARD_BASS_TUNING[0]?.open_midi ?? 28) % 12)
}

export function createBassViewModel(scale_instance: ScaleInstance, generation_id: number, fret_count = 12, tuning = STANDARD_BASS_TUNING): StringedInstrumentViewModel {
  return createStringedInstrumentViewModel(scale_instance, generation_id, fret_count, tuning)
}
