import type { ScaleInstance } from '../theory/scale-instance'
import type { NoteRole } from '../theory/scale-formulas'
import type { ProgressionRole } from '../theory/progression-harmony'

export interface PianoKey {
  readonly midi: number
  readonly pitch_class: number
  readonly octave: number
  readonly label: string
  readonly is_natural: boolean
  readonly is_scale_note: boolean
  readonly is_root: boolean
  readonly degree: number | null
  readonly primary_role: NoteRole | null
  readonly progression_role: ProgressionRole | null
}

export interface PianoViewModel {
  readonly generation_id: number
  readonly keys: readonly PianoKey[]
}

const ALTERED_PITCH_CLASSES = [1, 3, 6, 8, 10]
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export interface PianoMappingOptions {
  readonly visible_pitch_classes?: ReadonlySet<number>
  readonly progression_roles?: ReadonlyMap<number, ProgressionRole>
}

export function createPianoViewModel(scale_instance: ScaleInstance, generation_id: number, first_midi = 48, last_midi = 72, options: PianoMappingOptions = {}): PianoViewModel {
  const scale_notes = new Map(scale_instance.notes.map((note) => [note.pitch_class, note]))
  const keys = Array.from({ length: last_midi - first_midi + 1 }, (_, index) => {
    const midi = first_midi + index
    const pitch_class = midi % 12
    const scale_note = scale_notes.get(pitch_class)
    const is_visible = scale_note !== undefined && (!options.visible_pitch_classes || options.visible_pitch_classes.has(pitch_class))
    const is_natural = !ALTERED_PITCH_CLASSES.includes(pitch_class)

    return {
      midi,
      pitch_class,
      octave: Math.floor(midi / 12) - 1,
      label: is_visible ? scale_note?.spelling.text ?? NOTE_NAMES[pitch_class] ?? 'Unknown' : NOTE_NAMES[pitch_class] ?? 'Unknown',
      is_natural,
      is_scale_note: is_visible,
      is_root: pitch_class === scale_instance.root_pitch_class,
      degree: scale_note?.degree ?? null,
      primary_role: scale_note?.primary_role ?? null,
      progression_role: scale_note ? options.progression_roles?.get(pitch_class) ?? null : null
    }
  })

  return { generation_id, keys }
}
