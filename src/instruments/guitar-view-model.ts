import type { ScaleInstance } from '../theory/scale-instance'
import type { NoteRole } from '../theory/scale-formulas'
import type { ProgressionRole } from '../theory/progression-harmony'

export interface StringedInstrumentString {
  readonly name: string
  readonly open_midi: number
}

export interface StringedInstrumentPosition {
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
  readonly progression_role: ProgressionRole | null
}

export interface StringedInstrumentViewModel {
  readonly generation_id: number
  readonly start_fret: number
  readonly fret_count: number
  readonly strings: readonly { readonly tuning: StringedInstrumentString; readonly positions: readonly StringedInstrumentPosition[] }[]
}

export type GuitarString = StringedInstrumentString
export type GuitarPosition = StringedInstrumentPosition
export type GuitarViewModel = StringedInstrumentViewModel

const TUNING_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export interface StringedInstrumentMappingOptions {
  readonly start_fret?: number
  readonly visible_pitch_classes?: ReadonlySet<number>
  readonly progression_roles?: ReadonlyMap<number, ProgressionRole>
  readonly chord_positions?: ReadonlyMap<number, number>
}

function normalize_pitch_class(pitch_class: number): number {
  return ((pitch_class % 12) + 12) % 12
}

export function getTuningNote(semitones: number, reference_pitch_class = 4): string {
  return TUNING_NOTE_NAMES[normalize_pitch_class(reference_pitch_class + semitones)] ?? 'E'
}

export function getGuitarTuningNote(semitones: number): string {
  return getTuningNote(semitones)
}

export function shiftTuning(tuning: readonly StringedInstrumentString[], semitones: number): readonly StringedInstrumentString[] {
  return tuning.map((tuned_string) => {
    const open_midi = tuned_string.open_midi + semitones
    const prefix = tuned_string.name.startsWith('Low ') ? 'Low ' : tuned_string.name.startsWith('High ') ? 'High ' : ''
    return { ...tuned_string, name: `${prefix}${TUNING_NOTE_NAMES[normalize_pitch_class(open_midi)] ?? tuned_string.name}`, open_midi }
  })
}

export const STANDARD_TUNING: readonly GuitarString[] = [
  { name: 'Low E', open_midi: 40 },
  { name: 'A', open_midi: 45 },
  { name: 'D', open_midi: 50 },
  { name: 'G', open_midi: 55 },
  { name: 'B', open_midi: 59 },
  { name: 'High E', open_midi: 64 }
]

export function createStringedInstrumentViewModel(scale_instance: ScaleInstance, generation_id: number, fret_count = 12, tuning: readonly StringedInstrumentString[] = STANDARD_TUNING, options: StringedInstrumentMappingOptions = {}): StringedInstrumentViewModel {
  const scale_notes = new Map(scale_instance.notes.map((note) => [note.pitch_class, note]))
  const start_fret = Math.max(0, options.start_fret ?? 0)
  const strings = tuning.map((tuned_string, string_index) => ({
    tuning: tuned_string,
    positions: Array.from({ length: fret_count + 1 }, (_, index) => {
      const fret = start_fret + index
      const midi = tuned_string.open_midi + fret
      const pitch_class = midi % 12
      const scale_note = scale_notes.get(pitch_class)
      const is_marked_position = !options.chord_positions || options.chord_positions.get(string_index) === fret
      const is_visible = scale_note !== undefined && (!options.visible_pitch_classes || options.visible_pitch_classes.has(pitch_class)) && is_marked_position
      return {
        string_index,
        string_name: tuned_string.name,
        fret,
        midi,
        pitch_class,
        octave: Math.floor(midi / 12) - 1,
        label: is_visible ? scale_note?.spelling.text ?? NOTE_NAMES[pitch_class] ?? 'Unknown' : NOTE_NAMES[pitch_class] ?? 'Unknown',
        is_scale_note: is_visible,
        is_root: pitch_class === scale_instance.root_pitch_class,
        degree: scale_note?.degree ?? null,
        primary_role: scale_note?.primary_role ?? null,
        progression_role: scale_note ? options.progression_roles?.get(pitch_class) ?? null : null
      }
    })
  }))

  return { generation_id, start_fret, fret_count, strings }
}

export function createGuitarViewModel(scale_instance: ScaleInstance, generation_id: number, fret_count = 12, tuning: readonly GuitarString[] = STANDARD_TUNING, options: StringedInstrumentMappingOptions = {}): GuitarViewModel {
  return createStringedInstrumentViewModel(scale_instance, generation_id, fret_count, tuning, options)
}

export function findFretWindowStart(tuning: readonly StringedInstrumentString[], pitch_classes: ReadonlySet<number>, fret_count = 4, max_start_fret = 12): number {
  for (let start_fret = 0; start_fret <= max_start_fret; start_fret += 1) {
    const visible_pitch_classes = new Set(tuning.flatMap((tuned_string) => Array.from({ length: fret_count + 1 }, (_, offset) => (tuned_string.open_midi + start_fret + offset) % 12)))
    if ([...pitch_classes].every((pitch_class) => visible_pitch_classes.has(pitch_class))) return start_fret
  }
  return 0
}

interface ChordPositionCandidate {
  readonly string_index: number
  readonly fret: number
  readonly pitch_class: number
  readonly midi: number
}

interface ChordPositionSelection {
  readonly candidates: readonly ChordPositionCandidate[]
  readonly coverage: number
  readonly root_is_lowest: boolean
  readonly span: number
  readonly fret_total: number
}

function is_better_chord_position_selection(candidate: ChordPositionSelection, current: ChordPositionSelection | undefined): boolean {
  if (!current) return true
  if (candidate.coverage !== current.coverage) return candidate.coverage > current.coverage
  if (candidate.root_is_lowest !== current.root_is_lowest) return candidate.root_is_lowest
  if (candidate.candidates.length !== current.candidates.length) return candidate.candidates.length > current.candidates.length
  if (candidate.span !== current.span) return candidate.span < current.span
  if (candidate.fret_total !== current.fret_total) return candidate.fret_total < current.fret_total
  return candidate.candidates.map((item) => item.fret).join(',') < current.candidates.map((item) => item.fret).join(',')
}

export function findChordPositions(tuning: readonly StringedInstrumentString[], pitch_classes: ReadonlySet<number>, start_fret: number, fret_count = 4, root_pitch_class?: number): ReadonlyMap<number, number> {
  const candidates_by_string = tuning.map((tuned_string, string_index) => Array.from({ length: fret_count + 1 }, (_, offset) => {
    const fret = start_fret + offset
    const midi = tuned_string.open_midi + fret
    return { string_index, fret, pitch_class: midi % 12, midi }
  }).filter((candidate) => pitch_classes.has(candidate.pitch_class)))
  let best: ChordPositionSelection | undefined

  function evaluate(candidates: readonly ChordPositionCandidate[]): void {
    if (candidates.length === 0) return
    const covered_pitch_classes = new Set(candidates.map((candidate) => candidate.pitch_class))
    const lowest_candidate = candidates.reduce((lowest, candidate) => candidate.midi < lowest.midi ? candidate : lowest)
    const frets = candidates.map((candidate) => candidate.fret)
    const selection: ChordPositionSelection = {
      candidates,
      coverage: covered_pitch_classes.size,
      root_is_lowest: root_pitch_class !== undefined && lowest_candidate.pitch_class === root_pitch_class,
      span: Math.max(...frets) - Math.min(...frets),
      fret_total: frets.reduce((total, fret) => total + fret, 0)
    }
    if (is_better_chord_position_selection(selection, best)) best = selection
  }

  function visit(string_index: number, selected: readonly ChordPositionCandidate[]): void {
    if (string_index === candidates_by_string.length) {
      evaluate(selected)
      return
    }
    visit(string_index + 1, selected)
    candidates_by_string[string_index]?.forEach((candidate) => visit(string_index + 1, [...selected, candidate]))
  }

  visit(0, [])
  return new Map(best?.candidates.map((candidate) => [candidate.string_index, candidate.fret]) ?? [])
}
