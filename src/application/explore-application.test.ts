import { describe, expect, it } from 'vitest'
import { createExploreApplication } from './explore-application'

describe('explore application', () => {
  it('given_initial_explore_state_when_changing_scale_then_publishes_one_new_generation', () => {
    const application = createExploreApplication()
    const observed_states: number[] = []
    application.subscribe((state) => observed_states.push(state.generation_id))

    const state = application.changeScale(4, 'phrygian')

    expect(state.scale_instance.notes.map((note) => note.pitch_class)).toEqual([4, 5, 7, 9, 11, 0, 2])
    expect(state.generation_id).toBe(2)
    expect(observed_states).toEqual([2])
  })

  it('given_saved_root_and_formula_when_creating_application_then_restores_scale_state', () => {
    const application = createExploreApplication(9, 'lydian')

    expect(application.getState().root_pitch_class).toBe(9)
    expect(application.getState().formula_id).toBe('lydian')
  })
})
