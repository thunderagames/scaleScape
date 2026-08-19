import { describe, expect, it } from 'vitest'
import {
  answer_transfer,
  create_comparison_exercise,
  create_learning_loop_state,
  get_characteristic_caption,
  reveal_comparison,
  select_changed_note,
  start_transfer
} from './learning-loop'

describe('learning loop domain', () => {
  it('given_e_root_when_creating_comparison_then_exposes_c_and_c_sharp_as_the_sixth_difference', () => {
    const exercise = create_comparison_exercise()

    expect(exercise.changed_degree).toBe(6)
    expect(exercise.changed_note_a.spelling.text).toBe('C')
    expect(exercise.changed_note_b.spelling.text).toBe('C#')
    expect(exercise.candidates.map((candidate) => candidate.label)).toEqual(['V', 'VI', 'VII'])
  })

  it('given_listen_phase_when_selecting_a_roman_degree_then_advances_to_identify_phase', () => {
    const state = create_learning_loop_state()

    const incorrect_state = select_changed_note(state, 5)
    const correct_state = select_changed_note(state, 6)

    expect(incorrect_state.changed_note_correct).toBe(false)
    expect(correct_state.changed_note_correct).toBe(true)
    expect(correct_state.phase).toBe('identify')
  })

  it('given_identify_phase_when_selecting_the_sixth_then_allows_the_reveal', () => {
    const selected_state = select_changed_note(create_learning_loop_state(), 6)

    expect(selected_state.changed_note_correct).toBe(true)
    expect(reveal_comparison(selected_state).phase).toBe('reveal')
    expect(get_characteristic_caption(selected_state)).toContain('raises the sixth degree')
  })

  it('given_revealed_e_comparison_when_starting_transfer_then_asks_for_the_sixth_on_a', () => {
    const listening_state = create_learning_loop_state()
    const selected_state = select_changed_note(listening_state, 6)
    const revealed_state = reveal_comparison(selected_state)

    const transfer_state = start_transfer(revealed_state)

    expect(transfer_state.phase).toBe('transfer')
    expect(transfer_state.exercise.transfer_candidates.map((candidate) => candidate.label)).toEqual(['E', 'F#', 'G'])
  })

  it('given_correct_initial_answers_when_answering_f_sharp_on_transfer_then_increments_streak', () => {
    const state = start_transfer(reveal_comparison(select_changed_note(create_learning_loop_state(), 6)))

    const completed_state = answer_transfer(state, 6)

    expect(completed_state.transfer_correct).toBe(true)
    expect(completed_state.phase).toBe('complete')
    expect(completed_state.streak).toBe(1)
  })

  it('given_an_incorrect_transfer_answer_when_completing_exercise_then_resets_streak', () => {
    const state = start_transfer(reveal_comparison(select_changed_note(create_learning_loop_state(), 6)))

    const completed_state = answer_transfer(state, 5)

    expect(completed_state.transfer_correct).toBe(false)
    expect(completed_state.streak).toBe(0)
  })
})
