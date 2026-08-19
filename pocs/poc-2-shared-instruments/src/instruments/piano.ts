import type { ScaleInstance } from '../../../poc-0-theory-audio/src/theory/scale-instance'

export interface PianoKey {
  readonly midi: number
  readonly pitch_class: number
  readonly octave: number
  readonly note_name: string
  readonly is_natural: boolean
  readonly key_index: number
  readonly is_scale_note: boolean
  readonly is_root: boolean
  readonly degree: number | null
  readonly primary_role: string | null
}

export interface PianoViewModel {
  readonly generation_id: number
  readonly first_midi: number
  readonly last_midi: number
  readonly keys: readonly PianoKey[]
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function create_piano_view_model(scale_instance: ScaleInstance, generation_id: number): PianoViewModel {
  const first_midi = 48
  const last_midi = 72
  const scale_notes_by_pitch_class = new Map(scale_instance.notes.map((note) => [note.pitch_class, note]))
  const keys = Array.from({ length: last_midi - first_midi + 1 }, (_, index) => {
    const midi = first_midi + index
    const pitch_class = midi % 12
    const scale_note = scale_notes_by_pitch_class.get(pitch_class)
    const is_natural = ![1, 3, 6, 8, 10].includes(pitch_class)
    const key_index = is_natural
      ? Array.from({ length: index + 1 }, (_, key_offset) => (first_midi + key_offset) % 12).filter((key_pitch_class) => ![1, 3, 6, 8, 10].includes(key_pitch_class)).length - 1
      : Array.from({ length: index }, (_, key_offset) => (first_midi + key_offset) % 12).filter((key_pitch_class) => ![1, 3, 6, 8, 10].includes(key_pitch_class)).length

    return {
      midi,
      pitch_class,
      octave: Math.floor(midi / 12) - 1,
      note_name: scale_note?.spelling.text ?? NOTE_NAMES[pitch_class] ?? 'Unknown',
      is_natural,
      key_index,
      is_scale_note: scale_note !== undefined,
      is_root: pitch_class === scale_instance.root_pitch_class,
      degree: scale_note?.degree ?? null,
      primary_role: scale_note?.primary_role ?? null
    }
  })

  return { generation_id, first_midi, last_midi, keys }
}
