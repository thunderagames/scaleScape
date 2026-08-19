import { describe, expect, it } from 'vitest'
import { create_fretboard_model } from './guitar-fretboard'

describe('create_fretboard_model', () => {
  it('given_standard_tuning_when_creating_model_then_builds_six_strings_and_thirteen_positions', () => {
    const fretboard_model = create_fretboard_model()

    expect(fretboard_model.strings).toHaveLength(6)
    expect(fretboard_model.strings.every((guitar_string) => guitar_string.notes)).toBe(true)
    expect(fretboard_model.strings.every((guitar_string) => guitar_string.notes.length === 13)).toBe(true)
  })

  it('given_low_e_string_when_reading_the_twelfth_fret_then_returns_the_next_e_octave', () => {
    const fretboard_model = create_fretboard_model()
    const twelfth_fret = fretboard_model.strings[0]?.notes[12]

    expect(twelfth_fret?.note_name).toBe('E')
    expect(twelfth_fret?.pitch_class).toBe(4)
    expect(twelfth_fret?.octave).toBe(3)
  })

  it('given_e_dorian_pitch_classes_when_creating_model_then_marks_root_and_scale_notes', () => {
    const fretboard_model = create_fretboard_model({
      root_pitch_class: 4,
      scale_pitch_classes: [4, 6, 7, 9, 11, 1, 2]
    })
    const low_e_open = fretboard_model.strings[0]?.notes[0]
    const low_e_fret_one = fretboard_model.strings[0]?.notes[1]

    expect(low_e_open?.is_scale_note).toBe(true)
    expect(low_e_open?.is_root).toBe(true)
    expect(low_e_fret_one?.is_scale_note).toBe(false)
  })

  it('given_negative_fret_count_when_creating_model_then_rejects_invalid_configuration', () => {
    expect(() => create_fretboard_model({ fret_count: -1 })).toThrow('fret_count')
  })
})
