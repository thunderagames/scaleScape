import { describe, expect, it } from 'vitest'
import { create_ascending_scale_timeline } from './audio-timeline'

describe('create_ascending_scale_timeline', () => {
  it('given_three_notes_when_creating_timeline_then_schedules_drone_notes_and_shutdown_in_audio_time', () => {
    const timeline = create_ascending_scale_timeline({
      drone_frequency: 164.81,
      note_frequencies: [261.63, 293.66, 329.63],
      start_time_seconds: 10,
      generation_id: 4
    })

    expect(timeline).toEqual([
      { kind: 'drone_start', time_seconds: 10, frequency: 164.81, generation_id: 4 },
      { kind: 'note_start', time_seconds: 10, frequency: 261.63, generation_id: 4 },
      { kind: 'note_stop', time_seconds: 10.8, frequency: 261.63, generation_id: 4 },
      { kind: 'note_start', time_seconds: 11, frequency: 293.66, generation_id: 4 },
      { kind: 'note_stop', time_seconds: 11.8, frequency: 293.66, generation_id: 4 },
      { kind: 'note_start', time_seconds: 12, frequency: 329.63, generation_id: 4 },
      { kind: 'note_stop', time_seconds: 12.8, frequency: 329.63, generation_id: 4 },
      { kind: 'drone_stop', time_seconds: 13.5, generation_id: 4 }
    ])
  })

  it('given_custom_note_duration_and_gap_when_creating_timeline_then_preserves_the_configured_timing', () => {
    const timeline = create_ascending_scale_timeline({
      drone_frequency: 220,
      note_frequencies: [440, 880],
      note_duration_seconds: 0.5,
      note_gap_seconds: 0.75
    })

    expect(timeline[2]?.time_seconds).toBe(0.5)
    expect(timeline[3]?.time_seconds).toBe(0.75)
    expect(timeline.at(-1)?.time_seconds).toBe(2)
  })

  it('given_overlapping_note_duration_when_creating_timeline_then_keeps_all_events_chronological_and_drone_last', () => {
    const timeline = create_ascending_scale_timeline({
      drone_frequency: 220,
      note_frequencies: [440, 880],
      note_duration_seconds: 2,
      note_gap_seconds: 0.5
    })

    expect(timeline.map((event) => event.time_seconds)).toEqual([0, 0, 0.5, 2, 2.5, 2.5])
    expect(timeline.at(-1)?.kind).toBe('drone_stop')
  })

  it('given_invalid_timeline_parameters_when_creating_timeline_then_rejects_them', () => {
    expect(() => create_ascending_scale_timeline({ drone_frequency: 0, note_frequencies: [440] })).toThrow('Drone frequency')
    expect(() => create_ascending_scale_timeline({ drone_frequency: 220, note_frequencies: [Number.NaN] })).toThrow('Note frequencies')
    expect(() => create_ascending_scale_timeline({ drone_frequency: 220, note_frequencies: [440], note_gap_seconds: 0 })).toThrow('Note gap')
  })
})
