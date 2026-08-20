export const A4_MIDI = 69
export const A4_FREQUENCY = 440

export function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * 2 ** ((midi - A4_MIDI) / 12)
}

export function pitchToMidi(pitch_class: number, octave: number): number {
  return (octave + 1) * 12 + pitch_class
}

export function pitchToFrequency(pitch_class: number, octave: number): number {
  return midiToFrequency(pitchToMidi(pitch_class, octave))
}

export function transposePitch(pitch_class: number, octave: number, semitone_offset: number): { readonly pitch_class: number; readonly octave: number; readonly frequency: number } {
  const midi = pitchToMidi(pitch_class, octave) + semitone_offset
  return {
    pitch_class: ((midi % 12) + 12) % 12,
    octave: Math.floor(midi / 12) - 1,
    frequency: midiToFrequency(midi)
  }
}
