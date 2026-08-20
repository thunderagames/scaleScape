import { describe, expect, it } from 'vitest'
import { createGuitarViewModel } from './guitar-view-model'
import { createPianoViewModel } from './piano-view-model'
import { createScaleInstance } from '../theory/scale-instance'

describe('instrument view models', () => {
  it('given_e_dorian_when_mapping_piano_and_guitar_then_preserves_one_generation_and_pitch_set', () => {
    const scale_instance = createScaleInstance(4, 'dorian')
    const piano = createPianoViewModel(scale_instance, 4)
    const guitar = createGuitarViewModel(scale_instance, 4)
    const expected_pitch_classes = new Set([4, 6, 7, 9, 11, 1, 2])

    expect(piano.generation_id).toBe(4)
    expect(guitar.generation_id).toBe(4)
    expect(new Set(piano.keys.filter((key) => key.is_scale_note).map((key) => key.pitch_class))).toEqual(expected_pitch_classes)
    expect(new Set(guitar.strings.flatMap((guitar_string) => guitar_string.positions).filter((position) => position.is_scale_note).map((position) => position.pitch_class))).toEqual(expected_pitch_classes)
    expect(guitar.strings.flatMap((guitar_string) => guitar_string.positions).filter((position) => position.is_scale_note).every((position) => position.label.length > 0)).toBe(true)
  })
})
