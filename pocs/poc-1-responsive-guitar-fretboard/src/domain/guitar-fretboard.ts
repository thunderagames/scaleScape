export type PitchClass = number

export interface TunedString {
  readonly name: string
  readonly open_midi: number
}

export interface GuitarNote {
  readonly string_index: number
  readonly string_name: string
  readonly fret: number
  readonly pitch_class: PitchClass
  readonly octave: number
  readonly midi: number
  readonly note_name: string
  readonly frequency: number
  readonly is_open: boolean
  readonly is_scale_note: boolean
  readonly is_root: boolean
}

export interface FretboardString {
  readonly tuning: TunedString
  readonly notes: readonly GuitarNote[]
}

export interface FretboardModel {
  readonly fret_count: number
  readonly scale_pitch_classes: readonly PitchClass[]
  readonly root_pitch_class: PitchClass
  readonly strings: readonly FretboardString[]
}

export interface FretboardOptions {
  readonly fret_count?: number
  readonly root_pitch_class?: PitchClass
  readonly scale_pitch_classes?: readonly PitchClass[]
  readonly tuning?: readonly TunedString[]
}

export const STANDARD_TUNING: readonly TunedString[] = [
  { name: 'Low E', open_midi: 40 },
  { name: 'A', open_midi: 45 },
  { name: 'D', open_midi: 50 },
  { name: 'G', open_midi: 55 },
  { name: 'B', open_midi: 59 },
  { name: 'High E', open_midi: 64 }
]

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function normalize_pitch_class(pitch_class: number): PitchClass {
  return ((pitch_class % 12) + 12) % 12
}

function get_note_name(pitch_class: PitchClass): string {
  return NOTE_NAMES[pitch_class] ?? 'Unknown'
}

function get_frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function create_fretboard_model(options: FretboardOptions = {}): FretboardModel {
  const fret_count = options.fret_count ?? 12
  const root_pitch_class = normalize_pitch_class(options.root_pitch_class ?? 4)
  const scale_pitch_classes = [...new Set((options.scale_pitch_classes ?? [0, 2, 4, 5, 7, 9, 11]).map(normalize_pitch_class))]
  const tuning = options.tuning ?? STANDARD_TUNING

  if (fret_count < 0 || !Number.isInteger(fret_count)) {
    throw new Error('fret_count must be a non-negative integer')
  }

  const strings = tuning.map((tuned_string, string_index) => {
    const notes = Array.from({ length: fret_count + 1 }, (_, fret) => {
      const midi = tuned_string.open_midi + fret
      const pitch_class = normalize_pitch_class(midi)

      return {
        string_index,
        string_name: tuned_string.name,
        fret,
        pitch_class,
        octave: Math.floor(midi / 12) - 1,
        midi,
        note_name: get_note_name(pitch_class),
        frequency: get_frequency(midi),
        is_open: fret === 0,
        is_scale_note: scale_pitch_classes.includes(pitch_class),
        is_root: pitch_class === root_pitch_class
      }
    })

    return { tuning: tuned_string, notes }
  })

  return {
    fret_count,
    root_pitch_class,
    scale_pitch_classes,
    strings
  }
}
