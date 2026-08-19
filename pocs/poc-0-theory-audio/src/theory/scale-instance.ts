import { get_formula, type FormulaId, type NoteRole, type ScaleFormula } from './scale-formulas'

export interface NoteSpelling {
  readonly letter: string
  readonly accidental: string
  readonly text: string
}

export interface Interval {
  readonly semitones: number
  readonly degree: number
  readonly label: string
  readonly quality: 'perfect' | 'major' | 'minor' | 'augmented' | 'diminished'
}

export interface ScaleNote {
  readonly pitch_class: number
  readonly degree: number
  readonly interval: Interval
  readonly spelling: NoteSpelling
  readonly roles: readonly NoteRole[]
  readonly primary_role: NoteRole
}

export interface ScaleInstance {
  readonly root_pitch_class: number
  readonly root_spelling: NoteSpelling
  readonly formula: ScaleFormula
  readonly notes: readonly ScaleNote[]
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const NATURAL_PITCH_CLASSES: Readonly<Record<string, number>> = {
  A: 9,
  B: 11,
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7
}

function normalize_pitch_class(pitch_class: number): number {
  return ((pitch_class % 12) + 12) % 12
}

function get_accidental_text(accidental_offset: number): string {
  if (accidental_offset === 0) {
    return ''
  }

  if (accidental_offset > 0) {
    return '#'.repeat(accidental_offset)
  }

  return 'b'.repeat(Math.abs(accidental_offset))
}

function create_spelling(letter: string, accidental_offset: number): NoteSpelling {
  const accidental = get_accidental_text(accidental_offset)
  return { letter, accidental, text: `${letter}${accidental}` }
}

function create_root_spelling(root_pitch_class: number): NoteSpelling {
  const root_labels = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
  const text = root_labels[root_pitch_class] ?? 'C'
  const letter = text[0] ?? 'C'
  const accidental = text.slice(1)
  return { letter, accidental, text }
}

function calculate_spelling(root_spelling: NoteSpelling, degree: number, pitch_class: number): NoteSpelling {
  const root_letter_index = LETTERS.indexOf(root_spelling.letter)
  const letter = LETTERS[(root_letter_index + degree - 1) % LETTERS.length] ?? 'C'
  const natural_pitch_class = NATURAL_PITCH_CLASSES[letter] ?? 0
  let accidental_offset = normalize_pitch_class(pitch_class) - natural_pitch_class

  if (accidental_offset > 6) {
    accidental_offset -= 12
  }
  if (accidental_offset < -6) {
    accidental_offset += 12
  }

  return create_spelling(letter, accidental_offset)
}

function get_interval_quality(degree: number, semitones: number): Interval['quality'] {
  const perfect_degrees = new Set([1, 4, 5])
  const expected_semitones: Record<number, number> = {
    1: 0,
    2: 2,
    3: 4,
    4: 5,
    5: 7,
    6: 9,
    7: 11
  }
  const expected = expected_semitones[degree] ?? 0
  const difference = semitones - expected

  if (difference === 1) {
    return 'augmented'
  }
  if (difference === -1) {
    return perfect_degrees.has(degree) ? 'diminished' : 'minor'
  }
  if (difference <= -2) {
    return 'diminished'
  }

  return perfect_degrees.has(degree) ? 'perfect' : 'major'
}

function get_interval_label(degree: number, quality: Interval['quality']): string {
  const degree_labels: Record<number, string> = {
    1: 'P1',
    2: 'M2',
    3: 'M3',
    4: 'P4',
    5: 'P5',
    6: 'M6',
    7: 'M7'
  }
  const base_label = degree_labels[degree] ?? `degree ${degree}`

  if (quality === 'major') {
    return base_label
  }
  if (quality === 'minor') {
    return base_label.replace('M', 'm')
  }
  if (quality === 'augmented') {
    return `A${degree}`
  }
  if (quality === 'diminished') {
    return `d${degree}`
  }

  return base_label
}

function get_primary_role(roles: readonly NoteRole[]): NoteRole {
  const precedence: readonly NoteRole[] = ['tonic', 'characteristic', 'chord_tone', 'color_tone']
  return precedence.find((role) => roles.includes(role)) ?? 'color_tone'
}

export function create_scale_instance(root_pitch_class: number, formula_id: FormulaId): ScaleInstance {
  const normalized_root = normalize_pitch_class(root_pitch_class)
  const formula = get_formula(formula_id)
  const root_spelling = create_root_spelling(normalized_root)
  const notes = formula.degrees.map((degree, index) => {
    const semitones = formula.semitone_offsets[index] ?? 0
    const pitch_class = normalize_pitch_class(normalized_root + semitones)
    const quality = get_interval_quality(degree, semitones)
    const roles = formula.degree_roles[degree] ?? ['color_tone']
    const interval = {
      semitones,
      degree,
      quality,
      label: get_interval_label(degree, quality)
    }

    return {
      pitch_class,
      degree,
      interval,
      spelling: calculate_spelling(root_spelling, degree, pitch_class),
      roles,
      primary_role: get_primary_role(roles)
    }
  })

  return { root_pitch_class: normalized_root, root_spelling, formula, notes }
}
