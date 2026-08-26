import { describe, expect, it } from 'vitest'
import { DEFAULT_METRONOME_BPM, MAX_METRONOME_BPM, MIN_METRONOME_BPM, isMetronomeBpm, normalizeMetronomeBpm, stepMetronomeBpm } from './metronome-bpm'

describe('metronome BPM', () => {
  it('given_boundary_values_when_validating_then_accepts_both_limits', () => {
    expect(isMetronomeBpm(MIN_METRONOME_BPM)).toBe(true)
    expect(isMetronomeBpm(MAX_METRONOME_BPM)).toBe(true)
  })

  it('given_invalid_values_when_normalizing_then_returns_default', () => {
    expect(normalizeMetronomeBpm(29)).toBe(DEFAULT_METRONOME_BPM)
    expect(normalizeMetronomeBpm(251)).toBe(DEFAULT_METRONOME_BPM)
    expect(normalizeMetronomeBpm(120.5)).toBe(DEFAULT_METRONOME_BPM)
    expect(normalizeMetronomeBpm('120')).toBe(DEFAULT_METRONOME_BPM)
  })

  it('given_boundary_value_when_stepping_outward_then_stays_within_range', () => {
    expect(stepMetronomeBpm(MIN_METRONOME_BPM, -1)).toBe(MIN_METRONOME_BPM)
    expect(stepMetronomeBpm(MAX_METRONOME_BPM, 1)).toBe(MAX_METRONOME_BPM)
  })
})
