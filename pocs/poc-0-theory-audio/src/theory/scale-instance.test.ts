import { describe, expect, it } from 'vitest'
import { SCALE_FORMULAS } from './scale-formulas'
import { create_scale_instance } from './scale-instance'

describe('create_scale_instance', () => {
  it('given_all_mvp_formulas_and_all_roots_when_creating_instances_then_preserves_unique_ordered_scale_notes', () => {
    for (const formula of SCALE_FORMULAS) {
      for (let root_pitch_class = 0; root_pitch_class < 12; root_pitch_class += 1) {
        const scale_instance = create_scale_instance(root_pitch_class, formula.id)
        const pitch_classes = scale_instance.notes.map((note) => note.pitch_class)
        const degrees = scale_instance.notes.map((note) => note.degree)

        expect(new Set(pitch_classes).size).toBe(pitch_classes.length)
        expect(degrees).toEqual([...formula.degrees])
        expect(scale_instance.notes[0]?.pitch_class).toBe(root_pitch_class)
      }
    }
  })

  it('given_e_dorian_when_creating_instance_then_identifies_c_sharp_as_the_major_sixth', () => {
    const scale_instance = create_scale_instance(4, 'dorian')
    const characteristic_note = scale_instance.notes.find((note) => note.degree === 6)

    expect(characteristic_note?.spelling.text).toBe('C#')
    expect(characteristic_note?.interval.label).toBe('M6')
    expect(characteristic_note?.primary_role).toBe('characteristic')
  })

  it('given_db_phrygian_when_creating_instance_then_preserves_the_required_double_flat_spellings', () => {
    const scale_instance = create_scale_instance(1, 'phrygian')

    expect(scale_instance.notes.map((note) => note.spelling.text)).toEqual([
      'Db',
      'Ebb',
      'Fb',
      'Gb',
      'Ab',
      'Bbb',
      'Cb'
    ])
  })

  it('given_f_sharp_lydian_when_creating_instance_then_preserves_the_augmented_fourth_letter_name', () => {
    const scale_instance = create_scale_instance(6, 'lydian')
    const augmented_fourth = scale_instance.notes.find((note) => note.degree === 4)

    expect(augmented_fourth?.spelling.text).toBe('B#')
    expect(augmented_fourth?.interval.label).toBe('A4')
    expect(augmented_fourth?.interval.quality).toBe('augmented')
  })

  it('given_locrian_when_creating_instance_then_applies_characteristic_visual_precedence_to_the_fifth', () => {
    const scale_instance = create_scale_instance(0, 'locrian')
    const fifth = scale_instance.notes.find((note) => note.degree === 5)

    expect(fifth?.roles).toEqual(['characteristic', 'chord_tone'])
    expect(fifth?.primary_role).toBe('characteristic')
    expect(fifth?.interval.quality).toBe('diminished')
  })
})
