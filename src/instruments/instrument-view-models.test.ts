import { describe, expect, it } from 'vitest'
import { createGuitarViewModel, shiftTuning, STANDARD_TUNING } from './guitar-view-model'
import { createBassViewModel, getBassTuningNote, STANDARD_BASS_TUNING } from './bass-view-model'
import { createUkuleleViewModel, getUkuleleTuningNote, STANDARD_UKULELE_TUNING } from './ukulele-view-model'
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

  it('given_standard_tuning_when_shifting_by_two_semitones_then_shifts_every_open_string_equally', () => {
    const tuning = shiftTuning(STANDARD_TUNING, -2)

    expect(tuning.map((guitar_string) => guitar_string.open_midi)).toEqual([38, 43, 48, 53, 57, 62])
    expect(tuning.map((guitar_string) => guitar_string.name)).toEqual(['Low D', 'G', 'C', 'F', 'A', 'High D'])
  })

  it('given_standard_bass_tuning_when_mapping_then_creates_four_string_fretboard', () => {
    const bass = createBassViewModel(createScaleInstance(4, 'dorian'), 4)

    expect(bass.strings).toHaveLength(4)
    expect(bass.strings.map((string_model) => string_model.tuning.open_midi)).toEqual(STANDARD_BASS_TUNING.map((tuning) => tuning.open_midi))
    expect(bass.strings.every((string_model) => string_model.positions.length === 13)).toBe(true)
  })

  it('given_bass_tuning_shift_when_reading_the_open_note_then_returns_the_shifted_e_note', () => {
    expect(getBassTuningNote(-2)).toBe('D')
  })

  it('given_standard_ukulele_tuning_when_mapping_then_creates_reentrant_gcea_fretboard', () => {
    const ukulele = createUkuleleViewModel(createScaleInstance(4, 'dorian'), 4)

    expect(ukulele.strings).toHaveLength(4)
    expect(ukulele.strings.map((string_model) => string_model.tuning.open_midi)).toEqual([67, 60, 64, 69])
    expect(ukulele.strings.map((string_model) => string_model.tuning.open_midi)).toEqual(STANDARD_UKULELE_TUNING.map((tuning) => tuning.open_midi))
  })

  it('given_ukulele_tuning_shift_when_reading_the_open_note_then_returns_the_shifted_g_note', () => {
    expect(getUkuleleTuningNote(-2)).toBe('F')
  })
})
