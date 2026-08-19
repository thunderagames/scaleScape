import { describe, expect, it } from 'vitest'
import { SCALE_FORMULAS } from './scale-formulas'

describe('SCALE_FORMULAS', () => {
  it('given_the_mvp_catalog_when_reading_formulas_then_contains_eight_ordered_formulas', () => {
    expect(SCALE_FORMULAS.map((formula) => formula.id)).toEqual([
      'major',
      'natural_minor',
      'dorian',
      'phrygian',
      'lydian',
      'mixolydian',
      'locrian',
      'major_pentatonic'
    ])
  })

  it('given_major_pentatonic_when_reading_metadata_then_preserves_its_non_diatonic_degree_sequence', () => {
    const formula = SCALE_FORMULAS.find((candidate) => candidate.id === 'major_pentatonic')

    expect(formula?.degrees).toEqual([1, 2, 3, 5, 6])
    expect(formula?.semitone_offsets).toEqual([0, 2, 4, 7, 9])
  })

  it('given_locrian_when_reading_roles_then_marks_the_diminished_fifth_as_characteristic_and_chord_tone', () => {
    const formula = SCALE_FORMULAS.find((candidate) => candidate.id === 'locrian')

    expect(formula?.degree_roles[5]).toEqual(['characteristic', 'chord_tone'])
  })
})
