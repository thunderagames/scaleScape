export type FormulaId = string

export type NoteRole = 'tonic' | 'characteristic' | 'chord_tone' | 'color_tone'

export type ScaleCategory = string

export const PROBABLE_SCALES_CATEGORY: ScaleCategory = 'probable_scales'

export interface ScaleFormula {
  readonly id: FormulaId
  readonly name: string
  readonly category: ScaleCategory
  readonly degrees: readonly number[]
  readonly degree_formula: readonly string[]
  readonly interval_formula: readonly string[]
  readonly semitone_offsets: readonly number[]
  readonly characteristic_degrees: readonly number[]
  readonly degree_roles: Readonly<Record<number, readonly NoteRole[]>>
}

export type ScaleFormulaDefinition = Omit<ScaleFormula, 'degree_formula' | 'interval_formula'> & {
  readonly degree_formula?: readonly string[]
  readonly interval_formula?: readonly string[]
}

export function getStepSemitones(formula: ScaleFormula): readonly number[] {
  return formula.semitone_offsets.slice(1).map((offset, index) => offset - (formula.semitone_offsets[index] ?? 0))
}

export function getScaleStepSemitones(formula: ScaleFormula): readonly number[] {
  const last_offset = formula.semitone_offsets[formula.semitone_offsets.length - 1] ?? 0
  return [...getStepSemitones(formula), 12 - last_offset]
}

function toSignature(semitone_offsets: readonly number[]): string {
  return semitone_offsets.join('-')
}

function getUniqueSortedOffsets(semitone_offsets: readonly number[]): readonly number[] {
  return [...new Set(semitone_offsets)].sort((left, right) => left - right)
}

function isHeptatonicUniqueScale(semitone_offsets: readonly number[]): boolean {
  const unique_offsets = getUniqueSortedOffsets(semitone_offsets)
  return unique_offsets.length === 7 && unique_offsets[0] === 0
}

function buildHeptatonicCombinations(): readonly (readonly number[])[] {
  const combinations: number[][] = []
  const current = [0]

  function pickNext(start: number): void {
    if (current.length === 7) {
      combinations.push([...current])
      return
    }
    for (let next = start; next <= 11; next += 1) {
      current.push(next)
      pickNext(next + 1)
      current.pop()
    }
  }

  pickNext(1)
  return combinations
}

function buildProbableHeptatonicDefinitions(existing_definitions: readonly ScaleFormulaDefinition[]): readonly ScaleFormulaDefinition[] {
  const existing_heptatonic_signatures = new Set(
    existing_definitions
      .map((formula) => getUniqueSortedOffsets(formula.semitone_offsets))
      .filter(isHeptatonicUniqueScale)
      .map(toSignature)
  )

  const missing_heptatonic_sets = buildHeptatonicCombinations().filter((offsets) => !existing_heptatonic_signatures.has(toSignature(offsets)))

  return missing_heptatonic_sets.map((semitone_offsets, index) => ({
    id: `probable_heptatonic_${String(index + 1).padStart(3, '0')}`,
    name: `Probable heptatonic ${String(index + 1).padStart(3, '0')}`,
    degrees: [1, 2, 3, 4, 5, 6, 7],
    semitone_offsets,
    category: PROBABLE_SCALES_CATEGORY,
    characteristic_degrees: [],
    degree_roles: { 1: ['tonic', 'chord_tone'] }
  }))
}

const NATURAL_DEGREE_OFFSETS: Readonly<Record<number, number>> = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11 }

function createDegreeFormula(formula: ScaleFormulaDefinition): readonly string[] {
  return formula.degree_formula ?? formula.degrees.map((degree, index) => {
    const natural_offset = NATURAL_DEGREE_OFFSETS[degree]
    const offset = formula.semitone_offsets[index] ?? natural_offset ?? 0
    if (natural_offset === undefined || offset === natural_offset) return String(degree)
    const accidental_offset = offset - natural_offset
    const accidental = accidental_offset > 0 ? '#'.repeat(accidental_offset) : 'b'.repeat(Math.abs(accidental_offset))
    return `${accidental}${degree}`
  })
}

function formatIntervalFormula(semitones: number): string {
  if (semitones === 1) return 'S'
  if (semitones === 2) return 'T'
  if (semitones === 3) return 'TS'
  if (semitones === 4) return '2T'
  if (semitones === 5) return '2T + S'
  if (semitones === 6) return '3T'
  return `${semitones / 2}T`
}

function createIntervalFormula(formula: ScaleFormulaDefinition): readonly string[] {
  if (formula.interval_formula) return formula.interval_formula
  const last_offset = formula.semitone_offsets[formula.semitone_offsets.length - 1] ?? 0
  const steps = [...formula.semitone_offsets.slice(1).map((offset, index) => offset - (formula.semitone_offsets[index] ?? 0)), 12 - last_offset]
  return steps.map(formatIntervalFormula)
}

let scale_formulas: readonly ScaleFormula[] = []
let scale_category_order: readonly ScaleCategory[] = []

export function installScaleFormulas(definitions: readonly ScaleFormulaDefinition[], category_order: readonly ScaleCategory[]): void {
  const all_definitions = [...definitions, ...buildProbableHeptatonicDefinitions(definitions)]
  scale_formulas = all_definitions.map((formula) => ({
    ...formula,
    degree_formula: createDegreeFormula(formula),
    interval_formula: createIntervalFormula(formula)
  }))
  scale_category_order = category_order.includes(PROBABLE_SCALES_CATEGORY) ? [...category_order] : [...category_order, PROBABLE_SCALES_CATEGORY]
}

export function getScaleFormulas(): readonly ScaleFormula[] {
  return scale_formulas
}

export function getScaleCategoryOrder(): readonly ScaleCategory[] {
  return scale_category_order
}

const PREFERRED_DEFAULT_FORMULA_ID: FormulaId = 'dorian'

export function getDefaultFormulaId(): FormulaId {
  return scale_formulas.some((formula) => formula.id === PREFERRED_DEFAULT_FORMULA_ID)
    ? PREFERRED_DEFAULT_FORMULA_ID
    : scale_formulas[0]?.id ?? PREFERRED_DEFAULT_FORMULA_ID
}

export function getFormula(formula_id: FormulaId): ScaleFormula {
  const formula = scale_formulas.find((candidate) => candidate.id === formula_id)
  if (!formula) {
    throw new Error(`Unknown formula: ${formula_id}`)
  }
  return formula
}
