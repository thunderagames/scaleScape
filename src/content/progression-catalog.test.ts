import { describe, expect, it } from 'vitest'
import { createScaleInstance } from '../theory/scale-instance'
import { formatProgressionDegrees, getCompatibleProgressions, getUniqueProgressionDegrees, PROGRESSION_CATALOG } from './progression-catalog'

describe('progression catalog', () => {
  it('given_a_heptatonic_scale_when_reading_the_catalog_then_returns_only_complete_first_slice_progressions', () => {
    const compatible = getCompatibleProgressions(createScaleInstance(9, 'natural_minor'))

    expect(compatible).toContainEqual(PROGRESSION_CATALOG.find((item) => item.id === 'rock_user_example'))
    expect(compatible.every((item) => item.degrees.every((degree) => degree >= 1 && degree <= 7))).toBe(true)
  })

  it('given_a_non_heptatonic_scale_when_reading_the_catalog_then_hides_every_item', () => {
    expect(getCompatibleProgressions(createScaleInstance(0, 'major_pentatonic'))).toEqual([])
  })

  it('given_a_repeated_degree_progression_when_reading_unique_degrees_then_preserves_first_seen_order', () => {
    const twelve_bar = PROGRESSION_CATALOG.find((item) => item.id === 'blues_12_bar')

    expect(twelve_bar).toBeDefined()
    expect(getUniqueProgressionDegrees(twelve_bar!)).toEqual([1, 4, 5])
  })

  it('given_c_major_axis_when_formatting_the_progression_then_includes_standard_chord_case', () => {
    const axis = PROGRESSION_CATALOG.find((item) => item.id === 'pop_axis')

    expect(axis).toBeDefined()
    expect(formatProgressionDegrees(createScaleInstance(0, 'major'), axis!)).toBe('I–V–vi–IV')
  })
})
