import { describe, expect, it } from 'vitest'
import { beginAnswer, createComparisonExercise, createEarGymState, markExamplePlaying, restartExercise, submitAnswer } from './comparison-exercise'

describe('comparison exercise', () => {
  it('given_e_minor_comparison_when_creating_exercise_then_identifies_c_sharp_as_dorian_sixth', () => {
    const exercise = createComparisonExercise(4)

    expect(exercise.changed_degree).toBe(6)
    expect(exercise.changed_note_a).toBe('C')
    expect(exercise.changed_note_b).toBe('C#')
  })

  it('given_major_mixolydian_comparison_when_creating_exercise_then_identifies_minor_seventh', () => {
    const exercise = createComparisonExercise(0, 'major_mixolydian')

    expect(exercise.changed_degree).toBe(7)
    expect(exercise.changed_note_a).toBe('B')
    expect(exercise.changed_note_b).toBe('Bb')
  })

  it('given_supported_comparisons_when_creating_each_exercise_then_returns_three_degree_choices', () => {
    const comparison_ids = ['natural_minor_dorian', 'major_mixolydian', 'major_lydian', 'natural_minor_phrygian'] as const

    comparison_ids.forEach((comparison_id) => expect(createComparisonExercise(4, comparison_id).choices).toHaveLength(3))
  })

  it('given_listen_phase_when_beginning_answer_then_enters_answer_without_streak_change', () => {
    const state = beginAnswer(createEarGymState())

    expect(state.phase).toBe('answer')
    expect(state.streak).toBe(0)
  })

  it('given_answer_phase_when_submitting_sixth_degree_then_increments_streak_and_shows_feedback', () => {
    const state = submitAnswer(beginAnswer(createEarGymState()), 6)

    expect(state.phase).toBe('feedback')
    expect(state.is_correct).toBe(true)
    expect(state.streak).toBe(1)
  })

  it('given_answer_phase_when_submitting_wrong_degree_then_resets_streak_and_shows_feedback', () => {
    const initial_state = { ...createEarGymState(), streak: 2 }
    const state = submitAnswer(beginAnswer(initial_state), 5)

    expect(state.is_correct).toBe(false)
    expect(state.streak).toBe(0)
  })

  it('given_listen_phase_when_marking_example_playing_then_exposes_active_example', () => {
    const state = markExamplePlaying(createEarGymState(), 'b')

    expect(state.playing_example).toBe('b')
  })

  it('given_feedback_phase_when_restarting_exercise_then_returns_to_listen_with_same_comparison', () => {
    const initial_state = submitAnswer(beginAnswer(createEarGymState()), 6)
    const state = restartExercise(initial_state)

    expect(state.phase).toBe('listen')
    expect(state.exercise.changed_note_b).toBe('C#')
    expect(state.streak).toBe(1)
  })
})
