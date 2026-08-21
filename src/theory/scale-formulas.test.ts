import { describe, expect, it } from 'vitest'
import { createScaleInstance } from './scale-instance'
import { getScaleStepSemitones, SCALE_FORMULAS, type FormulaId } from './scale-formulas'

describe('exotic scale formulas', () => {
  it('given_exotic_formula_when_generating_scale_then_uses_the_published_interval_offsets', () => {
    const expected_offsets = {
      phrygian_dominant: [0, 1, 4, 5, 7, 8, 10],
      hungarian_minor: [0, 2, 3, 6, 7, 8, 11],
      byzantine: [0, 1, 4, 5, 7, 8, 11],
      enigmatic: [0, 1, 4, 6, 8, 10],
      prometheus: [0, 2, 4, 6, 10],
      persian: [0, 1, 4, 5, 6, 8, 11],
      egyptian: [0, 2, 5, 7, 10],
      oriental: [0, 1, 4, 5, 6, 9, 10],
      japanese: [0, 2, 5, 7, 8],
      hirajoshi: [0, 2, 3, 7, 8],
      romanian: [0, 2, 3, 6, 7, 9, 10],
      man_gong: [0, 3, 5, 8, 10],
      ritusen: [0, 2, 5, 7, 9],
      dominant_pentatonic: [0, 2, 4, 7, 10],
      voodoo: [0, 3, 5, 7, 9],
      neapolitan_major: [0, 1, 3, 5, 7, 9, 11],
      neapolitan_minor: [0, 1, 3, 5, 7, 8, 11],
      neapolitan_prometheus: [0, 1, 4, 6, 9, 10],
      petrushka: [0, 1, 4, 6, 7, 10],
      harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
      locrian_natural_six: [0, 1, 3, 5, 6, 9, 10],
      ionian_augmented: [0, 2, 4, 5, 8, 9, 11],
      lydian_sharp_two: [0, 3, 4, 6, 7, 9, 11],
      ultralocrian: [0, 1, 3, 4, 6, 8, 9],
      melodic_minor: [0, 2, 3, 5, 7, 9, 11],
      dorian_flat_two: [0, 1, 3, 5, 7, 9, 10],
      lydian_augmented: [0, 2, 4, 6, 8, 9, 11],
      lydian_dominant: [0, 2, 4, 6, 7, 9, 10],
      mixolydian_flat_six: [0, 2, 4, 5, 7, 8, 10],
      aeolian_flat_five: [0, 2, 3, 5, 6, 8, 10],
      altered: [0, 1, 3, 4, 6, 8, 10],
      harmonic_major: [0, 2, 4, 5, 7, 8, 11],
      iwato: [0, 1, 5, 6, 10],
      hon_kumoi: [0, 4, 5, 9, 11],
      kumoi: [0, 1, 5, 7, 8],
      chinese_pentatonic: [0, 4, 6, 7, 11],
      blues: [0, 3, 5, 6, 7, 10],
      major_blues: [0, 2, 3, 4, 7, 9],
      chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      whole_tone: [0, 2, 4, 6, 8, 10],
      diminished: [0, 2, 3, 5, 6, 8, 9, 11],
      augmented: [0, 3, 4, 7, 8, 11],
      hungarian_major: [0, 3, 4, 6, 7, 9, 10],
      kumoi_common: [0, 2, 3, 7, 9],
      insen: [0, 1, 5, 7, 10],
      pelog: [0, 1, 3, 7, 8],
      enigmatic_verdi: [0, 1, 4, 6, 8, 10, 11],
      prometheus_scriabin: [0, 2, 4, 6, 9, 10],
      istrian: [0, 1, 3, 4, 6, 7],
      baake_tritonic: [0, 3, 6],
      far_east: [0, 1, 5, 6, 9, 10],
      slendro: [0, 2, 5, 7, 10]
    }

    Object.entries(expected_offsets).forEach(([formula_id, offsets]) => {
      expect(createScaleInstance(0, formula_id as FormulaId).notes.map((note) => note.semitones)).toEqual(offsets)
    })
  })

  it('given_formula_catalog_when_reading_metadata_then_has_a_category_and_complete_octave_structure', () => {
    SCALE_FORMULAS.forEach((formula) => {
      expect(formula.category).toBeTruthy()
      expect(formula.degree_formula).toHaveLength(formula.degrees.length)
      expect(getScaleStepSemitones(formula).reduce((total, step) => total + step, 0)).toBe(12)
    })
  })

  it('given_user_formula_list_when_reading_matching_scales_then_uses_the_list_degree_formulas', () => {
    const expected_formulas = {
      major: ['1', '2', '3', '4', '5', '6', '7'],
      natural_minor: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
      harmonic_minor: ['1', '2', 'b3', '4', '5', 'b6', '7'],
      melodic_minor: ['1', '2', 'b3', '4', '5', '6', '7'],
      dorian: ['1', '2', 'b3', '4', '5', '6', 'b7'],
      phrygian: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'],
      lydian: ['1', '2', '3', '#4', '5', '6', '7'],
      mixolydian: ['1', '2', '3', '4', '5', '6', 'b7'],
      locrian: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'],
      major_pentatonic: ['1', '2', '3', '5', '6'],
      minor_pentatonic: ['1', 'b3', '4', '5', 'b7'],
      blues: ['1', 'b3', '4', 'b5', '5', 'b7'],
      major_blues: ['1', '2', 'b3', '3', '5', '6'],
      chromatic: ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'],
      whole_tone: ['1', '2', '3', '#4', '#5', 'b7'],
      diminished: ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'],
      augmented: ['1', 'b3', '3', '5', '#5', '7'],
      phrygian_dominant: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
      hungarian_minor: ['1', '2', 'b3', '#4', '5', 'b6', '7'],
      hungarian_major: ['1', '#2', '3', '#4', '5', '6', 'b7'],
      hirajoshi: ['1', '2', 'b3', '5', 'b6'],
      kumoi_common: ['1', '2', 'b3', '5', '6'],
      insen: ['1', 'b2', '4', '5', 'b7'],
      pelog: ['1', 'b2', 'b3', '5', 'b6'],
      persian: ['1', 'b2', '3', '4', 'b5', 'b6', '7'],
      enigmatic_verdi: ['1', 'b2', '3', '#4', '#5', '#6', '7'],
      prometheus_scriabin: ['1', '2', '3', '#4', '6', 'b7']
      ,istrian: ['1', 'b2', 'b3', 'b4', 'b5', '5']
      ,baake_tritonic: ['1', 'b3', 'b5']
      ,far_east: ['1', 'b2', '4', 'b5', '6', 'b7']
      ,slendro: ['1', '2', '4', '5', 'b7']
    }

    Object.entries(expected_formulas).forEach(([formula_id, degree_formula]) => {
      const formula = SCALE_FORMULAS.find((candidate) => candidate.id === formula_id)
      expect(formula?.degree_formula).toEqual(degree_formula)
    })
  })
})
