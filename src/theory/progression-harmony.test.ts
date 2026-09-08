import { describe, expect, it } from 'vitest'
import { createScaleInstance } from './scale-instance'
import { getDegreeTriad, getRomanChordDegree, getRomanDegree, mapProgressionRoles } from './progression-harmony'

describe('progression harmony theory', () => {
  it('given_a_natural_minor_scale_when_building_degree_triads_then_stacks_in_scale_one_three_five', () => {
    const scale = createScaleInstance(9, 'natural_minor')

    expect(getDegreeTriad(scale, 1)).toMatchObject({ ok: true, value: { name: 'Am' } })
    expect(getDegreeTriad(scale, 4)).toMatchObject({ ok: true, value: { name: 'Dm' } })
    expect(getDegreeTriad(scale, 5)).toMatchObject({ ok: true, value: { name: 'Em' } })
    const tonic = getDegreeTriad(scale, 1)
    if (!tonic.ok) throw new Error('Expected a complete triad')
    expect(tonic.value.notes.map((note) => note.spelling.text)).toEqual(['A', 'C', 'E'])
  })

  it('given_a_non_heptatonic_scale_when_building_a_degree_triad_then_returns_missing_degrees_without_inventing_notes', () => {
    const result = getDegreeTriad(createScaleInstance(0, 'major_pentatonic'), 2)

    expect(result).toEqual({ ok: false, error: { degree: 2, missing_degrees: [4] } })
  })

  it('given_a_diatonic_triad_when_mapping_scale_notes_then_separates_chord_root_other_tones_and_nonchord_notes', () => {
    const scale = createScaleInstance(9, 'natural_minor')
    const triad = getDegreeTriad(scale, 5)

    if (!triad.ok) throw new Error('Expected a complete triad')
    expect(mapProgressionRoles(scale, triad.value).map(({ note, role }) => [note.degree, role])).toEqual([
      [1, 'nonchord'], [2, 'chord_tone'], [3, 'nonchord'], [4, 'nonchord'], [5, 'chord_tonic'], [6, 'nonchord'], [7, 'chord_tone']
    ])
  })

  it('given_supported_degree_numbers_when_formatting_then_uses_standard_roman_labels', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(getRomanDegree)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'])
  })

  it('given_triad_qualities_when_formatting_roman_chord_degrees_then_uses_standard_case_and_symbols', () => {
    expect([
      getRomanChordDegree(1, 'major'),
      getRomanChordDegree(5, 'major'),
      getRomanChordDegree(6, 'minor'),
      getRomanChordDegree(7, 'diminished'),
      getRomanChordDegree(1, 'augmented')
    ]).toEqual(['I', 'V', 'vi', 'vii°', 'I+'])
  })

  it('given_a_locrian_diminished_triad_when_naming_then_uses_the_standard_diminished_symbol', () => {
    const result = getDegreeTriad(createScaleInstance(11, 'locrian'), 1)

    expect(result).toMatchObject({ ok: true, value: { name: 'B°', symbol: '°', quality: 'diminished' } })
  })

  it('given_an_augmented_diatonic_triad_when_naming_then_uses_the_standard_augmented_symbol', () => {
    const result = getDegreeTriad(createScaleInstance(0, 'ionian_augmented'), 1)

    expect(result).toMatchObject({ ok: true, value: { name: 'C+', symbol: '+', quality: 'augmented' } })
  })
})
