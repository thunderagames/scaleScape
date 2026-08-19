import { getFormula, type FormulaId, type NoteRole, type ScaleFormula } from './scale-formulas'

export interface NoteSpelling {
  readonly letter: string
  readonly accidental: string
  readonly text: string
}

export interface ScaleNote {
  readonly pitch_class: number
  readonly degree: number
  readonly semitones: number
  readonly label: string
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
const NATURAL_PITCH_CLASSES: Readonly<Record<string, number>> = { A: 9, B: 11, C: 0, D: 2, E: 4, F: 5, G: 7 }
const ROOT_LABELS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

function normalizePitchClass(pitch_class: number): number {
  return ((pitch_class % 12) + 12) % 12
}

function createSpelling(letter: string, accidental_offset: number): NoteSpelling {
  const accidental = accidental_offset > 0 ? '#'.repeat(accidental_offset) : accidental_offset < 0 ? 'b'.repeat(Math.abs(accidental_offset)) : ''
  return { letter, accidental, text: `${letter}${accidental}` }
}

function createRootSpelling(root_pitch_class: number): NoteSpelling {
  const text = ROOT_LABELS[root_pitch_class] ?? 'C'
  return { letter: text[0] ?? 'C', accidental: text.slice(1), text }
}

function calculateSpelling(root_spelling: NoteSpelling, degree: number, pitch_class: number): NoteSpelling {
  const root_letter_index = LETTERS.indexOf(root_spelling.letter)
  const letter = LETTERS[(root_letter_index + degree - 1) % LETTERS.length] ?? 'C'
  let accidental_offset = normalizePitchClass(pitch_class) - (NATURAL_PITCH_CLASSES[letter] ?? 0)
  if (accidental_offset > 6) accidental_offset -= 12
  if (accidental_offset < -6) accidental_offset += 12
  return createSpelling(letter, accidental_offset)
}

function getPrimaryRole(roles: readonly NoteRole[]): NoteRole {
  return (['tonic', 'characteristic', 'chord_tone', 'color_tone'] as const).find((role) => roles.includes(role)) ?? 'color_tone'
}

export function createScaleInstance(root_pitch_class: number, formula_id: FormulaId): ScaleInstance {
  const normalized_root = normalizePitchClass(root_pitch_class)
  const formula = getFormula(formula_id)
  const root_spelling = createRootSpelling(normalized_root)
  const notes = formula.degrees.map((degree, index) => {
    const semitones = formula.semitone_offsets[index] ?? 0
    const pitch_class = normalizePitchClass(normalized_root + semitones)
    const spelling = calculateSpelling(root_spelling, degree, pitch_class)
    const roles = formula.degree_roles[degree] ?? ['color_tone']
    return { pitch_class, degree, semitones, label: spelling.text, spelling, roles, primary_role: getPrimaryRole(roles) }
  })
  return { root_pitch_class: normalized_root, root_spelling, formula, notes }
}
