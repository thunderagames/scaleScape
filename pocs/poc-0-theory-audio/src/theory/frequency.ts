export const A4_MIDI = 69
export const A4_FREQUENCY = 440

export interface AbsolutePitch {
  readonly pitch_class: number
  readonly octave: number
  readonly frequency: number
}

export function midi_to_frequency(midi: number): number {
  return A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12)
}

export function pitch_to_midi(pitch_class: number, octave: number): number {
  return (octave + 1) * 12 + pitch_class
}

export function pitch_to_frequency(pitch_class: number, octave: number): number {
  return midi_to_frequency(pitch_to_midi(pitch_class, octave))
}

export function transpose_pitch(pitch_class: number, octave: number, semitone_offset: number): AbsolutePitch {
  const midi = pitch_to_midi(pitch_class, octave) + semitone_offset
  const transposed_pitch_class = ((midi % 12) + 12) % 12
  const transposed_octave = Math.floor(midi / 12) - 1

  return {
    pitch_class: transposed_pitch_class,
    octave: transposed_octave,
    frequency: midi_to_frequency(midi)
  }
}

export function cents_difference(actual_frequency: number, expected_frequency: number): number {
  return 1200 * Math.log2(actual_frequency / expected_frequency)
}
