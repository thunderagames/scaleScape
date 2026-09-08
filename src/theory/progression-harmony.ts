import type { ScaleInstance, ScaleNote } from './scale-instance'

export type ProgressionRole = 'chord_tonic' | 'chord_tone' | 'nonchord'

export interface DegreeTriad {
  readonly degree: number
  readonly notes: readonly [ScaleNote, ScaleNote, ScaleNote]
  readonly quality: 'major' | 'minor' | 'diminished' | 'augmented'
  readonly symbol: '' | 'm' | '°' | '+'
  readonly name: string
}

export interface IncompleteDegreeTriad {
  readonly degree: number
  readonly missing_degrees: readonly number[]
}

export type DegreeTriadResult =
  | { readonly ok: true; readonly value: DegreeTriad }
  | { readonly ok: false; readonly error: IncompleteDegreeTriad }

export interface ProgressionNote {
  readonly note: ScaleNote
  readonly role: ProgressionRole
}

const ROMAN_DEGREES: Readonly<Record<number, string>> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII'
}

function normalize_pitch_class(pitch_class: number): number {
  return ((pitch_class % 12) + 12) % 12
}

function interval_between(lower_pitch_class: number, upper_pitch_class: number): number {
  return normalize_pitch_class(upper_pitch_class - lower_pitch_class)
}

function is_complete_heptatonic_scale(scale_instance: ScaleInstance): boolean {
  if (scale_instance.notes.length !== 7 || scale_instance.formula.category === 'probable_scales') return false
  const degrees = new Set(scale_instance.notes.map((note) => note.degree))
  const pitch_classes = new Set(scale_instance.notes.map((note) => note.pitch_class))
  return degrees.size === 7 && pitch_classes.size === 7 && [1, 2, 3, 4, 5, 6, 7].every((degree) => degrees.has(degree))
}

function get_quality(root: ScaleNote, third: ScaleNote, fifth: ScaleNote): DegreeTriad['quality'] | undefined {
  const third_interval = interval_between(root.pitch_class, third.pitch_class)
  const fifth_interval = interval_between(root.pitch_class, fifth.pitch_class)
  if (third_interval === 4 && fifth_interval === 7) return 'major'
  if (third_interval === 3 && fifth_interval === 7) return 'minor'
  if (third_interval === 3 && fifth_interval === 6) return 'diminished'
  if (third_interval === 4 && fifth_interval === 8) return 'augmented'
  return undefined
}

function get_symbol(quality: DegreeTriad['quality']): DegreeTriad['symbol'] {
  if (quality === 'minor') return 'm'
  if (quality === 'diminished') return '°'
  if (quality === 'augmented') return '+'
  return ''
}

export function getRomanDegree(degree: number): string {
  return ROMAN_DEGREES[degree] ?? String(degree)
}

export function getRomanChordDegree(degree: number, quality: DegreeTriad['quality']): string {
  const roman = getRomanDegree(degree)
  const numeral = quality === 'major' || quality === 'augmented' ? roman : roman.toLowerCase()
  const symbol = quality === 'diminished' ? '°' : quality === 'augmented' ? '+' : ''
  return `${numeral}${symbol}`
}

export function isCompleteHeptatonicScale(scale_instance: ScaleInstance): boolean {
  return is_complete_heptatonic_scale(scale_instance)
}

export function getDegreeTriad(scale_instance: ScaleInstance, degree: number): DegreeTriadResult {
  const scale_notes = new Map(scale_instance.notes.map((note) => [note.degree, note]))
  const triad_degrees = [degree, ((degree - 1 + 2) % 7) + 1, ((degree - 1 + 4) % 7) + 1]
  const notes = triad_degrees.map((triad_degree) => scale_notes.get(triad_degree))
  const missing_degrees = triad_degrees.filter((_, index) => notes[index] === undefined)
  const root = notes[0]
  const third = notes[1]
  const fifth = notes[2]
  if (!root || !third || !fifth || missing_degrees.length > 0) return { ok: false, error: { degree, missing_degrees } }

  const quality = get_quality(root, third, fifth)
  if (!quality) return { ok: false, error: { degree, missing_degrees: triad_degrees } }
  const symbol = get_symbol(quality)
  return { ok: true, value: { degree, notes: [root, third, fifth], quality, symbol, name: `${root.spelling.text}${symbol}` } }
}

export function mapProgressionRoles(scale_instance: ScaleInstance, triad: DegreeTriad): readonly ProgressionNote[] {
  const chord_pitch_classes = new Set(triad.notes.map((note) => note.pitch_class))
  return scale_instance.notes.map((note) => ({ note, role: note.pitch_class === triad.notes[0].pitch_class ? 'chord_tonic' : chord_pitch_classes.has(note.pitch_class) ? 'chord_tone' : 'nonchord' }))
}
