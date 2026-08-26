export const MIN_METRONOME_BPM = 30
export const MAX_METRONOME_BPM = 250
export const DEFAULT_METRONOME_BPM = 120

export type MetronomeBpm = number

export function isMetronomeBpm(value: unknown): value is MetronomeBpm {
  return typeof value === 'number' && Number.isInteger(value) && value >= MIN_METRONOME_BPM && value <= MAX_METRONOME_BPM
}

export function normalizeMetronomeBpm(value: unknown): MetronomeBpm {
  return isMetronomeBpm(value) ? value : DEFAULT_METRONOME_BPM
}

export function stepMetronomeBpm(value: MetronomeBpm, direction: -1 | 1): MetronomeBpm {
  return normalizeMetronomeBpm(Math.min(MAX_METRONOME_BPM, Math.max(MIN_METRONOME_BPM, value + direction)))
}
