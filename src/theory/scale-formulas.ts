export type FormulaId =
  | 'major'
  | 'natural_minor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'locrian'
  | 'major_pentatonic'

export type NoteRole = 'tonic' | 'characteristic' | 'chord_tone' | 'color_tone'

export interface ScaleFormula {
  readonly id: FormulaId
  readonly name: string
  readonly degrees: readonly number[]
  readonly semitone_offsets: readonly number[]
  readonly characteristic_degrees: readonly number[]
  readonly degree_roles: Readonly<Record<number, readonly NoteRole[]>>
}

export function getStepSemitones(formula: ScaleFormula): readonly number[] {
  return formula.semitone_offsets.slice(1).map((offset, index) => offset - (formula.semitone_offsets[index] ?? 0))
}

const diatonic_roles = (characteristic_degree: number): Readonly<Record<number, readonly NoteRole[]>> => ({
  1: ['tonic', 'chord_tone'],
  3: ['chord_tone'],
  5: ['chord_tone'],
  [characteristic_degree]: ['characteristic']
})

export const SCALE_FORMULAS: readonly ScaleFormula[] = [
  { id: 'major', name: 'Major', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 5, 7, 9, 11], characteristic_degrees: [7], degree_roles: diatonic_roles(7) },
  { id: 'natural_minor', name: 'Natural minor', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 5, 7, 8, 10], characteristic_degrees: [6], degree_roles: diatonic_roles(6) },
  { id: 'dorian', name: 'Dorian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 5, 7, 9, 10], characteristic_degrees: [6], degree_roles: diatonic_roles(6) },
  { id: 'phrygian', name: 'Phrygian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 5, 7, 8, 10], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'lydian', name: 'Lydian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 6, 7, 9, 11], characteristic_degrees: [4], degree_roles: diatonic_roles(4) },
  { id: 'mixolydian', name: 'Mixolydian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 5, 7, 9, 10], characteristic_degrees: [7], degree_roles: diatonic_roles(7) },
  { id: 'locrian', name: 'Locrian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 5, 6, 8, 10], characteristic_degrees: [5], degree_roles: { ...diatonic_roles(5), 5: ['characteristic', 'chord_tone'] } },
  { id: 'major_pentatonic', name: 'Major pentatonic', degrees: [1, 2, 3, 5, 6], semitone_offsets: [0, 2, 4, 7, 9], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 3: ['chord_tone'], 5: ['chord_tone'] } }
]

export function getFormula(formula_id: FormulaId): ScaleFormula {
  const formula = SCALE_FORMULAS.find((candidate) => candidate.id === formula_id)
  if (!formula) {
    throw new Error(`Unknown formula: ${formula_id}`)
  }
  return formula
}
