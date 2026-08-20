import type { ScaleInstance } from '../theory/scale-instance'
import type { NoteRole } from '../theory/scale-formulas'

export interface GuitarString {
  readonly name: string
  readonly open_midi: number
}

export interface GuitarPosition {
  readonly string_index: number
  readonly string_name: string
  readonly fret: number
  readonly midi: number
  readonly pitch_class: number
  readonly octave: number
  readonly label: string
  readonly is_scale_note: boolean
  readonly is_root: boolean
  readonly degree: number | null
  readonly primary_role: NoteRole | null
}

export interface GuitarViewModel {
  readonly generation_id: number
  readonly fret_count: number
  readonly strings: readonly { readonly tuning: GuitarString; readonly positions: readonly GuitarPosition[] }[]
}

export const STANDARD_TUNING: readonly GuitarString[] = [
  { name: 'Low E', open_midi: 40 },
  { name: 'A', open_midi: 45 },
  { name: 'D', open_midi: 50 },
  { name: 'G', open_midi: 55 },
  { name: 'B', open_midi: 59 },
  { name: 'High E', open_midi: 64 }
]

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function createGuitarViewModel(scale_instance: ScaleInstance, generation_id: number, fret_count = 12, tuning = STANDARD_TUNING): GuitarViewModel {
  const scale_notes = new Map(scale_instance.notes.map((note) => [note.pitch_class, note]))
  const strings = tuning.map((tuned_string, string_index) => ({
    tuning: tuned_string,
    positions: Array.from({ length: fret_count + 1 }, (_, fret) => {
      const midi = tuned_string.open_midi + fret
      const pitch_class = midi % 12
      const scale_note = scale_notes.get(pitch_class)
      return {
        string_index,
        string_name: tuned_string.name,
        fret,
        midi,
        pitch_class,
        octave: Math.floor(midi / 12) - 1,
        label: scale_note?.spelling.text ?? NOTE_NAMES[pitch_class] ?? 'Unknown',
        is_scale_note: scale_note !== undefined,
        is_root: pitch_class === scale_instance.root_pitch_class,
        degree: scale_note?.degree ?? null,
        primary_role: scale_note?.primary_role ?? null
      }
    })
  }))

  return { generation_id, fret_count, strings }
}
