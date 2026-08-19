export interface AudioTimelineEvent {
  readonly kind: 'drone_start' | 'note_start' | 'note_stop' | 'drone_stop'
  readonly time_seconds: number
  readonly frequency?: number
  readonly generation_id: number
}

export interface AudioTimelineOptions {
  readonly drone_frequency: number
  readonly note_frequencies: readonly number[]
  readonly start_time_seconds?: number
  readonly note_duration_seconds?: number
  readonly note_gap_seconds?: number
  readonly generation_id?: number
}

export function create_ascending_scale_timeline(options: AudioTimelineOptions): readonly AudioTimelineEvent[] {
  const start_time_seconds = options.start_time_seconds ?? 0
  const note_duration_seconds = options.note_duration_seconds ?? 0.8
  const note_gap_seconds = options.note_gap_seconds ?? 1
  const generation_id = options.generation_id ?? 1

  if (!Number.isFinite(options.drone_frequency) || options.drone_frequency <= 0) {
    throw new Error('Drone frequency must be a finite positive number')
  }
  if (options.note_frequencies.some((frequency) => !Number.isFinite(frequency) || frequency <= 0)) {
    throw new Error('Note frequencies must be finite positive numbers')
  }
  if (!Number.isFinite(start_time_seconds) || start_time_seconds < 0) {
    throw new Error('Start time must be a finite non-negative number')
  }
  if (!Number.isFinite(note_duration_seconds) || note_duration_seconds <= 0) {
    throw new Error('Note duration must be a finite positive number')
  }
  if (!Number.isFinite(note_gap_seconds) || note_gap_seconds <= 0) {
    throw new Error('Note gap must be a finite positive number')
  }
  if (!Number.isInteger(generation_id) || generation_id < 0) {
    throw new Error('Generation ID must be a non-negative integer')
  }

  const events: AudioTimelineEvent[] = [
    {
      kind: 'drone_start',
      time_seconds: start_time_seconds,
      frequency: options.drone_frequency,
      generation_id
    }
  ]

  options.note_frequencies.forEach((frequency, index) => {
    const note_start = start_time_seconds + index * note_gap_seconds
    events.push({ kind: 'note_start', time_seconds: note_start, frequency, generation_id })
    events.push({ kind: 'note_stop', time_seconds: note_start + note_duration_seconds, frequency, generation_id })
  })

  const final_note_stop = start_time_seconds + Math.max(options.note_frequencies.length - 1, 0) * note_gap_seconds + note_duration_seconds
  events.push({
    kind: 'drone_stop',
    time_seconds: Math.max(start_time_seconds + options.note_frequencies.length * note_gap_seconds + 0.5, final_note_stop),
    generation_id
  })

  const event_order: Record<AudioTimelineEvent['kind'], number> = {
    drone_start: 0,
    note_stop: 1,
    note_start: 2,
    drone_stop: 3
  }

  return events.sort((left, right) => left.time_seconds - right.time_seconds || event_order[left.kind] - event_order[right.kind])
}
