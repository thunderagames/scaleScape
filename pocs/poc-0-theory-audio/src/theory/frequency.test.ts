import { describe, expect, it } from 'vitest'
import { cents_difference, midi_to_frequency, pitch_to_frequency, pitch_to_midi, transpose_pitch } from './frequency'

describe('frequency conversion', () => {
  it('given_a4_when_converting_pitch_to_midi_then_returns_midi_69', () => {
    expect(pitch_to_midi(9, 4)).toBe(69)
  })

  it('given_midi_69_when_converting_to_frequency_then_returns_440_hz', () => {
    expect(midi_to_frequency(69)).toBe(440)
  })

  it('given_a4_when_comparing_frequency_to_independent_oracle_then_returns_zero_cents', () => {
    const expected_frequency = 440 * 2 ** ((69 - 69) / 12)

    expect(cents_difference(pitch_to_frequency(9, 4), expected_frequency)).toBe(0)
  })

  it('given_c4_when_converting_pitch_to_frequency_then_returns_the_equal_temperament_frequency', () => {
    expect(pitch_to_frequency(0, 4)).toBeCloseTo(261.625565, 5)
  })

  it('given_e4_and_a_major_sixth_when_transposing_pitch_then_returns_c_sharp_5', () => {
    const transposed_pitch = transpose_pitch(4, 4, 9)

    expect(transposed_pitch.pitch_class).toBe(1)
    expect(transposed_pitch.octave).toBe(5)
    expect(transposed_pitch.frequency).toBeCloseTo(554.365262, 5)
  })
})
