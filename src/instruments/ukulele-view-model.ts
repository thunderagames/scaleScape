import type { ScaleInstance } from '../theory/scale-instance'
import { createStringedInstrumentViewModel, getTuningNote, type StringedInstrumentViewModel, type StringedInstrumentString } from './guitar-view-model'

// Standard C6 reentrant tuning: high G4, C4, E4, A4.
export const STANDARD_UKULELE_TUNING: readonly StringedInstrumentString[] = [
  { name: 'High G', open_midi: 67 },
  { name: 'C', open_midi: 60 },
  { name: 'E', open_midi: 64 },
  { name: 'A', open_midi: 69 }
]

export function getUkuleleTuningNote(semitones: number): string {
  return getTuningNote(semitones, (STANDARD_UKULELE_TUNING[0]?.open_midi ?? 67) % 12)
}

export function createUkuleleViewModel(scale_instance: ScaleInstance, generation_id: number, fret_count = 12, tuning = STANDARD_UKULELE_TUNING): StringedInstrumentViewModel {
  return createStringedInstrumentViewModel(scale_instance, generation_id, fret_count, tuning)
}
