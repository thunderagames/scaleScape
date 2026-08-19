import { describe, expect, it } from 'vitest'
import { create_scale_instance } from '../../../poc-0-theory-audio/src/theory/scale-instance'
import { create_guitar_view_model } from './guitar'
import { create_piano_view_model } from './piano'

describe('shared instrument view models', () => {
  it('given_two_octaves_when_mapping_the_piano_then_uses_large_natural_keys_and_small_altered_keys', () => {
    const piano = create_piano_view_model(create_scale_instance(4, 'dorian'), 1)

    expect(piano.keys).toHaveLength(25)
    expect(piano.keys.filter((key) => key.is_natural)).toHaveLength(15)
    expect(piano.keys.filter((key) => !key.is_natural)).toHaveLength(10)
    expect(piano.keys.find((key) => key.midi === 48)?.key_index).toBe(0)
    expect(piano.keys.find((key) => key.midi === 49)?.key_index).toBe(1)
    expect(piano.keys.find((key) => key.midi === 60)?.key_index).toBe(7)
  })

  it('given_e_lydian_when_mapping_both_instruments_then_marks_the_same_augmented_fourth_pitch_class', () => {
    const scale_instance = create_scale_instance(4, 'lydian')
    const piano = create_piano_view_model(scale_instance, 7)
    const guitar = create_guitar_view_model(scale_instance, 7)

    const piano_characteristic_keys = piano.keys.filter((key) => key.primary_role === 'characteristic')
    const guitar_characteristic_positions = guitar.strings.flatMap((guitar_string) => guitar_string.positions).filter((position) => position.primary_role === 'characteristic')

    expect(piano_characteristic_keys.length).toBeGreaterThan(0)
    expect(guitar_characteristic_positions.length).toBeGreaterThan(0)
    expect(new Set(piano_characteristic_keys.map((key) => key.pitch_class))).toEqual(new Set([10]))
    expect(new Set(guitar_characteristic_positions.map((position) => position.pitch_class))).toEqual(new Set([10]))
    expect(piano.generation_id).toBe(7)
    expect(guitar.generation_id).toBe(7)
  })

  it('given_e_phrygian_when_mapping_the_piano_then_uses_formula_spelling_for_scale_keys', () => {
    const scale_instance = create_scale_instance(4, 'phrygian')
    const piano = create_piano_view_model(scale_instance, 1)
    const scale_keys = piano.keys.filter((key) => key.is_scale_note)

    expect(scale_keys.map((key) => key.note_name)).toContain('F')
    expect(scale_keys.map((key) => key.note_name)).toContain('C')
    expect(scale_keys.every((key) => key.degree !== null)).toBe(true)
  })
})
