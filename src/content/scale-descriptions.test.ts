import { describe, expect, it } from 'vitest'
import { SCALE_FORMULAS } from '../theory/scale-formulas'
import { getScaleDescription } from './scale-descriptions'

describe('scale descriptions', () => {
  it('given_named_scale_catalog_when_reading_descriptions_then_covers_every_non_probable_formula_in_both_languages', () => {
    const named_formulas = SCALE_FORMULAS.filter((formula) => formula.category !== 'probable_scales')

    named_formulas.forEach((formula) => {
      expect(getScaleDescription(formula.id, 'en')?.history, formula.id).toBeTruthy()
      expect(getScaleDescription(formula.id, 'en')?.usage, formula.id).toBeTruthy()
      expect(getScaleDescription(formula.id, 'es')?.history, formula.id).toBeTruthy()
      expect(getScaleDescription(formula.id, 'es')?.usage, formula.id).toBeTruthy()
    })
  })

  it('given_probable_scale_when_reading_description_then_returns_no_editorial_content', () => {
    expect(getScaleDescription('probable_heptatonic_001', 'en')).toBeUndefined()
    expect(getScaleDescription('probable_heptatonic_001', 'es')).toBeUndefined()
  })
})
