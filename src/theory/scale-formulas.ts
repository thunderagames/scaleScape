export type FormulaId = string

export type NoteRole = 'tonic' | 'characteristic' | 'chord_tone' | 'color_tone'

export type ScaleCategory = 'fundamental' | 'greek_modes' | 'pentatonic_blues' | 'symmetric' | 'exotic_world' | 'probable_scales'

export const SCALE_CATEGORY_ORDER: readonly ScaleCategory[] = ['fundamental', 'greek_modes', 'pentatonic_blues', 'symmetric', 'exotic_world', 'probable_scales']

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

type ScaleFormulaDefinition = Omit<ScaleFormula, 'category' | 'degree_formula' | 'interval_formula'> & {
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

const diatonic_roles = (characteristic_degree: number): Readonly<Record<number, readonly NoteRole[]>> => ({
  1: ['tonic', 'chord_tone'],
  3: ['chord_tone'],
  5: ['chord_tone'],
  [characteristic_degree]: ['characteristic']
})

const FORMULA_CATEGORIES: Readonly<Record<string, ScaleCategory>> = {
  major: 'fundamental', natural_minor: 'fundamental', harmonic_minor: 'fundamental', melodic_minor: 'fundamental',
  dorian: 'greek_modes', phrygian: 'greek_modes', lydian: 'greek_modes', mixolydian: 'greek_modes', locrian: 'greek_modes',
  major_pentatonic: 'pentatonic_blues', minor_pentatonic: 'pentatonic_blues', blues: 'pentatonic_blues', major_blues: 'pentatonic_blues',
  chromatic: 'symmetric', whole_tone: 'symmetric', diminished: 'symmetric', augmented: 'symmetric',
  phrygian_dominant: 'exotic_world', hungarian_minor: 'exotic_world', hungarian_major: 'exotic_world', byzantine: 'exotic_world', enigmatic: 'exotic_world', prometheus: 'exotic_world', persian: 'exotic_world', oriental: 'exotic_world', romanian: 'exotic_world', egyptian: 'exotic_world', japanese: 'exotic_world', hirajoshi: 'exotic_world', man_gong: 'exotic_world', ritusen: 'exotic_world', dominant_pentatonic: 'exotic_world', voodoo: 'exotic_world', neapolitan_major: 'exotic_world', neapolitan_minor: 'exotic_world', neapolitan_prometheus: 'exotic_world', petrushka: 'exotic_world', locrian_natural_six: 'exotic_world', ionian_augmented: 'exotic_world', lydian_sharp_two: 'exotic_world', ultralocrian: 'exotic_world', dorian_flat_two: 'exotic_world', lydian_augmented: 'exotic_world', lydian_dominant: 'exotic_world', mixolydian_flat_six: 'exotic_world', aeolian_flat_five: 'exotic_world', altered: 'exotic_world', harmonic_major: 'exotic_world', iwato: 'exotic_world', hon_kumoi: 'exotic_world', kumoi: 'exotic_world', kumoi_common: 'exotic_world', chinese_pentatonic: 'exotic_world', insen: 'exotic_world', pelog: 'exotic_world', enigmatic_verdi: 'exotic_world', prometheus_scriabin: 'exotic_world', istrian: 'exotic_world', baake_tritonic: 'exotic_world', far_east: 'exotic_world', slendro: 'exotic_world'
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

const SCALE_FORMULA_DEFINITIONS: readonly ScaleFormulaDefinition[] = [
  { id: 'major', name: 'Major', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 5, 7, 9, 11], characteristic_degrees: [7], degree_roles: diatonic_roles(7) },
  { id: 'natural_minor', name: 'Natural minor', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 5, 7, 8, 10], characteristic_degrees: [6], degree_roles: diatonic_roles(6) },
  { id: 'dorian', name: 'Dorian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 5, 7, 9, 10], characteristic_degrees: [6], degree_roles: diatonic_roles(6) },
  { id: 'phrygian', name: 'Phrygian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 5, 7, 8, 10], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'lydian', name: 'Lydian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 6, 7, 9, 11], characteristic_degrees: [4], degree_roles: diatonic_roles(4) },
  { id: 'mixolydian', name: 'Mixolydian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 5, 7, 9, 10], characteristic_degrees: [7], degree_roles: diatonic_roles(7) },
  { id: 'locrian', name: 'Locrian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 5, 6, 8, 10], characteristic_degrees: [5], degree_roles: { ...diatonic_roles(5), 5: ['characteristic', 'chord_tone'] } },
  { id: 'major_pentatonic', name: 'Major pentatonic', degrees: [1, 2, 3, 5, 6], semitone_offsets: [0, 2, 4, 7, 9], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 3: ['chord_tone'], 5: ['chord_tone'] } },
  { id: 'minor_pentatonic', name: 'Minor pentatonic', degrees: [1, 3, 4, 5, 7], semitone_offsets: [0, 3, 5, 7, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'phrygian_dominant', name: 'Phrygian dominant', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 4, 5, 7, 8, 10], characteristic_degrees: [3], degree_roles: { ...diatonic_roles(3), 3: ['characteristic', 'chord_tone'] } },
  { id: 'hungarian_minor', name: 'Hungarian minor', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 6, 7, 8, 11], characteristic_degrees: [4], degree_roles: diatonic_roles(4) },
  { id: 'byzantine', name: 'Byzantine', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 4, 5, 7, 8, 11], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'enigmatic', name: 'Enigmatic', degrees: [1, 2, 3, 5, 6, 7], degree_formula: ['1', 'b2', '3', '#4', '#5', 'b7'], semitone_offsets: [0, 1, 4, 6, 8, 10], characteristic_degrees: [5], degree_roles: diatonic_roles(5) },
  { id: 'prometheus', name: 'Prometheus', degrees: [1, 2, 3, 5, 7], degree_formula: ['1', '2', '3', '#4', 'b7'], semitone_offsets: [0, 2, 4, 6, 10], characteristic_degrees: [5], degree_roles: diatonic_roles(5) },
  { id: 'persian', name: 'Persian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 4, 5, 6, 8, 11], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'egyptian', name: 'Egyptian', degrees: [1, 2, 4, 5, 7], semitone_offsets: [0, 2, 5, 7, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'oriental', name: 'Oriental', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 4, 5, 6, 9, 10], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'japanese', name: 'Japanese', degrees: [1, 2, 4, 5, 6], semitone_offsets: [0, 2, 5, 7, 8], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'hirajoshi', name: 'Hirajoshi', degrees: [1, 2, 3, 5, 6], semitone_offsets: [0, 2, 3, 7, 8], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 3: ['chord_tone'], 5: ['chord_tone'] } },
  { id: 'romanian', name: 'Romanian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 6, 7, 9, 10], characteristic_degrees: [4], degree_roles: diatonic_roles(4) },
  { id: 'man_gong', name: 'Man Gong', degrees: [1, 3, 4, 6, 7], semitone_offsets: [0, 3, 5, 8, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'] } },
  { id: 'ritusen', name: 'Ritusen', degrees: [1, 2, 4, 5, 6], semitone_offsets: [0, 2, 5, 7, 9], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'dominant_pentatonic', name: 'Dominant pentatonic', degrees: [1, 2, 3, 5, 7], semitone_offsets: [0, 2, 4, 7, 10], characteristic_degrees: [7], degree_roles: diatonic_roles(7) },
  { id: 'voodoo', name: 'Voodoo', degrees: [1, 3, 4, 5, 6], semitone_offsets: [0, 3, 5, 7, 9], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 3: ['chord_tone'], 5: ['chord_tone'] } },
  { id: 'neapolitan_major', name: 'Neapolitan major', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 5, 7, 9, 11], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'neapolitan_minor', name: 'Neapolitan minor', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 5, 7, 8, 11], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'neapolitan_prometheus', name: 'Neapolitan Prometheus', degrees: [1, 2, 3, 5, 6, 7], semitone_offsets: [0, 1, 4, 6, 9, 10], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'petrushka', name: 'Petrushka', degrees: [1, 2, 3, 4, 5, 7], semitone_offsets: [0, 1, 4, 6, 7, 10], characteristic_degrees: [4], degree_roles: diatonic_roles(4) },
  { id: 'harmonic_minor', name: 'Harmonic minor', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 5, 7, 8, 11], characteristic_degrees: [7], degree_roles: diatonic_roles(7) },
  { id: 'locrian_natural_six', name: 'Locrian natural 6', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 5, 6, 9, 10], characteristic_degrees: [6], degree_roles: diatonic_roles(6) },
  { id: 'ionian_augmented', name: 'Ionian augmented', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 5, 8, 9, 11], characteristic_degrees: [5], degree_roles: diatonic_roles(5) },
  { id: 'lydian_sharp_two', name: 'Lydian #2', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 3, 4, 6, 7, 9, 11], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'ultralocrian', name: 'Ultralocrian', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 4, 6, 8, 9], characteristic_degrees: [7], degree_roles: diatonic_roles(7) },
  { id: 'melodic_minor', name: 'Melodic minor', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 5, 7, 9, 11], characteristic_degrees: [6], degree_roles: diatonic_roles(6) },
  { id: 'dorian_flat_two', name: 'Dorian b2', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 5, 7, 9, 10], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'lydian_augmented', name: 'Lydian augmented', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 6, 8, 9, 11], characteristic_degrees: [5], degree_roles: diatonic_roles(5) },
  { id: 'lydian_dominant', name: 'Lydian dominant', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 6, 7, 9, 10], characteristic_degrees: [7], degree_roles: diatonic_roles(7) },
  { id: 'mixolydian_flat_six', name: 'Mixolydian b6', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 5, 7, 8, 10], characteristic_degrees: [6], degree_roles: diatonic_roles(6) },
  { id: 'aeolian_flat_five', name: 'Aeolian b5', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 3, 5, 6, 8, 10], characteristic_degrees: [5], degree_roles: { ...diatonic_roles(5), 5: ['characteristic', 'chord_tone'] } },
  { id: 'altered', name: 'Altered', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 1, 3, 4, 6, 8, 10], characteristic_degrees: [2], degree_roles: diatonic_roles(2) },
  { id: 'harmonic_major', name: 'Harmonic major', degrees: [1, 2, 3, 4, 5, 6, 7], semitone_offsets: [0, 2, 4, 5, 7, 8, 11], characteristic_degrees: [6], degree_roles: diatonic_roles(6) },
  { id: 'iwato', name: 'Iwato', degrees: [1, 2, 4, 5, 7], semitone_offsets: [0, 1, 5, 6, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'hon_kumoi', name: 'Hon Kumoi Shiouzhi', degrees: [1, 3, 4, 6, 7], semitone_offsets: [0, 4, 5, 9, 11], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 3: ['chord_tone'] } },
  { id: 'kumoi', name: 'Kumoi', degrees: [1, 2, 4, 5, 6], semitone_offsets: [0, 1, 5, 7, 8], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'chinese_pentatonic', name: 'Chinese pentatonic', degrees: [1, 3, 4, 5, 7], semitone_offsets: [0, 4, 6, 7, 11], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 3: ['chord_tone'], 5: ['chord_tone'] } },
  { id: 'blues', name: 'Blues', degrees: [1, 3, 4, 5, 5, 7], degree_formula: ['1', 'b3', '4', 'b5', '5', 'b7'], semitone_offsets: [0, 3, 5, 6, 7, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'] } },
  { id: 'major_blues', name: 'Major blues', degrees: [1, 2, 3, 3, 5, 6], degree_formula: ['1', '2', 'b3', '3', '5', '6'], semitone_offsets: [0, 2, 3, 4, 7, 9], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'chromatic', name: 'Chromatic', degrees: [1, 2, 2, 3, 3, 4, 4, 5, 6, 6, 7, 7], degree_formula: ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'], semitone_offsets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'] } },
  { id: 'whole_tone', name: 'Whole tone', degrees: [1, 2, 3, 4, 5, 7], degree_formula: ['1', '2', '3', '#4', '#5', 'b7'], semitone_offsets: [0, 2, 4, 6, 8, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'] } },
  { id: 'diminished', name: 'Diminished', degrees: [1, 2, 3, 4, 5, 6, 6, 7], degree_formula: ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'], semitone_offsets: [0, 2, 3, 5, 6, 8, 9, 11], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'augmented', name: 'Augmented', degrees: [1, 3, 3, 5, 5, 7], degree_formula: ['1', 'b3', '3', '5', '#5', '7'], semitone_offsets: [0, 3, 4, 7, 8, 11], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'hungarian_major', name: 'Hungarian major', degrees: [1, 2, 3, 4, 5, 6, 7], degree_formula: ['1', '#2', '3', '#4', '5', '6', 'b7'], semitone_offsets: [0, 3, 4, 6, 7, 9, 10], characteristic_degrees: [2, 4], degree_roles: diatonic_roles(4) },
  { id: 'kumoi_common', name: 'Kumoi (common)', degrees: [1, 2, 3, 5, 6], degree_formula: ['1', '2', 'b3', '5', '6'], semitone_offsets: [0, 2, 3, 7, 9], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 3: ['chord_tone'], 5: ['chord_tone'] } },
  { id: 'insen', name: 'Insen', degrees: [1, 2, 4, 5, 7], degree_formula: ['1', 'b2', '4', '5', 'b7'], semitone_offsets: [0, 1, 5, 7, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'pelog', name: 'Pelog', degrees: [1, 2, 3, 5, 6], degree_formula: ['1', 'b2', 'b3', '5', 'b6'], semitone_offsets: [0, 1, 3, 7, 8], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'], 5: ['chord_tone'] } },
  { id: 'enigmatic_verdi', name: 'Enigmatic (Verdi)', degrees: [1, 2, 3, 4, 5, 6, 7], degree_formula: ['1', 'b2', '3', '#4', '#5', '#6', '7'], semitone_offsets: [0, 1, 4, 6, 8, 10, 11], characteristic_degrees: [2, 4, 5, 6], degree_roles: diatonic_roles(4) },
  { id: 'prometheus_scriabin', name: 'Prometheus (Scriabin)', degrees: [1, 2, 3, 4, 6, 7], degree_formula: ['1', '2', '3', '#4', '6', 'b7'], semitone_offsets: [0, 2, 4, 6, 9, 10], characteristic_degrees: [4], degree_roles: diatonic_roles(4) },
  { id: 'istrian', name: 'Istrian (12-TET approximation)', degrees: [1, 2, 3, 4, 5, 5], degree_formula: ['1', 'b2', 'b3', 'b4', 'b5', '5'], semitone_offsets: [0, 1, 3, 4, 6, 7], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'] } },
  { id: 'baake_tritonic', name: "Baake's tritonic", degrees: [1, 3, 5], degree_formula: ['1', 'b3', 'b5'], interval_formula: ['TS', 'TS', '3T'], semitone_offsets: [0, 3, 6], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'] } },
  { id: 'far_east', name: 'Far East', degrees: [1, 2, 4, 5, 6, 7], degree_formula: ['1', 'b2', '4', 'b5', '6', 'b7'], semitone_offsets: [0, 1, 5, 6, 9, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'] } },
  { id: 'slendro', name: 'Slendro (approx.)', degrees: [1, 2, 4, 5, 7], degree_formula: ['1', '2', '4', '5', 'b7'], interval_formula: ['~240 cents', '~240 cents', '~240 cents', '~240 cents', '~240 cents'], semitone_offsets: [0, 2, 5, 7, 10], characteristic_degrees: [], degree_roles: { 1: ['tonic', 'chord_tone'] } }
]

const PROBABLE_HEPTATONIC_DEFINITIONS = buildProbableHeptatonicDefinitions(SCALE_FORMULA_DEFINITIONS)
const ALL_SCALE_FORMULA_DEFINITIONS = [...SCALE_FORMULA_DEFINITIONS, ...PROBABLE_HEPTATONIC_DEFINITIONS]

export const SCALE_FORMULAS: readonly ScaleFormula[] = ALL_SCALE_FORMULA_DEFINITIONS.map((formula) => ({
  ...formula,
  category: FORMULA_CATEGORIES[formula.id] ?? 'probable_scales',
  degree_formula: createDegreeFormula(formula),
  interval_formula: createIntervalFormula(formula)
}))

export function getFormula(formula_id: FormulaId): ScaleFormula {
  const formula = SCALE_FORMULAS.find((candidate) => candidate.id === formula_id)
  if (!formula) {
    throw new Error(`Unknown formula: ${formula_id}`)
  }
  return formula
}
